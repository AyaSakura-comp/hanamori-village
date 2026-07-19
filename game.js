// Hanamori Village — HD-2D: 3D stone town with pixel-art billboards (Babylon.js).
const WORLD = { w: 20, h: 72 };
const MOVE_SPEED=280;
const CHARACTER_SCALE=1.75;
// iPhone 14 Pro Max native panel, rotated to landscape (Apple: 2796-by-1290 pixels).
const LANDSCAPE_RENDER = { width: 2796, height: 1290 };
const MOBILE_RENDER = matchMedia('(pointer: coarse)').matches;
const FRAME_INTERVAL = 1000 / 60;
// Horizontal side-scroller: the street runs along X; Z is shallow depth. Districts sit left→right.
const ZONES = [{ name:'河畔商店街', x: -24 }, { name:'花守中央廣場', x: 0 }, { name:'南風村口', x: 24 }];
const npcs = [
 { x: 4, z: 1.4, name:'莉亞',face:0, lines: ['旅行者，你好！這裡是花守村，我是照顧花圃的莉亞。', '沿著中央石板路一直走，就能抵達河畔商店街。', '三條街道都和廣場相連，所以不用擔心迷路。', '等星鈴花盛開時，我請你喝村裡最好喝的蜂蜜茶！'] },
 { x: 19, z: 0.2, name:'米洛',face:1, lines: ['你就是剛來的旅行者吧？我是木匠米洛。', '往東走這條寬路通往村口，兩旁都是新修好的木屋。', '沿著淺色石板走，便不會踩進居民的花圃。', '有空再來，我會替你做一雙更適合旅行的靴子。'] },
 { x: -9, z: 1.4, name:'莎婆婆',face:2, lines: ['呵呵，年輕人，你終於走到河畔來了。', '過橋後是麵包坊，清晨總能聞到蜂蜜麵包的香味。', '溪水不能直接走過去，要從中央石橋通行。', '記住道路不只是方向，也是村民一起生活的痕跡。'] },
 { x: -22, z: 0.6, name:'艾妲',face:3, lines: ['歡迎來到河畔麵包坊！我是店主艾妲。', '今天烤的是蜂蜜核桃麵包，香味連橋那頭都聞得到。', '莉亞說你正在認識村子，所以這一個送給你。', '下次帶朋友一起來，我會替你們留靠窗的位置！'] },
 { x: 14, z: 1.4, name:'凱恩',face:4, lines: ['站住……啊，是新來的旅行者。我是巡守凱恩。', '村裡很和平，但夜裡過橋還是要留意濕滑的石階。', '若看到圍籬損壞，請告訴我或木匠米洛。', '放心探索吧，我會守著通往村外的道路。'] },
 { x: -3, z: -0.4, name:'菲菲',face:5, lines: ['你也是來看廣場噴泉的嗎？我是菲菲！', '我每天都數水花，可是每次數到二十就忘記了。', '莎婆婆說，忘記的願望會變成河邊的小花。', '所以我決定再許一個願望：希望你明天也會來！'] }
];
const BUILDINGS=['guild','magic','alchemy','smithy','tavern','bakery','flower','chapel','home','clocktower','market'];
const occluders = [];   // foreground buildings that fade out when the player walks behind them
const streamedVisuals = [];
const streamedMaterialCache = new Map();
const STREAM_DISTANCE = 24; // preload textures just beyond the frame
const STREAM_RELEASE_DISTANCE = 32; // hysteresis prevents load/unload thrashing at district boundaries
const RENDER_DISTANCE = 18; // tighter camera budget: loaded objects outside this band do not render
let engine, scene, camera, player, shadowGenerator, activeNpc = null, line = 0, talking = false, vector = { x: 0, y: 0 }, origin = null, touchStart = null, direction = 'down', zoneIndex = -1, walkClock = 0;
let debugEnabled = false, debugYaw = 0, debugGesture = null;
const debugPointers = new Map();

// Camera geometry: Octopath-style side-on view, slight downward tilt, scrolls horizontally along X.
// view = vertical half-extent; landscape aspect widens the horizontal span automatically.
const CAM = { height: 6.9, back: 21, targetY: 2.4, targetZ: -0.8, view: 4.6 };

function material(name, color) { const m = new BABYLON.StandardMaterial(name, scene); m.diffuseColor = BABYLON.Color3.FromHexString(color); m.specularColor = BABYLON.Color3.Black(); return m; }
function pixelTexture(url) { const t = new BABYLON.Texture(url, scene, false, true, BABYLON.Texture.NEAREST_SAMPLINGMODE); t.hasAlpha = true; return t; }
function spriteMaterial(name, url) { const m = new BABYLON.StandardMaterial(name, scene); m.diffuseTexture = pixelTexture(url); m.opacityTexture = m.diffuseTexture; m.useAlphaFromDiffuseTexture = true; m.backFaceCulling = false; m.specularColor = BABYLON.Color3.Black(); m.emissiveColor = new BABYLON.Color3(.12, .12, .12); return m; }
function registerStreamedVisual(mesh, url, configure, variant = 'normal') { mesh.setEnabled(false); streamedVisuals.push({ mesh, url, configure, variant, loaded: false }); }
function cachedStreamedMaterial(item) {
 const key = `${item.url}:${item.variant}`;
 if (!streamedMaterialCache.has(key)) { const m = spriteMaterial(`stream-${key}`, item.url); if (item.configure) item.configure(m); streamedMaterialCache.set(key, m); }
 return streamedMaterialCache.get(key);
}
function updateAssetStreaming(force = false) {
 if (!player) return;
 for (const item of streamedVisuals) {
  const distance = Math.abs(item.mesh.position.x - player.position.x);
  if (distance <= STREAM_DISTANCE && !item.loaded) { item.mesh.material = cachedStreamedMaterial(item); item.mesh.setEnabled(true); item.loaded = true; }
  else if (distance > STREAM_RELEASE_DISTANCE && item.loaded) { item.mesh.setEnabled(false); item.mesh.material = null; item.loaded = false; }
  if (item.loaded) item.mesh.isVisible = Math.abs(item.mesh.position.x - camera.position.x) <= RENDER_DISTANCE;
 }
}
function box(name, x, y, z, w, h, d, mat, collision = false) { const mesh = BABYLON.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene); mesh.position.set(x, y, z); mesh.material = mat; mesh.checkCollisions = collision; mesh.receiveShadows = true; return mesh; }

