// === V25 STUDIO PBR LIGHTING + MATERIAL PASS ===
// Visual-only patch: preserves mechanics, cutaway and exploded-view state machines.
(function applyV25StudioPBR(){
  // Let the CSS radial backdrop show through the transparent WebGL canvas.
  scene.background=null;
  scene.fog.color.setHex(0x02070c);
  scene.fog.density=0.00013;
  viewport.style.background='radial-gradient(ellipse at 52% 39%,#183149 0%,#0a1723 38%,#050c13 67%,#010407 100%)';

  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=isMobileView?1.12:1.19;
  renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;

  // Procedural cubemap: broad cool/warm softboxes create readable reflections on metal
  // without any network HDRI dependency.
  function studioFace(kind){
    const c=document.createElement('canvas');c.width=c.height=128;
    const x=c.getContext('2d');
    const base=x.createLinearGradient(0,0,128,128);
    base.addColorStop(0,kind==='warm'?'#261a12':kind==='cool'?'#0a1725':'#10161d');
    base.addColorStop(.55,'#05090d');base.addColorStop(1,'#010305');x.fillStyle=base;x.fillRect(0,0,128,128);
    const glow=x.createRadialGradient(64,40,4,64,48,76);
    glow.addColorStop(0,kind==='warm'?'rgba(255,218,174,.72)':kind==='cool'?'rgba(163,211,255,.72)':'rgba(236,245,255,.70)');
    glow.addColorStop(.30,kind==='warm'?'rgba(225,160,94,.22)':kind==='cool'?'rgba(80,151,225,.22)':'rgba(190,215,235,.20)');
    glow.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=glow;x.fillRect(0,0,128,128);
    // softbox strips become long, high-contrast highlights on polished parts
    const strip=x.createLinearGradient(0,0,128,0);
    strip.addColorStop(0,'rgba(255,255,255,0)');
    strip.addColorStop(.40,'rgba(255,255,255,.05)');
    strip.addColorStop(.48,kind==='warm'?'rgba(255,229,198,.64)':kind==='cool'?'rgba(205,232,255,.68)':'rgba(255,255,255,.70)');
    strip.addColorStop(.55,'rgba(255,255,255,.08)');strip.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=strip;x.fillRect(0,12,128,104);
    return c;
  }
  const studioEnv=new THREE.CubeTexture([
    studioFace('warm'),studioFace('cool'),studioFace('neutral'),
    studioFace('neutral'),studioFace('neutral'),studioFace('cool')
  ]);
  studioEnv.encoding=THREE.sRGBEncoding;studioEnv.needsUpdate=true;
  scene.environment=studioEnv;

  // Re-balance the already existing light rig rather than stacking excessive light energy.
  key.color.setHex(0xfff0dc);key.intensity=1.62;key.position.set(560,790,610);
  key.shadow.mapSize.set(isMobileView?1536:3072,isMobileView?1536:3072);
  key.shadow.camera.left=-760;key.shadow.camera.right=760;key.shadow.camera.top=820;key.shadow.camera.bottom=-760;
  key.shadow.bias=-0.00012;key.shadow.normalBias=.018;
  rim.color.setHex(0x70b9ff);rim.intensity=1.24;rim.position.set(-720,470,-560);
  warm.color.setHex(0xffaf74);warm.intensity=.46;warm.distance=1350;warm.position.set(430,360,420);
  frontFill.color.setHex(0xe9f5ff);frontFill.intensity=.38;frontFill.position.set(-120,430,1050);
  lowFill.intensity=.045;
  if(typeof softTop!=='undefined'){softTop.intensity=.24;softTop.color.setHex(0xdcecff);}
  if(typeof edgeLight22!=='undefined'){edgeLight22.intensity=.34;edgeLight22.color.setHex(0x6dbdff);}
  const topSoft=new THREE.DirectionalLight(0xeaf4ff,.58);topSoft.position.set(-120,980,180);scene.add(topSoft);
  const warmKick=new THREE.DirectionalLight(0xffbd82,.34);warmKick.position.set(820,260,-250);scene.add(warmKick);
  const coolKick=new THREE.DirectionalLight(0x63aaff,.28);coolKick.position.set(-820,260,260);scene.add(coolKick);

  function tunePhysical(m,opt){
    if(!m)return;
    if(opt.color!==undefined)m.color.setHex(opt.color);
    if(opt.roughness!==undefined)m.roughness=opt.roughness;
    if(opt.metalness!==undefined)m.metalness=opt.metalness;
    if('clearcoat' in m && opt.clearcoat!==undefined)m.clearcoat=opt.clearcoat;
    if('clearcoatRoughness' in m && opt.clearcoatRoughness!==undefined)m.clearcoatRoughness=opt.clearcoatRoughness;
    if('envMapIntensity' in m)m.envMapIntensity=opt.envMapIntensity===undefined?1.35:opt.envMapIntensity;
    m.dithering=true;m.needsUpdate=true;
  }

  // Main visible V20 digital-twin palette: cast / machined / dark steel / brass are deliberately separated.
  tunePhysical(refM.cast,{color:0x7f878c,roughness:.36,metalness:.82,clearcoat:.12,clearcoatRoughness:.42,envMapIntensity:1.30});
  tunePhysical(refM.castDark,{color:0x22272b,roughness:.46,metalness:.80,clearcoat:.08,clearcoatRoughness:.50,envMapIntensity:1.06});
  tunePhysical(refM.alloy,{color:0xc7ced2,roughness:.19,metalness:.94,clearcoat:.30,clearcoatRoughness:.18,envMapIntensity:1.58});
  tunePhysical(refM.machined,{color:0xf0f2f3,roughness:.075,metalness:1,clearcoat:.50,clearcoatRoughness:.08,envMapIntensity:1.86});
  tunePhysical(refM.crank,{color:0x303438,roughness:.14,metalness:1,clearcoat:.20,clearcoatRoughness:.15,envMapIntensity:1.50});
  tunePhysical(refM.brass,{color:0xb9843f,roughness:.17,metalness:.96,clearcoat:.24,clearcoatRoughness:.16,envMapIntensity:1.48});
  tunePhysical(refM.copper,{color:0x9b6038,roughness:.24,metalness:.94,clearcoat:.10,clearcoatRoughness:.28,envMapIntensity:1.30});
  tunePhysical(refM.black,{color:0x090c0f,roughness:.72,metalness:.30,envMapIntensity:.55});
  tunePhysical(refM.rubber,{color:0x030405,roughness:.96,metalness:.01,envMapIntensity:.15});
  refM.cut.color.setHex(0xff392d);refM.cut.opacity=1;refM.cut.needsUpdate=true;

  if(typeof m22!=='undefined'){
    tunePhysical(m22.dark,{color:0x252b30,roughness:.39,metalness:.86,clearcoat:.12,clearcoatRoughness:.36,envMapIntensity:1.14});
    tunePhysical(m22.iron,{color:0x4a413b,roughness:.45,metalness:.82,envMapIntensity:1.08});
    tunePhysical(m22.alloy,{color:0xc1c9cd,roughness:.20,metalness:.94,clearcoat:.28,clearcoatRoughness:.18,envMapIntensity:1.54});
    tunePhysical(m22.steel,{color:0xe2e6e8,roughness:.09,metalness:1,clearcoat:.42,clearcoatRoughness:.08,envMapIntensity:1.78});
    tunePhysical(m22.bronze,{color:0xb27f39,roughness:.18,metalness:.95,envMapIntensity:1.42});
    tunePhysical(m22.hose,{color:0x06080a,roughness:.90,metalness:.04,envMapIntensity:.18});
  }
  if(typeof coverMat!=='undefined')tunePhysical(coverMat,{color:0x454c51,roughness:.30,metalness:.88,clearcoat:.14,clearcoatRoughness:.30,envMapIntensity:1.16});
  if(typeof railBracketMat!=='undefined')tunePhysical(railBracketMat,{color:0x9a8151,roughness:.23,metalness:.90,envMapIntensity:1.30});

  // Ensure all physically shaded meshes participate in the studio environment.
  scene.traverse(o=>{
    if(!o.isMesh)return;
    const mats=Array.isArray(o.material)?o.material:[o.material];
    for(const m of mats){
      if(!m || !(m.isMeshStandardMaterial||m.isMeshPhysicalMaterial))continue;
      if('envMapIntensity' in m && m.envMapIntensity===1){
        m.envMapIntensity=m.transparent?.45:(m.metalness>.75?1.42:.72);
      }
      m.dithering=true;m.needsUpdate=true;
    }
  });

  // Dark satin floor + soft contact patch. It reads as AO/contact shadow without post-processing.
  if(typeof studioFloor!=='undefined'){
    tunePhysical(studioFloor.material,{color:0x06090c,roughness:.40,metalness:.38,clearcoat:.16,clearcoatRoughness:.42,envMapIntensity:.52});
  }
  const sc=document.createElement('canvas');sc.width=512;sc.height=256;const sx=sc.getContext('2d');
  const sg=sx.createRadialGradient(256,132,12,256,132,238);sg.addColorStop(0,'rgba(0,0,0,.92)');sg.addColorStop(.42,'rgba(0,0,0,.48)');sg.addColorStop(.78,'rgba(0,0,0,.12)');sg.addColorStop(1,'rgba(0,0,0,0)');sx.fillStyle=sg;sx.fillRect(0,0,512,256);
  const shadowTex=new THREE.CanvasTexture(sc);shadowTex.minFilter=THREE.LinearFilter;shadowTex.magFilter=THREE.LinearFilter;
  const contactShadow=new THREE.Mesh(new THREE.PlaneGeometry(920,500),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,opacity:.72,depthWrite:false,color:0x000000}));
  contactShadow.name='Studio Contact Shadow';contactShadow.rotation.x=-Math.PI/2;contactShadow.position.set(0,-90.6,20);contactShadow.renderOrder=1;scene.add(contactShadow);

  // Subtle photographic vignette, outside the canvas rendering cost.
  let vignette=document.getElementById('v25StudioVignette');
  if(!vignette){vignette=document.createElement('div');vignette.id='v25StudioVignette';vignette.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:1;background:radial-gradient(ellipse at 52% 43%,rgba(0,0,0,0) 34%,rgba(0,0,0,.08) 60%,rgba(0,0,0,.48) 100%)';viewport.appendChild(vignette);}
  const badge=document.querySelector('.qualityBadge');if(badge)badge.textContent='V25 · STUDIO PBR · ENV REFLECTIONS';

  window.__v25VisualDebug={
    enabled:true,
    environment:!!scene.environment,
    exposure:renderer.toneMappingExposure,
    machinedRoughness:refM.machined.roughness,
    machinedEnv:refM.machined.envMapIntensity,
    castRoughness:refM.cast.roughness,
    brassMetalness:refM.brass.metalness,
    contactShadow:!!contactShadow,
    vignette:!!vignette
  };
})();
