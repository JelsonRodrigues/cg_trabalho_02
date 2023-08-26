#version 300 es

precision highp float;

// Vertex attributes
layout( location=0 ) in vec4 position;

// Aplica perspectiva para os pontos
uniform mat4x4 projection;

// Transforma um ponto do mundo para o sistema de coordenadas da camera
uniform mat4x4 view;

// Coordenadas do modelo, aplicado as transformacoes de translacao,
// rotacao e escala (o que posiciona o objeto no mundo).
uniform mat4x4 model;

void main() {
  gl_Position = projection * view * model * position;
  gl_PointSize = 15.0;
}