// ---- Procedural pixel-art HD-2D textures (DynamicTexture canvases) ----
function makeCanvasTexture(name, size, draw, tile = true, smooth = false) {
 // Ground textures are heavily minified, so give them mipmaps + trilinear to avoid streak aliasing;
 // sprite/wall textures stay crisp nearest-neighbour.
 const t = new BABYLON.DynamicTexture(name, { width: size, height: size }, scene, smooth,
  smooth ? BABYLON.Texture.TRILINEAR_SAMPLINGMODE : BABYLON.Texture.NEAREST_SAMPLINGMODE);
 draw(t.getContext(), size); t.update();
 if (tile) { t.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE; t.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE; }
 if (smooth) t.anisotropicFilteringLevel = 8;   // kill grazing-angle streaks on the long road
 return t;
}
function texturedMaterial(name, size, draw, uScale = 1, vScale = 1, smooth = false) {
 const m = new BABYLON.StandardMaterial(name, scene);
 m.diffuseTexture = makeCanvasTexture(name + '-tex', size, draw, true, smooth);
 m.diffuseTexture.uScale = uScale; m.diffuseTexture.vScale = vScale;
 m.specularColor = BABYLON.Color3.Black();
 return m;
}
function rnd(seed) { const x = Math.sin(seed * 127.1) * 43758.5453; return x - Math.floor(x); }
function drawGrass(ctx, s) {
 ctx.fillStyle = '#5f8a3e'; ctx.fillRect(0, 0, s, s);
 for (let i = 0; i < 1400; i++) { const x = rnd(i + 1) * s, y = rnd(i + 7) * s, v = rnd(i * 3 + 2); ctx.fillStyle = v > .72 ? '#6f9a48' : v > .4 ? '#557d36' : '#4c722f'; ctx.fillRect(x | 0, y | 0, 2, 2 + (v > .9 ? 2 : 0)); }
 for (let i = 0; i < 22; i++) { const x = rnd(i + 40) * s, y = rnd(i + 90) * s, c = ['#e8d15a', '#e78fb0', '#f4f0e8', '#d98ce0'][i % 4]; ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, 2, 2); ctx.fillStyle = '#3f5f2a'; ctx.fillRect((x | 0), (y | 0) + 2, 1, 2); }
}
function drawCobble(ctx, s) {
 ctx.fillStyle = '#5b5750'; ctx.fillRect(0, 0, s, s);
 const cell = 22;
 for (let gy = 0, r = 0; gy < s; gy += cell, r++) for (let gx = (r % 2) * (cell / 2) - cell; gx < s; gx += cell) {
  const seed = (gx * 3 + gy * 7); const v = rnd(seed); const base = 150 + v * 26;
  const x = gx + 2, y = gy + 2, w = cell - 4, h = cell - 4;
  ctx.fillStyle = `rgb(${base - 34},${base - 40},${base - 48})`; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = `rgb(${base},${base - 6},${base - 16})`; ctx.fillRect(x + 1, y + 1, w - 2, h - 3);
  ctx.fillStyle = `rgb(${base + 22},${base + 16},${base + 4})`; ctx.fillRect(x + 2, y + 2, w - 4, 2);
 }
}
function drawRunePlaza(ctx, s) {
 drawCobble(ctx, s);
 const c = s / 2; ctx.strokeStyle = '#d9b25a'; ctx.lineWidth = 3; ctx.globalAlpha = .85;
 for (const rad of [s * .42, s * .32, s * .17]) { ctx.beginPath(); ctx.arc(c, c, rad, 0, Math.PI * 2); ctx.stroke(); }
 ctx.lineWidth = 2;
 for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(c + Math.cos(a) * s * .17, c + Math.sin(a) * s * .17); ctx.lineTo(c + Math.cos(a) * s * .42, c + Math.sin(a) * s * .42); ctx.stroke(); }
 ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 - Math.PI / 2; const px = c + Math.cos(a) * s * .3, py = c + Math.sin(a) * s * .3; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); ctx.stroke();
 ctx.globalAlpha = 1;
}
function drawStoneBrick(ctx, s) {
 ctx.fillStyle = '#3f3b34'; ctx.fillRect(0, 0, s, s);
 const bh = 16, bw = 32;
 for (let gy = 0, row = 0; gy < s; gy += bh, row++) for (let gx = (row % 2) * (bw / 2) - bw; gx < s; gx += bw) {
  const v = rnd(gx * 5 + gy * 11); const base = 120 + v * 34;
  const x = gx + 2, y = gy + 2, w = bw - 3, h = bh - 3;
  ctx.fillStyle = `rgb(${base - 30},${base - 34},${base - 40})`; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = `rgb(${base},${base - 8},${base - 20})`; ctx.fillRect(x, y, w, h - 2);
  ctx.fillStyle = `rgb(${base + 26},${base + 16},${base})`; ctx.fillRect(x, y, w, 2);
  ctx.fillStyle = `rgb(${base - 44},${base - 50},${base - 56})`; ctx.fillRect(x, y + h - 2, w, 2);
 }
}
function drawWood(ctx, s) {
 ctx.fillStyle = '#6b4629'; ctx.fillRect(0, 0, s, s);
 for (let y = 0; y < s; y += 16) { ctx.fillStyle = '#5a3a22'; ctx.fillRect(0, y, s, 2); for (let i = 0; i < s; i += 4) { const v = rnd(i + y); ctx.fillStyle = v > .5 ? '#79512f' : '#61401f'; ctx.fillRect(i, y + 3, 3, 12); } }
}
function drawWater(ctx, s) {
 ctx.fillStyle = '#2f7f9a'; ctx.fillRect(0, 0, s, s);
 for (let i = 0; i < 260; i++) { const x = rnd(i + 3) * s, y = rnd(i + 9) * s, v = rnd(i * 2 + 5); ctx.fillStyle = v > .8 ? '#8fd7e6' : v > .5 ? '#3f9bb5' : '#276b84'; ctx.fillRect(x | 0, y | 0, v > .8 ? 5 : 3, 2); }
}

