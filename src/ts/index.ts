import * as glm from "gl-matrix";

import { Spline } from "../modules/Spline";
import { CubicBezierCurve } from "../modules/CubicBezierCurve";
import { DrawableObject } from "./DrawableObject";
import { Camera } from "./Camera";
import { Terrain } from "./Terrain";
import { MovingCamera } from "./MovingCamera";
import { SplinePoints } from "./SplinePoints";
import { AnimatedObject } from "./AnimatedObject";
import WebGLUtils from "./WebGLUtils";
import { Origin } from "./Origin";

var canva : HTMLCanvasElement;
var gl : WebGL2RenderingContext;

var spline : Spline;
var terrain : Terrain;
var objects : Array<DrawableObject> = new Array();
var animated_objects : Array<AnimatedObject> = new Array();
var cameras : Array<Camera> = new Array();
var current_camera : number = 0;

// Animation
var animation_slider : HTMLInputElement;
var start = Date.now();

var perspective = glm.mat4.create();

function canvasResize(canva:HTMLCanvasElement) {
  const widht = window.innerWidth - 20;
  const height = window.innerHeight - 20;
  canva.width = widht;
  canva.height = height;
  canva.style.width = `${widht}px`;
  canva.style.height = `${height}px`;
}

async function main() {
  // Get canvas
  canva = document.getElementById("mainCanvas") as HTMLCanvasElement;
  canvasResize(canva);
  
  // Setup gl
  gl = canva.getContext("webgl2") as WebGL2RenderingContext;
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.15, 0.18, 0.15, 1.0);
  gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT)
  gl.viewport(0, 0, canva.width, canva.height)

  // Create the perspective matrix
  const field_of_view = Math.PI / 4.0;
  const near = 0.01;
  const far = 1000.0;
  const aspect_ratio = canva.width / canva.height;
  glm.mat4.perspective(perspective, field_of_view, aspect_ratio, near, far);

  const camera_path = new Spline();
  camera_path.addCurve(new CubicBezierCurve(
    glm.vec3.fromValues(-1.0, 0.9, 0.0),
    glm.vec3.fromValues(0.0, 1.0, 1.0),
    glm.vec3.fromValues(0.0, 1.0, 1.0),
    glm.vec3.fromValues(1.0, 0.9, 0.0),
  ));

  const moving_camera = new MovingCamera([0, 1, 0], camera_path, 10000);

  cameras.push(
    new Camera([0.15, 1.0, 0], [0, 0, 0], [0, 1, 0]),
    moving_camera,
  );

  terrain = new Terrain(gl);
  objects.push(
    terrain,
    new Origin(gl),
  );

  animated_objects.push(
    moving_camera,
  );

  setupEventHandlers();
  start = Date.now();
  animate();
}

var begin_movement : glm.vec2 = glm.vec2.create();

var index_curve_in_spline = -1;
var index_control_point_in_curve = -1;
var spline_modifiyng : SplinePoints | null = null;
var left_control_pressed = false;

