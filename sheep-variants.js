// Reuse the supplied sheep's UVs, materials and skinning for the mutations.
function createSheepVariants(root){
 const frame=root.parent,sourceMeshes=[],sourceBones=new Map(),parts=new Map();
 root.updateMatrixWorld(true);
 root.traverse(o=>{if(o.isBone)sourceBones.set(o.name,o);if(o.isSkinnedMesh)sourceMeshes.push(o);});
 function subset(g,indices){const copy=g.clone();copy.setIndex(indices);copy.clearGroups();return copy;}
 for(const m of sourceMeshes){
  m.skeleton.update();const g=m.geometry,p=g.attributes.position,points=[];
  for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i);m.boneTransform(i,v);v.applyMatrix4(m.matrixWorld);points.push(frame.worldToLocal(v));}
  const head=[],body=[],front=[],back=[],index=g.index?Array.from(g.index.array):Array.from({length:p.count},(_,i)=>i);
  for(let i=0;i<index.length;i+=3){const ids=index.slice(i,i+3),c=new THREE.Vector3();for(const k of ids)c.add(points[k]);c.multiplyScalar(1/3);
   (c.y>1.1&&c.z>.22?head:body).push(...ids);
   if(c.y<.81&&c.z>.08)front.push(...ids);
   if(c.y<.83&&c.z<-.4)back.push(...ids);
  }
  parts.set(m,{original:g,head:subset(g,head),body:subset(g,body),front:subset(g,front),back:subset(g,back)});
 }
 function clonePart(part,name){
  const clone=root.clone(true),map=new Map();
  function pair(a,b){map.set(a,b);for(let i=0;i<a.children.length;i++)pair(a.children[i],b.children[i]);}pair(root,clone);
  for(const src of sourceMeshes){const dst=map.get(src);dst.geometry=parts.get(src)[part];dst.skeleton=new THREE.Skeleton(src.skeleton.bones.map(b=>map.get(b)),src.skeleton.boneInverses.map(m=>m.clone()));dst.bind(dst.skeleton,src.bindMatrix.clone());dst.frustumCulled=false;}
  clone.name=name;frame.add(clone);clone.updateMatrixWorld(true);
  const bones=new Map();clone.traverse(o=>{if(o.isBone)bones.set(o.name,o);});return {root:clone,bones};
 }
 const heads=[clonePart('head','Left branching neck'),clonePart('head','Right branching neck')];
 const extraFront=clonePart('front','Middle front leg pair');extraFront.root.position.z-=.37;
 const extraBack=clonePart('back','Middle rear leg pair');extraBack.root.position.z+=.37;
 frame.updateMatrixWorld(true);
 extraFront.motion=createSheepMotion(extraFront.root,{legType:'Front',phaseOffset:.125,moveBody:false});
 extraBack.motion=createSheepMotion(extraBack.root,{legType:'Back',phaseOffset:.125,moveBody:false});
 let current='normal';const labels={normal:'普通羊',double:'双头羊',eight:'八腿羊',both:'双头八腿羊'};
 function rotateWorld(b,axis,angle){if(!b)return;const q=new THREE.Quaternion().setFromAxisAngle(axis,angle).multiply(b.getWorldQuaternion(new THREE.Quaternion()));b.quaternion.copy(b.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));b.updateMatrixWorld(true);}
 function setVariant(value){
  if(!labels[value])return;current=value;const double=value==='double'||value==='both',eight=value==='eight'||value==='both';
  for(const m of sourceMeshes)m.geometry=parts.get(m)[double?'body':'original'];
  heads.forEach(h=>h.root.visible=double);extraFront.root.visible=extraBack.root.visible=eight;
  document.querySelectorAll('[data-variant]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.variant===value)));
  document.getElementById('sheep-name').textContent=labels[value];
 }
 function update(dt,travel,curvature,time){
  if(extraFront.root.visible){extraFront.motion.update(dt,travel,curvature);extraBack.motion.update(dt,travel,curvature);}
  const axis=new THREE.Vector3(0,0,1).applyQuaternion(frame.quaternion),up=new THREE.Vector3(0,1,0);
  heads.forEach((h,i)=>{if(!h.root.visible)return;
   for(const [name,b]of h.bones){const source=sourceBones.get(name);b.position.copy(source.position);b.quaternion.copy(source.quaternion);b.scale.copy(source.scale);}
   h.root.updateMatrixWorld(true);const side=i===0?-1:1;
   rotateWorld(h.bones.get('Neck1'),axis,-side*.46);
   rotateWorld(h.bones.get('Neck2'),up,side*.13);
   const head=h.bones.get('Head');if(head){head.rotateX(Math.sin(time*.7+i*1.9)*.025);head.rotateY(Math.sin(time*.46+i*2.2)*.065);}
   h.root.updateMatrixWorld(true);
  });
 }
 setVariant('double');
 return {setVariant,update,heads,extraFront,extraBack,get current(){return current;},get label(){return labels[current];},get counts(){return {heads:heads[0].root.visible?2:1,legs:extraFront.root.visible?8:4};}};
}
