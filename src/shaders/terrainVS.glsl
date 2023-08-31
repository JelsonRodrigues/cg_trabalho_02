#version 300 es

precision highp float;

// Vertex attributes
layout( location=0 ) in vec4 position;

out vec2 f_text_coord;

uniform mat4x4 u_projection;
uniform mat4x4 u_view;
uniform mat4x4 u_model;
uniform vec2 camera_position;

uniform highp sampler2D u_heightmap;

void main() {
  gl_PointSize = 15.0;
  f_text_coord = position.xz + camera_position.xy;
  
  vec4 height = texture(u_heightmap, f_text_coord) * vec4(1.0, 1.0/256.0, 0.0, 0.0);
  // vec4 height = texture(u_heightmap, f_text_coord) * vec4(256.0 * 256.0, 256.0, 0.0, 0.0);
  gl_Position = u_projection * u_view * u_model * vec4(position.x, (height.r + height.g) , position.z, 1.0);
}