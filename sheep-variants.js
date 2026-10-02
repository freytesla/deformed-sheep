// Each specimen is now an independent, continuous skinned asset.
function createSheepVariants(roots){
 const labels={normal:'普通羊 · 原型参照',double:'双头羊 · 暖白厚毛',eight:'八腿羊 · 灰毛长躯'},entries={};let current='double';
 for(const [key,root]of Object.entries(roots)){
  const bones=new Map();root.traverse(o=>{if(o.isBone)bones.set(o.name,o);});
  const motion=createSheepMotion(root),extra=[],heads=[];
  if(key==='eight')for(const [prefix,legType]of [['extraFront','Front'],['extraBack','Back']])extra.push(createSheepMotion(root,{prefix,legType,phaseOffset:.125,moveBody:false}));
  if(key==='double')for(let i=0;i<2;i++){
   const prefix='head'+i,items=[];for(const [name,b]of bones){if(!name.startsWith(prefix))continue;const source=bones.get(name.slice(prefix.length));if(source)items.push({b,source,q:b.quaternion.clone(),p:b.position.clone(),sq:source.quaternion.clone(),sp:source.position.clone()});}heads.push({items,head:bones.get(prefix+'Head')});
  }
  entries[key]={root,motion,extra,heads,bones};
 }
 function setVariant(value){if(!entries[value])return;current=value;for(const [key,e]of Object.entries(entries))e.root.visible=key===value;entries[value].motion.reset();entries[value].extra.forEach(m=>m.reset());document.querySelectorAll('[data-variant]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.variant===value)));document.getElementById('sheep-name').textContent=labels[value];}
 function update(dt,travel,curvature,time){const e=entries[current];e.extra.forEach(m=>m.update(dt,travel,curvature));e.heads.forEach((h,i)=>{for(const r of h.items){r.b.position.copy(r.p).add(r.source.position).sub(r.sp);r.b.quaternion.copy(r.q).multiply(r.sq.clone().invert()).multiply(r.source.quaternion);}if(h.head){h.head.rotateX(Math.sin(time*.7+i*1.9)*.025);h.head.rotateY(Math.sin(time*.46+i*2.2)*.045);}});e.root.updateMatrixWorld(true);}
 setVariant('double');return {setVariant,update,entries,get entry(){return entries[current];},get current(){return current;},get label(){return labels[current];},get counts(){return {heads:current==='double'?2:1,legs:current==='eight'?8:4};}};
}
