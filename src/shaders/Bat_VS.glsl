#version 300 es

precision highp float;

// Vertex attributes
layout( location=0 ) in vec4 position;
layout( location=1 ) in vec3 normal;
layout( location=2 ) in vec2 text_coord;

out vec2 f_text_coord;
out vec3 f_normal;
out vec3 f_position;

uniform mat4x4 u_projection;
uniform mat4x4 u_view;
uniform mat4x4 u_model;
uniform mat4x4 u_inverse_transpose_model;

void main() {
  gl_PointSize = 15.0;
  gl_Position = u_projection * u_view * u_model * position;
  
  f_position = (u_model * position).xyz;
  f_normal = mat3(u_inverse_transpose_model) * normal;
  f_text_coord = text_coord;
  f_text_coord.y = 1.0 - f_text_coord.y;
}

