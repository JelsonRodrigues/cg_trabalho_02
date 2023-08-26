import * as glm from "gl-matrix"

export class CubicBezierCurve {
  private control_points : Array<glm.vec3>;
  private coeff_vector : [glm.vec3, glm.vec3, glm.vec3, glm.vec3];

  constructor (P0 : glm.vec3, P1: glm.vec3, P2: glm.vec3, P3: glm.vec3) {
    this.control_points = new Array(P0, P1, P2, P3);
    this.coeff_vector = [glm.vec3.create(), glm.vec3.create(), glm.vec3.create(), glm.vec3.create()];
    this.calcCoeffVector(P0, P1, P2, P3);
  }

  private calcCoeffVector(P0 : glm.vec3, P1: glm.vec3, P2: glm.vec3, P3: glm.vec3){
    const temp = glm.vec3.create();
    
    glm.vec3.scaleAndAdd(temp, temp, P0, 1.0);
    glm.vec3.scaleAndAdd(temp, temp, P1, 0.0);
    glm.vec3.scaleAndAdd(temp, temp, P2, 0.0);
    glm.vec3.scaleAndAdd(temp, temp, P3, 0.0);
    this.coeff_vector[0] = glm.vec3.clone(temp);
    glm.vec3.zero(temp);

    glm.vec3.scaleAndAdd(temp, temp, P0, -3.0);
    glm.vec3.scaleAndAdd(temp, temp, P1, 3.0);
    glm.vec3.scaleAndAdd(temp, temp, P2, 0.0);
    glm.vec3.scaleAndAdd(temp, temp, P3, 0.0);
    this.coeff_vector[1] = glm.vec3.clone(temp);
    glm.vec3.zero(temp);

    glm.vec3.scaleAndAdd(temp, temp, P0, 3.0);
    glm.vec3.scaleAndAdd(temp, temp, P1, -6.0);
    glm.vec3.scaleAndAdd(temp, temp, P2, 3.0);
    glm.vec3.scaleAndAdd(temp, temp, P3, 0.0);
    this.coeff_vector[2] = glm.vec3.clone(temp);
    glm.vec3.zero(temp);

    glm.vec3.scaleAndAdd(temp, temp, P0, -1.0);
    glm.vec3.scaleAndAdd(temp, temp, P1, 3.0);
    glm.vec3.scaleAndAdd(temp, temp, P2, -3.0);
    glm.vec3.scaleAndAdd(temp, temp, P3, 1.0);
    this.coeff_vector[3] = glm.vec3.clone(temp);
    glm.vec3.zero(temp);
  }

  public getPoint(t:number) : glm.vec3 {
    const t_0 = Math.pow(t, 0);
    const t_1 = Math.pow(t, 1);
    const t_2 = Math.pow(t, 2);
    const t_3 = Math.pow(t, 3);

    const res = glm.vec3.create();

    glm.vec3.scaleAndAdd(res, res, this.coeff_vector[0], t_0);
    glm.vec3.scaleAndAdd(res, res, this.coeff_vector[1], t_1);
    glm.vec3.scaleAndAdd(res, res, this.coeff_vector[2], t_2);
    glm.vec3.scaleAndAdd(res, res, this.coeff_vector[3], t_3);

    return res;
  }

  public getPointTangent(t: number): glm.vec3 {
    const point = this.getPoint(t);
    const vec = this.getVectorTangent(t);
    const res = glm.vec3.add(glm.vec3.create(), point, vec);
    return res;
  }

  public getVectorTangent(t: number): glm.vec3 {
    const t_0 = 0;
    const t_1 = Math.pow(t, 0);
    const t_2 = Math.pow(t, 1);
    const t_3 = Math.pow(t, 2);

    const res = glm.vec3.create();

    glm.vec3.scaleAndAdd(res, res, this.coeff_vector[0], t_0);
    glm.vec3.scaleAndAdd(res, res, this.coeff_vector[1], t_1);
    glm.vec3.scaleAndAdd(res, res, this.coeff_vector[2], t_2);
    glm.vec3.scaleAndAdd(res, res, this.coeff_vector[3], t_3);
    
    return res;
  }

  public changeControlPoint(index:number, new_point: glm.vec3) {
    if (index < 0 || index >= this.control_points.length) { return; }

    this.control_points[index] = new_point;

    this.calcCoeffVector(this.control_points[0], this.control_points[1], this.control_points[2], this.control_points[3]);
  }

  public getControlPointByIndex(index : number) : glm.vec3 | null {
    if (index < 0 || index >= this.control_points.length) {
      return null;
    }
    return this.control_points[index];
  }

  public get getControlPoints() : Array<glm.vec3> {
    return this.control_points;
  }
}