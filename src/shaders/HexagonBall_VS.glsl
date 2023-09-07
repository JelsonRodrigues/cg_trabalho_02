#version 300 es

precision highp float;

// Vertex attributes
layout( location=0 ) in vec4 position;

uniform mat4x4 projection;
uniform mat4x4 view;
uniform mat4x4 model;

void main() {
  gl_Position = projection * view * model * position;
}