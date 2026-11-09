export function signedArea(points){return points.reduce((n,p,i)=>{const q=points[(i+1)%points.length];return n+p[0]*q[1]-q[0]*p[1];},0)/2;}
export function validPolygon(points){
 if(points.length<3||points.length>1000||!points.every(p=>p.length===2&&p.every(Number.isFinite))||Math.abs(signedArea(points))<=1e-8)return false;
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-9)return false;for(let j=i+2;j<points.length;j++){if(i===0&&j===points.length-1)continue;const c=points[j],d=points[(j+1)%points.length];if(cross(a,b,c)*cross(a,b,d)<-1e-14&&cross(c,d,a)*cross(c,d,b)<-1e-14)return false;}}return true;
}
export function multiply(a,b){return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];}
const point=(m,x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
export function pdfContours(operators,OPS,viewport){
 let matrix=[1,0,0,1,0,0],stack=[],found=[],skipped=0;const vp=viewport.transform;
 for(let i=0;i<operators.fnArray.length;i++){
 const op=operators.fnArray[i],args=operators.argsArray[i];
 if(op===OPS.save)stack.push(matrix.slice());else if(op===OPS.restore)matrix=stack.pop()||[1,0,0,1,0,0];
 else if(op===OPS.transform)matrix=multiply(matrix,args);
 else if(op===OPS.paintFormXObjectBegin){stack.push(matrix.slice());if(args[0])matrix=multiply(matrix,args[0]);}
 else if(op===OPS.paintFormXObjectEnd)matrix=stack.pop()||matrix;
 else if(op===OPS.constructPath){
 const data=args[1]?.[0];if(!data)continue;let points=[],curved=false;
 const emit=()=>{if(!curved&&points.length>=3){const m=multiply(vp,matrix),polygon=points.map(p=>point(m,...p)).map(p=>[p[0]/viewport.width,p[1]/viewport.height]);if(validPolygon(polygon)){const area=Math.abs(signedArea(polygon));if(area>.00003&&area<.65)found.push(polygon);}}else if(curved)skipped++;points=[];curved=false;};
 for(let n=0;n<data.length;){const cmd=data[n++];if(cmd===0){points=[];curved=false;points.push([data[n++],data[n++]]);}else if(cmd===1)points.push([data[n++],data[n++]]);else if(cmd===2){curved=true;n+=6;}else if(cmd===3){curved=true;n+=4;}else if(cmd===4)emit();else break;}
 if(points.length>2&&Math.hypot(points[0][0]-points.at(-1)[0],points[0][1]-points.at(-1)[1])<.01){points.pop();emit();}
 }
 }
 const keys=new Set(),unique=[];for(const p of found){const key=p.map(x=>x.map(n=>n.toFixed(4)).join(',')).sort().join(';');if(!keys.has(key)){keys.add(key);unique.push(p);}}return {polygons:unique.slice(0,300),truncated:unique.length>300,skipped};
}
export function sceneData(polygons,width,aspect,source){if(!Number.isFinite(width)||width<=0||width>100000)throw Error('도면 폭은 0보다 크고 100,000m 이하여야 합니다.');return {version:1,source,width,depth:width/aspect,objects:polygons.filter(p=>p.enabled&&validPolygon(p.points)).map((p,i)=>({name:p.name||'입체 '+(i+1),height:p.height,color:p.color,points:p.points.map(([x,y])=>[(x-.5)*width,(.5-y)*width/aspect])}))};}
export function blenderScript(data){
 return `# CAD BOM — reviewed concept masses, not a reconstructed BIM model.\n# Blender: Scripting > Open > Run Script. Creates a NEW collection; does not delete your scene.\nimport bpy, json, math, bmesh\nfrom mathutils import Vector\nDATA = json.loads(${JSON.stringify(JSON.stringify(data))})\ncollection = bpy.data.collections.new('CAD_BOM_Concept')\nbpy.context.scene.collection.children.link(collection)\nfor item in DATA['objects']:\n    points = item['points']\n    count = len(points)\n    verts = [(x,y,0) for x,y in points] + [(x,y,item['height']) for x,y in points]\n    faces = [tuple(reversed(range(count))),tuple(range(count,2*count))]\n    faces += [(i,(i+1)%count,(i+1)%count+count,i+count) for i in range(count)]\n    mesh = bpy.data.meshes.new(item['name'])\n    mesh.from_pydata(verts,[],faces)\n    mesh.update()\n    bm=bmesh.new()\n    bm.from_mesh(mesh)\n    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))\n    bm.to_mesh(mesh)\n    bm.free()\n    obj = bpy.data.objects.new(item['name'],mesh)\n    collection.objects.link(obj)\n    mat = bpy.data.materials.new(item['name']+'_material')\n    color = item['color'].lstrip('#')\n    mat.diffuse_color = tuple(int(color[i:i+2],16)/255 for i in (0,2,4))+(1,)\n    obj.data.materials.append(mat)\n    obj['source'] = DATA['source']\n    obj['status'] = 'Concept mass: verify footprint, dimensions and height'\n# Camera is in a separate collection; existing objects are preserved.\nsize = max(DATA['width'],DATA['depth'])\ncam_data=bpy.data.cameras.new('CAD_BOM_Camera')\ncam=bpy.data.objects.new('CAD_BOM_Camera',cam_data)\ncollection.objects.link(cam)\ncam.location=(size*.9,-size*1.1,size*.95)\ncam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()\ncam_data.type='ORTHO'\ncam_data.ortho_scale=size*1.6\nbpy.context.scene.camera=cam\nlight_data=bpy.data.lights.new('CAD_BOM_Sun','SUN')\nlight=bpy.data.objects.new('CAD_BOM_Sun',light_data)\ncollection.objects.link(light)\nlight.rotation_euler=(.4,-.5,-.5)\nlight_data.energy=3\nprint('CAD BOM imported:',len(DATA['objects']),'concept objects')\n`;
}