// ---- Contact shadow: a soft dark disc laid flat on the ground under a sprite ----
let shadowMat = null;
function contactShadowMaterial() {
 if (shadowMat) return shadowMat;
 const t = new BABYLON.DynamicTexture('contact-shadow', { width: 64, height: 64 }, scene, false);
 const c = t.getContext(); const g = c.createRadialGradient(32, 32, 2, 32, 32, 30);
 g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(.6, 'rgba(0,0,0,0.28)'); g.addColorStop(1, 'rgba(0,0,0,0)');
 c.fillStyle = g; c.fillRect(0, 0, 64, 64); t.update();
 const m = new BABYLON.StandardMaterial('contact-shadow-mat', scene); m.diffuseTexture = t; m.opacityTexture = t; m.useAlphaFromDiffuseTexture = true;
 m.emissiveColor = BABYLON.Color3.Black(); m.disableLighting = true; m.specularColor = BABYLON.Color3.Black(); m.backFaceCulling = false;
 shadowMat = m; return m;
}
function contactShadow(x, z, rx, rz) {
 const p = BABYLON.MeshBuilder.CreateGround('cs', { width: rx, height: rz }, scene);
 p.position.set(x, 0.03, z); p.material = contactShadowMaterial(); p.isPickable = false; return p;
}

// 3D ground material driven by real seamless texture assets (diffuse + normal, optional AO).
// The normal map gives genuine per-stone relief under the directional sun — a true 3D floor, not a flat image.
function groundMaterial(name, uScale, vScale) {
 // Poly Haven cobblestone_floor_001 (CC0): real medieval cobbles with full PBR response.
 const m = new BABYLON.PBRMaterial(name, scene);
 const tex = (file, nonColor = false) => { const t = new BABYLON.Texture(`assets/textures/${file}`, scene, false, true, BABYLON.Texture.TRILINEAR_SAMPLINGMODE); t.uScale = uScale; t.vScale = vScale; t.wrapU = t.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE; t.anisotropicFilteringLevel = 8; if (nonColor) t.gammaSpace = false; return t; };
 m.albedoTexture = tex('medieval_cobble_color.jpg');
 m.bumpTexture = tex('medieval_cobble_normal.jpg', true); m.invertNormalMapY = true;
 m.bumpTexture.level = .9; m.useParallax = !MOBILE_RENDER; m.useParallaxOcclusion = !MOBILE_RENDER; m.parallaxScaleBias = .035;
 m.metallicTexture = tex('medieval_cobble_roughness.jpg', true); m.useRoughnessFromMetallicTextureGreen = true; m.useMetallnessFromMetallicTextureBlue = false; m.metallic = 0;
 m.ambientTexture = tex('medieval_cobble_ao.jpg', true); m.useAmbientInGrayScale = true; m.ambientTextureStrength = .72;
 m.roughness = .9; m.environmentIntensity = .45;
 return m;
}

function createGround() {
 // The floor is ONE big textured 3D plane (paved stone, diffuse + normal for real relief). It reaches
 // far into the foreground but ends just behind the back wall, so the background above the buildings is
 // sky + treeline rather than stone riding up the screen. The wall hides the far edge.
 const g = BABYLON.MeshBuilder.CreateGround('ground', { width: 600, height: 164, subdivisions: 6 }, scene);
 // Fewer V repeats stretch stones along world Z to counter the side camera's foreshortening.
 g.position.z = 64; g.material = groundMaterial('ground', 200, 26); g.receiveShadows = true;
 // Glowing rune-circle decal laid over the paving at the centre as the plaza landmark.
 const rune = BABYLON.MeshBuilder.CreateGround('rune', { width: 8.5, height: 5.6 }, scene);
 rune.position.set(0, 0.06, 0.6); rune.material = runeDecalMaterial(); rune.isPickable = false;
}

let runeMat = null;
function runeDecalMaterial() {
 if (runeMat) return runeMat;
 const t = new BABYLON.DynamicTexture('rune-decal', { width: 512, height: 512 }, scene, true);
 const c = t.getContext(), s = 512, cx = s / 2;
 c.clearRect(0, 0, s, s); c.strokeStyle = '#e8c56a'; c.globalAlpha = .8;
 c.lineWidth = 4; for (const r of [s * .46, s * .34, s * .18]) { c.beginPath(); c.arc(cx, cx, r, 0, Math.PI * 2); c.stroke(); }
 c.lineWidth = 3; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; c.beginPath(); c.moveTo(cx + Math.cos(a) * s * .18, cx + Math.sin(a) * s * .18); c.lineTo(cx + Math.cos(a) * s * .46, cx + Math.sin(a) * s * .46); c.stroke(); }
 c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 - Math.PI / 2, px = cx + Math.cos(a) * s * .31, py = cx + Math.sin(a) * s * .31; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); c.stroke();
 t.update();
 const m = new BABYLON.StandardMaterial('rune-mat', scene); m.diffuseTexture = t; m.opacityTexture = t; m.useAlphaFromDiffuseTexture = true; m.emissiveColor = new BABYLON.Color3(.5, .38, .12); m.disableLighting = true; m.specularColor = BABYLON.Color3.Black(); m.backFaceCulling = false;
 runeMat = m; return m;
}

