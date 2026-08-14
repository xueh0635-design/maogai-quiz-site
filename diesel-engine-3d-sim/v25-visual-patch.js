// === V25 STUDIO PBR LIGHTING + MATERIAL PASS ===
// Visual-only patch: preserves mechanics, cutaway and exploded-view state machines.
(function applyV25StudioPBR(){
  scene.background=null;
  scene.fog.color.setHex(0x02070c);
  scene.fog.density=0.00013;
  viewport.style.background='radial-gradient(ellipse at 52% 39%,#183149 0%,#0a1723 38%,#050c13 67%,#010407 100%)';

  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=isMobileView?1.08:1.06;
  renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;

  // Full-engine framing. The base controller used maxDistance=2200, so lift that cap first.
  if(!isMobileView){
    controls.maxDistance=4200;
    camera.position.set(310,390,2300);
    controls.target.set(0,295,0);
    camera.fov=31;
    camera.updateProjectionMatrix();
    controls.update();
  }

  function studioFace(kind){
    const c=document.createElement('canvas');c.width=c.height=128;
    const x=c.getContext('2d');
    const base=x.createLinearGradient(0,0,128,128);
    base.addColorStop(0,kind==='warm'?'#261a12':kind==='cool'?'#0a1725':'#10161d');
    base.addColorStop(.55,'#05090d');base.addColorStop(1,'#010305');x.fillStyle=base;x.fillRect(0,0,128,128);
    const glow=x.createRadialGradient(64,40,4,64,48,76);
    glow.addColorStop(0,kind==='warm'?'rgba(255,218,174,.66)':kind==='cool'?'rgba(163,211,255,.66)':'rgba(236,245,255,.64)');
    glow.addColorStop(.30,kind==='warm'?'rgba(225,160,94,.20)':kind==='cool'?'rgba(80,151,225,.20)':'rgba(190,215,235,.18)');
    glow.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=glow;x.fillRect(0,0,128,128);
    const strip=x.createLinearGradient(0,0,128,0);
    strip.addColorStop(0,'rgba(255,255,255,0)');strip.addColorStop(.40,'rgba(255,255,255,.04)');
    strip.addColorStop(.48,kind==='warm'?'rgba(255,229,198,.54)':kind==='cool'?'rgba(205,232,255,.58)':'rgba(255,255,255,.60)');
    strip.addColorStop(.55,'rgba(255,255,255,.07)');strip.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=strip;x.fillRect(0,12,128,104);return c;
  }
  const studioEnv=new THREE.CubeTexture([studioFace('warm'),studioFace('cool'),studioFace('neutral'),studioFace('neutral'),studioFace('neutral'),studioFace('cool')]);
  studioEnv.encoding=THREE.sRGBEncoding;studioEnv.needsUpdate=true;scene.environment=studioEnv;

  // Base scene ambient fill was very high. Keep enough for shadow detail, but restore real contrast.
  for(const o of scene.children){
    if(o.type==='HemisphereLight')o.intensity=Math.min(o.intensity,.48);
    else if(o.type==='AmbientLight')o.intensity=Math.min(o.intensity,.04);
  }

  // Primary studio rig.
  key.color.setHex(0xfff0dc);key.intensity=1.46;key.position.set(560,790,610);
  key.shadow.mapSize.set(isMobileView?1536:3072,isMobileView?1536:3072);key.shadow.camera.left=-760;key.shadow.camera.right=760;key.shadow.camera.top=820;key.shadow.camera.bottom=-760;key.shadow.bias=-0.00012;key.shadow.normalBias=.018;
  rim.color.setHex(0x70b9ff);rim.intensity=1.02;rim.position.set(-720,470,-560);
  warm.color.setHex(0xffaf74);warm.intensity=.34;warm.distance=1350;warm.position.set(430,360,420);
  frontFill.color.setHex(0xe9f5ff);frontFill.intensity=.24;frontFill.position.set(-120,430,1050);lowFill.intensity=.028;
  if(typeof softTop!=='undefined'){softTop.intensity=.16;softTop.color.setHex(0xdcecff)}
  if(typeof edgeLight22!=='undefined'){edgeLight22.intensity=.27;edgeLight22.color.setHex(0x6dbdff)}

  // V20 created a second complete light rig (refKey/refFill/refRim/refWarm). Balance it instead of stacking it at full power.
  if(typeof refKey!=='undefined'){refKey.intensity=.78;refKey.color.setHex(0xfff0df);refKey.position.set(420,820,720)}
  if(typeof refFill!=='undefined'){refFill.intensity=.16;refFill.color.setHex(0xd8edff)}
  if(typeof refRim!=='undefined'){refRim.intensity=.46;refRim.color.setHex(0x4caaff)}
  if(typeof refWarm!=='undefined'){refWarm.intensity=.28;refWarm.color.setHex(0xffb875)}

  const topSoft=new THREE.DirectionalLight(0xeaf4ff,.34);topSoft.position.set(-120,980,180);scene.add(topSoft);
  const warmKick=new THREE.DirectionalLight(0xffbd82,.23);warmKick.position.set(820,260,-250);scene.add(warmKick);
  const coolKick=new THREE.DirectionalLight(0x63aaff,.21);coolKick.position.set(-820,260,260);scene.add(coolKick);

  function tunePhysical(m,opt){if(!m)return;if(opt.color!==undefined)m.color.setHex(opt.color);if(opt.roughness!==undefined)m.roughness=opt.roughness;if(opt.metalness!==undefined)m.metalness=opt.metalness;if('clearcoat' in m&&opt.clearcoat!==undefined)m.clearcoat=opt.clearcoat;if('clearcoatRoughness' in m&&opt.clearcoatRoughness!==undefined)m.clearcoatRoughness=opt.clearcoatRoughness;if('envMapIntensity' in m)m.envMapIntensity=opt.envMapIntensity===undefined?1.25:opt.envMapIntensity;m.dithering=true;m.needsUpdate=true}

  // Deterministic cast-metal microtexture: no external texture/HDRI download is required.
  const nc=document.createElement('canvas');nc.width=nc.height=128;const nx=nc.getContext('2d');const ni=nx.createImageData(128,128);let seed=73129;
  for(let i=0;i<16384;i++){seed=(seed*1664525+1013904223)>>>0;const n=174+((seed>>>24)&63),j=i*4;ni.data[j]=n;ni.data[j+1]=n;ni.data[j+2]=n;ni.data[j+3]=255}
  nx.putImageData(ni,0,0);const castNoise=new THREE.CanvasTexture(nc);castNoise.wrapS=castNoise.wrapT=THREE.RepeatWrapping;castNoise.repeat.set(7,7);castNoise.minFilter=THREE.LinearFilter;castNoise.magFilter=THREE.LinearFilter;
  function castGrain(m,bump=.14){if(!m)return;m.roughnessMap=castNoise;m.bumpMap=castNoise;m.bumpScale=bump;m.needsUpdate=true}

  // Material hierarchy: dark cast body, mid-grey alloy, bright machined faces, warm brass/copper.
  tunePhysical(refM.cast,{color:0x535e64,roughness:.47,metalness:.66,clearcoat:.06,clearcoatRoughness:.53,envMapIntensity:.80});
  tunePhysical(refM.castDark,{color:0x161c20,roughness:.57,metalness:.60,clearcoat:.03,clearcoatRoughness:.62,envMapIntensity:.60});
  tunePhysical(refM.alloy,{color:0x929da3,roughness:.32,metalness:.82,clearcoat:.15,clearcoatRoughness:.29,envMapIntensity:1.02});
  tunePhysical(refM.machined,{color:0xe1e6e9,roughness:.085,metalness:1,clearcoat:.40,clearcoatRoughness:.09,envMapIntensity:1.72});
  tunePhysical(refM.crank,{color:0x252a2e,roughness:.21,metalness:1,clearcoat:.14,clearcoatRoughness:.22,envMapIntensity:1.28});
  tunePhysical(refM.brass,{color:0xc58c3c,roughness:.20,metalness:.96,clearcoat:.18,clearcoatRoughness:.19,envMapIntensity:1.35});
  tunePhysical(refM.copper,{color:0xa86436,roughness:.27,metalness:.93,clearcoat:.08,clearcoatRoughness:.31,envMapIntensity:1.20});
  tunePhysical(refM.black,{color:0x07090c,roughness:.80,metalness:.22,envMapIntensity:.34});
  tunePhysical(refM.rubber,{color:0x020304,roughness:.97,metalness:.01,envMapIntensity:.08});
  castGrain(refM.cast,.15);castGrain(refM.castDark,.17);
  refM.cut.color.setHex(0xff342a);refM.cut.opacity=1;refM.cut.needsUpdate=true;

  if(typeof m22!=='undefined'){
    tunePhysical(m22.dark,{color:0x1b2226,roughness:.50,metalness:.68,clearcoat:.05,clearcoatRoughness:.48,envMapIntensity:.68});
    tunePhysical(m22.iron,{color:0x37322f,roughness:.54,metalness:.65,envMapIntensity:.66});
    tunePhysical(m22.alloy,{color:0x969fa4,roughness:.32,metalness:.82,clearcoat:.15,clearcoatRoughness:.29,envMapIntensity:1.02});
    tunePhysical(m22.steel,{color:0xd4dade,roughness:.11,metalness:1,clearcoat:.34,clearcoatRoughness:.10,envMapIntensity:1.58});
    tunePhysical(m22.bronze,{color:0xba7e32,roughness:.22,metalness:.95,envMapIntensity:1.29});
    tunePhysical(m22.hose,{color:0x040608,roughness:.94,metalness:.02,envMapIntensity:.09});
    castGrain(m22.dark,.13);castGrain(m22.iron,.15);
  }
  if(typeof coverMat!=='undefined')tunePhysical(coverMat,{color:0x323b40,roughness:.42,metalness:.70,clearcoat:.06,clearcoatRoughness:.42,envMapIntensity:.74});
  if(typeof railBracketMat!=='undefined')tunePhysical(railBracketMat,{color:0xa58247,roughness:.26,metalness:.89,envMapIntensity:1.19});

  scene.traverse(o=>{if(!o.isMesh)return;const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(!m||!(m.isMeshStandardMaterial||m.isMeshPhysicalMaterial))continue;if('envMapIntensity'in m&&m.envMapIntensity===1)m.envMapIntensity=m.transparent?.40:(m.metalness>.75?1.26:.66);m.dithering=true;m.needsUpdate=true}});

  // Target reference has a dark studio void, not a visible grey platform. Hide the V20 plane completely.
  if(typeof floor!=='undefined')floor.visible=false;
  if(typeof grid!=='undefined')grid.visible=false;
  if(typeof studioFloor!=='undefined')studioFloor.visible=false;

  // Keep a transparent contact patch so the engine still feels grounded against the dark background.
  const sc=document.createElement('canvas');sc.width=512;sc.height=256;const sx=sc.getContext('2d');const sg=sx.createRadialGradient(256,132,12,256,132,238);sg.addColorStop(0,'rgba(0,0,0,.92)');sg.addColorStop(.42,'rgba(0,0,0,.42)');sg.addColorStop(.78,'rgba(0,0,0,.08)');sg.addColorStop(1,'rgba(0,0,0,0)');sx.fillStyle=sg;sx.fillRect(0,0,512,256);const shadowTex=new THREE.CanvasTexture(sc);shadowTex.minFilter=THREE.LinearFilter;shadowTex.magFilter=THREE.LinearFilter;const contactShadow=new THREE.Mesh(new THREE.PlaneGeometry(1040,560),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,opacity:.58,depthWrite:false,color:0x000000}));contactShadow.name='Studio Contact Shadow';contactShadow.rotation.x=-Math.PI/2;contactShadow.position.set(0,-90.6,20);contactShadow.renderOrder=1;scene.add(contactShadow);

  let vignette=document.getElementById('v25StudioVignette');if(!vignette){vignette=document.createElement('div');vignette.id='v25StudioVignette';vignette.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:1;background:radial-gradient(ellipse at 52% 43%,rgba(0,0,0,0) 39%,rgba(0,0,0,.07) 63%,rgba(0,0,0,.47) 100%)';viewport.appendChild(vignette)}
  const badge=document.querySelector('.qualityBadge');if(badge)badge.textContent='V25 · REFERENCE STUDIO PBR';
  let hemiMax=0;for(const o of scene.children){if(o.type==='HemisphereLight')hemiMax=Math.max(hemiMax,o.intensity)}
  window.__v25VisualDebug={enabled:true,environment:!!scene.environment,exposure:renderer.toneMappingExposure,machinedRoughness:refM.machined.roughness,machinedEnv:refM.machined.envMapIntensity,castRoughness:refM.cast.roughness,brassMetalness:refM.brass.metalness,contactShadow:!!contactShadow,vignette:!!vignette,castMicrotexture:!!refM.cast.bumpMap,hemisphereMax:hemiMax,cameraPosition:camera.position.toArray(),cameraTarget:controls.target.toArray(),cameraFov:camera.fov,cameraMaxDistance:controls.maxDistance,studioFloorVisible:typeof studioFloor!=='undefined'?studioFloor.visible:null};
})();