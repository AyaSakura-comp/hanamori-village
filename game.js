// Hanamori Village — HD-2D: 3D stone town with pixel-art billboards (Babylon.js).
const WORLD = { w: 20, h: 72 };
const MOVE_SPEED=280;
const CHARACTER_SCALE=1.75;
const ZONES = [{ name:'河畔商店街', z: -24 }, { name:'花守中央廣場', z: 0 }, { name:'南風村口', z: 24 }];
const npcs = [
 { x: -2.2, z: 3.8, name:'莉亞',face:0, lines: ['旅行者，你好！這裡是花守村，我是照顧花圃的莉亞。', '沿著中央石板路一直走，就能抵達河畔商店街。', '三條街道都和廣場相連，所以不用擔心迷路。', '等星鈴花盛開時，我請你喝村裡最好喝的蜂蜜茶！'] },
 { x: 3, z: 25, name:'米洛',face:1, lines: ['你就是剛來的旅行者吧？我是木匠米洛。', '南邊這條寬路通往村口，兩旁都是新修好的木屋。', '沿著淺色石板走，便不會踩進居民的花圃。', '有空再來，我會替你做一雙更適合旅行的靴子。'] },
 { x: 3, z: -17, name:'莎婆婆',face:2, lines: ['呵呵，年輕人，你終於走到河畔來了。', '過橋後是麵包坊，清晨總能聞到蜂蜜麵包的香味。', '溪水不能直接走過去，要從中央石橋通行。', '記住道路不只是方向，也是村民一起生活的痕跡。'] },
 { x: 3, z: -30, name:'艾妲',face:3, lines: ['歡迎來到河畔麵包坊！我是店主艾妲。', '今天烤的是蜂蜜核桃麵包，香味連橋那頭都聞得到。', '莉亞說你正在認識村子，所以這一個送給你。', '下次帶朋友一起來，我會替你們留靠窗的位置！'] },
 { x: 3, z: 21, name:'凱恩',face:4, lines: ['站住……啊，是新來的旅行者。我是巡守凱恩。', '村裡很和平，但夜裡過橋還是要留意濕滑的石階。', '若看到圍籬損壞，請告訴我或木匠米洛。', '放心探索吧，我會守著通往村外的道路。'] },
 { x: -3, z: -1.5, name:'菲菲',face:5, lines: ['你也是來看廣場噴泉的嗎？我是菲菲！', '我每天都數水花，可是每次數到二十就忘記了。', '莎婆婆說，忘記的願望會變成河邊的小花。', '所以我決定再許一個願望：希望你明天也會來！'] }
];
const BUILDINGS=['guild','magic','alchemy','smithy','tavern','bakery','flower','chapel','home','clocktower','market'];
const PROPS = {};   // key -> texture url resolved after assets load
let engine, scene, camera, player, shadowGenerator, activeNpc = null, line = 0, talking = false, vector = { x: 0, y: 0 }, origin = null, direction = 'down', zoneIndex = -1, walkClock = 0;

// Camera geometry: Octopath-style side-on view with a slight downward tilt.
const CAM = { height: 13, back: 22, targetY: 2.6, view: 11.5 };

function material(name, color) { const m = new BABYLON.StandardMaterial(name, scene); m.diffuseColor = BABYLON.Color3.FromHexString(color); m.specularColor = BABYLON.Color3.Black(); return m; }
function pixelTexture(url) { const t = new BABYLON.Texture(url, scene, false, true, BABYLON.Texture.NEAREST_SAMPLINGMODE); t.hasAlpha = true; return t; }
function spriteMaterial(name, url) { const m = new BABYLON.StandardMaterial(name, scene); m.diffuseTexture = pixelTexture(url); m.opacityTexture = m.diffuseTexture; m.useAlphaFromDiffuseTexture = true; m.backFaceCulling = false; m.specularColor = BABYLON.Color3.Black(); m.emissiveColor = new BABYLON.Color3(.12, .12, .12); return m; }
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

