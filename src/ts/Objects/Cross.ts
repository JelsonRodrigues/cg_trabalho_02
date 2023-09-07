import { DrawableObject} from "../Interfaces/DrawableObject";
import * as glm from "gl-matrix";

import { WebGLUtils } from "../WebGLUtils";

import vertexSource from "../../shaders/vertexShader.glsl";
import fragmentSource from "../../shaders/fragmentShader.glsl";
import { Camera } from "../Camera/Camera";
import { Light } from "../Light/Light";

export class Cross implements DrawableObject {
  public model : glm.mat4;

  private static initialized : boolean = false;
  private static program : WebGLProgram;
  private static vao : WebGLVertexArrayObject;
  private static buffer_vertices : WebGLBuffer;
  private static u_model : WebGLUniformLocation;
  private static u_view : WebGLUniformLocation;
  private static u_projection : WebGLUniformLocation;
  private static a_position : number;
  private static u_color : WebGLUniformLocation;
  private static vertices : number = 0;

  constructor (gl : WebGL2RenderingContext) {
    this.model = glm.mat4.create();
    
    this.model[0] = 0.25;
    this.model[5] = 0.25;

    if (!Cross.initialized) {
      this.setup(gl);
    }

    Cross.initialized = true;
  }

  draw(gl : WebGL2RenderingContext, camera : Camera, projection : glm.mat4, lights : Light[]) : void {
    const view = camera.getViewMatrix();
    gl.useProgram(Cross.program as WebGLProgram);

    gl.bindVertexArray(Cross.vao);
  
    gl.uniformMatrix4fv(Cross.u_model, false, this.model);
    gl.uniformMatrix4fv(Cross.u_view, false, glm.mat4.create());
    gl.uniformMatrix4fv(Cross.u_projection, false, glm.mat4.create());

    gl.uniform4f(Cross.u_color, 1.0, 1.0, 1.0, 1.0);

    gl.drawArrays(
      WebGL2RenderingContext.LINES,
      0,
      Cross.vertices
    );

    // Unbind VAO to other gl calls do not modify it
    gl.bindVertexArray(null);
  }
  
  setup(gl: WebGL2RenderingContext): void {
    // Create the program
    Cross.program = WebGLUtils.createProgram(
      gl,
      WebGLUtils.createShader(gl, WebGL2RenderingContext.VERTEX_SHADER, vertexSource) as WebGLShader,
      WebGLUtils.createShader(gl, WebGL2RenderingContext.FRAGMENT_SHADER, fragmentSource) as WebGLShader
    ) as WebGLProgram;
    gl.useProgram(Cross.program);
    
    // Look up uniform and attributes positions
    Cross.u_model = gl.getUniformLocation(Cross.program, "model") as WebGLUniformLocation;
    Cross.u_view = gl.getUniformLocation(Cross.program, "view") as WebGLUniformLocation;
    Cross.u_projection = gl.getUniformLocation(Cross.program, "projection") as WebGLUniformLocation;
    Cross.u_color = gl.getUniformLocation(Cross.program, "color") as WebGLUniformLocation;
    
    Cross.a_position = gl.getAttribLocation(Cross.program, "position");

    // Create the vertices buffer
    Cross.buffer_vertices = gl.createBuffer() as WebGLBuffer;

    // Create the Vertex Array Object
    Cross.vao = gl.createVertexArray() as WebGLVertexArrayObject;    
    gl.bindVertexArray(Cross.vao);
    
    // Tell VAO what buffer to bind
    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, Cross.buffer_vertices);

    // Tell it how to read Data
    gl.vertexAttribPointer(
      Cross.a_position,
      3, 
      WebGL2RenderingContext.FLOAT, 
      false, 
      3 * Float32Array.BYTES_PER_ELEMENT, 
      0 * Float32Array.BYTES_PER_ELEMENT
    );
    gl.enableVertexAttribArray(Cross.a_position);

    // Unbind VAO buffer so other objects cannot modify it
    gl.bindVertexArray(null);

    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, Cross.buffer_vertices);
    const data = new Float32Array([
      -1.0, 0.0, 0.0,
      1.0, 0.0, 0.0,
      0.0, -1.0, 0.0,
      0.0, 1.0, 1.0,
    ]);
    gl.bufferData(
      WebGL2RenderingContext.ARRAY_BUFFER,
      data,
      WebGL2RenderingContext.STATIC_DRAW
    );

    Cross.vertices = data.length / 3;
  }
}