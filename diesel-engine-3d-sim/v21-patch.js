// === V21 FLOW + DETAIL PASS ===
const v21Root=new THREE.Group();v21Root.name='V21 Fluid & Detail Systems';scene.add(v21Root);
const flowRoot=new THREE.Group(),detail21=new THREE.Group();v21Root.add(flowRoot,detail21);
const flowMat={
 intake:new THREE.MeshBasicMaterial({color:0x33b9ff,transparent:true,opacity:.92}),
 exhaust:new THREE.MeshBasicMaterial({color:0xff6738,transparent:true,opacity:.92}),
 fuel:new THREE.MeshBasicMaterial({color:0xffd84a,transparent:true,opacity:.96}),
 oil:new THREE.MeshBasicMaterial({color:0xf5b33f,transparent:true,opacity:.92}),
 coolant:new THREE.MeshBasicMaterial({color:0x27d6ff,transparent:true,opacity:.88})
};
function curveFrom(points){return new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'catmullrom',.25)}
function addFlow(name,points,mat,count=18,size=3.4,speed=.10){const g=new THREE.Group();g.name=name;flowRoot.add(g);const c=curveFrom(points),arr=[];for(let i=0;i<count;i++){const s=new THREE.Mesh(new THREE.SphereGeometry(size,10,8),mat);g.add(s);arr.push({m:s,u:i/count})}g.userData={curve:c,arr,speed};return g}
const flowSets=[];
flowSets.push(addFlow('Intake Air Flow',[[420,430,165],[285,440,150],[160,445,138],[0,445,138],[-160,445,138],[-230,456,112],[-180,475,62]],flowMat.intake,24,4.4,.11));
flowSets.push(addFlow('Exhaust Gas Flow',[[-180,470,-65],[-180,445,-105],[-160,415,-142],[20,405,-145],[230,410,-140],[355,420,-105],[430,420,-95]],flowMat.exhaust,24,4.6,.13));
flowSets.push(addFlow('Common Rail Fuel',[[-250,650,82],[-120,650,82],[0,650,82],[120,650,82],[250,650,82]],flowMat.fuel,22,3.0,.15));
for(const x of cylX)flowSets.push(addFlow(`Injector ${x} Fuel`,[[x,650,82],[x,625,65],[x,590,25],[x,540,0],[x,485,0]],flowMat.fuel,10,2.6,.18));
flowSets.push(addFlow('Lubrication Main Gallery',[[300,82,138],[190,82,125],[60,90,116],[-80,90,125],[-220,105,130],[-300,120,100]],flowMat.oil,22,3.2,.10));
flowSets.push(addFlow('Cylinder Head Oil Feed',[[-300,120,-92],[-330,240,-115],[-320,380,-110],[-275,455,-102],[-150,535,-92],[0,560,-82],[180,560,-82]],flowMat.oil,18,3.0,.095));
for(const x of cylX){flowSets.push(addFlow(`Coolant Jacket ${x}`,[[x-48,235,-95],[x-55,315,-105],[x-48,410,-95],[x-35,470,-80],[x,500,-75],[x+35,470,-80],[x+48,410,-95],[x+55,315,-105],[x+48,235,-95]],flowMat.coolant,14,3.2,.085));}
const coolantShellMat=new THREE.MeshPhysicalMaterial({color:0x27cfff,transparent:true,opacity:.10,roughness:.08,metalness:.08,transmission:.35,depthWrite:false,side:THREE.DoubleSide});
for(const x of cylX){const sh=refCyl(59,236,coolantShellMat,[x,323,-4],[0,0,0],'Coolant Water Jacket',64);detail21.add(sh);}
const coverMat=new THREE.MeshPhysicalMaterial({color:0x383e42,roughness:.26,metalness:.82,clearcoat:.22});
const upperCover=roundedBox(670,70,252,24,coverMat,[0,628,0],[0,0,0],'DOHC Cam Cover');upperCover.visible=false;detail21.add(upperCover);edgeOutline(upperCover);
const railBracketMat=new THREE.MeshPhysicalMaterial({color:0x8b7a57,roughness:.28,metalness:.82});
for(const x of [-180,-60,60,180]){detail21.add(roundedBox(22,18,72,5,railBracketMat,[x,636,76],[0,0,0],'Fuel Rail Bracket'));}
for(const x of [-240,-120,0,120,240]){detail21.add(refCyl(5,17,refM.machined,[x,655,107],[0,0,0],'Cam Cover Stud',16));}
const sectionFrame=roundedBox(690,390,10,28,new THREE.MeshBasicMaterial({color:0xff3b30,transparent:true,opacity:.10}),[0,300,132],[0,0,0],'Section Plane');sectionFrame.visible=false;detail21.add(sectionFrame);
info(refFilter,{cn:'机油滤清器',en:'Full-flow Oil Filter',mat:'钢壳滤芯总成',fn:'过滤润滑油中的磨粒与污染物。',param:'全流式过滤。',state:()=>`${Math.round(320+rpm*.045)} kPa`},'oil');
info(flyV20,{cn:'飞轮总成',en:'Flywheel Assembly',mat:'高强度锻钢',fn:'储存转动能量并平抑四冲程扭矩波动。',param:'齿圈可见。',state:()=>`${rpm} rpm`},'motion');
info(camA,{cn:'进气凸轮轴',en:'Intake Camshaft',mat:'表面硬化合金钢',fn:'按曲轴半速驱动进气门。',param:'DOHC 16V。',state:()=>`${Math.round((angle/2)%360)}° cam`},'valve');
function flowSystemEnabled(name){if(name.includes('Intake')||name.includes('Exhaust'))return systemVisible('gas');if(name.includes('Fuel')||name.includes('Injector'))return systemVisible('fuel');if(name.includes('Oil')||name.includes('Lubrication'))return systemVisible('oil');if(name.includes('Coolant'))return systemVisible('cooling');return true}
function updateV21(dt){
 const safeDt=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));
 const baseSpeed=Math.max(.25,rpm/1500);
 for(const g of flowSets){
  g.visible=flowSystemEnabled(g.name);
  for(const p of g.userData.arr){
   const next=p.u+safeDt*g.userData.speed*baseSpeed;
   p.u=((next%1)+1)%1;
   const q=g.userData.curve.getPointAt(p.u);
   if(q)p.m.position.copy(q);
   const pulse=.78+.28*Math.sin((p.u*16+performance.now()*.002));
   p.m.scale.setScalar(pulse)
  }
 }
 const cut=!!cutaway;sectionFrame.visible=cut;upperCover.visible=!cut;
 for(const o of detail21.children){if(o.name&&o.name.includes('Coolant Water Jacket'))o.visible=cut&&systemVisible('cooling')}
}
