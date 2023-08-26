import * as glm from "gl-matrix"
import {CubicBezierCurve} from "./CubicBezierCurve.js"

export class Spline {
  private curves : Array<CubicBezierCurve>;
  private num_points_per_curve : number;
  public array_points : Array<glm.vec3>;

  constructor (numPoints : number = 128) {
    this.num_points_per_curve = numPoints;
    this.curves = new Array();
    this.array_points = new Array(numPoints);
  }

  public addCurve(curve : CubicBezierCurve) {
    this.curves.push(curve);
  }

  public getPoint(t:number) : glm.vec3 {
    const sanitized_t = Math.abs(t) % 1.0;
    const expand_t = sanitized_t * this.curves.length;
    const curve_index = Math.floor(expand_t);
    const new_t = expand_t - curve_index;
    
    return this.curves[curve_index].getPoint(new_t);
  }

  public getVectorTangent(t:number) : glm.vec3 {
    const sanitized_t = Math.abs(t) % 1.0;
    const expand_t = sanitized_t * this.curves.length;
    const curve_index = Math.floor(expand_t);
    const new_t = expand_t - curve_index;
    
    return this.curves[curve_index].getVectorTangent(new_t);
  }

  public getPointTangent(t:number) : glm.vec3 {
    const sanitized_t = Math.abs(t) % 1.0;
    const expand_t = sanitized_t * this.curves.length;
    const curve_index = Math.floor(expand_t);
    const new_t = expand_t - curve_index;
    
    return this.curves[curve_index].getPointTangent(new_t);
  }

  public sampleSpline() {
    const increment = 1.0 / this.num_points_per_curve;
    this.curves.forEach((curve, index) => {
      let t = 0.0;
      for (let i = 0; i < this.num_points_per_curve; ++i){
        this.array_points[i + this.num_points_per_curve * index] = curve.getPoint(t);
        t += increment;
      }
      // Ensure last point is t = 1.0
      this.array_points[this.num_points_per_curve - 1 + this.num_points_per_curve * index] = this.curves[index].getPoint(1.0);
    });
  }
  
  public getCurveByIndex(index:number) : CubicBezierCurve | null {
    if (index < 0 || index >= this.curves.length) {
      return null;
    }

    return this.curves[index];
  }

  public updateCurve(index:number, new_curve:CubicBezierCurve) {
    if (index < 0 || index >= this.curves.length) {
      return;
    }

    this.curves[index] = new_curve;

    const increment = 1.0 / this.num_points_per_curve;
    let t = 0.0;
    for (let i = 0; i < this.num_points_per_curve; ++i){
      this.array_points[i + this.num_points_per_curve * index] = this.curves[index].getPoint(t);
      t += increment;
    }
    // Ensure last point is t = 1.0
    this.array_points[this.num_points_per_curve - 1 + this.num_points_per_curve * index] = this.curves[index].getPoint(1.0);
  }

  public updatePoint(index : number, new_point : glm.vec3) : boolean {
    if (index < 0 || index >= this.curves.length * 4) { return false; }

    const index_curve = Math.floor(index / 4);
    const index_point_in_curve = index - index_curve * 4;

    const curve = this.curves[index_curve];
    curve.changeControlPoint(index_point_in_curve, new_point);

    this.updateCurve(index_curve, curve);

    return true;
  }

  public indexControlPoint(radius:number = 0.1, point : glm.vec3) : number {
    for (let i = this.curves.length - 1; i >= 0; --i) {
      for (let c = 0; c < 4; ++c) {
        const dist = glm.vec3.dist(point, this.curves[i].getControlPoints[c]);
        if ( dist <= radius ) {
          return i * 4 + c;
        }
      }
    }

    return -1;
  }

  public get getNumCurvesInSpline() : number {
    return this.curves.length;
  }

  public isC0Continuous() : boolean {
    for (let i = 0; i < this.curves.length - 1; ++i) {
      const equals = glm.vec3.equals(this.curves[i].getControlPoints[3], this.curves[i+1].getControlPoints[0]);
      if (!equals) return false;
    }
    return true;
  }

  public turnC0Continuous() {
    if (this.curves.length <= 1) return;

    for (let i = 0; i < this.curves.length - 1; ++i) {
      const this_curve = this.curves[i];
      const next_curve = this.curves[i+1];
      
      next_curve.changeControlPoint(0, this_curve.getControlPointByIndex(3) as glm.vec3);
    }

    this.sampleSpline();
  }