function createWalls() {
 const stone = texturedMaterial('wall', 256, drawStoneBrick, 10, 1.2, true);
 const capMat = material('wall-cap', '#7d766a');
 // No back wall and no foreground curb — the town sits openly between its own buildings and the sky.
 // End caps (off-screen) keep the walkable strip bounded at the extremes.
 for (const ex of [-46, 46]) box(`end-wall-${ex}`, ex, 1.4, -2, 0.8, 2.8, 20, stone, true);
}

const BUILDING_ASPECT = { guild:1.361, magic:.892, alchemy:1.086, smithy:1.033, tavern:.992, bakery:1.113, flower:1.006, chapel:1.025, home:.983, clocktower:.556, market:1.346 };
function createBuilding(key, x, z, width = 5, height = 4.6, flip = false, foreground = false) {
 // Cropped PNG dimensions are authoritative: preserve each facade's natural silhouette instead of stretching to a generic box.
 const fittedWidth = height * BUILDING_ASPECT[key];
 width = fittedWidth;
 const plane = BABYLON.MeshBuilder.CreatePlane(`building-${key}-${x}`, { width, height }, scene);
 plane.position.set(x, height / 2, z); plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
 registerStreamedVisual(plane, `assets/buildings/${key}.png`, m => {
  if (flip) { m.diffuseTexture.uScale = -1; m.diffuseTexture.uOffset = 1; }
  // Facade sprites retain a small glossy lobe so camera-side spotlights produce a warm reflection.
  m.specularColor = new BABYLON.Color3(.38, .28, .16); m.specularPower = 48;
 }, flip ? 'flip' : 'normal');
 contactShadow(x, z + 0.1, width * .8, 1.8);
 shadowGenerator.addShadowCaster(plane);
 if (foreground) {
  // Near-camera framing facade: no collision; hide it fully near the player instead of alpha fading stacked planes.
  plane.fadeR = width * .42; occluders.push(plane);
 } else {
  // Backdrop building: an invisible collision slab keeps the player on the street side of it.
  const blocker = box(`wall-${key}-${x}`, x, 0.9, z + 0.4, width * .8, 1.8, 0.7, material(`wallmat-${key}-${x}`, '#223329'), true); blocker.isVisible = false;
 }
 return plane;
}

const FOREGROUND_ASPECT = {
 'ivy-cottage':1.198, 'garden-cottage':1.193, 'gable-cottage':1.182, 'merchant-wagon':1.232, 'blue-wagon':1.130, 'flower-well':1.182,
 'red-bakery':1.285, 'blue-smithy':1.361, 'moss-workshop':1.250, 'fishing-shack':1.273, 'red-cottage':1.283, 'stable':1.274,
 'purple-potion':1.228, 'honey-lodge':1.219, 'moon-cottage':1.125, 'boathouse':1.225, 'moss-shrine':1.187, 'greenhouse':1.371
};
function createForegroundAsset(key, x, height, flip = false, z = 17.2) {
 const width = height * FOREGROUND_ASPECT[key];
 const p = BABYLON.MeshBuilder.CreatePlane(`foreground-${key}-${x}-${z}`, { width, height }, scene);
 p.position.set(x, height / 2, z); p.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
 registerStreamedVisual(p, `assets/foreground/${key}.png`, m => { if (flip) { m.diffuseTexture.uScale = -1; m.diffuseTexture.uOffset = 1; } }, flip ? 'flip' : 'normal');
 contactShadow(x, z + .1, width * .78, 1.4); shadowGenerator.addShadowCaster(p);
 p.fadeR = width * .42; occluders.push(p);
}

function createTown() {
 // Backdrop frontage: a continuous row of buildings along the far side of the street.
 const rows = [-31,-26,-21,-16,-7,-2,3,8,15,20,25,30];
 rows.forEach((x, i) => {
  const key = BUILDINGS[i % BUILDINGS.length];
  const w = 5.2 + (i % 3) * 0.5, h = 4.4 + (i % 4) * 0.4;
  createBuilding(key, x, -6.0 - (i % 2) * 0.5, w, h, i % 2 === 0);
 });
 // A fuller background row of houses (offset to peek between the front row) — extra density that never
 // blocks the walkable street or hides the characters, and hides the ground's far edge behind rooftops.
 const backX = [-33, -28.5, -23.5, -18.5, -13.5, -9, -4.5, 0.5, 5.5, 10.5, 17, 23, 28, 33];
 backX.forEach((x, i) => createBuilding(BUILDINGS[(i + 4) % BUILDINGS.length], x, -10.5, 5.6 + (i % 3) * 0.4, 5.0 + (i % 4) * 0.5, i % 2 === 0));
 createBuilding('clocktower', -18, -7.6, 4.4, 7.6);
 // Three staggered near-camera rows form a crowded neighbourhood instead of one ruler-straight lineup.
 // The outer rows deliberately reuse the main facade set; only the middle row uses dedicated foreground art.
 const foregroundRows = [
  { z:9.4, start:-35, step:4.7, count:16, source:'building', height:4.1, offset:3 },
  { z:13.4, start:-33, step:4.0, count:18, source:'foreground', height:3.5, offset:0 },
  { z:17.4, start:-36, step:4.6, count:16, source:'building', height:4.4, offset:7 }
 ];
 const foregroundKeys = Object.keys(FOREGROUND_ASPECT);
 foregroundRows.forEach((row, ri) => {
  for (let i = 0; i < row.count; i++) {
   const x = row.start + i * row.step;
   const height = row.height + ((i + ri) % 3 - 1) * .25;
   const flip = (i + ri) % 2 === 0;
   if (row.source === 'building') {
    const key = BUILDINGS[(i + row.offset) % BUILDINGS.length];
    createBuilding(key, x, row.z, 5, height, flip, true);
   } else {
    const key = foregroundKeys[(i + row.offset) % foregroundKeys.length];
    createForegroundAsset(key, x, height, flip, row.z);
   }
  }
 });
}

