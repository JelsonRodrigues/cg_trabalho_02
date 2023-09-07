import { DrawableObject} from "../Interfaces/DrawableObject";
import * as glm from "gl-matrix";

import { WebGLUtils } from "../WebGLUtils";

import vertexSource from "../../shaders/Bat_VS.glsl";
import fragmentSource from "../../shaders/Bat_FS.glsl";
import { Light } from "../Light/Light";
import { Camera } from "../Camera/Camera";
import { DirectionalLight } from "../Light/DirectionalLight";
import { PointLight } from "../Light/PointLight";
import { AnimatedObject } from "../Interfaces/AnimatedObject";
import { ColidableObject } from "../Interfaces/ColidableObject";
import { Spline } from "../../modules/Spline";
import { CubicBezierCurve } from "../../modules/CubicBezierCurve";

export class Bat implements DrawableObject, AnimatedObject, ColidableObject {
  public model : glm.mat4;

  private paused_animation : boolean = false;
  private accumulated_time : number = 0.0;
  private time_total : number = 30_000;
  private path : Spline;

  private static initialized : boolean = false;
  private static program : WebGLProgram;
  private static vao : WebGLVertexArrayObject;
  private static buffer_vertices : WebGLBuffer;
  private static u_model : WebGLUniformLocation;
  private static u_view : WebGLUniformLocation;
  private static u_projection : WebGLUniformLocation;
  private static u_inverse_transpose_model : WebGLUniformLocation;
  private static u_directional_light_vec : WebGLUniformLocation;
  private static u_directional_light_color : WebGLUniformLocation;
  private static u_point_light_position : WebGLUniformLocation;
  private static u_point_light_color : WebGLUniformLocation;
  private static u_point_light_radius : WebGLUniformLocation;
  private static u_point_light_count : WebGLUniformLocation;
  private static u_camera_position : WebGLUniformLocation;
  private static a_position : number;
  private static a_normal : number;
  private static a_text_coord : number;
  private static u_texture: WebGLUniformLocation;
  private static u_texture_emissive: WebGLUniformLocation;
  private static texture : WebGLTexture;
  private static texture_emissive : WebGLTexture;
  private static objects_mtl_ranges : Map<[number, number], WebGLUtils.MTL_Info> = new Map();

  constructor (gl : WebGL2RenderingContext, path : Spline | null = null, time_animation : number = 30_000) {
    this.model = glm.mat4.create();
    
    this.time_total = time_animation;

    if (path) {
      this.path = path;
    }
    else {
      const spline = new Spline();

      spline.addCurve(new CubicBezierCurve(
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0],
      ));

      this.path = spline;
    }

    this.updateAnimation(0);

    if (!Bat.initialized) {
      this.setup(gl);
    }

