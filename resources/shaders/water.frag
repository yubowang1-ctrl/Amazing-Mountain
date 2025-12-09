#version 330 core

in vec3 ws_pos;
in vec3 ws_norm;
in vec2 uv;
in vec4 clipSpace;

out vec4 fragColor;

uniform sampler2D u_reflectionTexture;
uniform sampler2D u_refractionTexture;
uniform sampler2D u_depthTexture;
uniform sampler2D u_normalMap;
uniform sampler2D u_dudvMap;

uniform vec3 ws_cam_pos;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform bool uEnableFog;
uniform float u_timeFactor;

// Water parameters (uniforms)
uniform float u_waveStrength;
uniform float u_waterClarity;
uniform float u_fresnelPower;
uniform float u_waveSpeed;



// Fresnel
float calculateFresnel(vec3 viewDir, vec3 normal) {
    float fresnel = dot(viewDir, normal);
    fresnel = pow(1.0 - fresnel, u_fresnelPower);
    return fresnel;
}



void main() {
    vec2 ndc = (clipSpace.xy / clipSpace.w) / 2.0 + 0.5;

    // Get distortion
    vec2 dudvOffset1 = texture(u_dudvMap, vec2(uv.x + u_timeFactor * u_waveSpeed, uv.y + u_timeFactor * u_waveSpeed)).rg * 2.0 - 1.0;
    vec2 dudvOffset2 = texture(u_dudvMap, vec2(-uv.x + u_timeFactor * u_waveSpeed, uv.y + u_timeFactor * u_waveSpeed * 1.5)).rg * 2.0 - 1.0;
    vec2 distortion = (dudvOffset1 + dudvOffset2) * u_waveStrength;

    // flip reflection vertically
    vec2 refractTexCoords = ndc + distortion;
    vec2 reflectTexCoords = vec2(1.0 - ndc.x, ndc.y) + distortion;

    refractTexCoords = clamp(refractTexCoords, 0.001, 0.999);
    reflectTexCoords = clamp(reflectTexCoords, 0.001, 0.999);

    vec3 reflectionColor = texture(u_reflectionTexture, reflectTexCoords).rgb;
    vec3 refractionColor = texture(u_refractionTexture, refractTexCoords).rgb;

    vec2 distortedMeshUV = uv + distortion;

    // calculate fresnel - more reflection at grazing angles
    vec3 normalMap = texture(u_normalMap, distortedMeshUV).rgb * 2.0 - 1.0;
    vec3 normal = normalize(vec3(normalMap.r, normalMap.b, normalMap.g));
    vec3 finalNormal = normalize(ws_norm + normal * 0.3);
    vec3 viewDir = normalize(ws_cam_pos - ws_pos);

    float fresnel = calculateFresnel(viewDir, ws_norm);
    float floorDepth = texture(u_depthTexture, refractTexCoords).r;
    float waterDepthVal = gl_FragCoord.z;

    float near = 0.1;
    float far = 100.0;
    float floorDist = 2.0 * near * far / (far + near - (2.0 * floorDepth - 1.0) * (far - near));
    float waterDist = 2.0 * near * far / (far + near - (2.0 * waterDepthVal - 1.0) * (far - near));
    float waterDepth = floorDist - waterDist;
    float depthFactor = clamp(waterDepth * u_waterClarity, 0.0, 1.0);

    vec3 waterBase = vec3(0.0, 0.3, 0.5);
    vec3 waterColor = mix(refractionColor, reflectionColor, fresnel);
    waterColor = mix(waterColor, waterBase, depthFactor * 0.5);

    // Apply fog
    if (uEnableFog) {
        float dist = length(ws_cam_pos - ws_pos);
        float fog = 1.0 - exp(-uFogDensity * dist);
        vec3 fogColor = length(uFogColor) < 0.001 ? vec3(0.6, 0.7, 0.8) : uFogColor;
        waterColor = mix(waterColor, fogColor, clamp(fog, 0.0, 1.0));
    }

    fragColor = vec4(waterColor, 1.0);
}
