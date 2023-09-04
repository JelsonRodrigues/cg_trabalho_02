import { DrawableObject} from "../Interfaces/DrawableObject";
import * as glm from "gl-matrix";

import { WebGLUtils } from "../WebGLUtils";

import vertexSource from "../../shaders/vertexShader.glsl";
import fragmentSource from "../../shaders/fragmentShader.glsl";
import { Camera } from "../Camera/Camera";
import { Light } from "../Light/Light";
import { PointLight } from "./PointLight";

export class PointLightDot extends PointLight implements DrawableObject{
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

  constructor (gl : WebGL2RenderingContext, position : glm.vec3, color : glm.vec3, radius : number) {
    super(position, color, radius);
    this.model = glm.mat4.create();
    this.model[12] = position[0];
    this.model[13] = position[1];
    this.model[14] = position[2];
    
    if (!PointLightDot.initialized) {
      this.setup(gl);
    }

    PointLightDot.initialized = true;
  }

  draw(gl : WebGL2RenderingContext, camera : Camera, projection : glm.mat4, lights : Light[]) : void {
    const view = camera.getViewMatrix();
    gl.useProgram(PointLightDot.program as WebGLProgram);

    gl.bindVertexArray(PointLightDot.vao);
    
    gl.uniformMatrix4fv(PointLightDot.u_model, false, this.model);
    gl.uniformMatrix4fv(PointLightDot.u_view, false, view);
    gl.uniformMatrix4fv(PointLightDot.u_projection, false, projection);

    const color = super.getColor();
    gl.uniform4f(PointLightDot.u_color, color[0], color[1], color[2], 1.0);

    gl.drawArrays(
      WebGL2RenderingContext.POINTS,
      0,
      PointLightDot.vertices
    );

    // Unbind VAO to other gl calls do not modify it
    gl.bindVertexArray(null);
  }
  
  setup(gl: WebGL2RenderingContext): void {
    // Create the program
    PointLightDot.program = WebGLUtils.createProgram(
      gl,
      WebGLUtils.createShader(gl, WebGL2RenderingContext.VERTEX_SHADER, vertexSource) as WebGLShader,
      WebGLUtils.createShader(gl, WebGL2RenderingContext.FRAGMENT_SHADER, fragmentSource) as WebGLShader
    ) as WebGLProgram;
    gl.useProgram(PointLightDot.program);
    
    // Look up uniform and attributes positions
    PointLightDot.u_model = gl.getUniformLocation(PointLightDot.program, "model") as WebGLUniformLocation;
    PointLightDot.u_view = gl.getUniformLocation(PointLightDot.program, "view") as WebGLUniformLocation;
    PointLightDot.u_projection = gl.getUniformLocation(PointLightDot.program, "projection") as WebGLUniformLocation;
    PointLightDot.u_color = gl.getUniformLocation(PointLightDot.program, "color") as WebGLUniformLocation;
    
    PointLightDot.a_position = gl.getAttribLocation(PointLightDot.program, "position");

    // Create the vertices buffer
    PointLightDot.buffer_vertices = gl.createBuffer() as WebGLBuffer;

    // Create the Vertex Array Object
    PointLightDot.vao = gl.createVertexArray() as WebGLVertexArrayObject;    
    gl.bindVertexArray(PointLightDot.vao);
    
    // Tell VAO what buffer to bind
    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, PointLightDot.buffer_vertices);

    // Tell it how to read Data
    gl.vertexAttribPointer(
      PointLightDot.a_position,
      3, 
      WebGL2RenderingContext.FLOAT, 
      false, 
      3 * Float32Array.BYTES_PER_ELEMENT, 
      0 * Float32Array.BYTES_PER_ELEMENT
    );
    gl.enableVertexAttribArray(PointLightDot.a_position);

    // Unbind VAO buffer so other objects cannot modify it
    gl.bindVertexArray(null);

    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, PointLightDot.buffer_vertices);
    const data = new Float32Array([
      0.0, 0.0, 0.0
    ]);
    gl.bufferData(
      WebGL2RenderingContext.ARRAY_BUFFER,
      data,
      WebGL2RenderingContext.STATIC_DRAW
    );

    PointLightDot.vertices = data.length / 3;
  }
}