    Bat.initialized = true;
  }
  getCenter(): glm.vec3 {
    const origin = glm.vec4.fromValues(0.0, 0.0, 0.0, 1.0);
    glm.vec4.transformMat4(origin, origin, this.model);
    return glm.vec3.fromValues(origin[0], origin[1], origin[2]);
  }
  getRadius(): number {
    // Get a unit vector and transform by the model
    // The resulting size of the vector is the radius
    const unit_vector = glm.vec4.fromValues(0.58, 0.58, 0.58, 0.0);
    glm.vec4.transformMat4(unit_vector, unit_vector, this.model);
    return glm.vec4.length(unit_vector);
  }

  checkColision(object: ColidableObject): boolean {
    const distance = glm.vec3.length(glm.vec3.sub(glm.vec3.create(), this.getCenter(), object.getCenter()));
    return distance <= this.getRadius() + object.getRadius();
  }

  updateAnimation(fElapsedTime:number): void {
    if (!this.paused_animation ) {
      this.accumulated_time = (this.accumulated_time + fElapsedTime) % this.time_total;
      const percent_animation = this.accumulated_time / this.time_total;
      
      const point = this.path.getPoint(percent_animation);

      const out = point;
      
      this.model[12] = out[0];
      this.model[13] = out[1];
      this.model[14] = out[2];
    }
  }

  resetAnimation(): void {      
    this.accumulated_time = 0;
    this.updateAnimation(0.0);
  }

  toggleAnimation(): void {
    this.paused_animation = !this.paused_animation;
  }

  pauseAnimation(): void {
    this.paused_animation = true;
  }

  resumeAnimation(): void {
    this.paused_animation = false;
  }

  getAnimationState(): boolean {
    return this.paused_animation;
  }

  draw(gl: WebGL2RenderingContext, camera : Camera, projection : glm.mat4, lights : Light[]) : void {
    const view = camera.getViewMatrix();
    gl.useProgram(Bat.program as WebGLProgram);

    gl.bindVertexArray(Bat.vao);
    
    gl.uniformMatrix4fv(Bat.u_model, false, this.model);
    gl.uniformMatrix4fv(Bat.u_view, false, view);
    gl.uniformMatrix4fv(Bat.u_projection, false, projection);
    gl.uniformMatrix4fv(Bat.u_inverse_transpose_model, false, glm.mat4.invert(glm.mat4.create(), this.model));
    gl.uniform3fv(Bat.u_camera_position, camera.getCameraPosition());

    this.setupLights(gl, lights);
    
    gl.uniform1i(Bat.u_texture, 0);
    gl.uniform1i(Bat.u_texture_emissive, 1);

    gl.activeTexture(WebGL2RenderingContext.TEXTURE0 + 0);
    gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, Bat.texture);

    gl.activeTexture(WebGL2RenderingContext.TEXTURE0 + 1);
    gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, Bat.texture_emissive);

    Bat.objects_mtl_ranges.forEach(
      (value, key) => {
        /** @todo setup light information before drawing */
        gl.drawArrays(WebGL2RenderingContext.TRIANGLES, key[0], key[1]);
      }
    )
    // Unbind VAO to other gl calls do not modify it
    gl.bindVertexArray(null);
  }
  
  private setupLights(gl:WebGL2RenderingContext, lights: Light[]) {
    // Get the Directional Light
    const directional_lights = lights.filter((element) => {
      return element instanceof DirectionalLight;
    });

    if (directional_lights.length > 0) {
      const light = directional_lights[0] as DirectionalLight;
      gl.uniform3fv(Bat.u_directional_light_color, light.getColor());
      gl.uniform3fv(Bat.u_directional_light_vec, light.getDirection());
    }

    // Get the Point Lights
    const point_lights = lights.filter((element) => {
      return element instanceof PointLight;
    });

    const MAXIMUM_NUMBER_OF_POINT_LIGHTS = 8;
    const point_lights_count = (point_lights.length < MAXIMUM_NUMBER_OF_POINT_LIGHTS) ? point_lights.length : MAXIMUM_NUMBER_OF_POINT_LIGHTS;
    const point_light_radius = new Float32Array(point_lights_count);
    const point_lights_color = new Float32Array(point_lights_count*3);
    const point_lights_position = new Float32Array(point_lights_count*3);
    for (let c = 0; c < point_lights_count; ++c){
      const light = point_lights[c] as PointLight;
      const color = light.getColor();
      const position = light.getPosition();
      const radius = light.getRadiusIlumination();

      point_light_radius[c] = radius;
      point_lights_color[3*c + 0] = color[0];
      point_lights_color[3*c + 1] = color[1];
      point_lights_color[3*c + 2] = color[2];
      point_lights_position[3*c + 0] = position[0];
      point_lights_position[3*c + 1] = position[1];
      point_lights_position[3*c + 2] = position[2];
    }

    if (point_lights_count > 0) {
      gl.uniform1fv(Bat.u_point_light_radius, point_light_radius);
      gl.uniform3fv(Bat.u_point_light_color, point_lights_color);
      gl.uniform3fv(Bat.u_point_light_position, point_lights_position);
    }
    gl.uniform1ui(Bat.u_point_light_count, point_lights_count);
  }

  setup(gl: WebGL2RenderingContext): void {
    // Create the program
    Bat.program = WebGLUtils.createProgram(
      gl,
      WebGLUtils.createShader(gl, WebGL2RenderingContext.VERTEX_SHADER, vertexSource) as WebGLShader,
      WebGLUtils.createShader(gl, WebGL2RenderingContext.FRAGMENT_SHADER, fragmentSource) as WebGLShader
    ) as WebGLProgram;
    gl.useProgram(Bat.program);
    
    // Look up uniform and attributes positions
    Bat.u_model = gl.getUniformLocation(Bat.program, "u_model") as WebGLUniformLocation;
    Bat.u_view = gl.getUniformLocation(Bat.program, "u_view") as WebGLUniformLocation;
    Bat.u_projection = gl.getUniformLocation(Bat.program, "u_projection") as WebGLUniformLocation;
    Bat.u_texture = gl.getUniformLocation(Bat.program, "u_texture") as WebGLUniformLocation;
    Bat.u_texture_emissive = gl.getUniformLocation(Bat.program, "u_texture_emissive") as WebGLUniformLocation;
    Bat.u_inverse_transpose_model = gl.getUniformLocation(Bat.program, "u_inverse_transpose_model") as WebGLUniformLocation;
    Bat.u_directional_light_vec = gl.getUniformLocation(Bat.program, "directional_light_vec") as WebGLUniformLocation;
    Bat.u_directional_light_color = gl.getUniformLocation(Bat.program, "directional_light_color") as WebGLUniformLocation;
    Bat.u_point_light_position = gl.getUniformLocation(Bat.program, "point_light_position") as WebGLUniformLocation;
    Bat.u_point_light_color = gl.getUniformLocation(Bat.program, "point_light_color") as WebGLUniformLocation;
    Bat.u_point_light_radius = gl.getUniformLocation(Bat.program, "point_light_radius") as WebGLUniformLocation;
    Bat.u_point_light_count = gl.getUniformLocation(Bat.program, "point_light_count") as WebGLUniformLocation;
    Bat.u_camera_position = gl.getUniformLocation(Bat.program, "camera_position") as WebGLUniformLocation;

    Bat.a_position = gl.getAttribLocation(Bat.program, "position");
    Bat.a_normal = gl.getAttribLocation(Bat.program, "normal");
    Bat.a_text_coord = gl.getAttribLocation(Bat.program, "text_coord");

    Bat.texture = gl.createTexture() as WebGLTexture;
    gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, Bat.texture);
    gl.texImage2D(
      WebGL2RenderingContext.TEXTURE_2D, 
      0, 
      WebGL2RenderingContext.RGBA, 
      1, 
      1, 
      0, 
      WebGL2RenderingContext.RGBA, 
      WebGL2RenderingContext.UNSIGNED_BYTE, 
      new Uint8Array([82, 63, 63, 255])
    );

    Bat.texture_emissive = gl.createTexture() as WebGLTexture;
    gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, Bat.texture_emissive);
    gl.texImage2D(
      WebGL2RenderingContext.TEXTURE_2D, 
      0, 
      WebGL2RenderingContext.RGBA, 
      1, 
      1, 
      0, 
      WebGL2RenderingContext.RGBA, 
      WebGL2RenderingContext.UNSIGNED_BYTE, 
      new Uint8Array([255, 255, 0, 255])
    );

    // Create the vertices buffer
    Bat.buffer_vertices = gl.createBuffer() as WebGLBuffer;

    // Create the Vertex Array Object
    Bat.vao = gl.createVertexArray() as WebGLVertexArrayObject;    
    gl.bindVertexArray(Bat.vao);
    
    // Tell VAO what buffer to bind
    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, Bat.buffer_vertices);
    
    // Tell it how to read Data
    gl.vertexAttribPointer(
      Bat.a_position,
      3, 
      WebGL2RenderingContext.FLOAT, 
      false, 
      8 * Float32Array.BYTES_PER_ELEMENT, 
      0 * Float32Array.BYTES_PER_ELEMENT
    );
    gl.enableVertexAttribArray(Bat.a_position);

    gl.vertexAttribPointer(
      Bat.a_normal,
      3, 
      WebGL2RenderingContext.FLOAT, 
      false, 
      8 * Float32Array.BYTES_PER_ELEMENT, 
      3 * Float32Array.BYTES_PER_ELEMENT
    );
    gl.enableVertexAttribArray(Bat.a_normal);

    gl.vertexAttribPointer(
      Bat.a_text_coord,
      2, 
      WebGL2RenderingContext.FLOAT, 
      false, 
      8 * Float32Array.BYTES_PER_ELEMENT, 
      6 * Float32Array.BYTES_PER_ELEMENT
    );
    gl.enableVertexAttribArray(Bat.a_text_coord);

    // Unbind VAO buffer so other objects cannot modify it
    gl.bindVertexArray(null);

    // Load obj
    WebGLUtils.readObj("./objects/Bat/Flying_bat.obj").then(
      (obj_result) => {
        const packed_data = new Float32Array(obj_result.index_vertices.length * 8);

        for (let i = 0; i < obj_result.index_vertices.length; ++i) {
          const vertex = obj_result.vertices[obj_result.index_vertices[i]];
          const normal = obj_result.normals[obj_result.index_normals[i]];
          const text_coord = obj_result.texture_cordinates[obj_result.index_texture_cordinates[i]];

          packed_data[i*8 + 0] = vertex[0]; 
          packed_data[i*8 + 1] = vertex[1];  
          packed_data[i*8 + 2] = vertex[2]; 

          packed_data[i*8 + 3] = normal[0]; 
          packed_data[i*8 + 4] = normal[1]; 
          packed_data[i*8 + 5] = normal[2]; 
          
          packed_data[i*8 + 6] = text_coord[0]; 
          packed_data[i*8 + 7] = text_coord[1]; 
          
        }

        gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, Bat.buffer_vertices);
        gl.bufferData(
          WebGL2RenderingContext.ARRAY_BUFFER,
          packed_data,
          WebGL2RenderingContext.STATIC_DRAW
        );

        Bat.objects_mtl_ranges = obj_result.objects_ranges;
      }
    );

    // Start loading textures
    fetch("./objects/Bat/Sphere bat mat.png")
    .then(response => response.blob())
    .then(blob => {
      const image = new Image();
      image.src = URL.createObjectURL(blob);
      image.onload = () => {
        gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, Bat.texture);
        gl.texImage2D(WebGL2RenderingContext.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
      };
    });

    fetch("./objects/Bat/Sphere bat mat emission.png")
    .then(response => response.blob())
    .then(blob => {
      const image = new Image();
      image.src = URL.createObjectURL(blob);
      image.onload = () => {
        gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, Bat.texture_emissive);
        gl.texImage2D(WebGL2RenderingContext.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
      };
    });
  }
}