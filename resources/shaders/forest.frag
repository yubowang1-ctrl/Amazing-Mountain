#version 330 core

in vec3 v_worldPos;
in vec3 v_worldNormal;

out vec4 fragColor;

uniform vec3 uEye;

// global sun + ambient light (consistent with terrain)
uniform vec3 uSunDir;       // FROM light TO scene
uniform vec3 uSunColor;
uniform vec3 uAmbientColor;

uniform vec3  uFogColor;
uniform float uFogDensity;

struct Material {
    vec3 ka;
    vec3 kd;
    vec3 ks;
    float shininess;
};

uniform Material u_mat;

uniform sampler2D uTexture;
uniform int uUseTexture;

void main()
{
    vec3 N = normalize(v_worldNormal);
    vec3 V = normalize(uEye - v_worldPos);
    vec3 L = normalize(-uSunDir);  // light comes from -dir

    float NdotL = max(dot(N, L), 0.0);
    vec3 H      = normalize(L + V);
    float spec  = pow(max(dot(N, H), 0.0), u_mat.shininess);

    vec3 albedo = u_mat.kd;
    if (uUseTexture == 1) {
        // Triplanar mapping
        vec3 blend = abs(N);
        blend /= (blend.x + blend.y + blend.z);
        
        float scale = 0.2; // Adjust texture scale
        vec3 texX = texture(uTexture, v_worldPos.yz * scale).rgb;
        vec3 texY = texture(uTexture, v_worldPos.xz * scale).rgb;
        vec3 texZ = texture(uTexture, v_worldPos.xy * scale).rgb;
        
        vec3 texColor = texX * blend.x + texY * blend.y + texZ * blend.z;
        albedo *= texColor;
    }

    vec3 ambient  = albedo * uAmbientColor;
    vec3 diffuse  = albedo * NdotL * uSunColor;
    vec3 specular = u_mat.ks * spec    * uSunColor;

    vec3 color = ambient + diffuse + specular;

    // color jitter: All forest (dry + leaves) have slight color variations
    float hash = fract(sin(dot(v_worldPos.xy, vec2(12.9898,78.233))) * 43758.5453);
    float hash2 = fract(sin(dot(v_worldPos.zy, vec2(93.9898,18.233))) * 15731.7431);
    float t = clamp(0.3 * hash + 0.7 * hash2, 0.0, 1.0);

    vec3 tint1 = vec3(0.90, 1.00, 0.90);
    vec3 tint2 = vec3(1.00, 0.95, 0.85);
    vec3 tint = mix(tint1, tint2, t);

    color *= tint;

    // simple distance fog: using world-space distance
    float dist = length(uEye - v_worldPos);
    float fog  = 1.0 - exp(-uFogDensity * dist);
    fog = clamp(fog, 0.0, 1.0);

    color = mix(color, uFogColor, fog);

    fragColor = vec4(color, 1.0);
}
