#version 300 es

precision highp float;

in vec2 f_text_coord;
in vec3 f_normal;
out vec4 outColor;

uniform sampler2D u_texture;

#define AMBIENT_LIGHT (0.1)

void main(){
  vec4 color = texture(u_texture,  f_text_coord);
  vec3 normalized_normal = normalize(f_normal);
  outColor = vec4((
    ( AMBIENT_LIGHT + 
      max(0.0, dot(normalized_normal, normalize(vec3(2.0, 5.0, 3.0))))
    )
     * color
     ).rgb, 1.0);
}