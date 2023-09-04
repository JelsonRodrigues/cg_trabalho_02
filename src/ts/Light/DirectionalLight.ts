import { Light } from "./Light";
import * as glm from "gl-matrix";

export class DirectionalLight extends Light {
  private color : glm.vec3 = glm.vec3.fromValues(1.0, 1.0, 1.0);
  private direction : glm.vec3 = glm.vec3.fromValues(0.0, -1.0, 0.0);

  constructor (direction : glm.vec3 = [0.0, -1.0, 0.0], color : glm.vec3 = [1.0, 1.0, 1.0]) {
    super();
    this.direction = glm.vec3.normalize(glm.vec3.create(), direction);
    this.color = color;
  }

  public getColor(): glm.vec3 { return this.color; }
  public getDirection() : glm.vec3 { return this.direction; }
  public setColor(color:glm.vec3) { this.color = color; }
  public setDirection(direction:glm.vec3) { this.direction = glm.vec3.normalize(glm.vec3.create(), direction); }
}