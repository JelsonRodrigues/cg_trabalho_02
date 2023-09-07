import { Light } from "./Light";
import * as glm from "gl-matrix";

export class PointLight implements Light {
  private color : glm.vec3 = glm.vec3.fromValues(1.0, 1.0, 1.0);
  private position : glm.vec3 = glm.vec3.fromValues(0.0, -1.0, 0.0);
  private radius : number = 10.0;

  constructor (position : glm.vec3 = [0.0, 0.0, 0.0], color : glm.vec3 = [1.0, 1.0, 1.0], radius : number = 10.0) {
    this.position = position;
    this.color = color;
    this.radius = radius;
  }

  getColor(): glm.vec3 { return this.color; }
  getPosition() : glm.vec3 { return this.position; }
  getRadiusIlumination() : number { return this.radius; }
  setColor(color:glm.vec3) { this.color = color; }
  setPosition(position:glm.vec3) { this.position = position; }
  setRadius(radius : number) { this.radius = radius; }
}