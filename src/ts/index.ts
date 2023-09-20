import * as glm from "gl-matrix";

import { Spline } from "../modules/Spline";
import { CubicBezierCurve } from "../modules/CubicBezierCurve";
import { DrawableObject } from "./Interfaces/DrawableObject";
import { Camera } from "./Camera/Camera";
import { Terrain } from "./Objects/Terrain";
import { MovingCamera } from "./Camera/MovingCamera";
import { SplinePoints } from "./Objects/SplinePoints";
import { AnimatedObject } from "./Interfaces/AnimatedObject";
import WebGLUtils from "./WebGLUtils";
import { Origin } from "./Objects/Origin";
import { Light } from "./Light/Light";
import { DirectionalLight } from "./Light/DirectionalLight";
import { PointLight } from "./Light/PointLight";
import { PointLightDot } from "./Light/PointLightDot";
import { LightBall } from "./Objects/LightBall";
import { Cross } from "./Objects/Cross";
import { Bat } from "./Objects/Bat";
import { ColidableObject } from "./Interfaces/ColidableObject";

var canva : HTMLCanvasElement;
var gl : WebGL2RenderingContext;

var spline : Spline;
var terrain : Terrain;
var objects : Array<DrawableObject> = new Array();
var animated_objects : Array<AnimatedObject> = new Array();
var cameras : Array<Camera> = new Array();
var current_camera : number = 0;
var lights : Array<Light> = new Array();
var colidable_objects : Array<ColidableObject> = new Array();

var perspective = glm.mat4.create();

