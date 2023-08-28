import { DrawableObject} from "./DrawableObject";
import * as glm from "gl-matrix";

import { WebGLUtils } from "./WebGLUtils";

import vertexSource from "../shaders/terrainVS.glsl";
import fragmentSource from "../shaders/terrainFS.glsl";

export class Terrain implements DrawableObject {
  public model : glm.mat4;
  public camera_pos : glm.vec2 = glm.vec2.fromValues(0, 0);

  private static initialized : boolean = false;
  private static program : WebGLProgram;
  private static vao : WebGLVertexArrayObject;
  private static buffer_vertices : WebGLBuffer;
  private static buffer_indexes : WebGLBuffer;
  private static u_model : WebGLUniformLocation;
  private static u_view : WebGLUniformLocation;
  private static u_projection : WebGLUniformLocation;
  private static u_camera_position : WebGLUniformLocation;
  private static a_position : number;
  private static u_texture : WebGLUniformLocation;
  private static u_height_map : WebGLUniformLocation;
  private static texture : WebGLTexture;
  private static height_map : WebGLTexture;
  private static vertices : number = 0;
  private static faces : number = 0;


  constructor (gl : WebGL2RenderingContext) {
    this.model = glm.mat4.create();
    glm.mat4.scale(this.model, this.model, [20, 20, 20]);
    glm.mat4.rotateY(this.model, this.model, -Math.PI / 2);
    glm.mat4.translate(this.model, this.model, [-0.5, -0.4, -0.5]);
    // glm.mat4.translate(this.model, this.model, [-0.5, -0.4, -1.0]);
    
    if (!Terrain.initialized) {
      this.setup(gl);
    }

    Terrain.initialized = true;
  }

  draw(gl: WebGL2RenderingContext, view : glm.mat4, projection : glm.mat4) : void {
    gl.useProgram(Terrain.program as WebGLProgram);

    gl.bindVertexArray(Terrain.vao);
    
    gl.uniformMatrix4fv(Terrain.u_model, false, this.model);
    gl.uniformMatrix4fv(Terrain.u_view, false, view);
    gl.uniformMatrix4fv(Terrain.u_projection, false, projection);
    gl.uniform2f(Terrain.u_camera_position, this.camera_pos[0], this.camera_pos[1]);

    gl.uniform1i(Terrain.u_height_map, 0);
    gl.uniform1i(Terrain.u_texture, 1);

    gl.activeTexture(WebGL2RenderingContext.TEXTURE0 + 0);
    gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, Terrain.height_map);

