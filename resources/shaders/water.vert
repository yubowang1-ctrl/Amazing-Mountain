#version 330 core

layout(location = 0) in vec3 inPos;
layout(location = 1) in vec3 inNormal;
layout(location = 2) in vec2 inTexCoord;

out VS_OUT {
    vec3 worldPos;
    vec3 viewPos;
    vec3 normal;
    vec2 texCoord;
} vs_out;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;

void main()
{
    vec4 wp = uModel * vec4(inPos, 1.0);
    vec4 vp = uView  * wp;

    vs_out.worldPos = wp.xyz;
    vs_out.viewPos  = vp.xyz;

    mat3 normalMat = mat3(transpose(inverse(uModel)));
    vs_out.normal = normalize(normalMat * inNormal);

    vs_out.texCoord = inTexCoord;

    gl_Position = uProj * vp;
}
