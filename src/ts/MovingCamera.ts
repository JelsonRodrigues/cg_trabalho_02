import { Spline } from "../modules/Spline";
import { AnimatedObject } from "./AnimatedObject";
import { Camera } from "./Camera";

import * as glm from "gl-matrix";

export class MovingCamera extends Camera implements AnimatedObject {
  private camera_path : Spline;
  private camera_loking_at_path : Spline | null;
  private time_total : number = 10_000;
  private accumulated_time : number = 0;
  private paused_animation : boolean = false;
  private slider_controller : HTMLInputElement | null;

  constructor (up_vector: glm.vec3, camera_path:Spline, time_complete_path_ms:number, camera_loking_at_path : Spline | null = null, slider_controller : HTMLInputElement | null = null) {
    super(camera_path.getPoint(0.0), camera_path.getPointTangent(0.0), up_vector);
    this.camera_path = camera_path;
    this.camera_loking_at_path = camera_loking_at_path;
    this.time_total = time_complete_path_ms;
    this.slider_controller = slider_controller;
    if (this.slider_controller != null) {
      this.slider_controller.max = time_complete_path_ms.toFixed(2);
      this.slider_controller.addEventListener("input", (event) => {
        const value = parseFloat((this.slider_controller as HTMLInputElement).value);
        const percent = value / time_complete_path_ms;
        this.accumulated_time = percent * time_complete_path_ms;
      })
    }
  }
  
  updateAnimation(fElapsedTime:number): void {
    if (!this.paused_animation ) {
      this.accumulated_time = (this.accumulated_time + fElapsedTime) % this.time_total;
      const percent_animation = this.accumulated_time / this.time_total;
      super.updateCameraPosition(this.camera_path.getPoint(percent_animation));
      if (this.camera_loking_at_path != null) {
        super.updateLookAt(this.camera_loking_at_path.getPoint(percent_animation));
      }
      else {
        super.updateLookAt(this.camera_path.getPointTangent(percent_animation));
      }
      if (this.slider_controller != null) {
        this.slider_controller.value = `${percent_animation * parseFloat(this.slider_controller.max) - parseFloat(this.slider_controller.min)}`;
      }
    }
  }

  resetAnimation(): void {
    if (this.slider_controller != null) {
      this.slider_controller.value = this.slider_controller.min;
    }
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
}