    gl.activeTexture(WebGL2RenderingContext.TEXTURE0 + 1);
    gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, Terrain.texture);

    // gl.drawArrays(
    //   WebGL2RenderingContext.LINES,
    //   0,
    //   Terrain.vertices,
    // );

    gl.drawElements(WebGL2RenderingContext.TRIANGLES, Terrain.faces*3, WebGL2RenderingContext.UNSIGNED_INT, 0);
    // gl.drawElements(WebGL2RenderingContext.POINTS, Terrain.faces * 3, WebGL2RenderingContext.UNSIGNED_SHORT, 0);

    // Unbind VAO to other gl calls do not modify it
    gl.bindVertexArray(null);
  }
  
  setup(gl: WebGL2RenderingContext): void {
    // Create the program
    Terrain.program = WebGLUtils.createProgram(
      gl,
      WebGLUtils.createShader(gl, WebGL2RenderingContext.VERTEX_SHADER, vertexSource) as WebGLShader,
      WebGLUtils.createShader(gl, WebGL2RenderingContext.FRAGMENT_SHADER, fragmentSource) as WebGLShader
    ) as WebGLProgram;
    gl.useProgram(Terrain.program);
    
    // Look up uniform and attributes positions
    Terrain.u_model = gl.getUniformLocation(Terrain.program, "u_model") as WebGLUniformLocation;
    Terrain.u_view = gl.getUniformLocation(Terrain.program, "u_view") as WebGLUniformLocation;
    Terrain.u_projection = gl.getUniformLocation(Terrain.program, "u_projection") as WebGLUniformLocation;
    Terrain.u_height_map = gl.getUniformLocation(Terrain.program, "u_heightmap") as WebGLUniformLocation;
    Terrain.u_texture = gl.getUniformLocation(Terrain.program, "u_texture") as WebGLUniformLocation;
    Terrain.u_camera_position = gl.getUniformLocation(Terrain.program, "camera_position") as WebGLUniformLocation;
    
    Terrain.a_position = gl.getAttribLocation(Terrain.program, "position");
    Terrain.texture = gl.createTexture() as WebGLTexture;
    gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, Terrain.texture);
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

    Terrain.height_map = gl.createTexture() as WebGLTexture;
    gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, Terrain.height_map);
    gl.texImage2D(
      WebGL2RenderingContext.TEXTURE_2D, 
      0, 
      WebGL2RenderingContext.RGBA, 
      1, 
      1, 
      0, 
      WebGL2RenderingContext.RGBA, 
      WebGL2RenderingContext.UNSIGNED_BYTE, 
      new Uint8Array([0, 0, 0, 255])
    );

    // Create the vertices buffer
    Terrain.buffer_vertices = gl.createBuffer() as WebGLBuffer;
    Terrain.buffer_indexes = gl.createBuffer() as WebGLBuffer;

    // Create the Vertex Array Object
    Terrain.vao = gl.createVertexArray() as WebGLVertexArrayObject;    
    gl.bindVertexArray(Terrain.vao);
    
    // Tell VAO what buffer to bind
    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, Terrain.buffer_vertices);
    gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, Terrain.buffer_indexes);
    
    // Tell it how to read Data
    gl.vertexAttribPointer(
      Terrain.a_position,
      3, 
      WebGL2RenderingContext.FLOAT, 
      false, 
      3 * Float32Array.BYTES_PER_ELEMENT, 
      0 * Float32Array.BYTES_PER_ELEMENT
    );
    gl.enableVertexAttribArray(Terrain.a_position);

    // Unbind VAO buffer so other objects cannot modify it
    gl.bindVertexArray(null);

    // Start loading textures
    fetch("objects/Terrain/Mountain Range Diffuse PNG.png")
    // fetch("objects/Terrain/Rugged Terrain with Rocky Peaks Diffuse PNG.png")
    .then(response => response.blob())
    .then(blob => {
      const image = new Image();
      image.src = URL.createObjectURL(blob);
      image.onload = () => {
        gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, Terrain.texture);
        gl.texImage2D(WebGL2RenderingContext.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
      };
    });

    fetch("objects/Terrain/Mountain Range Height Map PNG.png")
    // fetch("objects/Terrain/Rugged Terrain with Rocky Peaks Height Map PNG.png")
    .then(response => response.blob())
    .then(blob => {
      const image = new Image();
      image.src = URL.createObjectURL(blob);
      image.onload = () => {
        gl.bindTexture(WebGL2RenderingContext.TEXTURE_2D, Terrain.height_map);
        gl.texImage2D(WebGL2RenderingContext.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
      };
    });

    // Create terrain mesh
    const [data, indexes] = this.createMesh();

    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, Terrain.buffer_vertices);
    gl.bufferData(
      WebGL2RenderingContext.ARRAY_BUFFER,
      data,
      WebGL2RenderingContext.STATIC_DRAW
    );

    gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, Terrain.buffer_indexes);
    gl.bufferData(
      WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER,
      indexes,
      WebGL2RenderingContext.STATIC_DRAW
    );

    Terrain.vertices = data.length / 3;
    Terrain.faces = indexes.length / 3;

    console.log("Number of Vertices: ", Terrain.vertices);
    console.log("Number of triengles: ", Terrain.faces);

  }

  private createMeshRadial() : [Float32Array, Uint32Array] {
    const NUMBER_OF_RAYS = 25;
    const LEVELS_OF_DETAIL = 4;
    const POINTS_PER_LOD = 8;
    
    // Divide the field of view into NUMBER_OF_RAYS
    const field_of_view = Math.PI * 1.0; // 110% 180 degrees
    const angle_between_rays = field_of_view / (NUMBER_OF_RAYS-1);

    const data = new Float32Array( 3 * (NUMBER_OF_RAYS * LEVELS_OF_DETAIL * POINTS_PER_LOD));
    const indexes = new Uint32Array( 
      3 * // Three indexes per triangle (face)
      (NUMBER_OF_RAYS-1) * 2 * // Points make a quadrilateral, and so each point will be in 2 triangles
      LEVELS_OF_DETAIL * // Number of LODS to multiply by the number of points
      POINTS_PER_LOD  // Number of points per LOD
    );

    // Cache the base vectors for each ray
    const RAYS_VECTORS_CACHE = new Array<glm.vec2>(NUMBER_OF_RAYS);
    for (let i = 0; i < NUMBER_OF_RAYS; ++i){
      RAYS_VECTORS_CACHE[i] = glm.vec2.fromValues(Math.cos(angle_between_rays * i) / 2.0, Math.sin(angle_between_rays * i) / 2.0);
    }

    let size_last = 0.0;
    for (let i = 0; i < LEVELS_OF_DETAIL; ++i) {
      size_last += POINTS_PER_LOD * Math.pow(2, i);
    }

    let dist_step = 1 / size_last;
    let current_dist = 0.0;
    const origin = glm.vec3.fromValues(0.5, 0.0, 0.5);

    for (let i = 0; i < LEVELS_OF_DETAIL; ++i) {
      for (let j = 0; j < POINTS_PER_LOD; ++j) {
        for (let k = 0; k < NUMBER_OF_RAYS; ++k) {
          data[3*(i * NUMBER_OF_RAYS * POINTS_PER_LOD + j * NUMBER_OF_RAYS + k) + 0] = RAYS_VECTORS_CACHE[k][0] * current_dist + origin[0];
          data[3*(i * NUMBER_OF_RAYS * POINTS_PER_LOD + j * NUMBER_OF_RAYS + k) + 1] = 0 + origin[1];
          data[3*(i * NUMBER_OF_RAYS * POINTS_PER_LOD + j * NUMBER_OF_RAYS + k) + 2] = RAYS_VECTORS_CACHE[k][1] * current_dist + origin[2];
        }
        current_dist += dist_step;
      }
      // dist_step *= Math.pow(2.0, i); // Double distance at each Level of Detail
      dist_step *= 2;
    }

    for (let i = 1 ; i < LEVELS_OF_DETAIL * POINTS_PER_LOD; ++i) {
      for (let j = 0; j < NUMBER_OF_RAYS-1; ++j) {
        indexes[6*((i-1) * (NUMBER_OF_RAYS-1) + j) + 0] = i * NUMBER_OF_RAYS + j;
        indexes[6*((i-1) * (NUMBER_OF_RAYS-1) + j) + 1] = i * NUMBER_OF_RAYS + (j+1);
        indexes[6*((i-1) * (NUMBER_OF_RAYS-1) + j) + 2] = (i-1) * NUMBER_OF_RAYS + (j+1);

        indexes[6*((i-1) * (NUMBER_OF_RAYS-1) + j) + 3] = i * NUMBER_OF_RAYS + j;
        indexes[6*((i-1) * (NUMBER_OF_RAYS-1) + j) + 4] = (i-1) * NUMBER_OF_RAYS + (j+1);
        indexes[6*((i-1) * (NUMBER_OF_RAYS-1) + j) + 5] = (i-1) * NUMBER_OF_RAYS + j;
      }
    }

    return [data, indexes];
  }

  private createMesh() : [Float32Array, Uint32Array] {
    const grid_size = 128;
    const step = 1.0/(grid_size-1);

    const data = new Float32Array( 3 * grid_size * grid_size);
    const indexes = new Uint32Array( 3 * (grid_size-1) * (grid_size-1) * 2 );

    const origin = glm.vec3.fromValues(0.0, 0.0, 0.0);
    for (let i = 0; i < grid_size; ++i) {
      for (let j = 0; j < grid_size; ++j) {
        data[3*(i * grid_size + j) + 0] = i * step + origin[0];
        data[3*(i * grid_size + j) + 1] = 0 + origin[1];
        data[3*(i * grid_size + j) + 2] = j * step + origin[2];
      }
    }

    for (let i = 0; i < grid_size-1; ++i) {
      for (let j = 0; j < grid_size-1; ++j) {
        indexes[6*(i*(grid_size - 1)+ j) + 0] = i * grid_size + j;
        indexes[6*(i*(grid_size - 1)+ j) + 1] = i * grid_size + (j+1);
        indexes[6*(i*(grid_size - 1)+ j) + 2] = (i+1) * grid_size + (j+1);
        indexes[6*(i*(grid_size - 1)+ j) + 3] = i * grid_size + j;
        indexes[6*(i*(grid_size - 1)+ j) + 4] = (i+1) * grid_size + (j+1);
        indexes[6*(i*(grid_size - 1)+ j) + 5] = (i+1) * grid_size + j;
      }
    }

    return [ data, indexes ];
  }

  public updateCameraPosition(new_pos : glm.vec2) {
    this.camera_pos = new_pos;
  }
}