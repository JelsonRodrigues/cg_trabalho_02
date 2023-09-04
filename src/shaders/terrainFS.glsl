#version 300 es

precision highp float;

in vec2 f_text_coord;
in vec3 f_normal;
in vec3 f_position;
out vec4 outColor;

uniform sampler2D u_texture;

// Camera position
uniform vec3 camera_position;

// Directional Light informations
uniform vec3 directional_light_vec;
uniform vec3 directional_light_color;

// Point Light informations
#define MAXIMUM_NUMBER_OF_POINT_LIGHTS 8
uniform vec3 point_light_position[MAXIMUM_NUMBER_OF_POINT_LIGHTS];
uniform vec3 point_light_color[MAXIMUM_NUMBER_OF_POINT_LIGHTS];
uniform float point_light_radius[MAXIMUM_NUMBER_OF_POINT_LIGHTS];
uniform uint point_light_count;

#define AMBIENT_LIGHT_INTENSITY (0.1)
#define AMBIENT_LIGHT_COLOR vec3(1., 1., 1.)

vec3 getLightIntensity() {
  vec3 normalized_normal = normalize(f_normal);
  vec3 surface_to_camera = normalize(camera_position - f_position);

  // Add ambient Light
  vec3 intensity = AMBIENT_LIGHT_INTENSITY * AMBIENT_LIGHT_COLOR;

  // Add directional Light
  intensity += max(0.0, -dot(normalized_normal, normalize(directional_light_vec))) * directional_light_color;
  // Calculate specular
  vec3 mid_vector = normalize((-normalize(directional_light_vec)) + surface_to_camera);
  float specular_highlight = pow(max(0.0, dot(normalized_normal, mid_vector)), 140.0);
  intensity += specular_highlight * directional_light_color;

  // Add contribuition from light points
  for (uint c = uint(0); c < point_light_count; ++c) {
    vec3 vec_position_to_light = point_light_position[c] - f_position;
    vec3 color = point_light_color[c];
    float radius = point_light_radius[c];

    float distance = length(vec_position_to_light);
    float brightness = 1.0 - clamp(distance / radius, 0.0, 1.0);

    float specular_highlight = 0.0;
    if (distance < radius) {
      // Calculate specular
      vec3 mid_vector = normalize(normalize(vec_position_to_light) + surface_to_camera);
      specular_highlight = pow(max(0.0, dot(normalized_normal, mid_vector)), 140.0);
    }

    intensity += color.rgb * (max(0.0, dot(normalized_normal, normalize(vec_position_to_light))) * brightness + specular_highlight);
  }

  intensity.r = clamp(intensity.r, 0.0, 1.0);
  intensity.g = clamp(intensity.g, 0.0, 1.0);
  intensity.b = clamp(intensity.b, 0.0, 1.0);

  return intensity;
}

void main(){
  vec4 color = texture(u_texture,  f_text_coord);
  outColor = vec4(getLightIntensity() * color.rgb, color.a);
}
