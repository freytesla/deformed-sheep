// Distance-parametrized paths: translation and facing share the same tangent.
function createSheepNavigation(sheep){
 let path=null,distance=0,length=0,speed=0,kind=null,curvature=0;
 const up=new THREE.Vector3(0,1,0);
 function begin(curve,type){path=curve;path.arcLengthDivisions=600;path.updateArcLengths();length=path.getLength();distance=0;kind=type;}
 function heading(){return new THREE.Vector3(0,0,1).applyAxisAngle(up,sheep.rotation.y);}
 return {
  cancel(){path=null;kind=null;speed=0;curvature=0;},
  drive(dt,throttle,steering,isBlocked){
   path=null;kind=null;
   speed=THREE.MathUtils.damp(speed,throttle>0?.6:throttle<0?-.32:0,7,dt);
   if(Math.abs(speed)<.003)speed=0;
   const travel=speed*dt,turn=steering*.8*travel,angle=sheep.rotation.y+turn*.5;
   const x=sheep.position.x+Math.sin(angle)*travel,z=sheep.position.z+Math.cos(angle)*travel,nextYaw=sheep.rotation.y+turn;
   if(Math.abs(travel)>0&&[-.7,0,.65].some(offset=>isBlocked(x+Math.sin(nextYaw)*offset,z+Math.cos(nextYaw)*offset))){speed=0;curvature=0;return {travel:0,curvature:0,completed:null,blocked:true};}
   sheep.position.x=x;sheep.position.z=z;sheep.rotation.y=nextYaw;curvature=steering*.8;
   return {travel,curvature,completed:null,blocked:false};
  },
  startStroll(){
   const origin=sheep.position.clone().setY(0),yaw=sheep.rotation.y;
   const curve=new THREE.Curve();curve.getPoint=(t,out=new THREE.Vector3())=>out.set(2.1*(Math.cos(t*Math.PI*2)-1),0,2.3*Math.sin(t*Math.PI*2)).applyAxisAngle(up,yaw).add(origin);
   begin(curve,'stroll');
  },
  startFeed(){
   const start=sheep.position.clone().setY(0),end=new THREE.Vector3(3.12,0,1.85),reach=Math.max(.9,Math.min(2,start.distanceTo(end)*.5));
   begin(new THREE.CubicBezierCurve3(start,start.clone().addScaledVector(heading(),reach),end.clone().add(new THREE.Vector3(0,0,-reach)),end),'feed');
  },
  update(dt){
   if(!path)return {travel:0,curvature:0,completed:null};
   speed=THREE.MathUtils.damp(speed,Math.min(.6,Math.sqrt(Math.max(0,length-distance)*.8)),3,dt);
   let travel=Math.min(length-distance,speed*dt);
   // Tight approach curves must slow down rather than rotate abruptly.
   for(let i=0;i<18;i++){
    const t=path.getTangentAt(Math.min(1,(distance+travel)/length)),angle=Math.atan2(t.x,t.z);
    const turn=Math.abs(Math.atan2(Math.sin(angle-sheep.rotation.y),Math.cos(angle-sheep.rotation.y)));
    if(turn<=.7*dt+.0003)break;
    travel*=.65;
   }
   if(dt>0)speed=Math.min(speed,travel/dt);distance+=travel;
   const u=Math.min(1,distance/length),position=path.getPointAt(u),tangent=path.getTangentAt(u);
   sheep.position.x=position.x;sheep.position.z=position.z;
   const desired=Math.atan2(tangent.x,tangent.z),diff=Math.atan2(Math.sin(desired-sheep.rotation.y),Math.cos(desired-sheep.rotation.y));sheep.rotation.y+=diff;
   const a=Math.max(0,u-.015/length),b=Math.min(1,u+.015/length),ta=path.getTangentAt(a),tb=path.getTangentAt(b);
   curvature=Math.atan2(ta.z*tb.x-ta.x*tb.z,ta.dot(tb))/Math.max(.0001,(b-a)*length);
   let completed=null;if(length-distance<.002){completed=kind;path=null;kind=null;speed=0;}
   return {travel,curvature,completed};
  },get active(){return !!path;},get state(){return {distance,length,speed,curvature,kind};}
 };
}
