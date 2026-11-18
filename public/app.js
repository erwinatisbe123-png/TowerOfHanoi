/* app.js — the browser side. It draws the board and animates.
   ALL puzzle logic (starting state, move validation, solution, win check)
   is requested from the Prolog server through the /api/... endpoints.   */
"use strict";

const $ = (id) => document.getElementById(id);
const towers = [...document.querySelectorAll(".tower")];

// ---- Game state (only mirrors what Prolog told us) ----
let disks = 3;
let state = [[], [], []];      // each tower bottom -> top
let moves = 0, minMoves = 0;
let selected = null;           // tower index currently "picked up"
let startTime = null, timerId = null;
let busy = false;              // true while a request / auto-solve runs
let solution = [], solIndex = 0, solveTimer = null, solving = false, paused = false;

// ---- Talking to Prolog ----
async function api(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error("Server error " + res.status);
  return res.json();
}

function setStatus(ok) {
  const s = $("status");
  s.textContent = ok ? "● Prolog connected" : "● Prolog not reachable";
  s.className = "badge " + (ok ? "on" : "off");
}

// ---- Rendering ----
const COLORS = ["#ff6b6b","#ff9f43","#ffc43d","#7bd389","#2ec4b6","#4cc9f0","#6c8cff","#9d6bff","#e879c9","#94a3b8"];

function render() {
  towers.forEach((t, i) => {
    const stack = t.querySelector(".stack");
    stack.innerHTML = "";
    state[i].forEach((size, pos) => {
      const d = document.createElement("div");
      d.className = "disk";
      d.style.width = (24 + (size / disks) * 70) + "%";
      d.style.setProperty("--c", COLORS[(size - 1) % COLORS.length]);
      d.textContent = size;
      d.title = "Disk " + size;
      const isTop = pos === state[i].length - 1;
      if (isTop) {
        d.classList.add("top");
        d.draggable = true;
        d.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", i); if (!canPlay()) e.preventDefault(); });
        if (selected === i) d.classList.add("lifted");
      }
      stack.appendChild(d);
    });
    t.classList.toggle("selected", selected === i);
  });
  $("moves").textContent = moves;
  $("minMoves").textContent = minMoves;
}

function say(text, kind) {
  const m = $("message");
  m.textContent = text;
  m.className = "message " + (kind || "");
}

function shake(i) {
  towers[i].classList.remove("shake");
  void towers[i].offsetWidth;              // restart animation
  towers[i].classList.add("shake");
  setTimeout(() => towers[i].classList.remove("shake"), 400);
}

// ---- Confetti (win celebration) ----
function confetti() {
  const box = $("confetti");
  for (let i = 0; i < 70; i++) {
    const b = document.createElement("i");
    b.className = "bit";
    b.style.left = Math.random() * 100 + "vw";
    b.style.background = COLORS[i % COLORS.length];
    b.style.animationDuration = (2 + Math.random() * 2.5) + "s";
    b.style.animationDelay = (Math.random() * 0.6) + "s";
    box.appendChild(b);
  }
  setTimeout(() => { box.innerHTML = ""; }, 5500);
}

// ---- Timer ----
const fmt = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
function startTimer() {
  if (timerId) return;
  startTime = Date.now();
  timerId = setInterval(() => { $("time").textContent = fmt(Math.floor((Date.now() - startTime) / 1000)); }, 250);
}
function stopTimer() { clearInterval(timerId); timerId = null; }
const elapsed = () => $("time").textContent;

// ---- New game ----
async function newGame() {
  stopSolver();
  stopTimer();
  try {
    const data = await api("/api/new?disks=" + disks);   // Prolog builds the start position
    state = data.state; minMoves = data.minMoves;
    setStatus(true);
  } catch (e) { setStatus(false); say("Cannot reach the Prolog server. Is it running?", "error"); return; }
  moves = 0; selected = null; busy = false;
  $("time").textContent = "00:00";
  $("win").classList.add("hidden");
  setSolverButtons(false);
  say("Tap a peg to pick up its top disk, then tap where to put it.");
  render();
}

// ---- Manual play ----
const canPlay = () => !solving && !busy;

