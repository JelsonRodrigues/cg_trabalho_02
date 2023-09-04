import { DrawableObject} from "../Interfaces/DrawableObject";
import { Spline } from "../../modules/Spline"
import * as glm from "gl-matrix";
import { WebGLUtils } from "../WebGLUtils";

import vertexSource from "../../shaders/vertexShader.glsl";
import fragmentSource from "../../shaders/fragmentShader.glsl";
import { Camera } from "../Camera/Camera";
import { Light } from "../Light/Light";

export class SplinePoints implements DrawableObject {
  public model : glm.mat4;
  public spline : Spline;
  private lines : number = 0;
  private buffer_vertices : WebGLBuffer;
  private vao : WebGLVertexArrayObject;
  private buffer_control_points : WebGLBuffer;
  private vao_control_points : WebGLVertexArrayObject;

  private static initialized : boolean = false;
  private static program : WebGLProgram;
  private static u_model : WebGLUniformLocation;
  private static u_view : WebGLUniformLocation;
  private static u_projection : WebGLUniformLocation;
  private static u_color : WebGLUniformLocation;
  private static a_position : number;

  constructor (gl : WebGL2RenderingContext, spline : Spline) {
    this.model = glm.mat4.create();
    this.spline = spline;
    this.buffer_vertices = gl.createBuffer() as WebGLBuffer;
    this.vao = gl.createVertexArray() as WebGLVertexArrayObject;    

    this.buffer_control_points = gl.createBuffer() as WebGLBuffer;
    this.vao_control_points = gl.createVertexArray() as WebGLVertexArrayObject;

    if (!SplinePoints.initialized){
      this.setup(gl);
    }
    SplinePoints.initialized = true;

    this.updateSplinePoints(gl);
  }

  draw(gl : WebGL2RenderingContext, camera : Camera, projection : glm.mat4, lights : Light[]) : void {
    const view = camera.getViewMatrix();
    // gl.disable(gl.DEPTH_TEST);
    gl.useProgram(SplinePoints.program as WebGLProgram);

    gl.bindVertexArray(this.vao);
    
    gl.uniformMatrix4fv(SplinePoints.u_model, false, this.model);
    gl.uniformMatrix4fv(SplinePoints.u_view, false, view);
    gl.uniformMatrix4fv(SplinePoints.u_projection, false, projection);
    gl.uniform4f(SplinePoints.u_color, 1.0, 0.0, 0.0, 1.0);

    gl.drawArrays(
      WebGL2RenderingContext.LINE_STRIP, 
      0, 
      this.lines
      );

    
    gl.bindVertexArray(this.vao_control_points);

    // Draw the lines and control points
    gl.uniformMatrix4fv(SplinePoints.u_model, false, this.model);
    gl.uniformMatrix4fv(SplinePoints.u_view, false, view);
    gl.uniformMatrix4fv(SplinePoints.u_projection, false, projection);
    gl.uniform4f(SplinePoints.u_color, 0.25, 0.25, 0.3, 1.0);
    
    gl.drawArrays(WebGL2RenderingContext.LINES, 0, this.spline.getNumCurvesInSpline * 4);
    gl.disable(gl.DEPTH_TEST);
    gl.drawArrays(WebGL2RenderingContext.POINTS, 0, this.spline.getNumCurvesInSpline * 4);
    gl.enable(gl.DEPTH_TEST);
    gl.bindVertexArray(null);
  } 
  
  updateSplinePoints(gl : WebGL2RenderingContext) {
    this.spline.sampleSpline();

    const data = new Float32Array(this.spline.array_points.length * 3);
    this.spline.array_points.forEach((point, index) => {
      data[index * 3 + 0] = point[0];
      data[index * 3 + 1] = point[1];
      data[index * 3 + 2] = point[2];
    });

    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.buffer_vertices);
    gl.bufferData(WebGL2RenderingContext.ARRAY_BUFFER, data, WebGL2RenderingContext.STATIC_DRAW);

    this.lines = this.spline.array_points.length;

    const spline_control_points = new Float32Array(this.spline.getNumCurvesInSpline * 3 * 4);
    
    for (let i = 0; i < this.spline.getNumCurvesInSpline;  ++i) {
      const curve = this.spline.getCurveByIndex(i);
      curve?.getControlPoints.forEach((value, index) => {
        spline_control_points[i * 4 * 3 + index * 3 + 0] = value[0];
        spline_control_points[i * 4 * 3 + index * 3 + 1] = value[1];
        spline_control_points[i * 4 * 3 + index * 3 + 2] = value[2];
      });
    }
    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.buffer_control_points);
    gl.bufferData(WebGL2RenderingContext.ARRAY_BUFFER, spline_control_points, WebGL2RenderingContext.STATIC_DRAW);
  }

  setup(gl: WebGL2RenderingContext): void {
    // Create the program
    SplinePoints.program = WebGLUtils.createProgram(
      gl,
      WebGLUtils.createShader(gl, WebGL2RenderingContext.VERTEX_SHADER, vertexSource) as WebGLShader,
      WebGLUtils.createShader(gl, WebGL2RenderingContext.FRAGMENT_SHADER, fragmentSource) as WebGLShader
    ) as WebGLProgram;
    gl.useProgram(SplinePoints.program);
    
    // Look up uniform and attributes positions
    SplinePoints.u_model = gl.getUniformLocation(SplinePoints.program, "model") as WebGLUniformLocation;
    SplinePoints.u_view = gl.getUniformLocation(SplinePoints.program, "view") as WebGLUniformLocation;
    SplinePoints.u_projection = gl.getUniformLocation(SplinePoints.program, "projection") as WebGLUniformLocation;
    SplinePoints.u_color = gl.getUniformLocation(SplinePoints.program, "color") as WebGLUniformLocation;
    
    SplinePoints.a_position = gl.getAttribLocation(SplinePoints.program, "position");
    
    // Create the Vertex Array Object
    gl.bindVertexArray(this.vao);
    
    // Tell VAO what buffer to bind
    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.buffer_vertices);

    // Tell it how to read Data
    gl.enableVertexAttribArray(SplinePoints.a_position);

    gl.vertexAttribPointer(
      SplinePoints.a_position,
      3, 
      WebGL2RenderingContext.FLOAT, 
      false, 
      3 * Float32Array.BYTES_PER_ELEMENT, 
      0 * Float32Array.BYTES_PER_ELEMENT
    );
    
    // Unbind VAO buffer so other objects cannot modify it
    gl.bindVertexArray(null);

    gl.bindVertexArray(this.vao_control_points);
    // Tell VAO what buffer to bind
    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, this.buffer_control_points);

    // Tell it how to read Data
    gl.enableVertexAttribArray(SplinePoints.a_position);

    gl.vertexAttribPointer(
      SplinePoints.a_position,
      3, 
      WebGL2RenderingContext.FLOAT, 
      false, 
      3 * Float32Array.BYTES_PER_ELEMENT, 
      0 * Float32Array.BYTES_PER_ELEMENT
    );
    
    // Unbind VAO buffer so other objects cannot modify it
    gl.bindVertexArray(null);
  }
}