  public turnC1Continuous() {
    if (this.curves.length <= 1) return;

    for (let i = 0; i < this.curves.length - 1; ++i) {
      const this_curve = this.curves[i];
      const next_curve = this.curves[i+1];

      const vec = glm.vec3.create();
      glm.vec3.sub(vec, this_curve.getControlPointByIndex(3) as glm.vec3, this_curve.getControlPointByIndex(2) as glm.vec3);
      glm.vec3.add(vec, this_curve.getControlPointByIndex(3) as glm.vec3, vec);
      
      next_curve.changeControlPoint(0, this_curve.getControlPointByIndex(3) as glm.vec3);
      next_curve.changeControlPoint(1, vec);
    }

    this.sampleSpline();
  }
  public turnC2Continuous() {
    if (this.curves.length <= 1) return;

    for (let i = 0; i < this.curves.length - 1; ++i) {
      const this_curve = this.curves[i];
      const next_curve = this.curves[i+1];

      const vec = glm.vec3.create();
      glm.vec3.sub(vec, this_curve.getControlPointByIndex(3) as glm.vec3, this_curve.getControlPointByIndex(2) as glm.vec3);
      glm.vec3.add(vec, this_curve.getControlPointByIndex(3) as glm.vec3, vec);
      
      next_curve.changeControlPoint(0, this_curve.getControlPointByIndex(3) as glm.vec3);
      next_curve.changeControlPoint(1, vec);

      glm.vec3.scaleAndAdd(vec, this_curve.getControlPointByIndex(1) as glm.vec3, vec, 4.0);
      next_curve.changeControlPoint(2, vec);
    }

    this.sampleSpline();
  }

  public turnG0Continuous() {
    this.turnC0Continuous();
  }
  public turnG1Continuous() {
    if (this.curves.length <= 1) return;

    for (let i = 0; i < this.curves.length - 1; ++i) {
      const this_curve = this.curves[i];
      const next_curve = this.curves[i+1];

      const vec = glm.vec3.create();
      glm.vec3.sub(vec, this_curve.getControlPointByIndex(3) as glm.vec3, this_curve.getControlPointByIndex(2) as glm.vec3);
      glm.vec3.normalize(vec, vec);

      const next_curve_vec_p0_p1 = glm.vec3.create();
      glm.vec3.sub(next_curve_vec_p0_p1, next_curve.getControlPointByIndex(1) as glm.vec3, next_curve.getControlPointByIndex(0) as glm.vec3);
      glm.vec3.scaleAndAdd(vec, this_curve.getControlPointByIndex(3) as glm.vec3, vec, glm.vec3.len(next_curve_vec_p0_p1));
      
      next_curve.changeControlPoint(0, this_curve.getControlPointByIndex(3) as glm.vec3);
      next_curve.changeControlPoint(1, vec);
    }

    this.sampleSpline();
  }
  public turnG2Continuous() {}

  public toOBJ() : string {
    let res = "";
    for (let i=0; i < this.curves.length; ++i) {
      for (let c = 0; c < 4; ++c){
        const control_point = this.curves[i].getControlPoints[c];
        res += `v ${control_point[0]} ${control_point[1]} ${control_point[2]}\n`;
      }
    }
    return res;
  }

  public static fromOBJ(obj : string, sampling_points : number = 128) : Spline {
    let spline = new Spline(sampling_points);

    const arrayVertices = new Array<glm.vec3>();
    const arrayColors = new Array<glm.vec3>();
    
    obj.split("\n").forEach((line) => {
      if (line[0] == "v"){
        const values = line.split(" ");
        if (values.length == 4){
          let new_val = glm.vec3.fromValues(
            parseFloat(values[1]),
            parseFloat(values[2]),
            parseFloat(values[3]),
          );
          arrayVertices.push(new_val);
        }
      }
    });

    for (let i = 0; i < arrayVertices.length / 4; ++i){
      if (i + 3 >= arrayVertices.length) break;

      const curve = new CubicBezierCurve(
        arrayVertices[i * 4 + 0],
        arrayVertices[i * 4 + 1],
        arrayVertices[i * 4 + 2],
        arrayVertices[i * 4 + 3],
      );
      
      spline.addCurve(curve);
    }

    return spline;
  }

  public get getPointsInSpline() : Array<glm.vec3> | null { return this.array_points; }
  public set setNumPoints(value:number) { this.num_points_per_curve = value; this.sampleSpline(); }
}