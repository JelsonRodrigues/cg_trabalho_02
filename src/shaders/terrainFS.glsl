#version 300 es

precision highp float;

in vec2 f_text_coord;
out vec4 outColor;

uniform sampler2D u_texture;

void main(){
  outColor = texture(u_texture,  f_text_coord);
}