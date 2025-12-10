#version 330 core

in vec3 v_dir;
out vec4 fragColor;

uniform samplerCube uSkybox;


void main()
{
   
    fragColor = texture(uSkybox, v_dir);
}
