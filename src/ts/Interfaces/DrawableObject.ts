import * as glm from "gl-matrix";
import { Camera } from "../Camera/Camera";
import { Light } from "../Light/Light";

export interface DrawableObject {
  // This function sould setup any VAO and call the drawArrays or drawElements
  draw(gl : WebGL2RenderingContext, camera : Camera, projection : glm.mat4, lights : Light[]) : void; 
}
