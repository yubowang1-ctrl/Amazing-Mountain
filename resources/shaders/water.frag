#version 330 core

in VS_OUT {
    vec3 worldPos;
    vec3 viewPos;
    vec3 normal;
    vec2 texCoord;
} fs_in;

out vec4 FragColor;

uniform sampler2D uDuDvMap;
uniform sampler2D uNormalMap;

uniform vec3 uCameraPos;
uniform vec3 uLightDir;
uniform vec3 uWaterColor;

uniform float uTime;
uniform float uWaveSpeed;
uniform float uWaveStrength;
uniform float uWaveScale;

uniform vec3  uFogColor;
uniform float uFogDensity;
uniform float uFogHeight;
uniform float uFogHeightFalloff;

vec3 applyFog(vec3 shadedColor)
{
    float dist = length(fs_in.viewPos);

    // exp fog
    float fogFactor = exp(-uFogDensity * dist);

    float h = fs_in.worldPos.y - uFogHeight;
    float heightFactor = exp(-uFogHeightFalloff * h);

    fogFactor *= heightFactor;
    fogFactor = clamp(fogFactor, 0.0, 1.0);

    return mix(uFogColor, shadedColor, fogFactor);
}

void main()
{
    // dudv
    float move = uTime * uWaveSpeed;

    vec2 baseUV   = fs_in.texCoord * uWaveScale;
    vec2 uv0      = baseUV + vec2(move, 0.0);
    vec2 uv1      = baseUV + vec2(-move * 0.7, move * 0.4);

    vec2 dudv0 = texture(uDuDvMap, uv0).rg * 2.0 - 1.0;
    vec2 dudv1 = texture(uDuDvMap, uv1).rg * 2.0 - 1.0;
    vec2 distortion = (dudv0 + dudv1) * 0.5 * uWaveStrength;

    vec2 normalUV = baseUV + distortion;

    vec3 texN = texture(uNormalMap, normalUV).rgb * 2.0 - 1.0;
    vec3 N = normalize(vec3(texN.x, texN.z, texN.y));

    vec3 L = normalize(-uLightDir);
    vec3 V = normalize(uCameraPos - fs_in.worldPos);
    vec3 H = normalize(L + V);

    float diff = max(dot(N, L), 0.0);
    vec3 diffuse  = uWaterColor * diff;
    vec3 ambient  = uWaterColor * 0.35;

    float spec    = pow(max(dot(N, H), 0.0), 80.0);
    vec3 specular = vec3(0.9, 0.95, 1.0) * spec;

    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 5.0);
    specular *= (0.3 + 0.7 * fresnel);

    vec3 shadedColor = ambient + diffuse + specular;

    vec3 finalColor = applyFog(shadedColor);
    FragColor = vec4(finalColor, 1.0);
}

