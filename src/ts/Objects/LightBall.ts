import { DrawableObject} from "../Interfaces/DrawableObject";
import * as glm from "gl-matrix";

import { WebGLUtils } from "../WebGLUtils";

import vertexSource from "../../shaders/vertexShader.glsl";
import fragmentSource from "../../shaders/fragmentShader.glsl";
import { Camera } from "../Camera/Camera";
import { Light } from "../Light/Light";
import { PointLight } from "../Light/PointLight";
import { AnimatedObject } from "../Interfaces/AnimatedObject";
import { Spline } from "../../modules/Spline";
import { CubicBezierCurve } from "../../modules/CubicBezierCurve";
import { ColidableObject } from "../Interfaces/ColidableObject";

export class LightBall extends PointLight implements DrawableObject, AnimatedObject, ColidableObject {
  public model : glm.mat4;
  private path : Spline;
  private time_total : number = 10_000;
  private accumulated_time : number = 0;
  private paused_animation : boolean = false;

  private static initialized : boolean = false;
  private static program : WebGLProgram;
  private static vao : WebGLVertexArrayObject;
  private static buffer_vertices : WebGLBuffer;
  private static u_model : WebGLUniformLocation;
  private static u_view : WebGLUniformLocation;
  private static u_projection : WebGLUniformLocation;
  private static a_position : number;
  private static u_color : WebGLUniformLocation;
  private static objects_mtl_ranges : Map<[number, number], WebGLUtils.MTL_Info> = new Map();

  constructor (
    gl : WebGL2RenderingContext, 
    position : glm.vec3, 
    color : glm.vec3, 
    radius : number, 
    path: Spline | null = null, 
    time : number = 10_000
  ) {
    super(position, color, radius);
    this.model = glm.mat4.create();
    this.model[12] = position[0];
    this.model[13] = position[1];
    this.model[14] = position[2];

    if (path != null) {
      this.path = path;
    }
    else {
      this.path = new Spline();
      this.path.addCurve(
        new CubicBezierCurve(position, position, position, position));
    }

    this.time_total = time;

    glm.mat4.scale(this.model, this.model, [0.1, 0.1, 0.1]);
    
    if (!LightBall.initialized) {
      this.setup(gl);
    }

    LightBall.initialized = true;
  }
  getCenter(): glm.vec3 {
    const origin = glm.vec4.fromValues(0.0, 0.0, 0.0, 1.0);
    glm.vec4.transformMat4(origin, origin, this.model);
    return glm.vec3.fromValues(origin[0], origin[1], origin[2]);
    // return glm.vec3.fromValues(this.model[12], this.model[13], this.model[14]);
  }
  checkColision(object: ColidableObject): boolean {
    const distance = glm.vec3.length(glm.vec3.sub(glm.vec3.create(), this.getCenter(), object.getCenter()));
    return distance <= this.getRadius() + object.getRadius();
  }
  getRadius(): number {
    const unit_vector = glm.vec4.fromValues(0.58, 0.58, 0.58, 0.0);
    glm.vec4.transformMat4(unit_vector, unit_vector, this.model);
    return glm.vec4.length(unit_vector);
  }

  updateAnimation(fElapsedTime:number): void {
    if (!this.paused_animation ) {
      if (this.accumulated_time + fElapsedTime > this.time_total) {
        this.pauseAnimation();
        return;
      }
      this.accumulated_time = (this.accumulated_time + fElapsedTime) % this.time_total;
      const percent_animation = this.accumulated_time / this.time_total;
      
      const point = this.path.getPoint(percent_animation);

      this.model[12] = point[0];
      this.model[13] = point[1];
      this.model[14] = point[2];

      super.setPosition(point);
    }
  }

