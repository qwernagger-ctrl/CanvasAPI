// ---------- Canvas ----------
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener("resize", () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });

// ---------- Состояние ----------
let state = "menu", showShoot = false, shootTimer = 0, gameTime = 180;
const keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// ---------- Web Audio ----------
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBounce(){const osc=audioCtx.createOscillator(); const gain=audioCtx.createGain(); osc.connect(gain); gain.connect(audioCtx.destination); osc.type="square"; osc.frequency.setValueAtTime(200,audioCtx.currentTime); gain.gain.setValueAtTime(0.2,audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(300,audioCtx.currentTime+0.1); gain.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+0.1); osc.start(); osc.stop(audioCtx.currentTime+0.1);}
function playScore(){const osc=audioCtx.createOscillator(); const gain=audioCtx.createGain(); osc.connect(gain); gain.connect(audioCtx.destination); osc.type="sine"; osc.frequency.setValueAtTime(400,audioCtx.currentTime); osc.frequency.linearRampToValueAtTime(800,audioCtx.currentTime+0.3); gain.gain.setValueAtTime(0.3,audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+0.3); osc.start(); osc.stop(audioCtx.currentTime+0.3);}
function playPass(){const osc=audioCtx.createOscillator(); const gain=audioCtx.createGain(); osc.connect(gain); gain.connect(audioCtx.destination); osc.type="triangle"; osc.frequency.setValueAtTime(300,audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(400,audioCtx.currentTime+0.1); gain.gain.setValueAtTime(0.2,audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+0.1); osc.start(); osc.stop(audioCtx.currentTime+0.1);}

// ---------- Мяч ----------
const ball = { x: 500, y: 260, r: 12, vx: 0, vy: 0, owner: null, gravity: 0.3 };

// ---------- Игроки ----------
const players = [
  { x: 200, y: 150, step: 0, color: "#1565c0", size: 2 },
  { x: 200, y: 260, step: 0, color: "#1565c0", size: 2 },
  { x: 200, y: 370, step: 0, color: "#1565c0", size: 2 }
];
const enemies = [
  { x: canvas.width - 200, y: 150, step: 0, color: "#c62828", size: 2 },
  { x: canvas.width - 200, y: 260, step: 0, color: "#c62828", size: 2 },
  { x: canvas.width - 200, y: 370, step: 0, color: "#c62828", size: 2 }
];

// ---------- Кольца ----------
const hoopLeft = { x: 80, y: canvas.height / 2 - 60, r: 30 };
const hoopRight = { x: canvas.width - 80, y: canvas.height / 2 - 60, r: 30 };

// ---------- Главное меню ----------
let menuItems = ["Start Game", "Instructions", "Exit"];
let selectedMenuIndex = 0;

function drawMenu() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#222"; ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle = "red"; ctx.font = "60px Arial"; ctx.textAlign = "center";
    ctx.fillText("🏀 StreetBall 3V3", canvas.width/3, canvas.height/5);

    ctx.font = "40px Arial";
    menuItems.forEach((item,index)=>{
        if(index===selectedMenuIndex){
            ctx.fillStyle="orange";
            ctx.fillText("→ "+item+" ←", canvas.width/2, canvas.height/2+index*60);
        }else{
            ctx.fillStyle="white";
            ctx.fillText(item, canvas.width/2, canvas.height/2+index*60);
        }
    });

    ctx.font="20px Arial"; ctx.fillStyle="gray";
    ctx.fillText("Use ↑ ↓ arrows and ENTER to select", canvas.width/2, canvas.height-50);
}

document.addEventListener("keydown",(e)=>{
    if(state==="menu"){
        if(e.code==="ArrowUp") selectedMenuIndex=(selectedMenuIndex+menuItems.length-1)%menuItems.length;
        if(e.code==="ArrowDown") selectedMenuIndex=(selectedMenuIndex+1)%menuItems.length;
        if(e.code==="Enter") handleMenuSelect();
    }
});

function handleMenuSelect(){
    const selected = menuItems[selectedMenuIndex];
    if(selected==="Start Game"){state="playing"; gameTime=180;}
    else if(selected==="Instructions"){alert("Controls:\nWASD - Move\nShift - Sprint\nSpace - Shoot\nE - Pass");}
    else if(selected==="Exit"){location.reload();}
}

// ---------- Обновление ----------
function update() {
  if(state!=="playing") return;
  movePlayer(); aiMove(); moveBall(); dribble(); checkShoot();
  gameTime -= 1/60; if(gameTime<=0) state="menu";
}

// ---------- Игрок ----------
function movePlayer(){
  const p=players[1], s=keys["ShiftLeft"]?4:2.5; let moving=false;
  if(keys["KeyW"]){p.y-=s; moving=true;} if(keys["KeyS"]){p.y+=s; moving=true;}
  if(keys["KeyA"]){p.x-=s; moving=true;} if(keys["KeyD"]){p.x+=s; moving=true;}
  if(moving) p.step+=0.3;
}

// ---------- Дриблинг ----------
function dribble(){
  const p=players[1];
  if(distance(ball,p)<14) ball.owner=p;
  if(!ball.owner) [...players,...enemies].forEach(e=>{if(distance(e,ball)<14) ball.owner=e;});
  if(ball.owner){ball.x=ball.owner.x+10; ball.y=ball.owner.y-5;}
}

// ---------- Мяч ----------
function moveBall(){
  if(!ball.owner){
    ball.vy+=ball.gravity; ball.x+=ball.vx; ball.y+=ball.vy;
    if(ball.y+ball.r>canvas.height){ball.y=canvas.height-ball.r; ball.vy*=-0.6; ball.vx*=0.9; playBounce();}
  }
}

