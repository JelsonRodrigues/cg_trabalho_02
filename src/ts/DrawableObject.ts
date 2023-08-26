import * as glm from "gl-matrix";

export interface DrawableObject {
  // This function sould setup any VAO and call the drawArrays or drawElements
  draw(gl : WebGL2RenderingContext, view : glm.mat4, projection : glm.mat4) : void; 
}