// Which prop textures actually exist in assets/props (kept in sync with the matted output).
const DECOR = new Set(['tree', 'bushes', 'fountain', 'lamp', 'flowerbed', 'barrels']);   // matted props in assets/props/
const has = k => DECOR.has(k);
// Vegetation and street props fill every corner so no bare grass or empty plaza remains.
function createDecor() {
 // Just a few scattered trees (not a dense backdrop): a couple in front, a couple filling background gaps.
 if (has('tree')) {
  for (const x of [-15, 20] ) createProp('tree', x, -4.6, 6.2, { sink: 0.5, flip: x % 2 === 0 });
  for (const x of [-30, 2, 31]) createProp('tree', x, -9.0, 6.6, { sink: 0.6, flip: x % 2 === 0 });
 }
 // Bushes and flowerbeds along the grass strips and the near curb.
 if (has('bushes')) {
  for (const x of [-33, -19, -6, 3, 16, 27, 37]) createProp('bushes', x, 3.5, 1.5, { flip: x % 2 === 0 });
  for (const x of [-28, -16, -3, 7, 18, 30]) createProp('bushes', x, -4.4, 1.7, { flip: x % 2 === 0 });
 }
 if (has('flowerbed')) for (const x of [-22, -8, 5, 14, 25]) createProp('flowerbed', x, -4.0, 1.3);
 // Wrought-iron lamps rhythm the street; barrels clutter the corners.
 if (has('lamp')) for (const x of [-30, -18, -6, 6, 18, 30]) createProp('lamp', x, 2.9, 2.6, { collide: true });
 if (has('barrels')) for (const x of [-24, -10, 11, 23]) createProp('barrels', x, 2.6, 1.3, { collide: true, flip: x % 2 === 0 });
 // A stone fountain anchors the central plaza (kept off the walking line, with collision).
 if (has('fountain')) createProp('fountain', 3.2, -3.0, 2.6, { collide: true });
}

// A pixel-art prop billboard (tree, bush, lamp, fountain, crate...) grounded with a contact shadow.
const PROP_ASPECT = { tree: 1.18, bushes: 1.12, fountain: 1.29, lamp: 0.18, flowerbed: 1.21, barrels: 0.99 };
function createProp(key, x, z, height, opts = {}) {
 const aspect = opts.aspect || PROP_ASPECT[key] || 1;
 const width = height * aspect;
 const p = BABYLON.MeshBuilder.CreatePlane(`prop-${key}-${x}-${z}`, { width, height }, scene);
 p.position.set(x, height / 2 - (opts.sink || 0), z); p.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
 registerStreamedVisual(p, `assets/props/${key}.png`, m => { if (opts.flip) { m.diffuseTexture.uScale = -1; m.diffuseTexture.uOffset = 1; } }, opts.flip ? 'flip' : 'normal');
 if (!opts.noShadow) { contactShadow(x, z + height * 0.04, width * 0.7, Math.max(0.6, width * 0.32)); shadowGenerator.addShadowCaster(p); }
 if (opts.collide) { const b = box(`prop-col-${key}-${x}-${z}`, x, 0.5, z, width * 0.5, 1, 0.5, material(`prop-colmat-${x}-${z}`, '#223329'), true); b.isVisible = false; }
 if (opts.foreground) { p.fadeR = width * 0.5 + 1.0; occluders.push(p); }
 return p;
}

function createBillboard(name, url, x, z, width, height) {
 const p = BABYLON.MeshBuilder.CreatePlane(name, { width, height }, scene);
 p.position.set(x, height / 2, z); p.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
 p.material = spriteMaterial(`${name}-mat`, url); return p;
}
function setSpriteFrame(mesh, column, row, columns, rows) { const t = mesh.material.diffuseTexture; t.uScale = 1 / columns; t.vScale = 1 / rows; t.uOffset = column / columns; t.vOffset = row / rows; }

function loadAssets() {
 player = createBillboard('player', 'assets/hero-walk.png', 0, 0.8, 2.0, 2.75);
 player.ellipsoid = new BABYLON.Vector3(.32, .8, .22); player.ellipsoidOffset = new BABYLON.Vector3(0, .85, 0); player.checkCollisions = true;
 setSpriteFrame(player, 1, 0, 3, 4); shadowGenerator.addShadowCaster(player);
 player.contact = contactShadow(0, 0.8, 1.5, 1.1);
 npcs.forEach((n, i) => {
  n.sprite = createBillboard(`npc-${i}`, `assets/npcs/npc-idle-${i}.png`, n.x, n.z, 1.93, 2.67);
  setSpriteFrame(n.sprite, 1, 0, 3, 1); shadowGenerator.addShadowCaster(n.sprite);
  contactShadow(n.x, n.z, 1.4, 1.05);
 });
}

