// Solve to the ankle bone, not an off-centre vertex on the hoof.
function createSheepMotion(root,options={}){
 const frame=root.parent,rig=[],byName={},up=new THREE.Vector3(0,1,0);
 root.updateMatrixWorld(true);
 root.traverse(b=>{if(b.isBone){const prefix=options.prefix||'',name=b.name.replace(/[^a-zA-Z0-9]/g,'');if(prefix?!name.startsWith(prefix):/^(head0|head1|extraFront|extraBack)/.test(name))return;byName[name.slice(prefix.length)]=b;rig.push({b,q:b.quaternion.clone(),p:b.position.clone()});}});
 const legs=[];
 // Four-beat lateral walk: LH, LF, RH, RF. Offsets refer to cycle position.
 for(const [stem,side,offset] of [['Front','L',.75],['Back','R',.5],['Front','R',.25],['Back','L',0]]){
  if(options.legType&&stem!==options.legType)continue;
  const upper=byName[stem+'UpperLeg'+side],lower=byName[stem+'LowerLeg'+side],driver=byName['IK'+stem+'Leg'+side];
  if(!upper||!lower||!driver)continue;
  const ankle=driver.getWorldPosition(new THREE.Vector3()),hip=upper.getWorldPosition(new THREE.Vector3()),knee=lower.getWorldPosition(new THREE.Vector3());
  const parent=upper.parent,parentQ=parent.getWorldQuaternion(new THREE.Quaternion());
  const forward=new THREE.Vector3(0,0,1).applyQuaternion(frame.getWorldQuaternion(new THREE.Quaternion()));
  legs.push({upper,lower,driver,rear:stem==='Back',offset:offset+(options.phaseOffset||0),parent,
   localAnkle:lower.worldToLocal(ankle.clone()),home:frame.worldToLocal(ankle.clone()),
   parentHome:parent.worldToLocal(ankle.clone()),parentQ,
   forwardLocal:forward.applyQuaternion(parentQ.clone().invert()),
   driverQ:driver.getWorldQuaternion(new THREE.Quaternion()),
   a:hip.distanceTo(knee),b:knee.distanceTo(ankle),
   lateral:frame.worldToLocal(ankle.clone()).x-frame.worldToLocal(hip.clone()).x,
   plant:ankle.clone(),from:ankle.clone(),target:ankle.clone(),swing:false,initialized:false});
 }
 const stride=.58,stance=.62;
 let phase=0,blend=0,bend=0;
 function worldRotation(b,q){b.quaternion.copy(b.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));b.updateMatrixWorld(true);}
 function yawBone(b,angle){if(b)worldRotation(b,new THREE.Quaternion().setFromAxisAngle(up,angle).multiply(b.getWorldQuaternion(new THREE.Quaternion())));}
 function aim(b,from,to){const delta=new THREE.Quaternion().setFromUnitVectors(from.normalize(),to.normalize());worldRotation(b,delta.multiply(b.getWorldQuaternion(new THREE.Quaternion())));}
 function solve(l,target,forward){
  const hip=l.upper.getWorldPosition(new THREE.Vector3()),knee=l.lower.getWorldPosition(new THREE.Vector3());
  const side=new THREE.Vector3().crossVectors(up,forward).normalize();
  target.addScaledVector(side,l.lateral-target.clone().sub(hip).dot(side));
  const maxLength=l.a+l.b-.0005,dy=THREE.MathUtils.clamp(target.y-hip.y,-maxLength+.001,maxLength-.001);
  const flat=target.clone().sub(hip);flat.y=0;
  const maxFlat=Math.sqrt(Math.max(0,maxLength*maxLength-dy*dy));if(flat.length()>maxFlat)flat.setLength(maxFlat);
  target.copy(hip).add(flat);target.y=hip.y+dy;
  const delta=target.clone().sub(hip),d=THREE.MathUtils.clamp(delta.length(),Math.abs(l.a-l.b)+.0005,maxLength),dir=delta.normalize();target.copy(hip).addScaledVector(dir,d);
  // Fixed sagittal pole prevents the near-straight leg from flipping sideways.
  const pole=forward.clone().negate().addScaledVector(dir,forward.dot(dir)).normalize();
  const along=(l.a*l.a-l.b*l.b+d*d)/(2*d),height=Math.sqrt(Math.max(0,l.a*l.a-along*along));
  const wanted=hip.clone().addScaledVector(dir,along).addScaledVector(pole,height);
  aim(l.upper,knee.clone().sub(hip),wanted.clone().sub(hip));
  const newKnee=l.lower.getWorldPosition(new THREE.Vector3()),ankle=l.lower.localToWorld(l.localAnkle.clone());
  aim(l.lower,ankle.sub(newKnee),target.clone().sub(newKnee));
 }
 return {legs,reset(){for(const l of legs){l.initialized=false;l.swing=false;l.reset=true;}},joints:legs.flatMap(l=>[{bone:l.upper},{bone:l.lower}]),update(dt,travel,curvature=0){
  const moving=Math.abs(travel)>1e-7;blend=THREE.MathUtils.damp(blend,moving?1:0,8,dt);
  if(moving)phase+=Math.abs(travel)/stride;
  bend=THREE.MathUtils.damp(bend,THREE.MathUtils.clamp(curvature,-.85,.85)*blend,6,dt);
  for(const r of rig){r.b.quaternion.copy(r.q);r.b.position.copy(r.p);}root.updateMatrixWorld(true);
  yawBone(byName.Back,-bend*.38);yawBone(byName.Torso,bend*.25);
  yawBone(byName.Torso2,bend*.35);yawBone(byName.Neck1,bend*.18);yawBone(byName.Neck2,bend*.12);
  if(options.moveBody!==false)frame.position.y=-.018*blend+Math.sin(phase*Math.PI*4)*.004*blend;frame.updateMatrixWorld(true);
  for(const l of legs){
   const parentQ=l.parent.getWorldQuaternion(new THREE.Quaternion());
   const forward=l.forwardLocal.clone().applyQuaternion(parentQ);forward.y=0;forward.normalize();
   const stepForward=forward.clone().multiplyScalar(travel<0?-1:1);
   const home=l.parent.localToWorld(l.parentHome.clone());home.y=l.home.y;
   if(l.reset){l.target.copy(home);l.plant.copy(home);l.reset=false;}
   // Release sooner and keep the support stroke slightly ahead of centre.
   const t=(phase+l.offset)%1,reach=stride*stance*.54;
   if(moving){
    if(!l.initialized){l.plant.copy(home).addScaledVector(stepForward,reach-t*stride);l.plant.y=l.home.y;l.from.copy(l.plant);l.initialized=true;}
    if(t>=stance){
     if(!l.swing){l.swing=true;l.from.copy(l.plant);}
     // Bring the hoof forward immediately instead of hanging behind the body.
     const u=(t-stance)/(1-stance),s=u+u*u-u*u*u;
     l.target.copy(l.from).lerp(home.clone().addScaledVector(stepForward,reach),s);
     l.target.y=l.home.y+Math.sin(Math.PI*u)*.075;
    }else{
     if(l.swing){l.plant.copy(l.target);l.plant.y=l.home.y;}
     l.swing=false;l.target.copy(l.plant);
    }
   }else{
    l.target.lerp(home,1-Math.exp(-dt*12));l.plant.copy(l.target);l.initialized=false;l.swing=false;
   }
   solve(l,l.target,forward);
   // Independent hoof bones also carry skin weights in this GLB.
   l.driver.position.copy(l.driver.parent.worldToLocal(l.target.clone()));
   const turn=parentQ.clone().multiply(l.parentQ.clone().invert());
   worldRotation(l.driver,turn.multiply(l.driverQ));
  }
  root.updateMatrixWorld(true);
 },get phase(){return phase;},get bend(){return bend;},get feet(){return legs.map(l=>({phase:l.offset,swing:l.swing,target:l.target.toArray(),actual:l.lower.localToWorld(l.localAnkle.clone()).toArray()}));}};
}
