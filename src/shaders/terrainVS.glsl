#version 300 es

precision highp float;

// Vertex attributes
layout( location=0 ) in vec4 position;

out vec2 f_text_coord;
out vec3 f_normal;

uniform mat4x4 u_projection;
uniform mat4x4 u_view;
uniform mat4x4 u_model;

uniform highp sampler2D u_heightmap;

/*
Here I try to aproximate normal of the suface
I get two neigbor points and create two vectors that will
be the aproximation of the tangent directions of the surface in that point.
If the surface was defined by a function then it would be possible to use calculus to 
get the exact normal.
*/
vec3 calculate_normal(vec4 point0) {
  float dist = (1.0/(8192.0 * 2.0));
  vec3 neigbor1 = vec3(position.x + dist, position.y, position.z);
  vec3 neigbor2 = vec3(position.x, position.y, position.z + dist);

  vec4 height1 = texture(u_heightmap, neigbor1.xz) * vec4(1.0, 1.0/256.0, 0.0, 0.0);
  vec4 point1 = vec4(neigbor1.x, height1.r + height1.g, neigbor1.z, 1.0);

  vec4 height2 = texture(u_heightmap, neigbor2.xz) * vec4(1.0, 1.0/256.0, 0.0, 0.0);
  vec4 point2 = vec4(neigbor2.x, height2.r + height2.g, neigbor2.z, 1.0);

  vec4 tangent1 = point1 - point0;
  vec4 tangent2 = point2 - point0;

  return cross(tangent2.xyz, tangent1.xyz);
}

void main() {
  gl_PointSize = 15.0;
  f_text_coord = position.xz;
  
  vec4 height = texture(u_heightmap, f_text_coord) * vec4(1.0, 1.0/256.0, 0.0, 0.0);
  vec4 this_point = vec4(position.x, (height.r + height.g), position.z, 1.0);
  gl_Position = u_projection * u_view * u_model * this_point;

  f_normal = mat3(transpose(inverse(u_model))) * calculate_normal(this_point);
}

