import * as glm from "gl-matrix";

export module WebGLUtils {

  export const sleep = (ms : number = 0.0) => new Promise(r => setTimeout(r, ms));
  
  export async function readFile(filePath : string) : Promise<string> {
    const response = await fetch(filePath);
    const text = await response.text();
    return text;
  }
  
  export function createShader(gl: WebGL2RenderingContext, type : number, source:string) : WebGLShader | null{
    const shader = gl.createShader(type);
    if (shader){
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (success) {
        return shader;
      }
      console.log(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
    }
    return null;
  }
  
  export function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) : WebGLProgram | null {
    const program = gl.createProgram();
    if (program){
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
  
      const success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (success) {
        return program;
      }
    
      console.log(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
    }
    return null;
  }

  export interface MTL_Info {
    "Ns" : number,
    "Ka" : glm.vec3,
    "Kd" : glm.vec3,
    "Ks" : glm.vec3,
    "Ke" : glm.vec3,
    "Ni" : number,
    "Tr" : number,
    "d" : number,
    "illum" : number,
    "material" : string,
  }
  export async function readMtl(filePath:string) : Promise<Map<string, MTL_Info>> {
    const mtl_contents = await readFile(filePath);

    let mtl_hash = new Map<string, MTL_Info>();
    let current_mtl = "";

    const lines = mtl_contents.split(/\n/);
    for (const line of lines){
      let elements = line.trim().split(/\s+/);
      if (elements[0] == 'newmtl') {
        current_mtl = elements[1].trim();
        const mtl_info_default : MTL_Info = {
          "Ns" : 0,
          "Ka" : glm.vec3.fromValues(0, 0, 0),
          "Kd" : glm.vec3.fromValues(0, 0, 0),
          "Ks" : glm.vec3.fromValues(0, 0, 0),
          "Ke" : glm.vec3.fromValues(0, 0, 0),
          "Ni" : 0,
          "Tr" : 0,
          "d" : 0,
          "illum" : 0,
          "material" : current_mtl,
        };

        mtl_hash.set(current_mtl, mtl_info_default);
      }
      else if (elements[0] == 'Ns'){
        if (mtl_hash.has(current_mtl)) {
          const object = mtl_hash.get(current_mtl) as MTL_Info;
          object.Ns = parseFloat(elements[1].trim());
          mtl_hash.set(current_mtl, object);
        } 
      }
      else if (elements[0] == 'Ka'){
        if (mtl_hash.has(current_mtl)) {
          const object = mtl_hash.get(current_mtl) as MTL_Info;
          object.Ka = glm.vec3.fromValues(parseFloat(elements[1].trim()), parseFloat(elements[2].trim()), parseFloat(elements[3].trim()));
          mtl_hash.set(current_mtl, object);
        } 
      }
      else if (elements[0] == 'Kd'){
        if (mtl_hash.has(current_mtl)) {
          const object = mtl_hash.get(current_mtl) as MTL_Info;
          object.Kd = glm.vec3.fromValues(parseFloat(elements[1].trim()), parseFloat(elements[2].trim()), parseFloat(elements[3].trim()));
          mtl_hash.set(current_mtl, object);
        } 
      }
      else if (elements[0] == 'Ks'){
        if (mtl_hash.has(current_mtl)) {
          const object = mtl_hash.get(current_mtl) as MTL_Info;
          object.Ks = glm.vec3.fromValues(parseFloat(elements[1].trim()), parseFloat(elements[2].trim()), parseFloat(elements[3].trim()));
          mtl_hash.set(current_mtl, object);
        } 
      }
      else if (elements[0] == 'Ke'){
        if (mtl_hash.has(current_mtl)) {
          const object = mtl_hash.get(current_mtl) as MTL_Info;
          object.Ke = glm.vec3.fromValues(parseFloat(elements[1].trim()), parseFloat(elements[2].trim()), parseFloat(elements[3].trim()));
          mtl_hash.set(current_mtl, object);
        }
      }
      else if (elements[0] == 'Ni'){
        if (mtl_hash.has(current_mtl)) {
          const object = mtl_hash.get(current_mtl) as MTL_Info;
          object.Ni = parseFloat(elements[1].trim());;
          mtl_hash.set(current_mtl, object);
        }
      }
      else if (elements[0] == 'd'){
        if (mtl_hash.has(current_mtl)) {
          const object = mtl_hash.get(current_mtl) as MTL_Info;
          object.d = parseFloat(elements[1].trim());;
          mtl_hash.set(current_mtl, object);
        }
      }
      else if (elements[0] == 'Tr'){
        if (mtl_hash.has(current_mtl)) {
          const object = mtl_hash.get(current_mtl) as MTL_Info;
          object.Tr = parseFloat(elements[1].trim());;
          mtl_hash.set(current_mtl, object);
        }
      }
      else if (elements[0] == 'illum'){
        if (mtl_hash.has(current_mtl)) {
          const object = mtl_hash.get(current_mtl) as MTL_Info;
          object.illum = parseFloat(elements[1].trim());;
          mtl_hash.set(current_mtl, object);
        }
      }
    }
    return mtl_hash;
  }

  export interface OBJ_Info {
    // This is the info collected from the file
    vertices : Array<glm.vec3>;
    normals : Array<glm.vec3>;
    texture_cordinates : Array<glm.vec2>;

    // This info is for creating a Webgl Vertex
    index_vertices : Array<number>;
    index_normals : Array<number>;
    index_texture_cordinates : Array<number>;

    // The range of indices to use a certain material information
    // Maps a range of vertices to a material information
    objects_ranges : Map<[number, number], MTL_Info>;

  }
  export async function readObj(filePath:string) : Promise<OBJ_Info> {
    const obj_content = await readFile(filePath);

    const obj_result : OBJ_Info = {
      "vertices" : new Array(),
      "normals" : new Array(),
      "texture_cordinates" : new Array(),
      "index_vertices" : new Array(),
      "index_normals" : new Array(),
      "index_texture_cordinates" : new Array(),
      "objects_ranges" : new Map(),
    };

    const mtl_libraries : Array<Map<string, MTL_Info>> = new Array<Map<string, MTL_Info>>();

    let last_material_used : string = "";
    let vertex_index_counter = 0;
    let vertex_index_start = 0;

    const lines = obj_content.split(/\n/);
    
    for (const line of lines) {
      let elements = line.trim().split(/\s+/);
      if (elements[0] == 'v') {
        obj_result.vertices.push(
          glm.vec3.fromValues(
            parseFloat(elements[1]), 
            parseFloat(elements[2]), 
            parseFloat(elements[3])
            )
        );
      }
      else if (elements[0] == 'vn') {
        obj_result.normals.push(
          glm.vec3.fromValues(
            parseFloat(elements[1]), 
            parseFloat(elements[2]), 
            parseFloat(elements[3])
            )
        );
      }
      else if (elements[0] == 'vt'){
        obj_result.texture_cordinates.push(
          glm.vec2.fromValues(
            parseFloat(elements[1]), 
            parseFloat(elements[2]), 
            )
        );
      }
      // Handle when square is used
      else if (elements[0] == 'f') { 
        for (let index = 1; index < elements.length; ++index) {
          vertex_index_counter += 1;
          const values = elements[index].trim().split(/\//);
          if (values.length >= 1) {
            obj_result.index_vertices.push(parseInt(values[0]) - 1);
          }
          if (values.length >= 2) {
            obj_result.index_texture_cordinates.push(parseInt(values[1]) - 1);
          }
          if (values.length >= 3) {
            obj_result.index_normals.push(parseInt(values[2]) - 1);
          }
        }
      }
      else if (elements[0] == 'mtllib') {
        // Parse the MTL file 
        const res = await readMtl(`${filePath.slice(0, filePath.lastIndexOf("/"))}/${elements[1].trim().replace("./", "")}`);
        mtl_libraries.push(res);
      }
      else if (elements[0] == 'usemtl') {
        if (elements[1].trim() != last_material_used) {
          const mtl_map = mtl_libraries.find((element) => {
            return element.has(last_material_used);
          });
          if (mtl_map != null) {
            const mtl_info = mtl_map.get(last_material_used) as MTL_Info;
            obj_result.objects_ranges.set([vertex_index_start, vertex_index_counter], mtl_info);
            vertex_index_start += vertex_index_counter;
            vertex_index_counter = 0;
          }
          last_material_used = elements[1].trim();
        }
      }
    }

    if (last_material_used != ""){
      const mtl_map = mtl_libraries.find((element) => {
        return element.has(last_material_used);
      });
      if (mtl_map != null) {
        const mtl_info = mtl_map.get(last_material_used) as MTL_Info;
        obj_result.objects_ranges.set([vertex_index_start, vertex_index_counter], mtl_info);
      }
    }
    
    return obj_result;
  }
  }
  
export default WebGLUtils;