const MAXIMUM_NUMBER_OF_POINT_LIGHTS = 8;

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
  // gl.clearColor(0.984313725490196, 0.984313725490196, 0.9725490196078431, 1.0);
  gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT)
  gl.viewport(0, 0, canva.width, canva.height)

  // Create the perspective matrix
  const field_of_view = Math.PI / 4.0;
  const near = 0.01;
  const far = 1000.0;
  const aspect_ratio = canva.width / canva.height;
  glm.mat4.perspective(perspective, field_of_view, aspect_ratio, near, far);

  terrain = new Terrain(gl);
  // const origin = new Origin(gl);
  // origin.model = terrain.model;
  objects.push(
    new Cross(gl, aspect_ratio),
    terrain,
    // origin,
  );
  
  for (let i = 0; i < 4; ++i) {
    const spline_follow = new Spline();
    const fisrt = glm.vec3.transformMat4(glm.vec3.create(), glm.vec3.fromValues(Math.random(), 0.6, Math.random()), terrain.model);
    spline_follow.addCurve(
      new CubicBezierCurve(
        fisrt,
        glm.vec3.transformMat4(glm.vec3.create(), glm.vec3.fromValues(Math.random(), 0.65, Math.random()), terrain.model),
        glm.vec3.transformMat4(glm.vec3.create(), glm.vec3.fromValues(Math.random(), 0.65, Math.random()), terrain.model),
        glm.vec3.transformMat4(glm.vec3.create(), glm.vec3.fromValues(Math.random(), 0.6, Math.random()), terrain.model))
      );
    spline_follow.addCurve(
      new CubicBezierCurve(
        glm.vec3.transformMat4(glm.vec3.create(), glm.vec3.fromValues(Math.random(), 0.65, Math.random()), terrain.model),
        glm.vec3.transformMat4(glm.vec3.create(), glm.vec3.fromValues(Math.random(), 0.65, Math.random()), terrain.model),
        glm.vec3.transformMat4(glm.vec3.create(), glm.vec3.fromValues(Math.random(), 0.6, Math.random()), terrain.model),
        fisrt
        )
      );

    const bat = new Bat(gl, spline_follow);

    // const scale = (Math.random() / 2.0 + 0.5) * 2.0 - 1.0;
    const scale = 3.0;
    glm.mat4.scale(bat.model, bat.model, [scale, scale, scale])

    objects.push(bat);
    colidable_objects.push(bat);
    animated_objects.push(bat);
  }

  spline = new Spline();
  // spline.addCurve(new CubicBezierCurve(
  //   glm.vec3.transformMat4(glm.vec3.create(), glm.vec3.fromValues(0.0, 0.6, 0.0), terrain.model),
  //   glm.vec3.transformMat4(glm.vec3.create(), glm.vec3.fromValues(0.5, 0.65, 1.0), terrain.model),
  //   glm.vec3.transformMat4(glm.vec3.create(), glm.vec3.fromValues(0.5, 0.65, 1.0), terrain.model),
  //   glm.vec3.transformMat4(glm.vec3.create(), glm.vec3.fromValues(0.1, 0.6, 0.0), terrain.model),
  // ));
  spline.addCurve(new CubicBezierCurve(
  [-16.023866653442383, 22.219959259033203, -12.713993072509766], 
  [-17.265642166137695, 22.379919052124023, -14.123856544494629], 
  [-13.035490036010742, 22.169912338256836, -14.525507926940918], 
  [-11.581172943115234, 23.67999267578125, -12.532625198364258]
  ));
  spline.addCurve(new CubicBezierCurve(
  [-11.581172943115234, 23.67999267578125, -12.532625198364258], 
  [-10.126855850219727, 25.190073013305664, -10.539742469787598], 
  [-8.419002532958984, 26.1501407623291, -8.929838180541992], 
  [-6.376898765563965, 25.710176467895508, -9.04189395904541], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [-6.376898765563965, 25.710176467895508, -9.04189395904541], 
  [-4.334794998168945, 25.270212173461914, -9.153949737548828], 
  [-1.9983421564102173, 24.51024055480957, -8.865803718566895], 
  [-1.1349401473999023, 24.610288619995117, -10.558719635009766], 
  ));
  spline.addCurve(new CubicBezierCurve( 
  [-1.1349401473999023, 24.610288619995117, -10.558719635009766],  
  [-0.2715381383895874, 24.710336685180664, -12.251635551452637], 
  [0.5710554122924805, 24.76038360595703, -15.36153793334961], 
  [1.455265760421753, 24.820430755615234, -15.637467384338379], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [1.455265760421753, 24.820430755615234, -15.637467384338379], 
  [2.3394761085510254, 24.880477905273438, -15.913396835327148], 
  [3.3040995597839355, 24.94052505493164, -16.511844635009766], 
  [4.10789680480957, 25.000572204589844, -16.465255737304688], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [4.10789680480957, 25.000572204589844, -16.465255737304688], 
  [4.911694049835205, 25.060619354248047, -16.41866683959961], 
  [5.854211807250977, 25.12066650390625, -16.892534255981445], 
  [6.519288539886475, 24.99070930480957, -16.325489044189453], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [6.519288539886475, 24.99070930480957, -16.325489044189453], 
  [7.184365272521973, 24.86075210571289, -15.758443832397461], 
  [7.796064376831055, 24.73079490661621, -14.90477180480957], 
  [8.514518737792969, 24.60083770751953, -14.624353408813477], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [8.514518737792969, 24.60083770751953, -14.624353408813477], 
  [9.232973098754883, 24.47088050842285, -14.343935012817383], 
  [10.138040542602539, 24.42092514038086, -13.77912712097168], 
  [11.471036911010742, 24.210966110229492, -13.684301376342773], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [11.471036911010742, 24.210966110229492, -13.684301376342773], 
  [12.804033279418945, 24.001007080078125, -13.589475631713867], 
  [14.53366756439209, 23.791048049926758, -14.191226959228516], 
  [15.468624114990234, 23.46108627319336, -12.948812484741211], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [15.468624114990234, 23.46108627319336, -12.948812484741211], 
  [16.403579711914062, 23.13112449645996, -11.706398010253906], 
  [17.47136688232422, 22.451154708862305, -9.724991798400879], 
  [17.008935928344727, 22.791208267211914, -8.67209243774414], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [17.008935928344727, 22.791208267211914, -8.67209243774414], 
  [16.546504974365234, 23.131261825561523, -7.619193077087402], 
  [16.084074020385742, 23.471315383911133, -6.566293716430664], 
  [15.62164306640625, 23.111352920532227, -5.513394355773926], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [15.62164306640625, 23.111352920532227, -5.513394355773926], 
  [15.159212112426758, 22.75139045715332, -4.4604949951171875], 
  [14.696781158447266, 22.391427993774414, -3.407595634460449], 
  [14.609905242919922, 21.941463470458984, -2.2031795978546143], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [14.609905242919922, 21.941463470458984, -2.2031795978546143], 
  [14.523029327392578, 21.491498947143555, -0.9987635612487793], 
  [14.436153411865234, 21.041534423828125, 0.20565247535705566], 
  [14.34927749633789, 20.85157585144043, 1.4100686311721802], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [14.34927749633789, 20.85157585144043, 1.4100686311721802], 
  [14.262401580810547, 20.661617279052734, 2.6144847869873047], 
  [14.25675106048584, 20.671663284301758, 3.8331403732299805], 
  [13.815485954284668, 20.68170928955078, 5.1207051277160645], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [13.815485954284668, 20.68170928955078, 5.1207051277160645], 
  [13.374220848083496, 20.691755294799805, 6.408269882202148], 
  [13.245619773864746, 20.701801300048828, 6.680578231811523], 
  [11.289857864379883, 20.71184730529785, 8.101781845092773], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [11.289857864379883, 20.71184730529785, 8.101781845092773], 
  [9.33409595489502, 20.721893310546875, 9.522985458374023], 
  [9.82596206665039, 21.251951217651367, 11.623907089233398], 
  [8.45433235168457, 21.381999969482422, 11.430032730102539], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [8.45433235168457, 21.381999969482422, 11.430032730102539], 
  [7.08270263671875, 21.512048721313477, 11.23615837097168], 
  [5.71107292175293, 21.64209747314453, 11.04228401184082], 
  [4.344793319702148, 21.772146224975586, 11.069259643554688], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [4.344793319702148, 21.772146224975586, 11.069259643554688], 
  [2.978513717651367, 21.90219497680664, 11.096235275268555], 
  [1.612234115600586, 22.032243728637695, 11.123210906982422], 
  [0.33737874031066895, 22.16229248046875, 11.513702392578125], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [0.33737874031066895, 22.16229248046875, 11.513702392578125], 
  [-0.937476634979248, 22.292341232299805, 11.904193878173828], 
  [-2.212332010269165, 22.42238998413086, 12.294685363769531], 
  [-3.322932243347168, 22.552438735961914, 13.17459487915039], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [-3.322932243347168, 22.552438735961914, 13.17459487915039], 
  [-4.43353271484375, 22.68248748779297, 14.05450439453125], 
  [-5.544133186340332, 22.812536239624023, 14.93441390991211], 
  [-7.012022972106934, 23.072587966918945, 15.430617332458496], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [-7.012022972106934, 23.072587966918945, 15.430617332458496], 
  [-8.479912757873535, 23.332639694213867, 15.926820755004883], 
  [-9.947802543640137, 23.472688674926758, 16.423023223876953], 
  [-11.432592391967773, 23.85274314880371, 16.189329147338867], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [-11.432592391967773, 23.85274314880371, 16.189329147338867], 
  [-12.91738224029541, 24.232797622680664, 15.955635070800781], 
  [-14.402172088623047, 24.612852096557617, 15.721940994262695], 
  [-15.724571228027344, 25.232912063598633, 15.161392211914062], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [-15.724571228027344, 25.232912063598633, 15.161392211914062], 
  [-17.04697036743164, 25.85297203063965, 14.60084342956543], 
  [-18.7353515625, 26.993043899536133, 14.480485916137695], 
  [-18.49639129638672, 27.09309196472168, 12.733091354370117], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [-18.49639129638672, 27.09309196472168, 12.733091354370117], 
  [-18.257431030273438, 27.193140029907227, 10.985696792602539], 
  [-17.40237045288086, 27.47319221496582, 9.241660118103027], 
  [-17.419597625732422, 27.39323616027832, 8.551690101623535], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [-17.419597625732422, 27.39323616027832, 8.551690101623535], 
  [-17.436824798583984, 27.31328010559082, 7.861720085144043], 
  [-17.578445434570312, 27.473329544067383, 7.096077919006348], 
  [-17.625883102416992, 27.15336799621582, 5.890352249145508], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [-17.625883102416992, 27.15336799621582, 5.890352249145508], 
  [-17.673320770263672, 26.833406448364258, 4.684626579284668], 
  [-17.72075843811035, 26.513444900512695, 3.478900909423828], 
  [-17.76819610595703, 26.193483352661133, 2.2731752395629883], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [-17.76819610595703, 26.193483352661133, 2.2731752395629883], 
  [-17.81563377380371, 25.87352180480957, 1.0674495697021484], 
  [-17.86307144165039, 25.553560256958008, -0.1382761001586914], 
  [-17.91050910949707, 25.233598709106445, -1.3440017700195312], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [-17.91050910949707, 25.233598709106445, -1.3440017700195312], 
  [-17.95794677734375, 24.913637161254883, -2.549727439880371], 
  [-18.39180564880371, 24.59367561340332, -3.670711040496826], 
  [-18.05282211303711, 24.273714065551758, -4.961178779602051], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [-18.05282211303711, 24.273714065551758, -4.961178779602051], 
  [-17.713838577270508, 23.953752517700195, -6.251646518707275], 
  [-17.374855041503906, 23.523788452148438, -7.5421142578125], 
  [-17.035871505737305, 23.073823928833008, -8.832582473754883], 
  ));
  spline.addCurve(new CubicBezierCurve(
  [-17.035871505737305, 23.073823928833008, -8.832582473754883], 
  [-16.696887969970703, 22.623859405517578, -10.123050689697266], 
  [-14.990755081176758, 22.17389488220215, -11.586112976074219], 
  [-16.0189208984375, 22.21394157409668, -12.703987121582031], 
  ));
  
  ​

  // Uncomment for editing the spline 
  // objects.push(new SplinePoints(gl, spline));
  
  const moving_camera = new MovingCamera([0, 1, 0], spline, 60000);

  /*
    The middle of the terrain is at coordinates (0.5, 0.0, 0.5)
    The terrain floor is not at 0.0, is a the height of aproximately 0.5725, 
    so I position the camera a little above in relation to the terrain
  */
  const terrain_point_location = glm.vec3.transformMat4(glm.vec3.create(), [0.5, 0.58, 0.5], terrain.model);
  const random_look_point = glm.vec3.add(glm.vec3.create(), terrain_point_location, [(2.0*Math.random()) - 1.0, -0.1, (2.0*Math.random()) - 1.0]);
  const terrain_up_vector = glm.vec3.transformMat3(glm.vec3.create(), [0, 1, 0], glm.mat3.fromMat4(glm.mat3.create(), terrain.model));

  cameras.push(
    new Camera(terrain_point_location, random_look_point,terrain_up_vector),
    moving_camera,
  );

  animated_objects.push(
    moving_camera,
  );

  
  lights.push(
    new DirectionalLight([0.707, -0.707, -0.707], [0.984313725490196, 0.984313725490196, 0.9725490196078431]),
  );

  setupEventHandlers();
  gameLoop();
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
      case "Space":
        const point_lights = lights.filter((element) => { return element instanceof LightBall; });
        if (point_lights.length < MAXIMUM_NUMBER_OF_POINT_LIGHTS){
          const camera = cameras[current_camera];
          const look_at = glm.vec3.sub(glm.vec3.create(), camera.getCameraLookingAt(), camera.getCameraPosition());
          glm.vec3.normalize(look_at, look_at);

          const spline_point_follow = new Spline();
          spline_point_follow.addCurve(new CubicBezierCurve(
            glm.vec3.scaleAndAdd(glm.vec3.create(), camera.getCameraPosition(), look_at, 0.0),
            glm.vec3.scaleAndAdd(glm.vec3.create(), camera.getCameraPosition(), look_at, 10.0),
            glm.vec3.scaleAndAdd(glm.vec3.create(), camera.getCameraPosition(), look_at, 15.0),
            glm.vec3.scaleAndAdd(glm.vec3.create(), camera.getCameraPosition(), look_at, 20.0),
          ));

          const point_of_light = new LightBall(
            gl, 
            camera.getCameraPosition(), 
            [Math.random(), Math.random(), Math.random()],
            10.0,
            spline_point_follow,
            2500,
            );
          lights.push(point_of_light);
          objects.push(point_of_light);
          animated_objects.push(point_of_light);
          colidable_objects.push(point_of_light);

          const audio = new Audio("./audio/ball_spawn.mp3");
          audio.play();
        }
        else {
          const audio = new Audio("./audio/error.mp3");
          audio.play();
        }
        
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
    if (event.button == 1) {
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
    else if (event.button == 0) {
      canva.addEventListener("pointermove", move_camera_with_mouse);

    }
  });

  canva.addEventListener("pointerup", (event) => {
    if (event.button == 1) {
      canva.removeEventListener("pointermove", orbit_camera_with_mouse);
      canva.removeEventListener("pointermove", modify_spline);
    }
    else if (event.button == 0) {
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

function gameLoop() {
  updatePhisics();
  updateAnimation();
  drawFrame();
  requestAnimationFrame(gameLoop);
}

function drawFrame() {
  const camera = cameras[current_camera];
  gl.clear(WebGL2RenderingContext.COLOR_BUFFER_BIT);
  objects.forEach((drawable_obj) => {
      drawable_obj.draw(gl, camera, perspective, lights);
    }
  );
}

var before:number = Date.now();
function updateAnimation() {
  const now = Date.now();
  const fElapsedTime = now - before;
  animated_objects.forEach(
    (object) => {
      object.updateAnimation(fElapsedTime);
    }
  );
  before = now;
}

function updatePhisics() {
  let colided_objects = 0;
  for (let i = 0; i < colidable_objects.length; ++i) {
    if (colidable_objects[i] instanceof LightBall){
      for (let j = 0; j < colidable_objects.length; ++j) {
        if (!(colidable_objects[j] instanceof LightBall)){
          if (colidable_objects[i].checkColision(colidable_objects[j])){
            const obj_1 = colidable_objects[i];
            const obj_2 = colidable_objects[j];
            if (obj_1 instanceof LightBall || obj_1 instanceof Bat){
              obj_1.pauseAnimation();
            }
            if (obj_2 instanceof LightBall || obj_2 instanceof Bat){
              obj_2.pauseAnimation();
            }
            colided_objects += 2;
            const audio = new Audio("./audio/hit.mp3");
            audio.play();
          }
        }
      }
    }
  }

  animated_objects = animated_objects.filter((element) => {
    if (element instanceof LightBall || element instanceof Bat) {
      return !element.getAnimationState();
    }
    return true;
  });

  lights = lights.filter((element) => {
    if (element instanceof LightBall || element instanceof Bat) {
      return !element.getAnimationState();
    }
    return true;
  });

  objects = objects.filter((element) => {
    if (element instanceof LightBall || element instanceof Bat) {
      return !element.getAnimationState();
    }
    return true;
  });

  colidable_objects = colidable_objects.filter((element) => {
    if (element instanceof LightBall || element instanceof Bat) {
      return !element.getAnimationState();
    }
    return true;
  });

  for (let c = 0; c < colided_objects / 2; ++c) {
    const spline_follow = new Spline();
    const fisrt = glm.vec3.transformMat4(glm.vec3.create(), glm.vec3.fromValues(Math.random(), 0.6, Math.random()), terrain.model);
    spline_follow.addCurve(
      new CubicBezierCurve(
        fisrt,
        glm.vec3.transformMat4(glm.vec3.create(), glm.vec3.fromValues(Math.random(), 0.65, Math.random()), terrain.model),
        glm.vec3.transformMat4(glm.vec3.create(), glm.vec3.fromValues(Math.random(), 0.65, Math.random()), terrain.model),
        glm.vec3.transformMat4(glm.vec3.create(), glm.vec3.fromValues(Math.random(), 0.6, Math.random()), terrain.model))
      );
    spline_follow.addCurve(
      new CubicBezierCurve(
        glm.vec3.transformMat4(glm.vec3.create(), glm.vec3.fromValues(Math.random(), 0.65, Math.random()), terrain.model),
        glm.vec3.transformMat4(glm.vec3.create(), glm.vec3.fromValues(Math.random(), 0.65, Math.random()), terrain.model),
        glm.vec3.transformMat4(glm.vec3.create(), glm.vec3.fromValues(Math.random(), 0.6, Math.random()), terrain.model),
        fisrt
        )
      );

    const bat = new Bat(gl, spline_follow, Math.random() * 30_000 + 10_000);

    const scale = (Math.random() / 2.0 + 0.5) * 2.0;
    // const scale = 1.0;
    glm.mat4.scale(bat.model, bat.model, [scale, scale, scale])

    glm.mat4.rotate(bat.model, bat.model, Math.random() * Math.PI, [Math.random(), Math.random(), Math.random()]);

    objects.push(bat);
    colidable_objects.push(bat);
    animated_objects.push(bat);
  }
}

window.onload = main