// === V25 STUDIO PBR LIGHTING + MATERIAL PASS ===
// Visual-only patch: preserves mechanics, cutaway and exploded-view state machines.
(function applyV25StudioPBR(){
  scene.background=null;
  scene.fog.color.setHex(0x01050a);
  scene.fog.density=0.000115;
  viewport.style.background='radial-gradient(ellipse at 52% 40%,#12283b 0%,#081520 39%,#040b12 68%,#010305 100%)';

  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=isMobileView?1.04:1.01;
  renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;

  // Keep the complete engine inside the clear central stage between both side panels.
  if(!isMobileView){
    camera.position.set(280,385,2280);
    controls.target.set(0,292,0);
    camera.fov=31;
    camera.updateProjectionMatrix();
    controls.update();
  }

  function studioFace(kind){
    const c=document.createElement('canvas');c.width=c.height=128;
    const x=c.getContext('2d');
    const base=x.createLinearGradient(0,0,128,128);
    base.addColorStop(0,kind==='warm'?'#21160f':kind==='cool'?'#071525':'#0c1218');
    base.addColorStop(.56,'#03070a');base.addColorStop(1,'#010203');x.fillStyle=base;x.fillRect(0,0,128,128);
    const glow=x.createRadialGradient(64,40,4,64,48,76);
    glow.addColorStop(0,kind==='warm'?'rgba(255,211,162,.58)':kind==='cool'?'rgba(150,205,255,.59)':'rgba(230,242,255,.55)');
    glow.addColorStop(.30,kind==='warm'?'rgba(226,151,84,.17)':kind==='cool'?'rgba(70,143,220,.17)':'rgba(184,211,236,.15)');
    glow.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=glow;x.fillRect(0,0,128,128);
    const strip=x.createLinearGradient(0,0,128,0);
    strip.addColorStop(0,'rgba(255,255,255,0)');strip.addColorStop(.405,'rgba(255,255,255,.025)');
    strip.addColorStop(.485,kind==='warm'?'rgba(255,225,188,.50)':kind==='cool'?'rgba(198,229,255,.54)':'rgba(255,255,255,.55)');
    strip.addColorStop(.555,'rgba(255,255,255,.05)');strip.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=strip;x.fillRect(0,12,128,104);return c;
  }
  const studioEnv=new THREE.CubeTexture([studioFace('warm'),studioFace('cool'),studioFace('neutral'),studioFace('neutral'),studioFace('neutral'),studioFace('cool')]);
  studioEnv.encoding=THREE.sRGBEncoding;studioEnv.needsUpdate=true;scene.environment=studioEnv;

  // Only touch top-level lighting nodes during boot; never recurse through the full model tree here.
  for(const o of scene.children){
    if(o.type==='HemisphereLight')o.intensity=Math.min(o.intensity,.52);
    else if(o.type==='AmbientLight')o.intensity=Math.min(o.intensity,.055);
  }
  key.color.setHex(0xffefda);key.intensity=1.28;key.position.set(590,800,660);
  key.shadow.mapSize.set(isMobileView?1536:3072,isMobileView?1536:3072);key.shadow.camera.left=-800;key.shadow.camera.right=800;key.shadow.camera.top=840;key.shadow.camera.bottom=-780;key.shadow.bias=-0.00012;key.shadow.normalBias=.018;
  rim.color.setHex(0x68b6ff);rim.intensity=1.00;rim.position.set(-760,470,-600);
  warm.color.setHex(0xffa966);warm.intensity=.31;warm.distance=1350;warm.position.set(450,350,450);
  frontFill.color.setHex(0xdceeff);frontFill.intensity=.22;frontFill.position.set(-120,420,1080);lowFill.intensity=.025;
  if(typeof softTop!=='undefined'){softTop.intensity=.16;softTop.color.setHex(0xd8eaff)}
  if(typeof edgeLight22!=='undefined'){edgeLight22.intensity=.27;edgeLight22.color.setHex(0x65b4ff)}
  const topSoft=new THREE.DirectionalLight(0xe5f1ff,.36);topSoft.position.set(-100,980,190);scene.add(topSoft);
  const warmKick=new THREE.DirectionalLight(0xffb26f,.26);warmKick.position.set(850,260,-300);scene.add(warmKick);
  const coolKick=new THREE.DirectionalLight(0x579fff,.22);coolKick.position.set(-850,280,320);scene.add(coolKick);

  function tunePhysical(m,opt){if(!m)return;if(opt.color!==undefined)m.color.setHex(opt.color);if(opt.roughness!==undefined)m.roughness=opt.roughness;if(opt.metalness!==undefined)m.metalness=opt.metalness;if('clearcoat' in m&&opt.clearcoat!==undefined)m.clearcoat=opt.clearcoat;if('clearcoatRoughness' in m&&opt.clearcoatRoughness!==undefined)m.clearcoatRoughness=opt.clearcoatRoughness;if('envMapIntensity' in m)m.envMapIntensity=opt.envMapIntensity===undefined?1.18:opt.envMapIntensity;m.dithering=true;m.needsUpdate=true}

  // Deterministic cast-metal microtexture: subtle roughness/bump variation on large cast surfaces.
  const nc=document.createElement('canvas');nc.width=nc.height=128;const nx=nc.getContext('2d');const ni=nx.createImageData(128,128);let seed=73129;
  for(let i=0;i<16384;i++){seed=(seed*1664525+1013904223)>>>0;const n=166+((seed>>>24)&71),j=i*4;ni.data[j]=n;ni.data[j+1]=n;ni.data[j+2]=n;ni.data[j+3]=255}
  nx.putImageData(ni,0,0);const castNoise=new THREE.CanvasTexture(nc);castNoise.wrapS=castNoise.wrapT=THREE.RepeatWrapping;castNoise.repeat.set(8,8);castNoise.minFilter=THREE.LinearFilter;castNoise.magFilter=THREE.LinearFilter;
  function castGrain(m,bump=.14){if(!m)return;m.roughnessMap=castNoise;m.bumpMap=castNoise;m.bumpScale=bump;m.needsUpdate=true}

  // Darker cast body + bright machined edges gives the same material hierarchy as the reference.
  tunePhysical(refM.cast,{color:0x5d666c,roughness:.44,metalness:.78,clearcoat:.07,clearcoatRoughness:.50,envMapIntensity:.96});
  tunePhysical(refM.castDark,{color:0x171c20,roughness:.54,metalness:.74,clearcoat:.04,clearcoatRoughness:.58,envMapIntensity:.78});
  tunePhysical(refM.alloy,{color:0x9fa8ae,roughness:.29,metalness:.90,clearcoat:.18,clearcoatRoughness:.27,envMapIntensity:1.20});
  tunePhysical(refM.machined,{color:0xdde4e8,roughness:.085,metalness:1,clearcoat:.40,clearcoatRoughness:.09,envMapIntensity:1.72});
  tunePhysical(refM.crank,{color:0x24292d,roughness:.20,metalness:1,clearcoat:.14,clearcoatRoughness:.22,envMapIntensity:1.27});
  tunePhysical(refM.brass,{color:0xc08a3e,roughness:.20,metalness:.96,clearcoat:.18,clearcoatRoughness:.19,envMapIntensity:1.35});
  tunePhysical(refM.copper,{color:0xa35f32,roughness:.27,metalness:.93,clearcoat:.08,clearcoatRoughness:.31,envMapIntensity:1.20});
  tunePhysical(refM.black,{color:0x07090b,roughness:.80,metalness:.24,envMapIntensity:.36});
  tunePhysical(refM.rubber,{color:0x020304,roughness:.97,metalness:.01,envMapIntensity:.08});
  castGrain(refM.cast,.15);castGrain(refM.castDark,.17);
  refM.cut.color.setHex(0xff3025);refM.cut.opacity=1;refM.cut.needsUpdate=true;

  if(typeof m22!=='undefined'){
    tunePhysical(m22.dark,{color:0x1c2226,roughness:.48,metalness:.81,clearcoat:.07,clearcoatRoughness:.45,envMapIntensity:.84});
    tunePhysical(m22.iron,{color:0x3c3632,roughness:.52,metalness:.78,envMapIntensity:.82});
    tunePhysical(m22.alloy,{color:0x9ca6ab,roughness:.30,metalness:.90,clearcoat:.17,clearcoatRoughness:.27,envMapIntensity:1.16});
    tunePhysical(m22.steel,{color:0xd2d9dd,roughness:.11,metalness:1,clearcoat:.32,clearcoatRoughness:.10,envMapIntensity:1.56});
    tunePhysical(m22.bronze,{color:0xb87e34,roughness:.21,metalness:.95,envMapIntensity:1.29});
    tunePhysical(m22.hose,{color:0x040608,roughness:.93,metalness:.03,envMapIntensity:.11});
    castGrain(m22.dark,.13);castGrain(m22.iron,.15);
  }
  if(typeof coverMat!=='undefined')tunePhysical(coverMat,{color:0x343b40,roughness:.40,metalness:.83,clearcoat:.08,clearcoatRoughness:.39,envMapIntensity:.88});
  if(typeof railBracketMat!=='undefined')tunePhysical(railBracketMat,{color:0xa27e45,roughness:.25,metalness:.90,envMapIntensity:1.19});

  // Existing mesh traversal is retained; it was already exercised by the validated PBR build.
  scene.traverse(o=>{if(!o.isMesh)return;const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(!m||!(m.isMeshStandardMaterial||m.isMeshPhysicalMaterial))continue;if('envMapIntensity'in m&&m.envMapIntensity===1)m.envMapIntensity=m.transparent?.34:(m.metalness>.75?1.12:.58);m.dithering=true;m.needsUpdate=true}});
  if(typeof studioFloor!=='undefined')tunePhysical(studioFloor.material,{color:0x010305,roughness:.88,metalness:.04,clearcoat:.02,clearcoatRoughness:.80,envMapIntensity:.10});

  const sc=document.createElement('canvas');sc.width=512;sc.height=256;const sx=sc.getContext('2d');const sg=sx.createRadialGradient(256,132,12,256,132,238);sg.addColorStop(0,'rgba(0,0,0,.94)');sg.addColorStop(.42,'rgba(0,0,0,.52)');sg.addColorStop(.78,'rgba(0,0,0,.13)');sg.addColorStop(1,'rgba(0,0,0,0)');sx.fillStyle=sg;sx.fillRect(0,0,512,256);const shadowTex=new THREE.CanvasTexture(sc);shadowTex.minFilter=THREE.LinearFilter;shadowTex.magFilter=THREE.LinearFilter;const contactShadow=new THREE.Mesh(new THREE.PlaneGeometry(920,500),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,opacity:.73,depthWrite:false,color:0x000000}));contactShadow.name='Studio Contact Shadow';contactShadow.rotation.x=-Math.PI/2;contactShadow.position.set(0,-90.6,20);contactShadow.renderOrder=1;scene.add(contactShadow);

  let vignette=document.getElementById('v25StudioVignette');if(!vignette){vignette=document.createElement('div');vignette.id='v25StudioVignette';vignette.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:1;background:radial-gradient(ellipse at 52% 43%,rgba(0,0,0,0) 38%,rgba(0,0,0,.08) 62%,rgba(0,0,0,.50) 100%)';viewport.appendChild(vignette)}
  const badge=document.querySelector('.qualityBadge');if(badge)badge.textContent='V25 · HIGH-CONTRAST STUDIO PBR';
  let hemiMax=0;for(const o of scene.children){if(o.type==='HemisphereLight')hemiMax=Math.max(hemiMax,o.intensity)}
  window.__v25VisualDebug={enabled:true,environment:!!scene.environment,exposure:renderer.toneMappingExposure,machinedRoughness:refM.machined.roughness,machinedEnv:refM.machined.envMapIntensity,castRoughness:refM.cast.roughness,brassMetalness:refM.brass.metalness,contactShadow:!!contactShadow,vignette:!!vignette,castMicrotexture:!!refM.cast.bumpMap,hemisphereMax,cameraPosition:camera.position.toArray(),cameraTarget:controls.target.toArray(),cameraFov:camera.fov};
})();