async function tryMove(from, to) {
  busy = true;
  try {
    const r = await api("/api/move", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, from, to, disks })    // Prolog validates
    });
    if (r.valid) {
      state = r.state; moves++; startTimer();
      say("Good move!", "ok");
      render();
      if (r.solved) finish();
    } else {
      say(r.message, "error"); shake(to);
    }
  } catch (e) { setStatus(false); say("Lost connection to the Prolog server.", "error"); }
  busy = false;
}

async function onTowerClick(i) {
  if (!canPlay()) return;
  if (selected === null) {
    if (state[i].length === 0) { say("There is no disk on that tower to move.", "error"); shake(i); return; }
    selected = i; say("Now choose the tower to drop the disk on."); render();
  } else if (selected === i) {
    selected = null; say("Disk put back."); render();
  } else {
    const from = selected; selected = null; render();
    await tryMove(from, i);
  }
}

towers.forEach((t) => {
  const i = Number(t.dataset.index);
  t.addEventListener("click", () => onTowerClick(i));
  // Drag & drop
  t.addEventListener("dragover", (e) => { e.preventDefault(); t.classList.add("dragover"); });
  t.addEventListener("dragleave", () => t.classList.remove("dragover"));
  t.addEventListener("drop", (e) => {
    e.preventDefault(); t.classList.remove("dragover");
    const from = Number(e.dataTransfer.getData("text/plain"));
    selected = null;
    if (canPlay() && from !== i) tryMove(from, i); else render();
  });
});

function finish() {
  stopTimer(); stopSolver();
  $("winText").textContent = `Solved in ${moves} moves (minimum ${minMoves}) — time ${elapsed()}.` +
    (moves === minMoves ? " Perfect solution!" : "");
  say("Puzzle complete!", "ok");
  confetti();
  setTimeout(() => $("win").classList.remove("hidden"), 400);
}

// ---- Automatic solver (move list comes from Prolog) ----
function setSolverButtons(active) {
  $("btnPause").disabled = !active;
  $("btnRestart").disabled = !active;
  $("btnSolve").disabled = active;
  $("diskCount").disabled = active;
  $("btnPause").textContent = paused ? "Resume" : "Pause";
}

function stopSolver() {
  clearTimeout(solveTimer); solveTimer = null;
  solving = false; paused = false; solution = []; solIndex = 0;
  setSolverButtons(false);
}

const delay = () => 1100 - Number($("speed").value) * 100;   // 1..10  ->  1000..100 ms

async function startSolver() {
  await newGame();                       // always solve from the starting position
  try {
    const data = await api("/api/solve?disks=" + disks);   // Prolog computes the moves
    solution = data.moves;
  } catch (e) { setStatus(false); say("Cannot reach the Prolog server.", "error"); return; }
  solving = true; paused = false; solIndex = 0;
  setSolverButtons(true);
  startTimer();
  say(`Prolog found a ${solution.length}-move solution. Playing…`);
  step();
}

function step() {
  if (!solving || paused) return;
  if (solIndex >= solution.length) { solving = false; setSolverButtons(false); return; }
  const m = solution[solIndex++];
  const disk = state[m.from].pop();
  state[m.to].push(disk);
  moves++;
  say(`Move ${moves}: disk ${m.disk} from tower ${m.from + 1} to tower ${m.to + 1}`);
  render();
  if (solIndex >= solution.length) { finish(); return; }
  solveTimer = setTimeout(step, delay());
}

function togglePause() {
  if (!solving) return;
  paused = !paused;
  $("btnPause").textContent = paused ? "Resume" : "Pause";
  if (paused) { clearTimeout(solveTimer); say("Paused."); } else step();
}

// ---- Wire up buttons ----
const sel = $("diskCount");
for (let n = 1; n <= 10; n++) sel.add(new Option(n, n));
sel.value = disks;
sel.addEventListener("change", () => { disks = Number(sel.value); newGame(); });
$("btnReset").addEventListener("click", newGame);
$("btnSolve").addEventListener("click", startSolver);
$("btnPause").addEventListener("click", togglePause);
$("btnRestart").addEventListener("click", startSolver);
$("winClose").addEventListener("click", newGame);

newGame();