  resetAnimation(): void {      
    const point = this.path.getPoint(0.0);

    this.model[12] = point[0];
    this.model[13] = point[1];
    this.model[14] = point[2];

    this.accumulated_time = 0;
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

  draw(gl : WebGL2RenderingContext, camera : Camera, projection : glm.mat4, lights : Light[]) : void {
    const view = camera.getViewMatrix();
    gl.useProgram(LightBall.program as WebGLProgram);

    gl.bindVertexArray(LightBall.vao);
    
    gl.uniformMatrix4fv(LightBall.u_model, false, this.model);
    gl.uniformMatrix4fv(LightBall.u_view, false, view);
    gl.uniformMatrix4fv(LightBall.u_projection, false, projection);

    const color = super.getColor();
    gl.uniform4f(LightBall.u_color, color[0], color[1], color[2], 1.0);

    LightBall.objects_mtl_ranges.forEach(
      (value, key) => {
        switch (value.material) {
          case "Black":
            gl.uniformMatrix4fv(LightBall.u_model, false, glm.mat4.scale(glm.mat4.create(), this.model, [0.9, 0.9, 0.9]));
            gl.uniform4f(LightBall.u_color, color[0], color[1], color[2], 1.0);
            break;
          case "Blue":
            gl.uniform4f(LightBall.u_color, color[0] * 2.0, color[1] * 2.0, color[2] * 2.0, 1.0);
            // gl.uniform4f(LightBall.u_color, 1.0, 1.0, 1.0, 1.0);
            break;
        }
        gl.drawArrays(WebGL2RenderingContext.TRIANGLES, key[0], key[1]);
      }
    )

    // Unbind VAO to other gl calls do not modify it
    gl.bindVertexArray(null);
  }
  
  setup(gl: WebGL2RenderingContext): void {
    // Create the program
    LightBall.program = WebGLUtils.createProgram(
      gl,
      WebGLUtils.createShader(gl, WebGL2RenderingContext.VERTEX_SHADER, vertexSource) as WebGLShader,
      WebGLUtils.createShader(gl, WebGL2RenderingContext.FRAGMENT_SHADER, fragmentSource) as WebGLShader
    ) as WebGLProgram;
    gl.useProgram(LightBall.program);
    
    // Look up uniform and attributes positions
    LightBall.u_model = gl.getUniformLocation(LightBall.program, "model") as WebGLUniformLocation;
    LightBall.u_view = gl.getUniformLocation(LightBall.program, "view") as WebGLUniformLocation;
    LightBall.u_projection = gl.getUniformLocation(LightBall.program, "projection") as WebGLUniformLocation;
    LightBall.u_color = gl.getUniformLocation(LightBall.program, "color") as WebGLUniformLocation;
    
    LightBall.a_position = gl.getAttribLocation(LightBall.program, "position");

    // Create the vertices buffer
    LightBall.buffer_vertices = gl.createBuffer() as WebGLBuffer;

    // Create the Vertex Array Object
    LightBall.vao = gl.createVertexArray() as WebGLVertexArrayObject;    
    gl.bindVertexArray(LightBall.vao);
    
    // Tell VAO what buffer to bind
    gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, LightBall.buffer_vertices);

    // Tell it how to read Data
    gl.vertexAttribPointer(
      LightBall.a_position,
      3, 
      WebGL2RenderingContext.FLOAT, 
      false, 
      3 * Float32Array.BYTES_PER_ELEMENT, 
      0 * Float32Array.BYTES_PER_ELEMENT
    );
    gl.enableVertexAttribArray(LightBall.a_position);

    // Unbind VAO buffer so other objects cannot modify it
    gl.bindVertexArray(null);

    WebGLUtils.readObj("./objects/HexagonBall/hexagon_ball.obj").then(
      (obj_result) => {
        const packed_data = new Float32Array(obj_result.index_vertices.length * 3);

        for (let i = 0; i < obj_result.index_vertices.length; ++i) {
          const vertex = obj_result.vertices[obj_result.index_vertices[i]];

          packed_data[i*3 + 0] = vertex[0]; 
          packed_data[i*3 + 1] = vertex[1];  
          packed_data[i*3 + 2] = vertex[2]; 
        }

        gl.bindBuffer(WebGL2RenderingContext.ARRAY_BUFFER, LightBall.buffer_vertices);
        gl.bufferData(
          WebGL2RenderingContext.ARRAY_BUFFER,
          packed_data,
          WebGL2RenderingContext.STATIC_DRAW
        );

        LightBall.objects_mtl_ranges = obj_result.objects_ranges;
      }
    );
  }
}