// ---------- Удар и пас ----------
ifHeld("Space",()=>{if(ball.owner===players[1]) ball.owner.shotPower=(ball.owner.shotPower||0)+0.2;});
onRelease("Space",()=>{
  if(ball.owner===players[1]){ball.vx=6; ball.vy=-ball.owner.shotPower||8; ball.owner.shotPower=0; ball.owner=null; playPass();}
});
onPress("KeyE",()=>{if(ball.owner===players[1]){ball.owner=null; ball.vx=4; ball.vy=-2; playPass();}});

// ---------- AI ----------
function aiMove(){
  enemies.forEach(e=>{
    if(!ball.owner || ball.owner!==e){e.x+=(ball.x-e.x)*0.02; e.y+=(ball.y-e.y)*0.02;}
    if(ball.owner===e){e.x+=(hoopLeft.x-e.x)*0.02; e.y+=(hoopLeft.y-e.y)*0.02;
      if(distance(e,hoopLeft)<50 && Math.random()<0.01){ball.owner=null; ball.vx=-5; ball.vy=-6; playPass();}}
  });
  players.forEach(p=>{if(p!==players[1] && !ball.owner){p.x+=(ball.x-p.x)*0.02; p.y+=(ball.y-p.y)*0.02;}});
}

// ---------- Попадание ----------
function checkShoot(){
  if(distance(ball,hoopRight)<hoopRight.r || distance(ball,hoopLeft)<hoopLeft.r){showShoot=true; shootTimer=30; playScore();}
  if(shootTimer>0) shootTimer--; else showShoot=false;
}

// ---------- Рисование ----------
function drawCourt(){
  ctx.fillStyle="#3a3a3a"; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle="red"; ctx.lineWidth=4;
  ctx.strokeRect(50,50,canvas.width-100,canvas.height-100);
  ctx.beginPath(); ctx.arc(canvas.width/2,canvas.height/2,60,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.arc(hoopLeft.x+10,hoopLeft.y+10,160,Math.PI*0.25,Math.PI*1.75); ctx.stroke();
  ctx.beginPath(); ctx.arc(hoopRight.x-10,hoopRight.y+10,160,Math.PI*1.25,Math.PI*2.75); ctx.stroke();
  ctx.strokeRect(hoopLeft.x-40,hoopLeft.y-60,80,120);
  ctx.strokeRect(hoopRight.x-40,hoopRight.y-60,80,120);
}

function drawHuman(x,y,step,color,shooting=false,size=1){
  const w=12*size,h=20*size; ctx.fillStyle=color; ctx.fillRect(x-w/2,y-h/2,w,h);
  ctx.fillStyle="#ffccaa"; ctx.beginPath(); ctx.arc(x,y-h,7*size,0,Math.PI*2); ctx.fill();
  let s=Math.sin(step)*6*size;
  ctx.strokeStyle="#222"; ctx.lineWidth=2*size;
  ctx.beginPath(); ctx.moveTo(x,y+h/2-4); ctx.lineTo(x-6*size,y+h/2+s); ctx.moveTo(x,y+h/2-4); ctx.lineTo(x+6*size,y+h/2-s); ctx.stroke();
  ctx.fillStyle=color;
  if(shooting) ctx.fillRect(x-8*size,y-h,16*size,3*size);
  else{ctx.fillRect(x-10*size,y-h+4,4*size,12*size); ctx.fillRect(x+6*size,y-h+4,4*size,12*size);}
  ctx.fillStyle="rgba(255, 72, 0, 0.3)"; ctx.beginPath(); ctx.ellipse(x,y+h/2,10*size,4*size,0,0,Math.PI*2); ctx.fill();
}

function drawHoop(x,y){
  ctx.strokeStyle="orange"; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(x,y,30,0,Math.PI*2); ctx.stroke();
  ctx.strokeStyle="#fff"; ctx.lineWidth=1;
  for(let i=-25;i<=25;i+=5){ctx.beginPath(); ctx.moveTo(x+i,y-30); ctx.lineTo(x,y+30); ctx.stroke();}
}

function draw(){
  if(state==="menu"){drawMenu(); return;}
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawCourt(); drawHoop(hoopLeft.x,hoopLeft.y); drawHoop(hoopRight.x,hoopRight.y);
  players.forEach(p=>drawHuman(p.x,p.y,p.step,p.color,p===ball.owner,p.size));
  enemies.forEach(e=>drawHuman(e.x,e.y,e.step,e.color,e===ball.owner,e.size));
  ctx.beginPath(); ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2); ctx.fillStyle="white"; ctx.fill();
  ctx.fillStyle="white"; ctx.font="40px Arial";
  let minutes=Math.floor(gameTime/60), seconds=Math.floor(gameTime%60);
  ctx.fillText(`${minutes}:${seconds<10?'0':''}${seconds}`,canvas.width/2-40,50);
  if(showShoot){ctx.fillStyle="orange"; ctx.font="80px Arial"; ctx.shadowColor="black"; ctx.shadowBlur=10; ctx.fillText("SHOOT",canvas.width/2-90,150); ctx.shadowBlur=0;}
}

// ---------- Loop ----------
function loop(){update(); draw(); requestAnimationFrame(loop);}
loop();

// ---------- Вспомогательные ----------
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
const pressed={};
function onPress(code,fn){document.addEventListener("keydown",e=>{if(e.code===code&&!pressed[code]){pressed[code]=true;fn();}}); document.addEventListener("keyup",e=>pressed[code]=false);}
function onRelease(code,fn){document.addEventListener("keyup",e=>{if(e.code===code) fn();});}
function ifHeld(code,fn){setInterval(()=>keys[code]&&fn(),16);}