function createGround() {
 // Large authored grass base so no rectangular seams show.
 const grass = texturedMaterial('grass', 128, drawGrass, 20, 44, true);
 const g = BABYLON.MeshBuilder.CreateGround('ground-base', { width: 40, height: 100, subdivisions: 2 }, scene);
 g.position.z = -2; g.material = grass; g.receiveShadows = true;

 // Central cobblestone plaza with a glowing rune circle (the district landmark).
 const plaza = texturedMaterial('plaza', 512, drawRunePlaza, 1, 1, true);
 box('plaza', 0, 0.06, 0, 10.5, 0.12, 12, plaza).receiveShadows = true;

 // Stone-paved main road + district crossroads.
 const road = texturedMaterial('road', 256, drawCobble, 1.6, 15, true);
 box('main-road', 0, 0.05, 0, 3.8, 0.1, 72, road);
 box('south-crossroad', 0, 0.055, 24, 11, 0.11, 4, texturedMaterial('road2', 256, drawCobble, 4.5, 1.6, true));
 box('riverside-road', 0, 0.055, -24, 11, 0.11, 4, texturedMaterial('road3', 256, drawCobble, 4.5, 1.6, true));

 // River + stone bridge; invisible barriers force crossing at the bridge only.
 const water = new BABYLON.StandardMaterial('river', scene); water.diffuseTexture = makeCanvasTexture('water-tex', 128, drawWater); water.diffuseTexture.uScale = 5; water.diffuseTexture.vScale = 1; water.specularColor = new BABYLON.Color3(.3, .4, .45); water.alpha = .9;
 const w = water.diffuseTexture; scene.onBeforeRenderObservable.add(() => { w.uOffset += 0.0009; });
 box('river', 0, 0.02, -12, 20, 0.08, 4.2, water);
 const bridge = box('bridge', 0, 0.16, -12, 4, 0.3, 4.8, texturedMaterial('bridge', 128, drawWood, 1, 2));
 for (const bx of [-2.4, 2.4]) box(`bridge-rail-${bx}`, bx, 0.5, -12, 0.25, 0.7, 4.8, texturedMaterial('bridge-rail' + bx, 128, drawWood, 1, 1));
 for (const bx of [-5.9, 5.9]) { const barrier = box(`river-barrier-${bx}`, bx, 0.7, -12, 8.2, 1.4, 3.6, material('river-wall', '#245f72'), true); barrier.isVisible = false; }
}

function createWalls() {
 const stone = texturedMaterial('wall', 256, drawStoneBrick, 6, 1.2, true);
 const capMat = material('wall-cap', '#7d766a');
 // Long stone retaining walls along both street edges (visible faces, side-on camera).
 for (const side of [-1, 1]) {
  const wx = side * 6.0;
  box(`side-wall-${side}`, wx, 0.7, 0, 0.7, 1.4, 68, stone, true);
  box(`side-wall-cap-${side}`, wx, 1.45, 0, 0.95, 0.14, 68, capMat);
 }
 // Back retaining wall + decorative staircase landmark behind the south gate.
 box('back-wall', 0, 1.4, 35.5, 13, 2.8, 1.2, stone, true);
 box('back-wall-cap', 0, 2.85, 35.5, 13, 0.16, 1.4, capMat);
 for (let i = 0; i < 5; i++) { const y = 0.2 + i * 0.34, d = 3.4 - i * 0.5; box(`stair-${i}`, 0, y, 33.7 - i * 0.28, 4.4, 0.34, d, stone).receiveShadows = true; }
 // Low front parapet (foreground occluder that frames the shot without hiding the road).
 for (const bx of [-4.2, 4.2]) box(`front-parapet-${bx}`, bx, 0.5, 33.6, 3.4, 1.0, 0.6, stone, true);
 for (const bx of [-4.2, 4.2]) box(`front-cap-${bx}`, bx, 1.05, 33.6, 3.7, 0.14, 0.75, capMat);
}

