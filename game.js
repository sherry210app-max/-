const canvas = document.querySelector('#board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.querySelector('#next');
const nextCtx = nextCanvas.getContext('2d');
const overlay = document.querySelector('#overlay');
const startButton = document.querySelector('#start-button');
const pauseButton = document.querySelector('#pause-button');
const scoreEl = document.querySelector('#score');
const levelEl = document.querySelector('#level');
const linesEl = document.querySelector('#lines');
const overlayTitle = document.querySelector('#overlay-title');
const overlayKicker = document.querySelector('#overlay-kicker');

const COLS = 10, ROWS = 20, SIZE = 30;
const colors = ['#36bde5','#4f71dc','#fa9b42','#edc436','#50bd72','#ad62d5','#e96682','#ec5d9a','#3eabb7','#7661d9','#df704b','#70a843'];
const shapes = [
  [[1,1,1,1]], [[1,0,0],[1,1,1]], [[0,0,1],[1,1,1]], [[1,1],[1,1]],
  [[0,1,1],[1,1,0]], [[0,1,0],[1,1,1]], [[1,1,0],[0,1,1]],
  [[1,0,1],[1,1,1]], [[0,1,0],[1,1,1],[0,1,0]], [[1,0,0],[1,0,0],[1,1,1]],
  [[1,1],[1,1],[1,0]], [[0,1,1],[1,1,0],[1,0,0]]
];
let board, current, upcoming, score, lines, level, running, paused, lastTime, dropCounter;

function freshPiece() { const type = Math.floor(Math.random() * shapes.length); return { matrix: shapes[type].map(r => [...r]), color: colors[type], x: 0, y: 0 }; }
function reset() { board = Array.from({length: ROWS}, () => Array(COLS).fill(null)); score = lines = 0; level = 1; current = freshPiece(); upcoming = freshPiece(); spawn(); updateStats(); drawNext(); }
function spawn() { current = upcoming || freshPiece(); upcoming = freshPiece(); current.x = Math.floor((COLS - current.matrix[0].length) / 2); current.y = 0; drawNext(); if (collides(current)) gameOver(); }
function collides(piece, dx = 0, dy = 0, matrix = piece.matrix) { return matrix.some((row,y) => row.some((v,x) => v && (piece.x + x + dx < 0 || piece.x + x + dx >= COLS || piece.y + y + dy >= ROWS || (piece.y + y + dy >= 0 && board[piece.y+y+dy][piece.x+x+dx])))); }
function merge() { current.matrix.forEach((row,y) => row.forEach((v,x) => { if (v && current.y+y >= 0) board[current.y+y][current.x+x] = current.color; })); }
function rotate() { const rotated = current.matrix[0].map((_, i) => current.matrix.map(r => r[i]).reverse()); const original = current.x; for (const shift of [0,-1,1,-2,2]) { current.x = original + shift; if (!collides(current,0,0,rotated)) { current.matrix = rotated; return; } } current.x = original; }
function clearLines() { let count = 0; for (let y = ROWS-1; y >= 0; y--) if (board[y].every(Boolean)) { board.splice(y,1); board.unshift(Array(COLS).fill(null)); count++; y++; } if (count) { const points = [0,100,300,500,800][count] * level; score += points; lines += count; level = Math.floor(lines/10)+1; updateStats(); } }
function drop() { if (!running || paused) return; if (!collides(current,0,1)) current.y++; else { merge(); clearLines(); spawn(); } dropCounter = 0; }
function drawBlock(context, x, y, color, size = SIZE) { context.fillStyle = color; context.fillRect(x*size+1,y*size+1,size-2,size-2); context.fillStyle = '#ffffff2e'; context.fillRect(x*size+3,y*size+3,size-6,3); context.fillStyle = '#00000025'; context.fillRect(x*size+3,y*size+size-6,size-6,3); }
function draw() { ctx.fillStyle='#f8fcff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.strokeStyle='#d7eaf7'; ctx.lineWidth=1; for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x*SIZE,0);ctx.lineTo(x*SIZE,ROWS*SIZE);ctx.stroke();} for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*SIZE);ctx.lineTo(COLS*SIZE,y*SIZE);ctx.stroke();} board.forEach((row,y)=>row.forEach((color,x)=>color&&drawBlock(ctx,x,y,color))); if(current) current.matrix.forEach((row,y)=>row.forEach((v,x)=>v&&drawBlock(ctx,current.x+x,current.y+y,current.color))); }
function drawNext() { nextCtx.clearRect(0,0,120,120); if (!upcoming) return; const m=upcoming.matrix, s=22, offX=(120-m[0].length*s)/2, offY=(120-m.length*s)/2; m.forEach((row,y)=>row.forEach((v,x)=>{if(v){ nextCtx.fillStyle=upcoming.color; nextCtx.fillRect(offX+x*s+1,offY+y*s+1,s-2,s-2); nextCtx.fillStyle='#ffffff33'; nextCtx.fillRect(offX+x*s+3,offY+y*s+3,s-6,3); }})); }
function updateStats() { scoreEl.textContent=String(score).padStart(6,'0'); levelEl.textContent=String(level).padStart(2,'0'); linesEl.textContent=String(lines).padStart(2,'0'); }
function update(time=0) { const delta=time-lastTime; lastTime=time; if(running&&!paused){ dropCounter+=delta; if(dropCounter>Math.max(110,800-(level-1)*65)) drop(); } draw(); requestAnimationFrame(update); }
function start() { reset(); running=true; paused=false; overlay.classList.add('hidden'); pauseButton.innerHTML='暫停 <span>Space</span>'; }
function togglePause() { if(!running) return; paused=!paused; pauseButton.innerHTML=paused?'繼續 <span>Space</span>':'暫停 <span>Space</span>'; if(paused){overlayKicker.textContent='稍作休息';overlayTitle.textContent='遊戲暫停';startButton.textContent='繼續';overlay.classList.remove('hidden');}else overlay.classList.add('hidden'); }
function gameOver() { running=false; overlayKicker.textContent='本局分數 '+score; overlayTitle.textContent='遊戲結束'; startButton.textContent='再玩一次'; overlay.classList.remove('hidden'); }
function action(a) { if(!running||paused)return; if(a==='left'&&!collides(current,-1))current.x--; if(a==='right'&&!collides(current,1))current.x++; if(a==='down')drop(); if(a==='rotate')rotate(); }
document.addEventListener('keydown',e=>{ if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '].includes(e.key))e.preventDefault(); if(e.key===' ')togglePause(); else if(e.key==='ArrowUp')action('rotate'); else if(e.key==='ArrowLeft')action('left'); else if(e.key==='ArrowRight')action('right'); else if(e.key==='ArrowDown')action('down'); });
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>action(b.dataset.action)));
startButton.addEventListener('click',()=>{ if(paused)togglePause(); else start(); }); pauseButton.addEventListener('click',togglePause);
reset(); requestAnimationFrame(update);
