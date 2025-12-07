#version 330 core

in vec2 v_uv;

out vec4 fragColor;

uniform sampler2D uSceneColor;
uniform sampler2D uSceneDepth;

uniform mat4 uInvViewProj;
uniform vec3 uCameraPos;

uniform bool  uEnableFog;
uniform bool  uEnableHeightFog;
uniform vec3  uFogColor;
uniform float uFogDensity;
uniform float uFogHeightFalloff;

uniform sampler3D uColorLUT;
uniform bool      uEnableColorGrading;

vec3 reconstructWorldPos(float depth01, vec2 texCoord) {
    // Convert texture coordinates and depth to NDC space
    vec4 ndc = vec4(
        texCoord.x * 2.0 - 1.0,  // X: [0,1] -> [-1,1]
        texCoord.y * 2.0 - 1.0,  // Y: [0,1] -> [-1,1]
        depth01 * 2.0 - 1.0,     // Z: [0,1] -> [-1,1]
        1.0
    );
    
    // Transform from NDC to world space
    vec4 worldPos = uInvViewProj * ndc;
    
    // Perspective divide
    return worldPos.xyz / worldPos.w;
}

float calculateAltitudeFog(vec3 worldPos) {
    float pixelHeight = worldPos.y;
    
    // fog zone
    float fogBottomHeight = -10.0;  // full fog below this
    float fogTopHeight = 40.0;      // no fog above this
    
    // calculate height factor (0 = top/clear, 1 = bottom/dense)
    float heightRange = fogTopHeight - fogBottomHeight;
    float normalizedHeight = (pixelHeight - fogBottomHeight) / heightRange;
    
    // exponential falloff
    float falloff = uFogHeightFalloff * 8.0;
    float heightFactor = exp(-normalizedHeight * falloff);
    heightFactor = clamp(heightFactor, 0.0, 1.0);
    
    // distance component
    float distance = length(worldPos - uCameraPos);
    float distanceFactor = 1.0 - exp(-uFogDensity * distance * 0.3);
    distanceFactor = clamp(distanceFactor, 0.0, 1.0);
    
    return heightFactor * (0.2 + 0.8 * distanceFactor);
}

void main()
{
    vec3 sceneColor = texture(uSceneColor, v_uv).rgb;
    float depth = texture(uSceneDepth, v_uv).r;
    
    if (uEnableFog && depth < 1.0) {
        vec3 worldPos = reconstructWorldPos(depth, v_uv);
        
        if (uEnableHeightFog) {
            float fogFactor = calculateAltitudeFog(worldPos);
            sceneColor = mix(sceneColor, uFogColor, fogFactor);
        }
    }

    if (uEnableColorGrading) {
        sceneColor = texture(uColorLUT, sceneColor).rgb;
    }
    
    fragColor = vec4(sceneColor, 1.0);
}
