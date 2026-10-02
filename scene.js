'use strict';
// Original procedural meshes. All dimensions are metres; no remote assets.
const $=id=>document.getElementById(id);
let seed=38129;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}function range(a,b){return a+(b-a)*rand();}
const scene=new THREE.Scene();scene.background=new THREE.Color('#26353b').convertSRGBToLinear();scene.fog=new THREE.FogExp2(scene.background,.045);
const camera=new THREE.PerspectiveCamera(51,innerWidth/innerHeight,.08,160);
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});}catch(e){$('error').style.display='block';$('error').textContent='浏览器无法启动 3D 图形。请用支持 WebGL 的 Edge 或 Chrome 打开。';throw e;}
renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;$('world').appendChild(renderer.domElement);
function resize(){renderer.setSize(Math.round(innerWidth),Math.round(innerHeight),false);renderer.domElement.style.width='100vw';renderer.domElement.style.height='100vh';camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}resize();addEventListener('resize',resize);
scene.add(new THREE.HemisphereLight(0x819fae,0x171c16,.42));const sun=new THREE.DirectionalLight(0xadc2d1,.86);sun.position.set(-14,18,-10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-26,right:26,top:26,bottom:-26,near:1,far:65});sun.shadow.bias=-.001;sun.shadow.normalBias=.03;scene.add(sun);
const mat=(c)=>new THREE.MeshStandardMaterial({color:new THREE.Color(c).convertSRGBToLinear(),flatShading:true,roughness:1});
const M={wood:mat('#665d48'),rail:mat('#897b5a'),darkwood:mat('#413e30'),red:mat('#64453b'),roof:mat('#464e48'),iron:mat('#373c34'),wool:mat('#c3bfa4'),wool2:mat('#b5b399'),skin:mat('#696550'),hoof:mat('#33382e'),eye:mat('#141c17'),horn:mat('#a29a7b'),hay:mat('#9b9563'),water:mat('#6b8079'),stone:mat('#747968')};
const models=new THREE.Group();models.name='Old pasture - original low poly models';scene.add(models);
const colliders=[];function mesh(geo,m,parent=models){const o=new THREE.Mesh(geo,m);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function box(x,y,z,w,h,d,m,parent=models){const o=mesh(new THREE.BoxGeometry(w,h,d),m,parent);o.position.set(x,y,z);return o;}
function ico(x,y,z,sx,sy,sz,m,parent=models,detail=0){const o=mesh(new THREE.IcosahedronGeometry(1,detail),m,parent);o.position.set(x,y,z);o.scale.set(sx,sy,sz);return o;}
function beam(a,b,r,m,parent=models,sides=5){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);const o=mesh(new THREE.CylinderGeometry(r,r*.91,av.distanceTo(bv),sides),m,parent);o.position.copy(av).add(bv).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return o;}
function solid(x,z,w,d){colliders.push({x,z,w:w/2,d:d/2});}
// Triangulated terrain with restrained per-face colour variation.
const tg=new THREE.PlaneGeometry(150,150,50,50);tg.rotateX(-Math.PI/2);const tp=tg.attributes.position;for(let i=0;i<tp.count;i++){const x=tp.getX(i),z=tp.getZ(i);tp.setY(i,Math.abs(x)<23&&Math.abs(z)<22?-.035:Math.sin(x*.12)*Math.cos(z*.09)*.7-.08);}const groundGeo=tg.toNonIndexed();const colors=[];const color=new THREE.Color();for(let i=0;i<groundGeo.attributes.position.count;i+=3){color.setHSL(.205+range(-.02,.02),.13+rand()*.09,.255+rand()*.06);color.convertSRGBToLinear();for(let j=0;j<3;j++)colors.push(color.r,color.g,color.b);}groundGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));groundGeo.computeVertexNormals();mesh(groundGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));
// Irregular bare earth in the central paddock.
for(let i=0;i<23;i++){const o=mesh(new THREE.CircleGeometry(range(.9,2.8),7),mat(i%2?'#746e51':'#6c694e'));o.rotation.x=-Math.PI/2;o.position.set(range(-7,8),.001+i*.0003,range(-3,8));o.scale.y=range(.45,.85);}
// Barn, built plank by plank. Front faces +z.
const barn=new THREE.Group();barn.name='Weathered timber barn';barn.position.set(-4,0,-9);models.add(barn);const plankM=['#695646','#735949','#5c4d40','#795e4b','#645647'].map(mat);
for(let i=0;i<24;i++){let x=-4.1+i*.355;box(x,2.05,-3,.33,4.1,.19,plankM[i%5],barn);if(Math.abs(x)>1.32)box(x,2.05,3,.33,4.1,.18,plankM[(i+2)%5],barn);}
for(const x of [-4.25,4.25])for(let i=0;i<17;i++)box(x,2.05,-2.9+i*.355,.18,4.1,.33,plankM[(i+1)%5],barn);
for(const x of [-4.35,4.35])for(const z of [-3.08,3.08])box(x,2.05,z,.24,4.25,.24,M.darkwood,barn);
box(0,4.12,3.05,8.8,.2,.25,M.darkwood,barn);box(0,3.18,3.06,2.9,.19,.3,M.darkwood,barn);
for(let i=0;i<24;i++){let x=-4.1+i*.355;const h=(1-Math.abs(x)/4.4)*1.9;box(x,4.2+h/2,3,.33,h,.18,plankM[(i+1)%5],barn);box(x,4.2+h/2,-3,.33,h,.18,plankM[i%5],barn);}
for(const side of [-1,1]){const roof=box(side*2.3,5.08,0,5.05,.16,7.15,M.roof,barn);roof.rotation.z=-side*.405;for(let j=0;j<11;j++){const rib=box(side*2.3,5.18,-3.4+j*.68,5.05,.035,.045,M.iron,barn);rib.rotation.z=-side*.405;}}
box(0,6.09,0,.15,.12,7.3,M.iron,barn);box(0,.06,0,8.3,.12,6,M.darkwood,barn);
// One slid-open door and one angled old door.
const door=box(-2.58,1.53,3.2,2.45,3,.15,M.darkwood,barn);box(-2.58,1.53,3.31,2.3,.12,.07,M.rail,barn);beam([-3.65,.15,3.32],[-1.52,2.92,3.32],.07,M.rail,barn,4);
const bulb=ico(.9,2.85,2.87,.09,.14,.09,new THREE.MeshStandardMaterial({color:0xd4b27c,emissive:0xc3964c,emissiveIntensity:.8}),barn);const lamp=new THREE.PointLight(0xf3b066,2.6,13,1.5);lamp.position.set(.8,2.4,3.65);barn.add(lamp);
solid(-4,-9,8.5,6); // Barn exterior is a scenic boundary for this study.
// Barn doorway is accessible to the threshold, with a dark interior beyond.
const sign=box(-6.9,2.95,-5.78,1.45,.45,.07,M.darkwood);for(let i=0;i<3;i++)box(-7.3+i*.37,2.95,-5.73,.15,.22,.025,M.rail);
// Paddock rails and leaning posts. South gap is the entrance.
function fence(ax,az,bx,bz,count){for(let i=0;i<=count;i++){const t=i/count,x=ax+(bx-ax)*t,z=az+(bz-az)*t;const p=box(x,.7,z,.15,1.4,.16,M.wood);p.rotation.z=range(-.035,.035);if(i<count){const nx=ax+(bx-ax)*(i+1)/count,nz=az+(bz-az)*(i+1)/count;for(const y of [.53,1.04]){const q=beam([x,y,z],[nx,y+range(-.045,.045),nz],.055,M.rail,models,4);}}}const dx=Math.abs(bx-ax),dz=Math.abs(bz-az);solid((ax+bx)/2,(az+bz)/2,dx+.15,dz+.15);}
fence(-11,-4,-11,10,6);fence(11,-4,11,10,6);fence(-11,-4,-8.4,-4,1);fence(.4,-4,11,-4,5);fence(-11,10,-2,10,4);fence(1.5,10,11,10,4);
// Open gate rests against its post.
const gate=new THREE.Group();gate.position.set(-2,0,10);gate.rotation.y=-1.18;models.add(gate);for(const y of [.5,1])box(1.6,y,0,3.2,.1,.12,M.wood,gate);for(const x of [0,1.6,3.2])box(x,.73,0,.12,1.22,.14,M.wood,gate);beam([.1,.18,0],[3.1,1.27,0],.05,M.rail,gate,4);
// Trough and hay, the second interactive object.
const trough=new THREE.Group();trough.name='Feed trough';trough.position.set(3.2,0,2.9);models.add(trough);box(0,.48,0,2.5,.15,.75,M.darkwood,trough);for(const z of [-.42,.42])box(0,.72,z,2.65,.45,.12,M.wood,trough);for(const x of [-1.3,1.3])box(x,.7,0,.12,.42,.8,M.wood,trough);for(const x of [-.92,.92])for(const z of [-.28,.28])box(x,.25,z,.1,.5,.1,M.darkwood,trough);solid(3.2,2.9,2.8,1);
const hay=new THREE.Group();hay.name='Added hay';trough.add(hay);hay.visible=false;for(let i=0;i<23;i++){const h=box(range(-1.1,1.1),range(.58,.76),range(-.26,.26),range(.18,.65),.025,.024,M.hay,hay);h.rotation.y=range(-2,2);}
// Water tank, hay bales, barrels and stones.
const tank=mesh(new THREE.CylinderGeometry(.86,.76,.5,10),M.iron);tank.position.set(-7,.25,2);const water=mesh(new THREE.CircleGeometry(.79,10),M.water);water.rotation.x=-Math.PI/2;water.position.set(-7,.48,2);solid(-7,2,1.8,1.8);
for(let i=0;i<3;i++){const x=1.5+i*.85,z=-4.85+(i%2)*.7;const bale=box(x,.42,z,.78,.84,1.1,M.hay);for(const offset of [-.28,.28])box(x,.85,z+offset,.8,.025,.045,M.darkwood);solid(x,z,.8,1.1);}
for(let i=0;i<2;i++){const barrel=mesh(new THREE.CylinderGeometry(.4,.37,1.05,9),M.wood);barrel.position.set(-9+i*.88,.525,-5);for(const y of [.2,.8]){const band=mesh(new THREE.CylinderGeometry(.405,.405,.07,9),M.iron);band.position.set(-9+i*.88,y,-5);}}
for(let i=0;i<35;i++){const x=range(-14,14),z=range(-6,15);if(Math.abs(x)<5&&z>0&&z<7)continue;ico(x,.06,z,range(.08,.3),range(.08,.2),range(.1,.35),M.stone);}
// Grass triangles in a single mesh, denser along boundaries.
const gv=[],gc=[];const grassColors=['#727957','#818461','#5d694c','#93906a'].map(c=>new THREE.Color(c).convertSRGBToLinear());for(let i=0;i<3400;i++){let x=range(-30,30),z=range(-24,27);if(x>-8.5&&x<.5&&z>-12.5&&z<-5.8)continue;if(Math.abs(x)<9&&z>-3&&z<9&&rand()>.2)continue;const h=range(.14,.48),w=range(.04,.11),c=grassColors[i%4];for(let k=0;k<2;k++){const a=k*Math.PI/2+rand(),dx=Math.cos(a)*w,dz=Math.sin(a)*w;gv.push(x-dx,0,z-dz,x+dx,0,z+dz,x+range(-.1,.1),h,z+range(-.1,.1));for(let n=0;n<3;n++)gc.push(c.r,c.g,c.b);}}const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(gv,3));gg.setAttribute('color',new THREE.Float32BufferAttribute(gc,3));gg.computeVertexNormals();const grass=mesh(gg,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:1}));grass.castShadow=false;
// Distant bare trees and telephone poles, quiet rural silhouette.
for(let i=0;i<17;i++){const x=range(-40,40),z=range(-38,-19),h=range(3,6);beam([x,0,z],[x+.2,h,z],.16,M.darkwood);for(let j=0;j<3;j++){const dx=range(-2,2);beam([x,h*.5+j*.5,z],[x+dx,h+range(0,1),z+range(-1,1)],.065,M.darkwood);}}
for(let i=0;i<5;i++){let x=-25+i*13;beam([x,0,-24],[x,7,-24],.11,M.darkwood);box(x,6.55,-24,2.3,.1,.14,M.darkwood);if(i<4)for(const off of [-.85,.85]){const points=[];for(let k=0;k<=15;k++){const t=k/15;points.push(new THREE.Vector3(x+off+t*13,6.55-Math.sin(t*Math.PI)*.8,-24));}scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x484e40})));}}
const materialState=applyPastureMaterials();
// Crossed alpha-cutout quads replace the solid triangular grass.
grass.visible=false;const grassTexture=new THREE.TextureLoader().load('materials/pasture-grass.png');grassTexture.encoding=THREE.sRGBEncoding;grassTexture.anisotropy=4;
const grassMaterial=new THREE.MeshStandardMaterial({map:grassTexture,alphaTest:.32,side:THREE.DoubleSide,roughness:1,color:0xa6aa8c});
const meadow=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),grassMaterial,1800);const dummy=new THREE.Object3D();let grassIndex=0;
for(let i=0;i<900;i++){let x=range(-25,25),z=range(-20,23);if(x>-8.5&&x<.5&&z>-12.5&&z<-5.8){x+=12;}const height=range(.22,.55),width=height*range(.9,1.3),angle=rand()*Math.PI;
for(let j=0;j<2;j++){dummy.position.set(x,height*.47,z);dummy.rotation.set(0,angle+j*Math.PI/2,0);dummy.scale.set(width,height,1);dummy.updateMatrix();meadow.setMatrixAt(grassIndex++,dummy.matrix);}}
meadow.receiveShadow=true;meadow.castShadow=false;models.add(meadow);
// A low-poly mound in the trough, textured with the same hay as the bales.
for(let i=0;i<6;i++)ico(-1+i*.4,.65,0,.28,.12,.32,M.hay,hay,0);