function createSunsetSky() {
 // A low-cost painted sky plane: dusk gradient, a soft sun, and translucent cloud banks behind town.
 const skyTex = new BABYLON.DynamicTexture('sunset-sky-texture', { width: 512, height: 256 }, scene, true);
 const c = skyTex.getContext(), g = c.createLinearGradient(0, 0, 0, 256);
 g.addColorStop(0, '#586781'); g.addColorStop(.45, '#aa7971'); g.addColorStop(.78, '#e5a66d'); g.addColorStop(1, '#f3c486'); c.fillStyle = g; c.fillRect(0, 0, 512, 256);
 const sun = c.createRadialGradient(116, 177, 3, 116, 177, 42); sun.addColorStop(0, 'rgba(255,247,190,.95)'); sun.addColorStop(.25, 'rgba(255,202,112,.7)'); sun.addColorStop(1, 'rgba(255,158,75,0)'); c.fillStyle = sun; c.fillRect(65, 126, 102, 102); skyTex.update();
 const skyMat = new BABYLON.StandardMaterial('sunset-sky-mat', scene); skyMat.emissiveTexture = skyTex; skyMat.disableLighting = true; skyMat.backFaceCulling = false;
 const sky = BABYLON.MeshBuilder.CreatePlane('sunset-sky', { width: 110, height: 28 }, scene); sky.position.set(0, 8.5, -18); sky.material = skyMat; sky.isPickable = false;
 const cloudTex = new BABYLON.DynamicTexture('sunset-cloud-texture', { width: 512, height: 192 }, scene, true); const cc = cloudTex.getContext(); cc.clearRect(0, 0, 512, 192);
 for (let i = 0; i < 20; i++) { const x = 10 + rnd(i + 91) * 490, y = 88 + rnd(i + 31) * 42, rx = 28 + rnd(i + 8) * 58, ry = 9 + rnd(i + 19) * 14; cc.fillStyle = i % 3 ? 'rgba(255,215,190,.68)' : 'rgba(105,94,130,.58)'; cc.beginPath(); cc.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); cc.fill(); }
 cloudTex.hasAlpha = true; cloudTex.update(); const cloudMat = new BABYLON.StandardMaterial('sunset-cloud-mat', scene); cloudMat.diffuseTexture = cloudTex; cloudMat.emissiveTexture = cloudTex; cloudMat.opacityTexture = cloudTex; cloudMat.useAlphaFromDiffuseTexture = true; cloudMat.alpha = .8; cloudMat.disableLighting = true; cloudMat.backFaceCulling = false;
 const clouds = BABYLON.MeshBuilder.CreatePlane('sunset-cloud', { width: 100, height: 20 }, scene); clouds.position.set(0, 7.8, -17.5); clouds.material = cloudMat; clouds.isPickable = false;
 // Stylised god-rays: additive translucent planes from the upper-left sun toward the street.
 const beamMat = new BABYLON.StandardMaterial('sunbeam-mat', scene); beamMat.diffuseColor = new BABYLON.Color3(1, .67, .32); beamMat.emissiveColor = new BABYLON.Color3(.8, .38, .1); beamMat.alpha = .075; beamMat.disableLighting = true; beamMat.backFaceCulling = false; beamMat.alphaMode = BABYLON.Engine.ALPHA_ADD;
 for (let i = 0; i < 3; i++) { const b = BABYLON.MeshBuilder.CreatePlane(`sunbeam-${i}`, { width: 1.8 + i, height: 18 }, scene); b.position.set(-9 + i * 3.8, 6.5, -4.8); b.rotation.z = -.32 + i * .035; b.material = beamMat; b.isPickable = false; }
 // Matching pools on the actual 3D street make the diagonal rays visibly land on the cobbles.
 const rayTex = new BABYLON.DynamicTexture('ground-ray-texture', { width: 128, height: 512 }, scene, true); const rc = rayTex.getContext(); const rg = rc.createLinearGradient(0, 0, 0, 512); rg.addColorStop(0, 'rgba(255,198,105,0)'); rg.addColorStop(.35, 'rgba(255,198,105,.55)'); rg.addColorStop(1, 'rgba(255,151,62,0)'); rc.fillStyle = rg; rc.fillRect(0, 0, 128, 512); rayTex.hasAlpha = true; rayTex.update();
 const rayMat = new BABYLON.StandardMaterial('ground-ray-mat', scene); rayMat.diffuseTexture = rayTex; rayMat.opacityTexture = rayTex; rayMat.emissiveTexture = rayTex; rayMat.useAlphaFromDiffuseTexture = true; rayMat.alpha = .16; rayMat.disableLighting = true; rayMat.backFaceCulling = false; rayMat.alphaMode = BABYLON.Engine.ALPHA_ADD;
 for (let i = 0; i < 3; i++) { const r = BABYLON.MeshBuilder.CreateGround(`ground-ray-${i}`, { width: 2.2 + i * .6, height: 13 }, scene); r.position.set(-8 + i * 8, .085, 1.5); r.rotation.y = -.38; r.material = rayMat; r.isPickable = false; }
}

function createFacadeSpotlights() {
 // Three warm camera-side cones skim selected facades; restrained intensities avoid washing out pixel art.
 for (const [i, x] of [-18, 0, 20].entries()) {
  const facadeSpot = new BABYLON.SpotLight(`facade-spot-${i}`, new BABYLON.Vector3(x - 3, 8.5, 10), new BABYLON.Vector3(.22, -.42, -1), .72, 14, scene);
  facadeSpot.diffuse = new BABYLON.Color3(1, .56, .25); facadeSpot.specular = new BABYLON.Color3(1, .72, .38); facadeSpot.intensity = .62; facadeSpot.range = 28;
 }
}

function createEnvironmentEffects() {
 const ps = new BABYLON.ParticleSystem('dust-motes', 140, scene);
 ps.particleTexture = new BABYLON.DynamicTexture('mote', { width: 16, height: 16 }, scene, false, BABYLON.Texture.NEAREST_SAMPLINGMODE);
 const pc = ps.particleTexture.getContext(); const pg = pc.createRadialGradient(8, 8, 1, 8, 8, 7); pg.addColorStop(0, 'rgba(255,245,205,1)'); pg.addColorStop(1, 'rgba(255,210,135,0)'); pc.fillStyle = pg; pc.fillRect(0, 0, 16, 16); ps.particleTexture.update();
 ps.emitter = new BABYLON.Vector3(0, 3, 0); ps.minEmitBox = new BABYLON.Vector3(-11, -2, -8); ps.maxEmitBox = new BABYLON.Vector3(11, 5, 8);
 ps.color1 = new BABYLON.Color4(1, .78, .38, .72); ps.color2 = new BABYLON.Color4(1, .93, .7, .34); ps.minSize = .04; ps.maxSize = .14; ps.minLifeTime = 5; ps.maxLifeTime = 10; ps.emitRate = 20; ps.direction1 = new BABYLON.Vector3(-.06, .02, 0); ps.direction2 = new BABYLON.Vector3(.08, .08, 0); ps.minEmitPower = .05; ps.maxEmitPower = .14; ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD; ps.start();
}