function createBuilding(key, x, z, width = 5, height = 4.6, flip = false) {
 const plane = BABYLON.MeshBuilder.CreatePlane(`building-${key}-${z}`, { width, height }, scene);
 plane.position.set(x, height / 2, z); plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
 plane.material = spriteMaterial(`mat-${key}-${x}-${z}`, `assets/buildings/${key}.png`);
 plane.material.diffuseTexture.uScale = flip ? -1 : 1; if (flip) plane.material.diffuseTexture.uOffset = 1;
 const blocker = box(`wall-${key}-${z}`, x, 0.9, z, width * .62, 1.8, 0.7, material(`wallmat-${key}-${x}-${z}`, '#223329'), true); blocker.isVisible = false;
 contactShadow(x, z + 0.1, width * .8, 2.4);
 shadowGenerator.addShadowCaster(plane);
 return plane;
}

function createTown() {
 // Continuous street frontage: buildings flush against the side walls, varied depth spacing.
 const rows = [-31,-26,-21,-16,-7,-2,3,8,15,20,25,30];
 let n = 0;
 rows.forEach((z, i) => {
  for (const side of [-1, 1]) {
   const key = BUILDINGS[n++ % BUILDINGS.length];
   const w = 4.4 + (i % 3) * 0.4, h = 4.2 + (i % 4) * 0.3;
   createBuilding(key, side * (5.0 - (i % 2) * 0.2), z, w, h, side > 0);
  }
 });
 createBuilding('clocktower', -4.9, 31.5, 3.8, 6.6);
}

function createBillboard(name, url, x, z, width, height) {
 const p = BABYLON.MeshBuilder.CreatePlane(name, { width, height }, scene);
 p.position.set(x, height / 2, z); p.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
 p.material = spriteMaterial(`${name}-mat`, url); return p;
}
function setSpriteFrame(mesh, column, row, columns, rows) { const t = mesh.material.diffuseTexture; t.uScale = 1 / columns; t.vScale = 1 / rows; t.uOffset = column / columns; t.vOffset = row / rows; }

function loadAssets() {
 player = createBillboard('player', 'assets/hero-walk.png', 0, 7, 1.35, 1.85);
 player.ellipsoid = new BABYLON.Vector3(.32, .8, .22); player.ellipsoidOffset = new BABYLON.Vector3(0, .85, 0); player.checkCollisions = true;
 setSpriteFrame(player, 1, 0, 3, 4); shadowGenerator.addShadowCaster(player);
 player.contact = contactShadow(0, 7, 1.1, 0.9);
 npcs.forEach((n, i) => {
  n.sprite = createBillboard(`npc-${i}`, `assets/npcs/npc-idle-${i}.png`, n.x, n.z, 1.3, 1.8);
  setSpriteFrame(n.sprite, 1, 0, 3, 1); shadowGenerator.addShadowCaster(n.sprite);
  contactShadow(n.x, n.z, 1.0, 0.85);
 });
}

function createEnvironmentEffects() {
 const ps = new BABYLON.ParticleSystem('light-motes', 90, scene);
 ps.particleTexture = new BABYLON.DynamicTexture('mote', { width: 16, height: 16 }, scene, false, BABYLON.Texture.NEAREST_SAMPLINGMODE);
 const pc = ps.particleTexture.getContext(); pc.fillStyle = 'white'; pc.beginPath(); pc.arc(8, 8, 5, 0, Math.PI * 2); pc.fill(); ps.particleTexture.update();
 ps.emitter = new BABYLON.Vector3(0, 4, 0); ps.minEmitBox = new BABYLON.Vector3(-9, 0, -35); ps.maxEmitBox = new BABYLON.Vector3(9, 5, 35);
 ps.color1 = new BABYLON.Color4(1, .86, .48, .5); ps.color2 = new BABYLON.Color4(.8, 1, .7, .22); ps.minSize = .03; ps.maxSize = .11; ps.minLifeTime = 4; ps.maxLifeTime = 8; ps.emitRate = 9; ps.gravity = new BABYLON.Vector3(0, .02, 0); ps.start();
}

