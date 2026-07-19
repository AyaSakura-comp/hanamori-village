const WORLD={w:1000,h:3600};const MOVE_SPEED=280;const CHARACTER_SCALE=1.75;
const ZONES=[{name:'河畔商店街',y:0},{name:'花守中央廣場',y:1200},{name:'南風村口',y:2400}];
const npcs=[
 {x:390,y:1990,name:'莉亞',face:0,texture:'npc0',lines:['旅行者，你好！這裡是花守村，我是照顧花圃的莉亞。','沿著中央石板路一直走，就能抵達河畔商店街。','三條街道都和廣場相連，所以不用擔心迷路。','等星鈴花盛開時，我請你喝村裡最好喝的蜂蜜茶！']},
 {x:650,y:3040,name:'米洛',face:1,texture:'npc1',lines:['你就是剛來的旅行者吧？我是木匠米洛。','南邊這條寬路通往村口，兩旁都是新修好的木屋。','沿著淺色石板走，便不會踩進居民的花圃。','有空再來，我會替你做一雙更適合旅行的靴子。']},
 {x:650,y:930,name:'莎婆婆',face:2,texture:'npc2',lines:['呵呵，年輕人，你終於走到河畔來了。','過橋後是麵包坊，清晨總能聞到蜂蜜麵包的香味。','溪水不能直接走過去，要從中央石橋通行。','記住道路不只是方向，也是村民一起生活的痕跡。']},
 {x:650,y:250,name:'艾妲',face:3,texture:'npc3',lines:['歡迎來到河畔麵包坊！我是店主艾妲。','今天烤的是蜂蜜核桃麵包，香味連橋那頭都聞得到。','莉亞說你正在認識村子，所以這一個送給你。','下次帶朋友一起來，我會替你們留靠窗的位置！']},
 {x:650,y:2860,name:'凱恩',face:4,texture:'npc4',lines:['站住……啊，是新來的旅行者。我是巡守凱恩。','村裡很和平，但夜裡過橋還是要留意濕滑的石階。','若看到圍籬損壞，請告訴我或木匠米洛。','放心探索吧，我會守著通往村外的道路。']},
 {x:350,y:1740,name:'菲菲',face:5,texture:'npc5',lines:['你也是來看廣場噴泉的嗎？我是菲菲！','我每天都數水花，可是每次數到二十就忘記了。','莎婆婆說，忘記的願望會變成河邊的小花。','所以我決定再許一個願望：希望你明天也會來！']}
];
let scene,player,activeNpc=null,line=0,talking=false,vector={x:0,y:0},origin=null,direction='down',zoneIndex=-1;
function camera(){return scene?.cameras.main;}
function blocked(){return false;}
function preload(){
 this.load.spritesheet('heroWalk','assets/hero-walk.png',{frameWidth:96,frameHeight:128});
 ['inn','home','flower','bakery'].forEach(k=>this.load.image(k,`assets/building-${k}.png`));
 for(let i=0;i<6;i++)this.load.spritesheet(`npc${i}`,`assets/npcs/npc-idle-${i}.png`,{frameWidth:96,frameHeight:128});
}
function pixelTree(g,x,y){g.fillStyle(0x315d35).fillRect(x-30,y-50,60,54);g.fillStyle(0x477b3d).fillRect(x-22,y-62,44,58);g.fillStyle(0x73a94e).fillRect(x-12,y-68,28,34);g.fillStyle(0x6c452b).fillRect(x-6,y,12,28);}
function cobbles(g,x,y,w,h){g.fillStyle(0xd8bd83).fillRect(x,y,w,h);g.fillStyle(0xf0d99a).fillRect(x+8,y,w-16,8);for(let yy=y+18;yy<y+h-8;yy+=32)for(let xx=x+10+(yy%64?12:0);xx<x+w-12;xx+=38){g.fillStyle(0xb79b69).fillRect(xx,yy,22,5);g.fillStyle(0xe9ce91).fillRect(xx+3,yy-7,16,5);}}
function drawZone(s,y,index){
 const g=s.add.graphics().setDepth(-900);g.fillStyle(index===2?0x79a957:index===1?0x6fa451:0x5f9d58).fillRect(0,y,WORLD.w,1200);
 for(let yy=y+20;yy<y+1180;yy+=64)for(let xx=20;xx<980;xx+=64){g.fillStyle((xx+yy)%128?0x8db965:0xa1c86e).fillRect(xx,yy,7,5);}
 cobbles(g,420,y,160,1200);
 if(index===2){cobbles(g,180,y+500,640,150);g.fillStyle(0x60462d).fillRect(130,y+390,740,10);g.fillRect(130,y+760,740,10);}
 if(index===1){cobbles(g,170,y+430,660,300);g.fillStyle(0x9f8358).fillCircle(500,y+580,128);g.fillStyle(0xdfc58b).fillCircle(500,y+580,114);for(let a=0;a<8;a++){const q=a*Math.PI/4;g.fillStyle(0xb89c69).fillRect(490+Math.cos(q)*88,y+575+Math.sin(q)*88,20,10);}g.fillStyle(0x796747).fillCircle(500,y+580,62);g.fillStyle(0xb7c2bd).fillCircle(500,y+570,50);g.fillStyle(0x62aab5).fillCircle(500,y+565,34);}
 if(index===0){g.fillStyle(0x438aa5).fillRect(0,y+470,420,180).fillRect(580,y+470,420,180);g.fillStyle(0x72c0c7).fillRect(0,y+490,420,12).fillRect(580,y+490,420,12);g.fillStyle(0x8a6847).fillRect(412,y+455,176,210);for(let py=y+468;py<y+650;py+=26)g.fillStyle(0xc5a56d).fillRect(426,py,148,16);cobbles(g,170,y+780,660,145);}
 for(let ty=y+100;ty<y+1150;ty+=180){pixelTree(g,70,ty);pixelTree(g,930,ty+70);}
}
function drawWorld(s){ZONES.forEach((z,i)=>drawZone(s,z.y,i));}
function house(s,walls,key,x,y,w=260,h=210){const image=s.add.image(x,y,key).setDisplaySize(w,h).setDepth(y);const body=s.add.rectangle(x,y+35,w*.68,h*.42,0,0);walls.add(body);body.setVisible(false);return image;}
function create(){
 scene=this;this.physics.world.setBounds(0,0,WORLD.w,WORLD.h);drawWorld(this);const walls=this.physics.add.staticGroup();
 house(this,walls,'bakery',270,330);house(this,walls,'flower',730,330);house(this,walls,'home',270,900);house(this,walls,'inn',730,900);
 house(this,walls,'flower',270,1510);house(this,walls,'inn',730,1510);house(this,walls,'home',270,2180);house(this,walls,'bakery',730,2180);
 house(this,walls,'inn',270,2700);house(this,walls,'home',730,2700);house(this,walls,'flower',270,3370);house(this,walls,'bakery',730,3370);
 const riverLeft=this.add.rectangle(205,560,410,170,0,0),riverRight=this.add.rectangle(795,560,410,170,0,0);walls.add(riverLeft);walls.add(riverRight);riverLeft.setVisible(false);riverRight.setVisible(false);
 this.anims.create({key:'walk-down',frames:this.anims.generateFrameNumbers('heroWalk',{frames:[0,1,2]}),frameRate:8,repeat:-1});
 this.anims.create({key:'walk-left',frames:this.anims.generateFrameNumbers('heroWalk',{frames:[3,4,5]}),frameRate:8,repeat:-1});
 this.anims.create({key:'walk-right',frames:this.anims.generateFrameNumbers('heroWalk',{frames:[6,7,8]}),frameRate:8,repeat:-1});
 this.anims.create({key:'walk-up',frames:this.anims.generateFrameNumbers('heroWalk',{frames:[9,10,11]}),frameRate:8,repeat:-1});
 for(let i=0;i<6;i++)this.anims.create({key:`idle-${i}`,frames:this.anims.generateFrameNumbers(`npc${i}`,{frames:[0,1,2,1]}),frameRate:3,repeat:-1});
 player=this.physics.add.sprite(500,3260,'heroWalk',1).setDisplaySize(64,86).setDepth(3260).setCollideWorldBounds(true);player.body.setSize(34,22).setOffset(31,101);this.physics.add.collider(player,walls);
 npcs.forEach((n,i)=>{n.sprite=this.add.sprite(n.x,n.y,n.texture).setDisplaySize(66,94).setDepth(n.y).play(`idle-${i}`);});
 this.cameras.main.setBounds(0,0,WORLD.w,WORLD.h);this.cameras.main.startFollow(player,true,.13,.13);this.cameras.main.setRoundPixels(true);
 this.input.on('pointerdown',startTouch);this.input.on('pointermove',dragTouch);this.input.on('pointerup',stopTouch);this.input.on('pointercancel',stopTouch);this.keys=this.input.keyboard.createCursorKeys();updateZone();
}
function update(){
 if(!player)return;if(talking){player.setVelocity(0);player.anims.stop();return;}let x=vector.x,y=vector.y;if(this.keys.left.isDown)x=-1;if(this.keys.right.isDown)x=1;if(this.keys.up.isDown)y=-1;if(this.keys.down.isDown)y=1;const length=Math.hypot(x,y)||1;x/=length;y/=length;player.setVelocity(x*MOVE_SPEED,y*MOVE_SPEED);player.setDepth(player.y);
 if(Math.abs(x)+Math.abs(y)>.08){direction=Math.abs(x)>Math.abs(y)?(x<0?'left':'right'):(y<0?'up':'down');player.anims.play(`walk-${direction}`,true);}else{player.anims.stop();player.setFrame({down:1,left:4,right:7,up:10}[direction]);}updateZone();
}
function updateZone(){if(!player)return;const next=Math.min(2,Math.floor(player.y/1200));if(next!==zoneIndex){zoneIndex=next;const label=document.querySelector('#location');if(label)label.textContent=`✦ ${ZONES[next].name}`;}}
function startTouch(p){origin={x:p.x,y:p.y};const i=document.querySelector('#touch-indicator');i.style.left=`${p.x}px`;i.style.top=`${p.y}px`;i.classList.add('active');}
function dragTouch(p){if(!origin||!p.isDown)return;const dx=p.x-origin.x,dy=p.y-origin.y,d=Math.hypot(dx,dy)||1,k=Math.min(38,d);vector={x:dx/d*k/38,y:dy/d*k/38};document.querySelector('#touch-knob').style.transform=`translate(${vector.x*38}px,${vector.y*38}px)`;}
function stopTouch(){origin=null;vector={x:0,y:0};document.querySelector('#touch-indicator').classList.remove('active');document.querySelector('#touch-knob').style.transform='';}
function move(dx,dy){player?.setVelocity(dx*MOVE_SPEED,dy*MOVE_SPEED);}
function nearest(){return npcs.find(n=>Phaser.Math.Distance.Between(n.x,n.y,player.x,player.y)<105);}
function drawPortrait(index){const c=document.querySelector('#portrait'),p=c.getContext('2d'),image=new Image();image.onload=()=>{p.clearRect(0,0,56,56);p.drawImage(image,96,0,96,96,0,0,56,56);};image.src=`assets/npcs/npc-idle-${index}.png`;}
function interact(){const npc=nearest();if(!npc){document.querySelector('#words').textContent='沿著石板路尋找村民吧。';return;}activeNpc=npc;line=0;talking=true;player.setVelocity(0);document.querySelector('#story').className='active';document.querySelector('#story-cg').src=`assets/village-cg-${npc.face}.png`;document.querySelector('#story-name').textContent=npc.name;advanceStory();}
function advanceStory(){if(!activeNpc)return;if(line>=activeNpc.lines.length)return endStory();document.querySelector('#story-text').textContent=activeNpc.lines[line++];}
function endStory(){document.querySelector('#story').className='';document.querySelector('#speaker').textContent=activeNpc.name;document.querySelector('#words').textContent='這段對話已經聽完了。';drawPortrait(activeNpc.face);activeNpc=null;talking=false;}
function bindDom(){document.querySelector('#talk').addEventListener('pointerdown',e=>{e.stopPropagation();interact();});document.querySelector('#story').addEventListener('pointerdown',e=>{e.stopPropagation();advanceStory();});addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter')interact();});}
const config={type:Phaser.AUTO,parent:'game',width:innerWidth,height:innerHeight,pixelArt:true,backgroundColor:'#79be55',physics:{default:'arcade',arcade:{debug:false}},scale:{mode:Phaser.Scale.RESIZE,width:'100%',height:'100%'},scene:{preload,create,update}};
new Phaser.Game(config);drawPortrait(0);bindDom();
