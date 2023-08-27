import { DrawableObject} from "./DrawableObject";
import * as glm from "gl-matrix";

import { WebGLUtils } from "./WebGLUtils";

import vertexSource from "../shaders/vertexShader.glsl";
import fragmentSource from "../shaders/fragmentShader.glsl";

export class Origin implements DrawableObject {
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
    
    if (!Origin.initialized) {
      this.setup(gl);
    }

    Origin.initialized = true;
  }

  draw(gl: WebGL2RenderingContext, view : glm.mat4, projection : glm.mat4) : void {
    gl.useProgram(Origin.program as WebGLProgram);

    gl.bindVertexArray(Origin.vao);
    
    gl.uniformMatrix4fv(Origin.u_model, false, this.model);
    gl.uniformMatrix4fv(Origin.u_view, false, view);
    gl.uniformMatrix4fv(Origin.u_projection, false, projection);

    gl.uniform4f(Origin.u_color, 1.0, 1.0, 0.5, 1.0);

    gl.drawArrays(
      WebGL2RenderingContext.POINTS,
      0,
      Origin.vertices
    );

    // Unbind VAO to other gl calls do not modify it
    gl.bindVertexArray(null);
  }
  
  setup(gl: WebGL2RenderingContext): void {
    // Create the program
    Origin.program = WebGLUtils.createProgram(
      gl,
      WebGLUtils.createShader(gl, WebGL2RenderingContext.VERTEX_SHADER, vertexSource) as WebGLShader,
      WebGLUtils.createShader(gl, WebGL2RenderingContext.FRAGMENT_SHADER, fragmentSource) as WebGLShader
    ) as WebGLProgram;
    gl.useProgram(Origin.program);
    
    // Look up uniform and attributes positions
    Origin.u_model = gl.getUniformLocation(Origin.program, "model") as WebGLUniformLocation;
    Origin.u_view = gl.getUniformLocation(Origin.program, "view") as WebGLUniformLocation;
    Origin.u_projection = gl.getUniformLocation(Origin.program, "projection") as WebGLUniformLocation;
    Origin.u_color = gl.getUniformLocation(Origin.program, "color") as WebGLUniformLocation;
    
    Origin.a_position = gl.getAttribLocation(Origin.program, "position");

    // Create the vertices buffer
    Origin.buffer_vertices = gl.createBuffer() as WebGLBuffer;

    // Create the Vertex Array Object
    Origin.vao = gl.createVertexArray() as WebGLVertexArrayObject;    
    gl.bindVertexArray(Origin.vao);
    
    // Tell VAO what buffer to bind
    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, Origin.buffer_vertices);

    // Tell it how to read Data
    gl.vertexAttribPointer(
      Origin.a_position,
      3, 
      WebGL2RenderingContext.FLOAT, 
      false, 
      3 * Float32Array.BYTES_PER_ELEMENT, 
      0 * Float32Array.BYTES_PER_ELEMENT
    );
    gl.enableVertexAttribArray(Origin.a_position);

    // Unbind VAO buffer so other objects cannot modify it
    gl.bindVertexArray(null);

    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, Origin.buffer_vertices);
    gl.bufferData(
      WebGL2RenderingContext.ARRAY_BUFFER,
      new Float32Array([
        -1.0, 0.0, -1.0,
        1.0, 0.0, -1.0,
        -1.0, 0.0, 1.0,
        1.0, 0.0, 1.0,
        0.0, 0.0, 0.0,
      ]),
      WebGL2RenderingContext.STATIC_DRAW
    );

    Origin.vertices = 5;
  }
}