function setupPostProcess() {
 const pipeline = new BABYLON.DefaultRenderingPipeline('cinematic', true, scene, [camera]);
 pipeline.samples = 1; pipeline.fxaaEnabled = true;
 pipeline.bloomEnabled = true; pipeline.bloomThreshold = .82; pipeline.bloomWeight = .16; pipeline.bloomScale = .5;
 // Keep DoF very subtle — the CSS tilt-shift band handles most of the HD-2D blur. A strong
 // Babylon ortho DoF blurs the whole plane, so bias it toward almost-sharp.
 pipeline.depthOfFieldEnabled = true; pipeline.depthOfFieldBlurLevel = BABYLON.DepthOfFieldEffectBlurLevel.Low;
 pipeline.depthOfField.focusDistance = 4200; pipeline.depthOfField.focalLength = 24; pipeline.depthOfField.fStop = 22;
 pipeline.imageProcessingEnabled = true; pipeline.imageProcessing.contrast = 1.12; pipeline.imageProcessing.exposure = 1.02;
 pipeline.imageProcessing.vignetteEnabled = true; pipeline.imageProcessing.vignetteWeight = 1.6; pipeline.imageProcessing.vignetteColor = new BABYLON.Color4(.03, .06, .06, 1);
 pipeline.imageProcessing.toneMappingEnabled = true;
}

function createScene() {
 scene = new BABYLON.Scene(engine);
 scene.clearColor = new BABYLON.Color4(.55, .62, .68, 1);   // hazy warm sky behind DoF
 scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR; scene.fogColor = new BABYLON.Color3(.7, .73, .68); scene.fogStart = 55; scene.fogEnd = 95;
 scene.collisionsEnabled = true;
 camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0, CAM.height, 28 + CAM.back), scene);
 camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
 camera.setTarget(new BABYLON.Vector3(0, CAM.targetY, 28));
 camera.inputs.clear(); resizeCamera();
 new BABYLON.HemisphericLight('sky', new BABYLON.Vector3(-.2, 1, .1), scene).intensity = .9;
 const sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-.5, -1.05, .55), scene);
 sun.position.set(12, 18, -10); sun.intensity = 1.35; sun.diffuse = new BABYLON.Color3(1, .95, .82);
 shadowGenerator = new BABYLON.ShadowGenerator(1024, sun); shadowGenerator.useBlurExponentialShadowMap = true; shadowGenerator.blurKernel = 16; shadowGenerator.darkness = .35;
 createGround(); createWalls(); createTown(); loadAssets(); createEnvironmentEffects(); setupPostProcess();
 scene.onBeforeRenderObservable.add(update);
 return scene;
}

function resizeCamera() { if (!camera) return; const aspect = engine.getRenderWidth() / engine.getRenderHeight(); const view = CAM.view; camera.orthoTop = view; camera.orthoBottom = -view; camera.orthoLeft = -view * aspect; camera.orthoRight = view * aspect; }

