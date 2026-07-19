const WORLD={w:1200,h:1800};const MOVE_SPEED=280;const CHARACTER_SCALE=1.75;
const portraits=new Image();portraits.src='assets/villagers.png';
const npcs=[
 {x:450,y:720,name:'莉亞',face:0,color:0xe4697e,lines:['旅行者，你好！這裡是花守村，我是照顧花圃的莉亞。','昨晚的風把星鈴花種子吹散了，大家正在幫忙尋找。','如果你在路邊看到發亮的小種子，請帶到廣場的老樹下。','等花開的那天，我請你喝村裡最好喝的蜂蜜茶！']},
 {x:680,y:620,name:'米洛',face:1,color:0x4c93ad,lines:['你就是剛來的旅行者吧？我是木匠米洛。','廣場的長椅被風吹壞了，我本來想今天修好。','可是莉亞的種子更重要，所以我先做了三只小木盒。','找到種子時放進盒裡，就不會再次被風吹走了。']},
 {x:650,y:900,name:'莎婆婆',face:2,color:0x8b6eb5,lines:['呵呵，年輕人，村裡的風已經告訴我你來了。','星鈴花不喜歡被追趕，它只會在安靜的人身邊閃光。','沿著水池慢慢走，聽見像鈴鐺的聲音時停下腳步。','不用著急。願意停下來的人，總會找到重要的東西。']}
];
let scene,player,activeNpc=null,line=0,talking=false,vector={x:0,y:0};
const MUSIC={day:'assets/bgm/hanamori-day.mp3',twilight:'assets/bgm/hanamori-twilight.mp3',dialogue:'assets/bgm/hanamori-dialogue.mp3'};
const exploreTrack=new Date().getHours()>=17?MUSIC.twilight:MUSIC.day;let musicStarted=false;
function camera(){return scene?.cameras.main;}
function blocked(){return false;}
function preload(){this.load.image('village','assets/village-hd2d.png');this.load.image('hero','assets/hero-sprite.png');this.load.image('npc0','assets/npc-sprite-0.png');this.load.image('npc1','assets/npc-sprite-1.png');this.load.image('npc2','assets/npc-sprite-2.png');}
function drawWorld(s){s.add.image(600,900,'village').setDisplaySize(WORLD.w,WORLD.h).setDepth(-1000);}
function makeTexture(s,key,body,hair){
 const g=s.make.graphics({x:0,y:0,add:false});g.fillStyle(0x294434,.35).fillEllipse(20,49,30,8);
 g.fillStyle(body).fillRoundedRect(8,18,24,27,4);g.fillStyle(0xf7c49f).fillCircle(20,14,11);g.fillStyle(hair).fillRect(9,3,22,10).fillCircle(20,9,11);
 g.fillStyle(0xffffff).fillRect(10,43,8,11).fillRect(22,43,8,11);g.generateTexture(key,40,56);g.destroy();
}
function house(s,group,x,y,w,h,roof){
 const wall=s.add.rectangle(x,y,w,h,roof,0);group.add(wall);wall.setVisible(false);
}
function create(){
 scene=this;this.physics.world.setBounds(0,0,WORLD.w,WORLD.h);drawWorld(this);
 const walls=this.physics.add.staticGroup();house(this,walls,435,565,150,100,0xd76a4c);house(this,walls,725,555,145,100,0x4c93ad);house(this,walls,425,845,150,105,0xd99048);house(this,walls,755,855,165,105,0x8b6eb5);
 player=this.physics.add.sprite(530,720,'hero').setDisplaySize(74,110).setDepth(1000).setCollideWorldBounds(true);player.body.setSize(180,120).setOffset(140,780);
 this.physics.add.collider(player,walls);npcs.forEach((n,i)=>{n.sprite=this.add.image(n.x,n.y,`npc${i}`).setDisplaySize(74,110).setDepth(n.y);});
 this.cameras.main.setBounds(0,0,WORLD.w,WORLD.h);this.cameras.main.startFollow(player,true,.13,.13);this.cameras.main.setRoundPixels(true);
 this.input.on('pointerdown',startTouch);this.input.on('pointermove',dragTouch);this.input.on('pointerup',stopTouch);this.input.on('pointercancel',stopTouch);
 this.keys=this.input.keyboard.createCursorKeys();
}
function update(){
 if(!player||talking)return player?.setVelocity(0);let x=vector.x,y=vector.y;
 if(this.keys.left.isDown)x=-1;if(this.keys.right.isDown)x=1;if(this.keys.up.isDown)y=-1;if(this.keys.down.isDown)y=1;
 const length=Math.hypot(x,y)||1;player.setVelocity(x/length*MOVE_SPEED,y/length*MOVE_SPEED);player.setDepth(player.y);
}
let origin=null;
function setMusic(src,volume=.42){const audio=document.querySelector('#bgm');if(!audio)return;if(!audio.src.endsWith(src)){audio.src=src;audio.loop=true;}audio.volume=volume;musicStarted=true;audio.play().catch(()=>{});}
function toggleMusic(e){e.stopPropagation();const audio=document.querySelector('#bgm'),button=document.querySelector('#music');audio.muted=!audio.muted;button.textContent=audio.muted?'♬':'♫';button.setAttribute('aria-pressed',String(audio.muted));if(!audio.muted)setMusic(talking?MUSIC.dialogue:exploreTrack,talking ? .3 : .42);}
function startTouch(p){if(!musicStarted)setMusic(exploreTrack);origin={x:p.x,y:p.y};const i=document.querySelector('#touch-indicator');i.style.left=`${p.x}px`;i.style.top=`${p.y}px`;i.classList.add('active');}
function dragTouch(p){if(!origin||!p.isDown)return;const dx=p.x-origin.x,dy=p.y-origin.y,d=Math.hypot(dx,dy)||1,k=Math.min(38,d);vector={x:dx/d*k/38,y:dy/d*k/38};document.querySelector('#touch-knob').style.transform=`translate(${vector.x*38}px,${vector.y*38}px)`;}
function stopTouch(){origin=null;vector={x:0,y:0};document.querySelector('#touch-indicator').classList.remove('active');document.querySelector('#touch-knob').style.transform='';}
function move(dx,dy){player?.setVelocity(dx*MOVE_SPEED,dy*MOVE_SPEED);}
function nearest(){return npcs.find(n=>Phaser.Math.Distance.Between(n.x,n.y,player.x,player.y)<85);}
function drawPortrait(index){if(!portraits.complete)return;const c=document.querySelector('#portrait'),p=c.getContext('2d'),w=portraits.width/3;p.clearRect(0,0,56,56);p.drawImage(portraits,w*index,0,w,portraits.height,0,0,56,56);}
function interact(){const npc=nearest();if(!npc){document.querySelector('#words').textContent='再靠近村民一點吧。';return;}activeNpc=npc;line=0;talking=true;setMusic(MUSIC.dialogue,.3);player.setVelocity(0);document.querySelector('#story').className='active';document.querySelector('#story-cg').src=`assets/village-cg-${npc.face}.png`;document.querySelector('#story-name').textContent=npc.name;advanceStory();}
function advanceStory(){if(!activeNpc)return;if(line>=activeNpc.lines.length)return endStory();document.querySelector('#story-text').textContent=activeNpc.lines[line++];}
function endStory(){setMusic(exploreTrack);document.querySelector('#story').className='';document.querySelector('#speaker').textContent=activeNpc.name;document.querySelector('#words').textContent='這段對話已經聽完了。';drawPortrait(activeNpc.face);activeNpc=null;talking=false;}
function bindDom(){document.querySelector('#music').addEventListener('pointerdown',toggleMusic);document.querySelector('#talk').addEventListener('pointerdown',e=>{e.stopPropagation();interact();});document.querySelector('#story').addEventListener('pointerdown',e=>{e.stopPropagation();advanceStory();});addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter')interact();});}
const config={type:Phaser.AUTO,parent:'game',width:innerWidth,height:innerHeight,pixelArt:true,backgroundColor:'#79be55',physics:{default:'arcade',arcade:{debug:false}},scale:{mode:Phaser.Scale.RESIZE,width:'100%',height:'100%'},scene:{preload,create,update}};
new Phaser.Game(config);portraits.onload=()=>drawPortrait(0);bindDom();
