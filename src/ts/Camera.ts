import * as glm from "gl-matrix";

export class Camera {
  private position : glm.vec3;
  private look_at : glm.vec3;
  private up_vector : glm.vec3;
  private view_matrix : glm.mat4;
  private camera_matrix : glm.mat4;

  private need_recalculation : boolean = false;

  constructor (position_in_wolrd : glm.vec3, look_at : glm.vec3, up_vector : glm.vec3) {
    this.position = position_in_wolrd;
    this.look_at = look_at;
    this.up_vector = up_vector;

    this.camera_matrix = glm.mat4.create();
    this.view_matrix = glm.mat4.create();

    this.calculateCameraViewMatrix();
  }

  private calculateCameraViewMatrix() {
    const x_axis = glm.vec3.create();
    const y_axis = glm.vec3.create();
    const z_axis = glm.vec3.create();
    
    // Fisrt calculate the Z axis
    glm.vec3.sub(z_axis, this.position, this.look_at);
    glm.vec3.normalize(z_axis, z_axis);

    // Now calculate the X axis
    glm.vec3.cross(x_axis, this.up_vector, z_axis);
    glm.vec3.normalize(x_axis, x_axis);

    // Last the Y axis
    glm.vec3.cross(y_axis, z_axis, x_axis);

    // Set x axis
    this.camera_matrix[0] = x_axis[0];
    this.camera_matrix[1] = x_axis[1];
    this.camera_matrix[2] = x_axis[2];
    this.camera_matrix[3] = 0.0;

    // Set y axis
    this.camera_matrix[4] = y_axis[0];
    this.camera_matrix[5] = y_axis[1];
    this.camera_matrix[6] = y_axis[2];
    this.camera_matrix[7] = 0.0; 

    // Set z axis
    this.camera_matrix[8] = z_axis[0];
    this.camera_matrix[9] = z_axis[1];
    this.camera_matrix[10] = z_axis[2];
    this.camera_matrix[11] = 0.0;

    // Set translation
    this.camera_matrix[12] = -this.position[0];
    this.camera_matrix[13] = -this.position[1];
    this.camera_matrix[14] = -this.position[2];
    this.camera_matrix[15] = 1.0; 

    // Calculate the view matrix

    const x_translation = glm.vec3.dot(x_axis, this.position);
    const y_translation = glm.vec3.dot(y_axis, this.position);
    const z_translation = glm.vec3.dot(z_axis, this.position);
    // Set x axis
    this.view_matrix[0] = x_axis[0];
    this.view_matrix[1] = y_axis[0];
    this.view_matrix[2] = z_axis[0];
    this.view_matrix[3] = 0.0;

    // Set y axis
    this.view_matrix[4] = x_axis[1];
    this.view_matrix[5] = y_axis[1];
    this.view_matrix[6] = z_axis[1];
    this.view_matrix[7] = 0.0; 

    // Set z axis
    this.view_matrix[8] = x_axis[2];
    this.view_matrix[9] = y_axis[2];
    this.view_matrix[10] = z_axis[2];
    this.view_matrix[11] = 0.0;

    // Set translation
    this.view_matrix[12] = -x_translation;
    this.view_matrix[13] = -y_translation;
    this.view_matrix[14] = -z_translation;
    this.view_matrix[15] = 1.0; 

    this.need_recalculation = false;
  }

  public getViewMatrix() : glm.mat4 {
    if (this.need_recalculation) this.calculateCameraViewMatrix();
    return this.view_matrix;
  }

  public getCameraMatrix() : glm.mat4 {
    if (this.need_recalculation) this.calculateCameraViewMatrix();
    return this.camera_matrix;
  }

  public getCameraMatrixAndViewMatrix() : [glm.mat4, glm.mat4] {
    if (this.need_recalculation) this.calculateCameraViewMatrix();
    return [this.camera_matrix, this.view_matrix];
  }

  public updateCameraPosition(new_position:glm.vec3) {
    this.position = new_position;
    this.need_recalculation = true;
  }

  public updateLookAt(new_look_at : glm.vec3) {
    this.look_at = new_look_at;
    this.need_recalculation = true;
  }

  public updateUpVector(new_up_vector : glm.vec3) {
    this.up_vector = new_up_vector;
    this.need_recalculation = true;
  }

  public getCameraPosition() : glm.vec3 { return this.position; }
  public getCameraLookingAt() : glm.vec3 { return this.look_at; }
  public getCameraUpVector() : glm.vec3 { return this.up_vector; }
}