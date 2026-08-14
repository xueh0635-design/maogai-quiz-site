// === V23 SMOOTH DEEP EXPLODE PASS ===
// Smooth, staged, wide-separation explosion choreography for the rebuilt digital-twin engine.
let v23Explode=0;
let v23ExplodeVelocity=0;
const v23ExplodeVectors={
  motion:new THREE.Vector3(0,-255,35),
  valve:new THREE.Vector3(0,360,-15),
  fuel:new THREE.Vector3(-45,455,270),
  gas:new THREE.Vector3(455,125,-165),
  details:new THREE.Vector3(-315,35,105),
  flow:new THREE.Vector3(70,115,130),
  hw:new THREE.Vector3(-250,55,-145),
  aux:new THREE.Vector3(285,180,175),
  gas22:new THREE.Vector3(465,120,-170)
};
function v23Clamp01(x){return Math.max(0,Math.min(1,x))}
function v23Smoothstep(x){x=v23Clamp01(x);return x*x*(3-2*x)}
function v23Stage(x,start,end){return v23Smoothstep((x-start)/(end-start))}
function v23SetExploded(group,vec,k){if(group)group.position.set(vec.x*k,vec.y*k,vec.z*k)}
function updateV23(dt){
  dt=Math.min(.05,Math.max(0,dt||0));
  const target=v23Clamp01(explode/100);
  // Critically damped-feeling response without snapping.  About 1.0–1.3 s for a full travel.
  const response=1-Math.exp(-5.15*dt);
  v23Explode+=(target-v23Explode)*response;
  if(Math.abs(target-v23Explode)<0.0008)v23Explode=target;
  const e=v23Explode;
  const shellK=v23Stage(e,.00,.72);
  const motionK=v23Stage(e,.04,.78);
  const valveK=v23Stage(e,.08,.84);
  const gasK=v23Stage(e,.12,.90);
  const auxK=v23Stage(e,.16,.94);
  const fuelK=v23Stage(e,.20,1.00);
  v23SetExploded(refDetails,v23ExplodeVectors.details,shellK);
  v23SetExploded(refMotion,v23ExplodeVectors.motion,motionK);
  v23SetExploded(refValve,v23ExplodeVectors.valve,valveK);
  v23SetExploded(refGas,v23ExplodeVectors.gas,gasK);
  v23SetExploded(refFuel,v23ExplodeVectors.fuel,fuelK);
  if(typeof flowRoot!=='undefined')v23SetExploded(flowRoot,v23ExplodeVectors.flow,v23Stage(e,.14,.86));
  if(typeof hw22!=='undefined')v23SetExploded(hw22,v23ExplodeVectors.hw,shellK);
  if(typeof aux22!=='undefined')v23SetExploded(aux22,v23ExplodeVectors.aux,auxK);
  if(typeof gas22!=='undefined')v23SetExploded(gas22,v23ExplodeVectors.gas22,gasK);
  // Keep the exploded assembly readable by easing the camera target slightly upward/outward.
  if(controls&&target>.02){
    const targetY=300+42*v23Smoothstep(e);
    controls.target.y+=(targetY-controls.target.y)*(1-Math.exp(-3.2*dt));
  }
}
