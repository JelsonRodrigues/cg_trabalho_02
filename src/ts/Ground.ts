import { DrawableObject} from "./DrawableObject";
import * as glm from "gl-matrix";

import { WebGLUtils } from "./WebGLUtils";

import vertexSource from "../shaders/vertexShader.glsl";
import fragmentSource from "../shaders/groundFragmentShader.glsl";

export class Ground implements DrawableObject {
  public model : glm.mat4;

  private static initialized : boolean = false;
  private static program : WebGLProgram;
  private static vao : WebGLVertexArrayObject;
  private static buffer_vertices : WebGLBuffer;
  private static buffer_index_vertices : WebGLBuffer;
  private static u_model : WebGLUniformLocation;
  private static u_view : WebGLUniformLocation;
  private static u_projection : WebGLUniformLocation;
  private static a_position : number;
  private static vertices : number = 0;
  private static faces : number = 0;

  constructor (gl : WebGL2RenderingContext) {
    this.model = glm.mat4.create();
    glm.mat4.scale(this.model, this.model, [50, 0, 50]);
    
    if (!Ground.initialized) {
      this.setup(gl);
    }

    Ground.initialized = true;

    
    // Put data to buffer
    this.setup(gl);
  }

  draw(gl: WebGL2RenderingContext, view : glm.mat4, projection : glm.mat4) : void {
    gl.useProgram(Ground.program as WebGLProgram);

    gl.bindVertexArray(Ground.vao);
    
    gl.uniformMatrix4fv(Ground.u_model, false, this.model);
    gl.uniformMatrix4fv(Ground.u_view, false, view);
    gl.uniformMatrix4fv(Ground.u_projection, false, projection);

    gl.drawElements(
      WebGL2RenderingContext.TRIANGLES,
      Ground.faces,
      WebGL2RenderingContext.UNSIGNED_SHORT,
      0
    );

    // Unbind VAO to other gl calls do not modify it
    gl.bindVertexArray(null);
  }
  
  setup(gl: WebGL2RenderingContext): void {
    // Create the program
    Ground.program = WebGLUtils.createProgram(
      gl,
      WebGLUtils.createShader(gl, WebGL2RenderingContext.VERTEX_SHADER, vertexSource) as WebGLShader,
      WebGLUtils.createShader(gl, WebGL2RenderingContext.FRAGMENT_SHADER, fragmentSource) as WebGLShader
    ) as WebGLProgram;
    gl.useProgram(Ground.program);
    
    // Look up uniform and attributes positions
    Ground.u_model = gl.getUniformLocation(Ground.program, "model") as WebGLUniformLocation;
    Ground.u_view = gl.getUniformLocation(Ground.program, "view") as WebGLUniformLocation;
    Ground.u_projection = gl.getUniformLocation(Ground.program, "projection") as WebGLUniformLocation;
    
    Ground.a_position = gl.getAttribLocation(Ground.program, "position");
    
    // Create the vertices buffer
    Ground.buffer_vertices = gl.createBuffer() as WebGLBuffer;
    Ground.buffer_index_vertices = gl.createBuffer() as WebGLBuffer;

    // Create the Vertex Array Object
    Ground.vao = gl.createVertexArray() as WebGLVertexArrayObject;    
    gl.bindVertexArray(Ground.vao);
    
    // Tell VAO what buffer to bind
    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, Ground.buffer_vertices);
    gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, Ground.buffer_index_vertices);

    // Tell it how to read Data
    gl.vertexAttribPointer(
      Ground.a_position,
      3, 
      WebGL2RenderingContext.FLOAT, 
      false, 
      3 * Float32Array.BYTES_PER_ELEMENT, 
      0 * Float32Array.BYTES_PER_ELEMENT
    );
    gl.enableVertexAttribArray(Ground.a_position);

    // Unbind VAO buffer so other objects cannot modify it
    gl.bindVertexArray(null);

    
    const data = [
      1.0, 0.0, 1.0,
      1.0, 0.0, -1.0,
      -1.0, 0.0, -1.0,
      -1.0, 0.0, 1.0,
    ];

    const indices = [
      0, 1, 2,
      2, 3, 0,
    ];

    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, Ground.buffer_vertices);
    gl.bufferData(
      WebGL2RenderingContext.ARRAY_BUFFER,
      new Float32Array(data),
      WebGL2RenderingContext.STATIC_DRAW
    );

    gl.bindBuffer(WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER, Ground.buffer_index_vertices);
    gl.bufferData(
      WebGL2RenderingContext.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      WebGL2RenderingContext.STATIC_DRAW
    )

    Ground.vertices = data.length / 3;
    Ground.faces = indices.length;
  }
}