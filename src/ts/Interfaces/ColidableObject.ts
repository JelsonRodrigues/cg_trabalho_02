import * as glm from "gl-matrix";

export interface ColidableObject {
  getCenter(): glm.vec3;
  getRadius(): number;
  checkColision(object: ColidableObject) : boolean;
}