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

// Depth of Field uniforms
uniform float uNear;
uniform float uFar;
uniform float uFocusDistance;
uniform float uBlurStrength;

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

// Convert non-linear depth to linear depth
float linearizeDepth(float depth01) {
    return (2.0 * uNear * uFar) / (uFar + uNear - (2.0 * depth01 - 1.0) * (uFar - uNear));
}

// Calculate Circle of Confusion (CoC)
float calculateCoC(float linearDepth) {
    return abs(linearDepth - uFocusDistance) / linearDepth * uBlurStrength;
}

// Poisson disk sampling pattern for blur
const vec2 poissonDisk[16] = vec2[](
    vec2(-0.613392, 0.617481),
    vec2(0.170019, -0.040254),
    vec2(-0.299417, 0.791925),
    vec2(0.645680, 0.493210),
    vec2(-0.651784, 0.717887),
    vec2(0.421003, 0.027070),
    vec2(-0.817194, -0.271096),
    vec2(-0.705374, -0.668203),
    vec2(0.977050, -0.108615),
    vec2(0.063326, 0.142369),
    vec2(0.203528, 0.214331),
    vec2(-0.667531, 0.326090),
    vec2(-0.098422, -0.295755),
    vec2(-0.885922, 0.215369),
    vec2(0.566637, 0.605213),
    vec2(0.039766, -0.396100)
);

// Perform depth-aware blur using Poisson disk sampling
vec3 dofBlur(vec2 uv, float coc, vec2 texelSize) {
    vec3 colorSum = vec3(0.0);
    float weightSum = 0.0;
    
    // Sample count based on CoC size
    int sampleCount = int(clamp(coc * 16.0, 4.0, 16.0));
    
    for (int i = 0; i < 16; i++) {
        if (i >= sampleCount) break;
        
        // Calculate sample offset based on CoC
        vec2 offset = poissonDisk[i] * coc * texelSize;
        vec2 sampleUV = uv + offset;
        
        // Sample color
        vec3 sampleColor = texture(uSceneColor, sampleUV).rgb;
        
        // Sample depth at this location
        float sampleDepth = texture(uSceneDepth, sampleUV).r;
        float sampleLinearDepth = linearizeDepth(sampleDepth);
        float sampleCoC = calculateCoC(sampleLinearDepth);
        
        // Weight based on CoC similarity (prefer samples with similar CoC)
        float weight = 1.0 / (1.0 + abs(sampleCoC - coc) * 10.0);
        weight *= 1.0 / (1.0 + float(i) * 0.1); // Slight falloff for distant samples
        
        colorSum += sampleColor * weight;
        weightSum += weight;
    }
    
    return weightSum > 0.0 ? colorSum / weightSum : texture(uSceneColor, uv).rgb;
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
    
    // Depth of Field processing
    if (depth < 1.0) {
        // Linearize depth
        float linearDepth = linearizeDepth(depth);
        
        // Calculate Circle of Confusion
        float coc = calculateCoC(linearDepth);
        
        // Get texture size for proper sampling
        vec2 texelSize = 1.0 / textureSize(uSceneColor, 0);
        
        // Apply blur if CoC is significant
        if (coc > 0.001) {
            vec3 blurredColor = dofBlur(v_uv, coc, texelSize);
            
            // Mix original and blurred based on CoC
            // Normalize CoC to [0, 1] range for mixing
            float cocFactor = clamp(coc * 0.5, 0.0, 1.0);
            sceneColor = mix(sceneColor, blurredColor, cocFactor);
        }
    }
    
    fragColor = vec4(sceneColor, 1.0);
}
