// High-detail albedo on simple geometry. UVs are scaled in metres, not per object.
function applyPastureMaterials(){
 const loader=new THREE.TextureLoader();const state={loaded:0,errors:[]};
 function texture(path){const t=loader.load(path,()=>state.loaded++,undefined,e=>state.errors.push(path));t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;}
 const wood=texture('materials/weathered-wood.png'),soil=texture('materials/paddock-earth.png'),metal=texture('materials/aged-metal.png');
 const hayTexture=texture('materials/packed-hay.png');M.hay.map=hayTexture;M.hay.color.setRGB(.78,.74,.58);M.hay.needsUpdate=true;
 const woods=new Set([M.wood,M.rail,M.darkwood,...plankM]);
 woods.forEach((m,i)=>{m.map=wood;m.color.setRGB(i===2?.42:.76,i===2?.39:.71,i===2?.34:.61);m.roughness=.97;m.needsUpdate=true;});
 for(const m of [M.roof,M.iron]){m.map=metal;m.color.setRGB(.62,.65,.65);m.metalness=.18;m.roughness=.83;m.needsUpdate=true;}
 M.stone.map=soil;M.stone.color.setRGB(.7,.76,.76);M.stone.needsUpdate=true;
 const earth=new THREE.MeshStandardMaterial({map:soil,color:0xb2b8a0,roughness:1,flatShading:true});
 models.updateMatrixWorld(true);
 models.traverse(o=>{
  if(!o.isMesh)return;const g=o.geometry,p=g.attributes.position;
  if(g===groundGeo||g.type==='CircleGeometry'&&o!==water){
   if(o!==water){o.material=earth;const uv=[];const v=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);uv.push(v.x/3.4,v.z/3.4);}g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));}return;
  }
  if(woods.has(o.material)&&g.type==='BoxGeometry'){
   const d=g.parameters,axis=d.height>=d.width&&d.height>=d.depth?'y':d.width>=d.depth?'x':'z',uv=[],n=g.attributes.normal;
   // Longitudinal grain always follows the longest board axis.
   for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i),normal=new THREE.Vector3().fromBufferAttribute(n,i);let u=axis==='y'?(Math.abs(normal.z)>.5?v.x:v.z):axis==='x'?(Math.abs(normal.z)>.5?v.y:v.z):(Math.abs(normal.x)>.5?v.y:v.x);uv.push(u/.75+Math.abs(o.position.x*.113)%1,v[axis]/1.7+Math.abs(o.position.z*.079)%1);}g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  }else if(woods.has(o.material)&&g.type==='CylinderGeometry'){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*.55,uv.getY(i)*g.parameters.height/1.7);uv.needsUpdate=true;}
  if((o.material===M.roof||o.material===M.iron)&&g.attributes.uv){const uv=g.attributes.uv;const d=g.parameters;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*(d.width||1)/2,uv.getY(i)*(d.depth||d.height||1)/2);uv.needsUpdate=true;}
 });return state;
}