function setupEventHandlers() {
  window.addEventListener('keydown', (event) => {
    let camera = cameras[current_camera];
    const camera_position = camera.getCameraPosition();
    const camera_to_look_at_vector = glm.vec3.sub(glm.vec3.create(), camera.getCameraLookingAt(), camera_position);
    const camera_matrix = camera.getCameraMatrix();
    let new_look_at : glm.vec3;
    let vec_movement : glm.vec3;
    switch (event.code) {
      case "ArrowUp": // Translate along -z
        vec_movement = glm.vec3.create();
        glm.vec3.scale(vec_movement, glm.vec3.fromValues(camera_matrix[8], camera_matrix[9], camera_matrix[10]), -0.05);
        glm.vec3.add(camera_position, camera_position, vec_movement);
        new_look_at = glm.vec3.add(glm.vec3.create(), camera_position, camera_to_look_at_vector);
        camera.updateCameraPosition(camera_position);
        camera.updateLookAt(new_look_at);
        break;
      case "ArrowDown": // Translate along z
        vec_movement = glm.vec3.create();
        glm.vec3.scale(vec_movement, glm.vec3.fromValues(camera_matrix[8], camera_matrix[9], camera_matrix[10]), 0.05);
        glm.vec3.add(camera_position, camera_position, vec_movement);
        new_look_at = glm.vec3.add(glm.vec3.create(), camera_position, camera_to_look_at_vector);
        camera.updateCameraPosition(camera_position);
        camera.updateLookAt(new_look_at);
        break;
      case "ArrowRight": // Translate along +x
        vec_movement = glm.vec3.create();
        glm.vec3.scale(vec_movement, glm.vec3.fromValues(camera_matrix[0], camera_matrix[1], camera_matrix[2]), 0.05);
        glm.vec3.add(camera_position, camera_position, vec_movement);
        new_look_at = glm.vec3.add(glm.vec3.create(), camera_position, camera_to_look_at_vector);
        camera.updateCameraPosition(camera_position);
        camera.updateLookAt(new_look_at);
        break;
      case "ArrowLeft": // Translate along -x
        vec_movement = glm.vec3.create();
        glm.vec3.scale(vec_movement, glm.vec3.fromValues(camera_matrix[0], camera_matrix[1], camera_matrix[2]), -0.05);
        glm.vec3.add(camera_position, camera_position, vec_movement);
        new_look_at = glm.vec3.add(glm.vec3.create(), camera_position, camera_to_look_at_vector);
        camera.updateCameraPosition(camera_position);
        camera.updateLookAt(new_look_at);
        break;
      case "ShiftRight": 
        vec_movement = glm.vec3.create();
        glm.vec3.scale(vec_movement, glm.vec3.fromValues(camera_matrix[4], camera_matrix[5], camera_matrix[6]), 0.05);
        glm.vec3.add(camera_position, camera_position, vec_movement);
        new_look_at = glm.vec3.add(glm.vec3.create(), camera_position, camera_to_look_at_vector);
        camera.updateCameraPosition(camera_position);
        camera.updateLookAt(new_look_at);
        break;
      case "ControlRight": 
        vec_movement = glm.vec3.create();
        glm.vec3.scale(vec_movement, glm.vec3.fromValues(camera_matrix[4], camera_matrix[5], camera_matrix[6]), -0.05);
        glm.vec3.add(camera_position, camera_position, vec_movement);
        new_look_at = glm.vec3.add(glm.vec3.create(), camera_position, camera_to_look_at_vector);
        camera.updateCameraPosition(camera_position);
        camera.updateLookAt(new_look_at);
        break;
      case "ControlLeft": 
        left_control_pressed = true;
        break;
      case "KeyV":
        camera = cameras[current_camera];
        if (camera instanceof MovingCamera) { camera.pauseAnimation(); } // Pause animation
        current_camera = (current_camera + 1) % cameras.length;
        camera = cameras[current_camera];
        if (camera instanceof MovingCamera) { camera.resumeAnimation(); } // Resume animation
        break;
      case "KeyJ":
        if (spline_modifiyng != null) {
          spline_modifiyng = spline_modifiyng as SplinePoints;
          spline_modifiyng.spline.turnG0Continuous();
          spline_modifiyng.updateSplinePoints(gl);
        }
        break;
      case "KeyK":
        if (spline_modifiyng != null) {
          spline_modifiyng = spline_modifiyng as SplinePoints;
          spline_modifiyng.spline.turnG1Continuous();
          spline_modifiyng.updateSplinePoints(gl);
        }
        break;
      case "KeyL":
        if (spline_modifiyng != null) {
          spline_modifiyng = spline_modifiyng as SplinePoints;
          spline_modifiyng.spline.turnC1Continuous();
          spline_modifiyng.updateSplinePoints(gl);
        }
        break;
      case "Semicolon":
        if (spline_modifiyng != null) {
          spline_modifiyng = spline_modifiyng as SplinePoints;
          for (let i = 0; i < spline_modifiyng.spline.getNumCurvesInSpline; ++i) {
            const curve = spline_modifiyng.spline.getCurveByIndex(i);
            curve?.getControlPoints.forEach((point)=>{
              console.log(`[${point[0]}, ${point[1]}, ${point[2]}],`);
            });
          }
        }
        break;
      case "KeyH":
        if (spline_modifiyng != null) {
          spline_modifiyng = spline_modifiyng as SplinePoints;
          const last_curve = spline_modifiyng.spline.getCurveByIndex(spline_modifiyng.spline.getNumCurvesInSpline-1);
          const last_point = last_curve?.getControlPointByIndex(3) as glm.vec3;
          const one_before_last_point = last_curve?.getControlPointByIndex(2) as glm.vec3;

          const p0 = glm.vec3.clone(last_point);
          const p0_p1_dist = glm.vec3.sub(glm.vec3.create(), last_point, one_before_last_point);
          const p1 = glm.vec3.add(glm.vec3.create(), p0, p0_p1_dist);
          const p2 = glm.vec3.add(glm.vec3.create(), p1, p0_p1_dist);
          const p3 = glm.vec3.add(glm.vec3.create(), p2, p0_p1_dist);
          spline_modifiyng.spline.addCurve(new CubicBezierCurve(p0, p1, p2, p3));
          spline_modifiyng.spline.sampleSpline();
          spline_modifiyng.updateSplinePoints(gl);
        }
        break;
      case "KeyC":
        camera.updateLookAt(glm.vec3.fromValues(0, 0, 0));
        break;
      case "KeyX":
        const look_vector = glm.vec3.sub(glm.vec3.create(), camera.getCameraLookingAt(), camera.getCameraPosition());
        const look_norm = glm.vec3.normalize(glm.vec3.create(), look_vector);
        camera.updateLookAt(glm.vec3.add(glm.vec3.create(), camera.getCameraPosition(), look_norm));
        break;
    }
  });

  window.addEventListener("keyup", (event) => {
    switch (event.code){
    case "ControlLeft": 
      left_control_pressed = false;
      break;
    }
  });

  canva.addEventListener("pointerdown", (event) => {
    begin_movement[0] = event.clientX;
    begin_movement[1] = event.clientY;
    // console.log((begin_movement[0] *2.0) / canva.width -1.0, (-begin_movement[1] * 2.0) / canva.height + 1.0);
    if (event.button == 0) {
      // Check if the click is in a control point
      const splines = objects.filter((object) => {
        return object instanceof SplinePoints;
      });
      for (let i=0; i< splines.length; ++i) {
        let spline = splines[i] as SplinePoints;
        for (let c = 0; c < spline.spline.getNumCurvesInSpline; ++c) {
          const curve = spline.spline.getCurveByIndex(c) as CubicBezierCurve;
          const num_control_points = (curve.getControlPoints as glm.vec3[]).length;
          for (let j = 0; j < num_control_points; ++j) {
            const point = curve.getControlPointByIndex(j) as glm.vec3;

            // Apply transformations and see if it would be in the same location
            const transformed_point = glm.vec3.create();
            glm.vec3.transformMat4(transformed_point, point, cameras[current_camera].getViewMatrix());
            glm.vec3.transformMat4(transformed_point, transformed_point, perspective);
            
            const dist_vec = glm.vec2.sub(
              glm.vec2.create(), 
              glm.vec2.fromValues((begin_movement[0] *2.0) / canva.width -1.0, (-begin_movement[1] * 2.0) / canva.height + 1.0), 
              glm.vec2.fromValues(transformed_point[0], transformed_point[1]) 
              );
            
            // Radius 
            // The further away the point is, the less space it will ocuppy in screen, so I 
            // Must decrease the radius acordingly to the z percentage of the point in relation
            // With the view frustum
            const dist = glm.vec2.length(dist_vec);
            const RADIUS = 0.06;

            if (dist <= RADIUS) {
              spline_modifiyng = spline;
              index_curve_in_spline = c;
              index_control_point_in_curve = j;
              canva.addEventListener("pointermove", modify_spline);
              return;
            }
          }
        }
      }

      // Otherwise 
      canva.addEventListener("pointermove", orbit_camera_with_mouse);
    }
    else if (event.button == 1) {
      canva.addEventListener("pointermove", move_camera_with_mouse);
    }
  });

  canva.addEventListener("pointerup", (event) => {
    if (event.button == 0) {
      canva.removeEventListener("pointermove", orbit_camera_with_mouse);
      canva.removeEventListener("pointermove", modify_spline);
    }
    else if (event.button == 1) {
      canva.removeEventListener("pointermove", move_camera_with_mouse);
    }
  });

  canva.addEventListener("wheel", (event) => {
    const camera = cameras[current_camera];
    const camera_position_in_world = camera.getCameraPosition();
    const look_at = camera.getCameraLookingAt();
    
    const origin_camera_vec = glm.vec3.create();
    glm.vec3.sub(origin_camera_vec,camera_position_in_world, look_at);

    const old_size = glm.vec3.len(origin_camera_vec);
    const normalized_vec = glm.vec3.create();
    glm.vec3.normalize(normalized_vec, origin_camera_vec);
    
    if (event.deltaY > 0) {
      glm.vec3.scaleAndAdd(camera_position_in_world, look_at, normalized_vec, old_size + 0.05);
    }
    else if (event.deltaY < 0) {
      glm.vec3.scaleAndAdd(camera_position_in_world, look_at, normalized_vec, old_size - 0.05);
    }

    camera.updateCameraPosition(camera_position_in_world);
  });

  const modify_spline = (event: PointerEvent) => {
    const current_position = glm.vec2.fromValues(event.clientX, event.clientY);
    const change = glm.vec2.create();
    glm.vec2.sub(change, current_position, begin_movement);
    
    if (spline_modifiyng == null) { return; }
    spline_modifiyng = spline_modifiyng as SplinePoints;
    const spline = spline_modifiyng.spline;
    const curve = spline.getCurveByIndex(index_curve_in_spline) as CubicBezierCurve;
    const point = curve.getControlPointByIndex(index_control_point_in_curve) as glm.vec3;

    const camera_position_in_world = cameras[current_camera].getCameraPosition();
    const camera_to_point_vec = glm.vec3.sub(glm.vec3.create(), point, camera_position_in_world);

    const camera_matrix = cameras[current_camera].getCameraMatrix();

    if (left_control_pressed) {
      const y_axis_transformed = glm.vec3.fromValues(camera_matrix[4], camera_matrix[5], camera_matrix[6]);
      const dot_value = glm.vec3.dot([0, 1, 0], y_axis_transformed);
      glm.vec3.scaleAndAdd(camera_to_point_vec, camera_to_point_vec, [0, 1, 0], change[1] * 0.01 * (dot_value > 0 ? -1 : 1));
    }
    else {
      const z_axis_transformed = glm.vec3.fromValues(camera_matrix[8], 0, camera_matrix[10]);
      const z_norm = glm.vec3.normalize(glm.vec3.create(), z_axis_transformed);
      glm.vec3.scaleAndAdd(camera_to_point_vec, camera_to_point_vec, z_norm, change[1] * 0.01);
      const x_axis_transformed = glm.vec3.fromValues(camera_matrix[0], 0, camera_matrix[2]);
      const x_norm = glm.vec3.normalize(glm.vec3.create(), x_axis_transformed);
      glm.vec3.scaleAndAdd(camera_to_point_vec, camera_to_point_vec, x_norm, change[0] * 0.01);
    }

    const new_point = glm.vec3.add(glm.vec3.create(), camera_position_in_world, camera_to_point_vec);
    curve.changeControlPoint(index_control_point_in_curve, new_point);
    spline.updateCurve(index_curve_in_spline, curve);
    spline_modifiyng.updateSplinePoints(gl);

    begin_movement = glm.vec2.clone(current_position);
  }

  const orbit_camera_with_mouse = (event: PointerEvent) => {
    const camera = cameras[current_camera];
    const camera_position_in_world = camera.getCameraPosition();
    const look_at_point = camera.getCameraLookingAt();
    const look_at_to_camera_position_vec = glm.vec3.create();
    glm.vec3.sub(look_at_to_camera_position_vec, camera_position_in_world, look_at_point);

    const current_position = glm.vec2.fromValues(event.clientX, event.clientY);
    const change = glm.vec2.create();
    glm.vec2.sub(change, current_position, begin_movement);

    const camera_matrix = cameras[current_camera].getCameraMatrix();

    const y_axis_transformed = glm.vec3.fromValues(camera_matrix[4], camera_matrix[5], camera_matrix[6]);

    const rotation_arround_y = glm.mat4.create();
    glm.mat4.rotate(rotation_arround_y, rotation_arround_y, change[0] * -0.01, y_axis_transformed);
    glm.vec3.transformMat4(look_at_to_camera_position_vec, look_at_to_camera_position_vec, rotation_arround_y);

    const x_axis_transformed = glm.vec3.fromValues(camera_matrix[0], camera_matrix[1], camera_matrix[2]);
    const rotation_arround_x = glm.mat4.create();
    glm.mat4.rotate(rotation_arround_x, rotation_arround_x, change[1] * -0.01, x_axis_transformed);
    glm.vec3.transformMat4(look_at_to_camera_position_vec, look_at_to_camera_position_vec, rotation_arround_x);

    begin_movement = glm.vec2.clone(current_position);
    glm.vec3.add(camera_position_in_world, look_at_point, look_at_to_camera_position_vec);
    if (camera_position_in_world[1] < 0.0) camera_position_in_world[1] = 0.0; // do not let camera go underground
    camera.updateCameraPosition(camera_position_in_world);
  }

  const move_camera_with_mouse = (event: PointerEvent) => {
    const camera = cameras[current_camera];
    const camera_position_in_world = camera.getCameraPosition();
    const look_at_point = camera.getCameraLookingAt();
    const camera_position_to_look_at_vec = glm.vec3.create();
    glm.vec3.sub(camera_position_to_look_at_vec, look_at_point, camera_position_in_world);

    const current_position = glm.vec2.fromValues(event.clientX, event.clientY);
    const change = glm.vec2.create();
    glm.vec2.sub(change, current_position, begin_movement);

    const camera_matrix = cameras[current_camera].getCameraMatrix();

    const y_axis_transformed = glm.vec3.fromValues(camera_matrix[4], camera_matrix[5], camera_matrix[6]);

    const rotation_arround_y = glm.mat4.create();
    glm.mat4.rotate(rotation_arround_y, rotation_arround_y, change[0] * -0.005, y_axis_transformed);
    glm.vec3.transformMat4(camera_position_to_look_at_vec, camera_position_to_look_at_vec, rotation_arround_y);

    const x_axis_transformed = glm.vec3.fromValues(camera_matrix[0], camera_matrix[1], camera_matrix[2]);
    const rotation_arround_x = glm.mat4.create();
    glm.mat4.rotate(rotation_arround_x, rotation_arround_x, change[1] * -0.005, x_axis_transformed);
    glm.vec3.transformMat4(camera_position_to_look_at_vec, camera_position_to_look_at_vec, rotation_arround_x);

    begin_movement = glm.vec2.clone(current_position);
    glm.vec3.add(look_at_point, camera_position_in_world, camera_position_to_look_at_vec);
    camera.updateLookAt(look_at_point);
  }
}

function animate() {
  updateAnimation();

  const camera = cameras[current_camera];
  
  const view_matrix = camera.getViewMatrix();
  const camera_matrix = camera.getCameraMatrix();
  
  // const terrain_origin = glm.vec3.create();
  // glm.vec3.transformMat4(terrain_origin, terrain_origin, terrain.model);

  // terrain.model = glm.mat4.targetTo(glm.mat4.create(), terrain_origin, camera.getCameraPosition(), camera.getCameraUpVector());

  // glm.mat4.multiply(terrain.model, glm.mat4.create(), camera_matrix);
  

  gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT);
  objects.forEach((drawable_obj) => {
      drawable_obj.draw(gl, view_matrix, perspective);
    }
  );
  
  requestAnimationFrame(animate);
}

var before:number = 0;
function updateAnimation() {
  const now = Date.now();
  const fElapsedTime = now - before;
  animated_objects.forEach(
    (object) => {
      object.updateAnimation(fElapsedTime);
    }
  );
  before = now;

  // terrain.camera_pos[0] = (fElapsedTime / 1000.0 * 0.01 + terrain.camera_pos[0]) % 1.0;
}
window.onload = main