function animatePlayer(moving, dt) { const row = {down:0,left:1,right:2,up:3}[direction]; if (!moving) { setSpriteFrame(player, 1, row, 3, 4); return; } walkClock += dt; setSpriteFrame(player, Math.floor(walkClock * 8) % 3, row, 3, 4); }
function move(dx, dy) { vector = { x: dx, y: dy }; }
function update() {
 if (!player || talking) return;
 let x = vector.x, y = vector.y;
 if (keys.has('ArrowLeft') || keys.has('a')) x = -1; if (keys.has('ArrowRight') || keys.has('d')) x = 1;
 if (keys.has('ArrowUp') || keys.has('w')) y = -1; if (keys.has('ArrowDown') || keys.has('s')) y = 1;
 const length = Math.hypot(x, y); const dt = Math.min(engine.getDeltaTime() / 1000, .04);
 if (length > .08) {
  x /= length; y /= length; direction = Math.abs(x) > Math.abs(y) ? (x < 0 ? 'left' : 'right') : (y < 0 ? 'up' : 'down');
  player.moveWithCollisions(new BABYLON.Vector3(x * (MOVE_SPEED / 50) * dt, 0, y * (MOVE_SPEED / 50) * dt));
  player.position.x = Math.max(-5.4, Math.min(5.4, player.position.x));
  player.position.z = Math.max(-34, Math.min(34, player.position.z));
 }
 if (player.contact) player.contact.position.set(player.position.x, 0.03, player.position.z);
 animatePlayer(length > .08, dt);
 const target = new BABYLON.Vector3(player.position.x, 0, player.position.z);
 camera.target.copyFrom(target);
 camera.position.x = target.x; camera.position.z = target.z + CAM.back;
 updateZone();
}
function updateZone() { if (!player) return; const next = player.position.z < -12 ? 0 : player.position.z < 12 ? 1 : 2; if (next !== zoneIndex) { zoneIndex = next; document.querySelector('#location').textContent = `✦ ${ZONES[next].name}`; } }
function startTouch(e) { origin = { x: e.clientX, y: e.clientY }; const i = document.querySelector('#touch-indicator'); i.style.left = `${e.clientX}px`; i.style.top = `${e.clientY}px`; i.classList.add('active'); }
function dragTouch(e) { if (!origin) return; const dx = e.clientX - origin.x, dy = e.clientY - origin.y, d = Math.hypot(dx, dy) || 1, k = Math.min(38, d); vector = { x: dx / d * k / 38, y: dy / d * k / 38 }; document.querySelector('#touch-knob').style.transform = `translate(${vector.x * 38}px,${vector.y * 38}px)`; }
function stopTouch() { origin = null; vector = { x: 0, y: 0 }; document.querySelector('#touch-indicator').classList.remove('active'); document.querySelector('#touch-knob').style.transform = ''; }
function nearest() { return npcs.find(n => Math.hypot(n.x - player.position.x, n.z - player.position.z) < 2.4); }
function drawPortrait(index) { const c = document.querySelector('#portrait'), p = c.getContext('2d'), image = new Image(); image.onload = () => { p.clearRect(0, 0, 56, 56); p.imageSmoothingEnabled = false; p.drawImage(image, 96, 0, 96, 128, 0, 0, 56, 56); }; image.src = `assets/npcs/npc-idle-${index}.png`; }
function interact() { const npc = nearest(); if (!npc) { document.querySelector('#words').textContent = '沿著石板路尋找村民吧。'; return; } activeNpc = npc; line = 0; talking = true; document.querySelector('#story').className = 'active'; document.querySelector('#story-cg').src = `assets/village-cg-${npc.face}.png`; document.querySelector('#story-name').textContent = npc.name; advanceStory(); }
function advanceStory() { if (!activeNpc) return; if (line >= activeNpc.lines.length) return endStory(); document.querySelector('#story-text').textContent = activeNpc.lines[line++]; }
function endStory() { document.querySelector('#story').className = ''; document.querySelector('#speaker').textContent = activeNpc.name; document.querySelector('#words').textContent = '這段對話已經聽完了。'; drawPortrait(activeNpc.face); activeNpc = null; talking = false; }
const keys = new Set();
function bindDom() {
 const canvas = document.querySelector('#game');
 canvas.addEventListener('pointerdown', startTouch); canvas.addEventListener('pointermove', dragTouch); canvas.addEventListener('pointerup', stopTouch); canvas.addEventListener('pointercancel', stopTouch);
 document.querySelector('#talk').addEventListener('pointerdown', e => { e.stopPropagation(); interact(); });
 document.querySelector('#story').addEventListener('pointerdown', e => { e.stopPropagation(); advanceStory(); });
 addEventListener('keydown', e => { keys.add(e.key); if (e.key === ' ' || e.key === 'Enter') interact(); });
 addEventListener('keyup', e => keys.delete(e.key));
 addEventListener('resize', () => { engine.resize(); resizeCamera(); });
}
const canvas = document.querySelector('#game');
engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true, adaptToDeviceRatio: true });
if (innerWidth < 600) engine.setHardwareScalingLevel(1.25);
bindDom(); createScene(); engine.runRenderLoop(() => scene.render()); drawPortrait(0);
