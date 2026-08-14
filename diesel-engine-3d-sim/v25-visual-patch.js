// === V25 STUDIO PBR LIGHTING + MATERIAL PASS ===
// Visual-only patch: preserves mechanics, cutaway and exploded-view state machines.
(function applyV25StudioPBR(){
  scene.background=null;
  scene.fog.color.setHex(0x02070c);
  scene.fog.density=0.00013;
  viewport.style.background='radial-gradient(ellipse at 52% 39%,#183149 0%,#0a1723 38%,#050c13 67%,#010407 100%)';

  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=isMobileView?1.08:1.04;
  renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;

  // Wider framing only; mobile camera remains unchanged.
  if(!isMobileView){
    camera.position.set(300,395,2240);
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

  // This is the exact lighting topology already validated by mobile Chromium.
  key.color.setHex(0xfff0dc);key.intensity=1.46;key.position.set(560,790,610);
  key.shadow.mapSize.set(isMobileView?1536:3072,isMobileView?1536:3072);key.shadow.camera.left=-760;key.shadow.camera.right=760;key.shadow.camera.top=820;key.shadow.camera.bottom=-760;key.shadow.bias=-0.00012;key.shadow.normalBias=.018;
  rim.color.setHex(0x70b9ff);rim.intensity=1.14;rim.position.set(-720,470,-560);
  warm.color.setHex(0xffaf74);warm.intensity=.38;warm.distance=1350;warm.position.set(430,360,420);
  frontFill.color.setHex(0xe9f5ff);frontFill.intensity=.34;frontFill.position.set(-120,430,1050);lowFill.intensity=.04;
  if(typeof softTop!=='undefined'){softTop.intensity=.21;softTop.color.setHex(0xdcecff)}
  if(typeof edgeLight22!=='undefined'){edgeLight22.intensity=.31;edgeLight22.color.setHex(0x6dbdff)}
  const topSoft=new THREE.DirectionalLight(0xeaf4ff,.48);topSoft.position.set(-120,980,180);scene.add(topSoft);
  const warmKick=new THREE.DirectionalLight(0xffbd82,.29);warmKick.position.set(820,260,-250);scene.add(warmKick);
  const coolKick=new THREE.DirectionalLight(0x63aaff,.25);coolKick.position.set(-820,260,260);scene.add(coolKick);

  function tunePhysical(m,opt){if(!m)return;if(opt.color!==undefined)m.color.setHex(opt.color);if(opt.roughness!==undefined)m.roughness=opt.roughness;if(opt.metalness!==undefined)m.metalness=opt.metalness;if('clearcoat' in m&&opt.clearcoat!==undefined)m.clearcoat=opt.clearcoat;if('clearcoatRoughness' in m&&opt.clearcoatRoughness!==undefined)m.clearcoatRoughness=opt.clearcoatRoughness;if('envMapIntensity' in m)m.envMapIntensity=opt.envMapIntensity===undefined?1.25:opt.envMapIntensity;m.dithering=true;m.needsUpdate=true}

  // Deterministic cast-metal microtexture from the previously validated pass.
  const nc=document.createElement('canvas');nc.width=nc.height=128;const nx=nc.getContext('2d');const ni=nx.createImageData(128,128);let seed=73129;
  for(let i=0;i<16384;i++){seed=(seed*1664525+1013904223)>>>0;const n=174+((seed>>>24)&63),j=i*4;ni.data[j]=n;ni.data[j+1]=n;ni.data[j+2]=n;ni.data[j+3]=255}
  nx.putImageData(ni,0,0);const castNoise=new THREE.CanvasTexture(nc);castNoise.wrapS=castNoise.wrapT=THREE.RepeatWrapping;castNoise.repeat.set(7,7);castNoise.minFilter=THREE.LinearFilter;castNoise.magFilter=THREE.LinearFilter;
  function castGrain(m,bump=.14){if(!m)return;m.roughnessMap=castNoise;m.bumpMap=castNoise;m.bumpScale=bump;m.needsUpdate=true}

  // Pure material-value changes: darker cast body, bright machined edges, warmer brass/copper.
  tunePhysical(refM.cast,{color:0x5e686e,roughness:.44,metalness:.78,clearcoat:.08,clearcoatRoughness:.49,envMapIntensity:.98});
  tunePhysical(refM.castDark,{color:0x1a2024,roughness:.52,metalness:.75,clearcoat:.05,clearcoatRoughness:.56,envMapIntensity:.82});
  tunePhysical(refM.alloy,{color:0xa3adb2,roughness:.28,metalness:.90,clearcoat:.19,clearcoatRoughness:.25,envMapIntensity:1.23});
  tunePhysical(refM.machined,{color:0xe1e6e9,roughness:.085,metalness:1,clearcoat:.40,clearcoatRoughness:.09,envMapIntensity:1.72});
  tunePhysical(refM.crank,{color:0x292e32,roughness:.19,metalness:1,clearcoat:.16,clearcoatRoughness:.20,envMapIntensity:1.33});
  tunePhysical(refM.brass,{color:0xc18a3d,roughness:.20,metalness:.96,clearcoat:.18,clearcoatRoughness:.19,envMapIntensity:1.35});
  tunePhysical(refM.copper,{color:0xa25f34,roughness:.27,metalness:.93,clearcoat:.08,clearcoatRoughness:.31,envMapIntensity:1.20});
  tunePhysical(refM.black,{color:0x080b0e,roughness:.78,metalness:.26,envMapIntensity:.42});
  tunePhysical(refM.rubber,{color:0x030405,roughness:.96,metalness:.01,envMapIntensity:.10});
  castGrain(refM.cast,.14);castGrain(refM.castDark,.16);
  refM.cut.color.setHex(0xff342a);refM.cut.opacity=1;refM.cut.needsUpdate=true;

  if(typeof m22!=='undefined'){
    tunePhysical(m22.dark,{color:0x20262a,roughness:.46,metalness:.82,clearcoat:.08,clearcoatRoughness:.42,envMapIntensity:.92});
    tunePhysical(m22.iron,{color:0x423a35,roughness:.50,metalness:.79,envMapIntensity:.90});
    tunePhysical(m22.alloy,{color:0xa5afb4,roughness:.29,metalness:.90,clearcoat:.18,clearcoatRoughness:.25,envMapIntensity:1.22});
    tunePhysical(m22.steel,{color:0xd4dade,roughness:.11,metalness:1,clearcoat:.34,clearcoatRoughness:.10,envMapIntensity:1.58});
    tunePhysical(m22.bronze,{color:0xb77d34,roughness:.22,metalness:.95,envMapIntensity:1.29});
    tunePhysical(m22.hose,{color:0x050709,roughness:.92,metalness:.03,envMapIntensity:.13});
    castGrain(m22.dark,.12);castGrain(m22.iron,.14);
  }
  if(typeof coverMat!=='undefined')tunePhysical(coverMat,{color:0x394147,roughness:.38,metalness:.84,clearcoat:.09,clearcoatRoughness:.37,envMapIntensity:.95});
  if(typeof railBracketMat!=='undefined')tunePhysical(railBracketMat,{color:0xa17f48,roughness:.26,metalness:.89,envMapIntensity:1.19});

  scene.traverse(o=>{if(!o.isMesh)return;const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(!m||!(m.isMeshStandardMaterial||m.isMeshPhysicalMaterial))continue;if('envMapIntensity'in m&&m.envMapIntensity===1)m.envMapIntensity=m.transparent?.40:(m.metalness>.75?1.26:.66);m.dithering=true;m.needsUpdate=true}});
  if(typeof studioFloor!=='undefined')tunePhysical(studioFloor.material,{color:0x020508,roughness:.82,metalness:.08,clearcoat:.04,clearcoatRoughness:.72,envMapIntensity:.16});

  const sc=document.createElement('canvas');sc.width=512;sc.height=256;const sx=sc.getContext('2d');const sg=sx.createRadialGradient(256,132,12,256,132,238);sg.addColorStop(0,'rgba(0,0,0,.92)');sg.addColorStop(.42,'rgba(0,0,0,.48)');sg.addColorStop(.78,'rgba(0,0,0,.12)');sg.addColorStop(1,'rgba(0,0,0,0)');sx.fillStyle=sg;sx.fillRect(0,0,512,256);const shadowTex=new THREE.CanvasTexture(sc);shadowTex.minFilter=THREE.LinearFilter;shadowTex.magFilter=THREE.LinearFilter;const contactShadow=new THREE.Mesh(new THREE.PlaneGeometry(920,500),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,opacity:.72,depthWrite:false,color:0x000000}));contactShadow.name='Studio Contact Shadow';contactShadow.rotation.x=-Math.PI/2;contactShadow.position.set(0,-90.6,20);contactShadow.renderOrder=1;scene.add(contactShadow);

  let vignette=document.getElementById('v25StudioVignette');if(!vignette){vignette=document.createElement('div');vignette.id='v25StudioVignette';vignette.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:1;background:radial-gradient(ellipse at 52% 43%,rgba(0,0,0,0) 38%,rgba(0,0,0,.07) 62%,rgba(0,0,0,.46) 100%)';viewport.appendChild(vignette)}
  const badge=document.querySelector('.qualityBadge');if(badge)badge.textContent='V25 · REFERENCE STUDIO PBR';
  window.__v25VisualDebug={enabled:true,environment:!!scene.environment,exposure:renderer.toneMappingExposure,machinedRoughness:refM.machined.roughness,machinedEnv:refM.machined.envMapIntensity,castRoughness:refM.cast.roughness,brassMetalness:refM.brass.metalness,contactShadow:!!contactShadow,vignette:!!vignette,castMicrotexture:!!refM.cast.bumpMap,cameraPosition:camera.position.toArray(),cameraTarget:controls.target.toArray(),cameraFov:camera.fov};
})();