function setupPostProcess() {
 const pipeline = new BABYLON.DefaultRenderingPipeline('cinematic', true, scene, [camera]);
 pipeline.samples = 1;
 // Native-resolution pixel art must stay crisp; FXAA softens billboard edges on Retina screens.
 pipeline.fxaaEnabled = false;
 pipeline.bloomEnabled = true; pipeline.bloomThreshold = .82; pipeline.bloomWeight = .16; pipeline.bloomScale = .5;
 // Keep DoF very subtle — the CSS tilt-shift band handles most of the HD-2D blur. A strong
 // Babylon ortho DoF blurs the whole plane, so bias it toward almost-sharp.
 pipeline.depthOfFieldEnabled = false; pipeline.depthOfFieldBlurLevel = BABYLON.DepthOfFieldEffectBlurLevel.Low;
 pipeline.depthOfField.focusDistance = 4200; pipeline.depthOfField.focalLength = 24; pipeline.depthOfField.fStop = 22;
 pipeline.imageProcessingEnabled = true; pipeline.imageProcessing.contrast = 1.08; pipeline.imageProcessing.exposure = 1.12;
 pipeline.imageProcessing.vignetteEnabled = true; pipeline.imageProcessing.vignetteWeight = 1.05; pipeline.imageProcessing.vignetteColor = new BABYLON.Color4(.04, .07, .07, 1);
 pipeline.imageProcessing.toneMappingEnabled = true; pipeline.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
}

function createScene() {
 scene = new BABYLON.Scene(engine);
 scene.clearColor = new BABYLON.Color4(.47, .38, .46, 1);   // dusk fallback behind the painted sunset sky
 scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR; scene.fogColor = new BABYLON.Color3(.66, .48, .4); scene.fogStart = 55; scene.fogEnd = 95;
 scene.collisionsEnabled = true;
 camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0, CAM.height, CAM.back), scene);
 camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
 camera.setTarget(new BABYLON.Vector3(0, CAM.targetY, CAM.targetZ));
 camera.inputs.clear(); resizeCamera();
 const skyLight = new BABYLON.HemisphericLight('sky', new BABYLON.Vector3(-.2, 1, .1), scene); skyLight.intensity = .72; skyLight.diffuse = new BABYLON.Color3(.72, .68, .8); skyLight.groundColor = new BABYLON.Color3(.22, .2, .3);
 // Camera-side key light (順光): warm rays travel from over the viewer into the town, lighting
 // billboard fronts and throwing shadows away toward the back street instead of silhouetting faces.
 const sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(.28, -.9, -.72), scene);
 sun.position.set(-10, 18, 18); sun.intensity = 1.58; sun.diffuse = new BABYLON.Color3(1, .68, .4); sun.specular = new BABYLON.Color3(1, .5, .24);
 shadowGenerator = new BABYLON.ShadowGenerator(1024, sun); shadowGenerator.useBlurExponentialShadowMap = true; shadowGenerator.blurKernel = 16; shadowGenerator.darkness = .35;
 createSunsetSky(); createGround(); createWalls(); createTown(); createDecor(); loadAssets(); updateAssetStreaming(true); createFacadeSpotlights(); createEnvironmentEffects(); setupPostProcess();
 scene.onBeforeRenderObservable.add(update);
 return scene;
}

function resizeCamera() { if (!camera) return; const aspect = LANDSCAPE_RENDER.width / LANDSCAPE_RENDER.height; const view = CAM.view; camera.orthoTop = view * 1.02; camera.orthoBottom = -view * 0.98; camera.orthoLeft = -view * aspect; camera.orthoRight = view * aspect; }

