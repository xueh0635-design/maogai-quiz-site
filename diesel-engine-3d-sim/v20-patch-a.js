// === V20 DIGITAL TWIN REBUILD ===
root.visible=false; floor.visible=false; grid.visible=false; labelVisible=false;
const refRoot=new THREE.Group(); refRoot.name='V20 Digital Twin Engine'; scene.add(refRoot);
const refMotion=new THREE.Group(),refValve=new THREE.Group(),refFuel=new THREE.Group(),refGas=new THREE.Group(),refDetails=new THREE.Group(); refRoot.add(refMotion,refValve,refFuel,refGas,refDetails);
const refM={
 cast:new THREE.MeshPhysicalMaterial({color:0x686f73,roughness:.30,metalness:.72,clearcoat:.18,clearcoatRoughness:.36}),
 castDark:new THREE.MeshPhysicalMaterial({color:0x202427,roughness:.42,metalness:.76,clearcoat:.12}),
 alloy:new THREE.MeshPhysicalMaterial({color:0xb8c0c4,roughness:.22,metalness:.88,clearcoat:.38,clearcoatRoughness:.20}),
 machined:new THREE.MeshPhysicalMaterial({color:0xdce2e4,roughness:.14,metalness:.98,clearcoat:.48,clearcoatRoughness:.12}),
 crank:new THREE.MeshPhysicalMaterial({color:0x323639,roughness:.18,metalness:.99,clearcoat:.28}),
 brass:new THREE.MeshPhysicalMaterial({color:0xb58945,roughness:.20,metalness:.90,clearcoat:.24}),
 copper:new THREE.MeshPhysicalMaterial({color:0x8c5b35,roughness:.28,metalness:.88}),
 black:new THREE.MeshStandardMaterial({color:0x080a0c,roughness:.78,metalness:.22}),
 rubber:new THREE.MeshStandardMaterial({color:0x040506,roughness:.94,metalness:.01}),
 cut:new THREE.LineBasicMaterial({color:0xe4382d,transparent:true,opacity:.94})
};
function rrShape(w,h,r){const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s}
function roundedBox(w,h,d,r,mat,pos=[0,0,0],rot=[0,0,0],name=''){const g=new THREE.ExtrudeGeometry(rrShape(w,h,r),{depth:d,bevelEnabled:true,bevelSegments:3,bevelSize:Math.min(4,r*.36),bevelThickness:Math.min(4,r*.36),curveSegments:8});g.translate(0,0,-d/2);return mesh(g,mat,pos,rot,name)}
function refCyl(r,h,mat,pos=[0,0,0],rot=[0,0,0],name='',rad=48){return mesh(new THREE.CylinderGeometry(r,r,h,rad),mat,pos,rot,name)}
function refTube(points,r,mat,segments=56){return tube(points,r,mat,segments)}
function edgeOutline(obj){const e=new THREE.LineSegments(new THREE.EdgesGeometry(obj.geometry,30),refM.cut);e.position.copy(obj.position);e.rotation.copy(obj.rotation);e.scale.copy(obj.scale);refDetails.add(e);return e}
function addBolt(x,y,z,axis='y',scale=1){const rot=axis==='x'?[0,0,Math.PI/2]:axis==='z'?[Math.PI/2,0,0]:[0,0,0];const b=refCyl(4.2*scale,9*scale,refM.machined,[x,y,z],rot,'Fastener',12);refDetails.add(b);return b}
const studioFloor=mesh(new THREE.PlaneGeometry(4200,4200),new THREE.MeshPhysicalMaterial({color:0x05090d,roughness:.55,metalness:.32,clearcoat:.10}),[0,-92,0],[-Math.PI/2,0,0],'Studio Floor');studioFloor.receiveShadow=true;scene.add(studioFloor);
const bed=roundedBox(760,54,390,18,refM.castDark,[0,-54,0],[Math.PI/2,0,0],'Bedplate');refDetails.add(bed);
const rearWall=roundedBox(620,350,32,24,refM.cast,[0,250,-126],[0,0,0],'Crankcase Rear Wall'),frontCover=roundedBox(620,350,32,24,refM.cast,[0,250,126],[0,0,0],'Crankcase Front Cover'),leftWeb=roundedBox(48,360,245,18,refM.cast,[-310,250,0],[0,0,0],'LH Crankcase Web'),rightWeb=roundedBox(48,360,245,18,refM.cast,[310,250,0],[0,0,0],'RH Crankcase Web');frontCover.visible=false;refDetails.add(rearWall,frontCover,leftWeb,rightWeb);edgeOutline(rearWall);edgeOutline(frontCover);edgeOutline(leftWeb);edgeOutline(rightWeb);
const deck2=roundedBox(650,58,258,16,refM.alloy,[0,440,0],[0,0,0],'Cylinder Deck'),head2=roundedBox(660,88,264,18,refM.alloy,[0,505,0],[0,0,0],'Cylinder Head'),carrier2=roundedBox(640,38,220,14,refM.castDark,[0,565,0],[0,0,0],'Cam Carrier'),sump2=roundedBox(690,120,300,28,refM.castDark,[0,15,0],[0,0,0],'Oil Sump');refDetails.add(deck2,head2,carrier2,sump2);edgeOutline(deck2);edgeOutline(head2);edgeOutline(sump2);
for(let x=-260;x<=260;x+=104)refDetails.add(roundedBox(18,300,34,7,refM.castDark,[x,245,-106]));
for(const x of [-260,-130,0,130,260]){refDetails.add(roundedBox(72,34,110,13,refM.cast,[x,91,0]));addBolt(x-22,112,38);addBolt(x+22,112,38)}
const cylX=[-180,-60,60,180],phys=[0,Math.PI,Math.PI,0];
for(const x of cylX){refDetails.add(refCyl(51,250,refM.machined,[x,323,0],[0,0,0],'Cylinder Liner',64));const bore=refCyl(45.5,252,refM.black,[x,323,0],[0,0,0],'Cylinder Bore',64);bore.material=bore.material.clone();bore.material.side=THREE.BackSide;refDetails.add(bore)}
const refCrank=new THREE.Group();refMotion.add(refCrank);for(const x of [-260,-130,0,130,260])refCrank.add(refCyl(24,42,refM.crank,[x,105,0],[0,0,Math.PI/2],'Main Journal',48));refCrank.add(refCyl(18,590,refM.crank,[0,105,0],[0,0,Math.PI/2],'Crank Axis',48));
for(let i=0;i<4;i++){const x=cylX[i],ph=phys[i];const w1=roundedBox(72,102,18,22,refM.crank,[x-30,105,0],[0,Math.PI/2,ph],'Crank Web');const w2=w1.clone();w2.position.x=x+30;refCrank.add(w1,w2);refCrank.add(refCyl(20,62,refM.machined,[x,105+52*Math.cos(ph),52*Math.sin(ph)],[0,0,Math.PI/2],'Rod Journal',48));for(const sx of [-1,1])refCrank.add(roundedBox(58,92,17,20,refM.crank,[x+sx*42,105-48*Math.cos(ph),-48*Math.sin(ph)],[0,Math.PI/2,ph],'Counterweight'))}
const refCyls=[];
for(let i=0;i<4;i++){const x=cylX[i],pg=new THREE.Group();refMotion.add(pg);const piston=new THREE.Group();pg.add(piston);const skirt=refCyl(44,66,refM.alloy,[x,0,0],[0,0,0],`Cylinder ${i+1} Piston`,64);piston.add(skirt);piston.add(refCyl(45,10,refM.machined,[x,36,0],[0,0,0],'Piston Crown',64));for(const dy of [19,25,31])piston.add(torus(44.4,1.3,refM.crank,[x,dy,0],[Math.PI/2,0,0]));piston.add(torus(19,4.5,refM.crank,[x,41,0],[Math.PI/2,0,0]));piston.add(refCyl(11,72,refM.machined,[x,2,0],[Math.PI/2,0,0],'Wrist Pin',32));const rod=roundedBox(34,190,16,11,refM.machined,[x,0,0],[0,0,0],`Cylinder ${i+1} Connecting Rod`);pg.add(rod);const big=torus(26,8,refM.machined,[x,0,0],[Math.PI/2,0,0]),small=torus(15,5,refM.machined,[x,0,0],[Math.PI/2,0,0]);pg.add(big,small);info(skirt,{cn:`${i+1}缸活塞`,en:`Cylinder ${i+1} Piston`,mat:'锻造铝合金',fn:'承受燃烧压力并通过连杆驱动曲轴。',param:'盆形燃烧室 + 三道活塞环。',state:()=>`${phaseText(localAngle(i))[0]} · ${thermoAt(localAngle(i)).P.toFixed(1)} bar`},'motion');refCyls.push({piston,rod,big,small,x,phase:phys[i]})}
const camA=new THREE.Group(),camB=new THREE.Group();camA.position.set(0,595,52);camB.position.set(0,595,-52);refValve.add(camA,camB);camA.add(refCyl(9,560,refM.crank,[0,0,0],[0,0,Math.PI/2],'Intake Camshaft',40));camB.add(refCyl(9,560,refM.crank,[0,0,0],[0,0,Math.PI/2],'Exhaust Camshaft',40));
for(let i=0;i<4;i++)for(const dx of [-24,24]){const x=cylX[i]+dx,l1=refCyl(18,20,refM.crank,[x,8*(dx<0?1:-1),0],[0,0,Math.PI/2],'Cam Lobe',32);l1.scale.set(1,1.35,.68);camA.add(l1);const l2=l1.clone();l2.position.y=-l1.position.y;camB.add(l2)}