// User-provided textured, skinned sheep. Keep the original asset intact.
const sheep=new THREE.Group();sheep.name='Imported sheep';sheep.position.set(.2,0,2);sheep.rotation.y=-.35;models.add(sheep);
const sheepNavigation=createSheepNavigation(sheep);
let sheepMotion=null,sheepVariants=null,walkDistance=0;const legs=[],heads=[];let importedRoot=null,mixer=null,modelReady=false,modelError=null,headBone=null,headRest=null,bodyBone=null,bodyRest=null,neckBone=null,neckRest=null;
$('status').textContent='正在载入羊的模型与贴图…';
new THREE.GLTFLoader().load('sheep/source/sheep.glb',gltf=>{
 importedRoot=gltf.scene;importedRoot.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(importedRoot),size=bounds.getSize(new THREE.Vector3());
 const scale=1.7/size.y;importedRoot.scale.multiplyScalar(scale);
 importedRoot.position.set(-(bounds.min.x+bounds.max.x)*.5*scale,-bounds.min.y*scale,-(bounds.min.z+bounds.max.z)*.5*scale);
 sheep.add(importedRoot);
 importedRoot.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;for(const m of (Array.isArray(o.material)?o.material:[o.material])){m.metalness=0;m.roughness=.94;if(m.map)m.map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());}}if(o.name==='Body'){bodyBone=o;bodyRest=o.position.clone();}if(o.name==='Neck2'){neckBone=o;neckRest=o.quaternion.clone();}if(o.name==='Head'){headBone=o;headRest=o.quaternion.clone();}});
 if(gltf.animations.length){mixer=new THREE.AnimationMixer(importedRoot);mixer.clipAction(gltf.animations[0]).play();mixer.update(0);}
 importedRoot.updateMatrixWorld(true);sheepMotion=createSheepMotion(importedRoot);sheepVariants=createSheepVariants(importedRoot);modelReady=true;$('status').textContent='模型已就绪。走近它，或按 C 呼唤。';
},undefined,error=>{modelError=String(error);$('status').textContent='模型加载失败。请通过本地预览地址打开。';console.error(error);});
document.querySelectorAll('[data-variant]').forEach(button=>button.onclick=()=>{if(!sheepVariants)return;sheepVariants.setVariant(button.dataset.variant);$('status').textContent='当前形态：'+sheepVariants.label+'。点击近看羊或走一圈。';});
// Handheld beam follows the view; moonlight still reveals the surrounding silhouettes.
const torch=new THREE.SpotLight(0xe5e0ce,1.9,24,.47,.65,1.25);torch.castShadow=true;torch.shadow.mapSize.set(1024,1024);torch.shadow.bias=-.001;scene.add(torch);scene.add(torch.target);let torchOn=true;
const fill=new THREE.PointLight(0xb4c4cd,.23,7);scene.add(fill);
// Simple browser interaction: orbit by default, optional first-person movement.
let followSheep=false;
let mode='orbit',orbitYaw=.54,orbitPitch=.37,orbitDist=17,orbitTarget=new THREE.Vector3(-.2,1,0),yaw=0,pitch=0;const player=new THREE.Vector3(0,1.65,8.3);const keys={};let drag=false,lastX=0,lastY=0,callUntil=0,feedState='empty',petUntil=0,noticeTimer;
function notify(s){$('notice').textContent=s;$('notice').style.opacity=1;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').style.opacity=0,2800);}
let audioCtx;function bleat(){try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume();const osc=audioCtx.createOscillator(),gain=audioCtx.createGain(),filter=audioCtx.createBiquadFilter();osc.type='sawtooth';filter.type='lowpass';filter.frequency.value=600;const t=audioCtx.currentTime;osc.frequency.setValueAtTime(155,t);osc.frequency.linearRampToValueAtTime(110,t+.55);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.04,t+.07);gain.gain.exponentialRampToValueAtTime(.001,t+.65);osc.connect(filter);filter.connect(gain);gain.connect(audioCtx.destination);osc.start(t);osc.stop(t+.7);}catch{}}
function callSheep(){callUntil=performance.now()/1000+4;bleat();$('status').textContent='它抬起头，回应你的声音。';notify('它听到了。');}
function startStroll(){if(!modelReady)return;feedState='empty';sheepNavigation.startStroll();$('status').textContent='它沿着弧线在围栏内走一圈。';notify('观察前后关节的弯曲，以及转弯时身体的朝向。');}
function enterWalk(){mode='walk';$('walk').textContent='返回全景';$('aim').style.display='block';$('description').innerHTML='WASD 行走，鼠标转头。<br>靠近羊或食槽，按 E 互动。';try{const p=renderer.domElement.requestPointerLock();if(p&&p.catch)p.catch(()=>notify('按住画面拖动，也能转头。'));}catch{} }
function overview(){mode='orbit';followSheep=false;if(document.pointerLockElement)document.exitPointerLock();orbitTarget.set(-.2,1,0);orbitDist=17;orbitYaw=.54;orbitPitch=.37;$('walk').textContent='走进牧场';$('aim').style.display='none';$('hint').style.display='none';$('description').innerHTML='拖动画面环绕观察，滚轮拉近。<br>走进围栏，呼唤它，或给食槽添一把草。';}
$('walk').onclick=()=>mode==='walk'?overview():enterWalk();$('inspect').onclick=()=>{overview();followSheep=true;orbitTarget.copy(sheep.position).add(new THREE.Vector3(0,1.1,0));orbitDist=4.3;orbitYaw=.58;orbitPitch=.19;};$('call').onclick=callSheep;$('stroll').onclick=startStroll;
renderer.domElement.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);});renderer.domElement.addEventListener('pointerup',()=>drag=false);
addEventListener('mousemove',e=>{const locked=document.pointerLockElement===renderer.domElement;if(!drag&&!locked)return;const dx=locked?e.movementX:e.clientX-lastX,dy=locked?e.movementY:e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;if(mode==='orbit'){orbitYaw-=dx*.006;orbitPitch=Math.max(.08,Math.min(1.1,orbitPitch+dy*.005));}else{yaw-=dx*.003;pitch=Math.max(-1.15,Math.min(1.15,pitch-dy*.003));}});
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();orbitDist=Math.max(2.4,Math.min(36,orbitDist+e.deltaY*.015));},{passive:false});
function near(){if(mode!=='walk')return null;if(player.distanceTo(new THREE.Vector3(3.2,1.65,2.9))<2.45)return 'feed';if(player.distanceTo(sheep.position.clone().setY(1.65))<2.35)return 'sheep';return null;}
function interact(){const n=near();if(n==='feed'){if(feedState==='empty'){feedState='moving';sheepNavigation.startFeed();hay.visible=true;notify('你添了一把干草。');$('status').textContent='它正慢慢走向食槽。';}else notify('食槽里已经有草了。');}else if(n==='sheep'){petUntil=performance.now()/1000+3;notify('你摸了摸它的额头。它没有躲开。');$('status').textContent='它微微低下头。';}else notify('走近羊或食槽，再按 E。');}
addEventListener('keydown',e=>{if(['KeyW','KeyA','KeyS','KeyD','Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.repeat)return;if(e.code==='KeyE')interact();if(e.code==='KeyC')callSheep();if(e.code==='KeyF'){torchOn=!torchOn;notify(torchOn?'手电已打开。':'手电已关闭。');}if(e.code==='KeyV')overview();});addEventListener('keyup',e=>keys[e.code]=false);addEventListener('blur',()=>{for(const k in keys)keys[k]=false;drag=false;});document.addEventListener('pointerlockchange',()=>{for(const k in keys)keys[k]=false;});
function blocked(x,z){if(Math.abs(x)>18||z>19||z<-16)return true;return colliders.some(c=>Math.abs(x-c.x)<c.w+.26&&Math.abs(z-c.z)<c.d+.26);}
const clock=new THREE.Clock();let time=0;function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.04);time+=dt;const now=performance.now()/1000;if(mode==='walk'){let forward=(keys.KeyW?1:0)-(keys.KeyS?1:0),strafe=(keys.KeyD?1:0)-(keys.KeyA?1:0);const norm=Math.hypot(forward,strafe)||1;const speed=2.8*dt/norm;let dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*strafe)*speed,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*strafe)*speed;if(!blocked(player.x+dx,player.z))player.x+=dx;if(!blocked(player.x,player.z+dz))player.z+=dz;camera.position.copy(player);camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);const n=near();$('hint').style.display=n?'block':'none';$('hint').textContent=n==='feed'?(feedState==='empty'?'[ E ]  给食槽添草':'食槽里有草了'):'[ E ]  轻轻摸它';}else{if(followSheep)orbitTarget.copy(sheep.position).add(new THREE.Vector3(0,.9,0));camera.position.set(orbitTarget.x+Math.sin(orbitYaw)*Math.cos(orbitPitch)*orbitDist,orbitTarget.y+Math.sin(orbitPitch)*orbitDist,orbitTarget.z+Math.cos(orbitYaw)*Math.cos(orbitPitch)*orbitDist);camera.lookAt(orbitTarget);}
const step=sheepNavigation.update(dt),travel=step.travel,moving=travel>0;walkDistance+=travel;
if(step.completed==='feed'){feedState='eating';$('status').textContent='它停在食槽旁，低头吃草。';}else if(step.completed==='stroll')$('status').textContent='它走完一圈，重新停下。';
sheep.position.y=0;legs.forEach((l,i)=>l.rotation.x=moving?Math.sin(time*6+(i%2)*Math.PI)*.22:0);heads.forEach((h,i)=>{let targetY=h.base+Math.sin(time*.5+i*1.7)*.16,targetX=Math.sin(time*.8+i)*.035;if(now<callUntil-i*.4){const to=camera.position.clone().sub(sheep.position);targetY=THREE.MathUtils.clamp(Math.atan2(to.x,to.z)-sheep.rotation.y,-.75,.75);}if(now<petUntil&&i===0)targetX=.4;if(feedState==='eating')targetX=.65+Math.sin(time*1.5+i*2)*.09;h.neck.rotation.y=THREE.MathUtils.lerp(h.neck.rotation.y,targetY,dt*2);h.neck.rotation.x=THREE.MathUtils.lerp(h.neck.rotation.x,targetX,dt*2);});if(sheepMotion)sheepMotion.update(dt,travel,step.curvature);
if(neckBone&&neckRest){if(feedState==='eating')neckBone.rotateX(-.6);}
if(headBone&&headRest){headBone.quaternion.copy(headRest);headBone.rotateX(feedState==='eating'?-.55:(now<petUntil?-.15:Math.sin(time*.65)*.035));if(now<callUntil&&!moving){const to=camera.position.clone().sub(sheep.position);headBone.rotateY(THREE.MathUtils.clamp(Math.atan2(to.x,to.z)-sheep.rotation.y,-.4,.4));}}
if(sheepVariants)sheepVariants.update(dt,travel,step.curvature,time);
const look=new THREE.Vector3();camera.getWorldDirection(look);torch.position.copy(camera.position).add(new THREE.Vector3(.12,-.18,0));torch.target.position.copy(camera.position).addScaledVector(look,12);torch.visible=torchOn;fill.position.copy(camera.position);fill.visible=torchOn;lamp.intensity=2.5+Math.sin(time*2.7)*.06+Math.sin(time*13)*.025;renderer.render(scene,camera);}
frame();
window.ranch={scene,models,sheep,player,camera,renderer,materialState,startStroll,sheepNavigation,get sheepMotion(){return sheepMotion;},get sheepVariants(){return sheepVariants;},get importedRoot(){return importedRoot;},interact,callSheep,overview,enterWalk,get state(){return{variant:sheepVariants?.current,anatomy:sheepVariants?.counts,walking:sheepNavigation.active,walkDistance,rigJoints:sheepMotion?.joints.length||0,modelReady,modelError,mode,feedState,sheepPosition:sheep.position.toArray(),playerPosition:player.toArray(),meshCount:renderer.info.render.calls};}};