function animatePlayer(moving, dt) { const row = {down:3,left:2,right:1,up:3}[direction]; if (!moving) { setSpriteFrame(player, 1, row, 3, 4); return; } walkClock += dt; setSpriteFrame(player, Math.floor(walkClock * 8) % 3, row, 3, 4); }
function move(dx, dy) { vector = { x: dx, y: dy }; }
function update() {
 if (!player || talking) return;
 let x = vector.x, y = vector.y;
 if (keys.has('ArrowLeft') || keys.has('a')) x = -1; if (keys.has('ArrowRight') || keys.has('d')) x = 1;
 if (keys.has('ArrowUp') || keys.has('w')) y = -1; if (keys.has('ArrowDown') || keys.has('s')) y = 1;
 const length = Math.hypot(x, y); const dt = Math.min(engine.getDeltaTime() / 1000, .04);
 if (length > .08) {
  x /= length; y /= length; direction = Math.abs(x) > Math.abs(y) ? (x < 0 ? 'left' : 'right') : (y < 0 ? 'up' : 'down');
  // Babylon's left-handed camera maps world -X to screen-right, so negate X to keep controls intuitive.
  player.moveWithCollisions(new BABYLON.Vector3(-x * (MOVE_SPEED / 50) * dt, 0, y * (MOVE_SPEED / 50) * dt));
  player.position.x = Math.max(-34, Math.min(34, player.position.x));
  player.position.z = Math.max(-2.0, Math.min(3.2, player.position.z));   // stay on the shallow street strip
 }
 if (player.contact) player.contact.position.set(player.position.x, 0.03, player.position.z);
 animatePlayer(length > .08, dt);
 // Buildings over the tracked player become translucent rather than disappearing; ease the transition as the camera moves.
 for (const o of occluders) {
  const near = Math.abs(player.position.x - o.position.x) < o.fadeR;
  const targetVisibility = near ? .15 : 1;
  o.visibility += (targetVisibility - o.visibility) * .18;
 }
 // Horizontal side-scroll: camera tracks the player's X only, keeping the fixed side-on tilt.
 camera.target.copyFrom(new BABYLON.Vector3(player.position.x, CAM.targetY, CAM.targetZ));
 camera.position.x = player.position.x + Math.sin(debugYaw) * CAM.back; camera.position.z = Math.cos(debugYaw) * CAM.back;
 updateAssetStreaming(); updateZone();
 // Contextual hint: only show a prompt when the player is close enough to talk (no permanent panel).
 document.querySelector('#hint').classList.toggle('show', !!nearest());
}
function updateZone() { if (!player) return; const next = player.position.x < -12 ? 0 : player.position.x < 12 ? 1 : 2; if (next !== zoneIndex) { zoneIndex = next; document.querySelector('#location').textContent = `✦ ${ZONES[next].name}`; } }
function pointerPairAngle() { const p = [...debugPointers.values()]; return p.length < 2 ? 0 : Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x); }
function resetDebugCamera() { debugYaw = 0; debugGesture = null; debugPointers.clear(); }
function startTouch(e) {
 if (debugEnabled) { debugPointers.set(e.pointerId, { x:e.clientX, y:e.clientY }); if (debugPointers.size === 2) { vector = {x:0,y:0}; origin = null; document.querySelector('#touch-indicator').classList.remove('active'); debugGesture = { angle:pointerPairAngle(), yaw:debugYaw }; } return; }
 origin = { x: e.clientX, y: e.clientY }; touchStart = { x: e.clientX, y: e.clientY, t: performance.now() }; const i = document.querySelector('#touch-indicator'); i.style.left = `${e.clientX}px`; i.style.top = `${e.clientY}px`; i.classList.add('active');
}
function dragTouch(e) {
 if (debugEnabled && debugPointers.has(e.pointerId)) { debugPointers.set(e.pointerId, {x:e.clientX,y:e.clientY}); if (debugGesture && debugPointers.size >= 2) debugYaw = debugGesture.yaw + pointerPairAngle() - debugGesture.angle; return; }
 if (!origin) return; const dx = e.clientX - origin.x, dy = e.clientY - origin.y, d = Math.hypot(dx, dy) || 1, k = Math.min(38, d); vector = { x: dx / d * k / 38, y: dy / d * k / 38 }; document.querySelector('#touch-knob').style.transform = `translate(${vector.x * 38}px,${vector.y * 38}px)`;
}
function stopTouch(e) {
 if (debugEnabled && e) { debugPointers.delete(e.pointerId); if (debugPointers.size < 2) debugGesture = null; return; }
 // A tap (barely moved, quick) near an NPC opens dialogue — the whole screen is the talk button, no UI button.
 if (touchStart && e && e.type === 'pointerup' && !talking) {
  const moved = Math.hypot(e.clientX - touchStart.x, e.clientY - touchStart.y);
  if (moved < 14 && performance.now() - touchStart.t < 350) interact();
 }
 touchStart = null; origin = null; vector = { x: 0, y: 0 }; document.querySelector('#touch-indicator').classList.remove('active'); document.querySelector('#touch-knob').style.transform = '';
}
function nearest() { return npcs.find(n => Math.hypot(n.x - player.position.x, n.z - player.position.z) < 2.4); }
function interact() { const npc = nearest(); if (!npc) return; activeNpc = npc; line = 0; talking = true; document.querySelector('#hint').classList.remove('show'); document.querySelector('#story').className = 'active'; document.querySelector('#story-cg').src = `assets/village-cg-${npc.face}.png`; document.querySelector('#story-name').textContent = npc.name; advanceStory(); }
function advanceStory() { if (!activeNpc) return; if (line >= activeNpc.lines.length) return endStory(); document.querySelector('#story-text').textContent = activeNpc.lines[line++]; }
function endStory() { document.querySelector('#story').className = ''; activeNpc = null; talking = false; }
const keys = new Set();
function bindDom() {
 const canvas = document.querySelector('#game');
 canvas.addEventListener('pointerdown', startTouch); canvas.addEventListener('pointermove', dragTouch); canvas.addEventListener('pointerup', stopTouch); canvas.addEventListener('pointercancel', stopTouch);
 // Tapping the story overlay advances the conversation (again, no button — the screen is the control).
 document.querySelector('#story').addEventListener('pointerdown', e => { e.stopPropagation(); advanceStory(); });
 const debugToggle = document.querySelector('#debug-toggle'), cameraReset = document.querySelector('#camera-reset');
 debugToggle.addEventListener('pointerdown', e => e.stopPropagation()); debugToggle.addEventListener('click', () => { debugEnabled = !debugEnabled; debugToggle.textContent = `DEBUG: ${debugEnabled ? 'ON' : 'OFF'}`; document.querySelector('#debug-tools').classList.toggle('enabled', debugEnabled); resetDebugCamera(); });
 cameraReset.addEventListener('pointerdown', e => e.stopPropagation()); cameraReset.addEventListener('click', resetDebugCamera);
 addEventListener('keydown', e => { keys.add(e.key); if (e.key === ' ' || e.key === 'Enter') interact(); });
 addEventListener('keyup', e => keys.delete(e.key));
 addEventListener('resize', () => { engine.setSize(LANDSCAPE_RENDER.width, LANDSCAPE_RENDER.height); resizeCamera(); });
}
const canvas = document.querySelector('#game');
engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true, adaptToDeviceRatio: false });
engine.setSize(LANDSCAPE_RENDER.width, LANDSCAPE_RENDER.height);
bindDom(); createScene();
// ProMotion can request 120 FPS; cap at 60 to avoid sustained GPU heat/throttling while walking.
let lastRender = 0;
engine.runRenderLoop(() => { const now = performance.now(); if (now - lastRender >= FRAME_INTERVAL - 1) { lastRender = now; scene.render(); } });
