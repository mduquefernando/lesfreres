const projects = [
  { title: "Hugo Boss", role: "Direction · Editing", file: "Hugo Boss (direction + edit).mp4", poster: "Hugo Boss (direction + edit).jpg" },
  { title: "Carolina Herrera I", role: "Direction", file: "Carolina Herrera(direction).mp4", poster: "Carolina Herrera(direction).jpg" },
  { title: "Carolina Herrera II", role: "Direction", file: "Carolina Herrea (direction).mp4", poster: "Carolina Herrea (direction).jpg" },
  { title: "Nike × FCB", role: "Editing · AI Cinematography", file: "Nike x FCB (edit + ai cinematography).mp4", poster: "Nike x FCB (edit + ai cinematography).jpg" },
  { title: "Aperol Spritz", role: "Editing · AI VFX", file: "Aperol Spritz (edit + ai vfx).mp4", poster: "Aperol Spritz (edit + ai vfx).jpg" },
  { title: "G-Shock", role: "Direction · Cinematography · Editing", file: "G-shock.mp4", poster: "G-shock.jpg" },
  { title: "Orkin", role: "AI Cinematography", file: "Orkin (ia cinematography).mp4", poster: "Orkin (ia cinematography).jpg" },
  { title: "Orkin II", role: "AI Cinematography", file: "Orkin II (ia cinematography).mp4", poster: "Orkin II (ia cinematography).jpg" },
  { title: "Niba", role: "Direction", file: "Niba (direction).mp4", poster: "Niba poster.jpg" },
  { title: "L0RNA — 2.0", role: "Editing", file: "l0rna - 2.0 (edit).mp4", poster: "l0rna - 2.0 (edit).jpg" },
  { title: "L0RNA — Quien Se Lo Queda Pierde", role: "Editing", file: "l0rna -Quien Se Lo Queda Pierde (edit) .mp4", poster: "l0rna -Quien Se Lo Queda Pierde (edit) .jpg" },
  { title: "Yung Beef — Plugg3", role: "Editing · AI Cinematography", file: "YungBeef Plugg3 (edit + ai cinematography).mp4", poster: "YungBeef Plugg3 (edit + ai cinematography).jpg" },
  { title: "Say Hello", role: "Direction · Cinematography · Editing", file: "Say hello .mp4", poster: "Say hello .jpg" },
  { title: "TLS I", role: "Direction · Cinematography · Editing", file: "TLS I.mp4", poster: "TLS I.jpg" },
  { title: "TLS II", role: "Direction · Cinematography · Editing", file: "TLS II.mp4", poster: "TLS II.jpg" },
  { title: "TLS III", role: "Direction · Cinematography · Editing", file: "TLS III.mp4", poster: "TLS III.jpg" },
  { title: "TLS IV", role: "Direction · Cinematography · Editing", file: "TLS IV.mp4", poster: "TLS IV.jpg" }
];

const ring = document.querySelector("#ring");
const scene = document.querySelector("#scene");
const sceneWrap = document.querySelector("#scene-wrap");
const activeIndexEl = document.querySelector("#active-index");
const totalCountEl = document.querySelector("#total-count");
const activeTitleEl = document.querySelector("#active-title");
const activeRoleEl = document.querySelector("#active-role");
const soundToggle = document.querySelector("#sound-toggle");
const viewer = document.querySelector("#viewer");
const viewerVideo = document.querySelector("#viewer-video");
const viewerTitle = document.querySelector("#viewer-title");
const viewerRole = document.querySelector("#viewer-role");
const viewerIndex = document.querySelector("#viewer-index");
const viewerClose = document.querySelector("#viewer-close");
const viewerPrev = document.querySelector("#viewer-prev");
const viewerNext = document.querySelector("#viewer-next");

const step = 360 / projects.length;
const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let rotation = 0;
let targetRotation = 0;
let velocity = 0;
let activeIndex = 0;
let viewerProjectIndex = 0;
let dragging = false;
let moved = false;
let pointerStartX = 0;
let rotationStart = 0;
let lastPointerX = 0;
let lastPointerTime = 0;
let pressedProject = null;
let soundEnabled = true;
let audioContext = null;
let carouselConfig = getCarouselConfig();

totalCountEl.textContent = pad(projects.length);
setRole(activeRoleEl, projects[0].role);
document.querySelector("#year").textContent = new Date().getFullYear();

projects.forEach((project, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "project";
  button.dataset.index = index;
  button.setAttribute("aria-label", `Open ${project.title}`);
  button.innerHTML = `
    <span class="project-card">
      <video muted playsinline preload="metadata" tabindex="-1" aria-hidden="true"${project.poster ? ` poster="${mediaUrl(project.poster)}"` : ""}>
        <source src="${mediaUrl(project.file)}" type="video/mp4">
      </video>
    </span>
    <span class="project-label">${escapeHtml(project.title)}</span>`;
  button.style.transform = `rotateY(${index * step}deg) translateZ(var(--radius))`;
  button.querySelector(".project-card").style.animationDuration = `${4.2 + (index % 5) * .38}s`;
  button.addEventListener("click", (event) => {
    if (event.detail === 0) selectOrOpen(index);
  });
  ring.appendChild(button);
});

const projectEls = [...ring.querySelectorAll(".project")];
const thumbVideos = [...ring.querySelectorAll("video")];

thumbVideos.forEach((video, index) => {
  video.addEventListener("loadeddata", () => {
    if (video.duration > .2 && !projects[index].poster) video.currentTime = Math.min(.35 + (index % 4) * .12, video.duration / 3);
  }, { once: true });
});

function animate() {
  const ease = prefersReducedMotion ? 1 : dragging ? .33 : .115;
  rotation += (targetRotation - rotation) * ease;
  if (!dragging && Math.abs(velocity) > .002) {
    targetRotation += velocity;
    velocity *= .945;
  }
  ring.style.transform = `rotateX(-8deg) rotateY(${rotation}deg)`;
  updateActive();
  requestAnimationFrame(animate);
}

function updateActive() {
  const next = mod(Math.round(-rotation / step), projects.length);
  projectEls.forEach((el, index) => {
    const angularDistance = Math.abs(shortestAngle(index * step + rotation));
    el.classList.toggle("is-active", index === next);
    el.classList.toggle("is-front", angularDistance < carouselConfig.frontAngle);
    const visible = angularDistance <= carouselConfig.visibleAngle;
    el.style.opacity = visible
      ? String(clamp(1 - angularDistance / carouselConfig.fadeDistance, carouselConfig.minOpacity, 1))
      : "0";
    el.style.pointerEvents = visible ? "auto" : "none";
  });
  if (next === activeIndex) return;
  activeIndex = next;
  activeIndexEl.textContent = pad(activeIndex + 1);
  activeTitleEl.textContent = projects[activeIndex].title;
  setRole(activeRoleEl, projects[activeIndex].role);
  playTick(Math.min(1, Math.abs(velocity) / 2.6));
}

sceneWrap.addEventListener("pointerdown", (event) => {
  dragging = true;
  moved = false;
  pointerStartX = event.clientX;
  lastPointerX = event.clientX;
  lastPointerTime = performance.now();
  rotationStart = targetRotation;
  pressedProject = event.target.closest(".project");
  velocity = 0;
  sceneWrap.classList.add("is-dragging");
  sceneWrap.setPointerCapture(event.pointerId);
  ensureAudio();
});

sceneWrap.addEventListener("pointermove", (event) => {
  if (!dragging) {
    const rect = sceneWrap.getBoundingClientRect();
    const normalized = (event.clientX - rect.left) / rect.width - .5;
    if (Math.abs(normalized) > .32 && Math.abs(velocity) < .05) targetRotation += normalized * .22;
    return;
  }
  const delta = event.clientX - pointerStartX;
  if (Math.abs(delta) > 5) moved = true;
  targetRotation = rotationStart + delta * carouselConfig.dragSensitivity;
  const now = performance.now();
  const elapsed = Math.max(8, now - lastPointerTime);
  velocity = clamp(
    ((event.clientX - lastPointerX) / elapsed) * carouselConfig.velocityScale,
    -carouselConfig.maxVelocity,
    carouselConfig.maxVelocity
  );
  lastPointerX = event.clientX;
  lastPointerTime = now;
});

function stopDragging(event) {
  if (!dragging) return;
  dragging = false;
  sceneWrap.classList.remove("is-dragging");
  try { sceneWrap.releasePointerCapture(event.pointerId); } catch {}
  if (!moved && pressedProject) selectOrOpen(Number(pressedProject.dataset.index));
  pressedProject = null;
  if (Math.abs(velocity) < .12) targetRotation = Math.round(targetRotation / step) * step;
  setTimeout(() => { moved = false; }, 0);
}

function selectOrOpen(index) {
  const distance = signedIndexDistance(index, activeIndex);
  if (distance !== 0) {
    targetRotation -= distance * step;
    velocity = 0;
    return;
  }
  openProject(index);
}

sceneWrap.addEventListener("pointerup", stopDragging);
sceneWrap.addEventListener("pointercancel", stopDragging);
sceneWrap.addEventListener("wheel", (event) => {
  event.preventDefault();
  ensureAudio();
  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  targetRotation -= clamp(delta, -75, 75) * carouselConfig.wheelSensitivity;
  velocity = 0;
}, { passive: false });

sceneWrap.addEventListener("mouseleave", () => {
  if (!dragging && Math.abs(velocity) < .08) targetRotation = Math.round(targetRotation / step) * step;
});

window.addEventListener("keydown", (event) => {
  if (viewer.open) {
    if (event.key === "ArrowLeft") navigateViewer(-1);
    if (event.key === "ArrowRight") navigateViewer(1);
    return;
  }
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    ensureAudio();
    targetRotation += event.key === "ArrowLeft" ? step : -step;
    velocity = 0;
  }
  if (event.key === "Enter") openProject(activeIndex);
});

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  soundToggle.lastChild.textContent = soundEnabled ? " Sound on" : " Sound off";
  if (soundEnabled) {
    ensureAudio();
    playTick(.6);
  }
});

function ensureAudio() {
  if (!soundEnabled) return;
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") audioContext.resume();
}

function playTick(intensity = .5) {
  if (!soundEnabled || !audioContext || audioContext.state !== "running") return;
  const now = audioContext.currentTime;
  const gain = audioContext.createGain();
  const osc = audioContext.createOscillator();
  const shimmer = audioContext.createOscillator();
  const shimmerGain = audioContext.createGain();
  osc.type = "sine";
  shimmer.type = "triangle";
  osc.frequency.setValueAtTime(920 + intensity * 130, now);
  osc.frequency.exponentialRampToValueAtTime(610, now + .048);
  shimmer.frequency.setValueAtTime(1740, now);
  shimmer.frequency.exponentialRampToValueAtTime(1180, now + .03);
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.exponentialRampToValueAtTime(.026 + intensity * .012, now + .004);
  gain.gain.exponentialRampToValueAtTime(.0001, now + .06);
  shimmerGain.gain.setValueAtTime(.0001, now);
  shimmerGain.gain.exponentialRampToValueAtTime(.008, now + .003);
  shimmerGain.gain.exponentialRampToValueAtTime(.0001, now + .032);
  osc.connect(gain).connect(audioContext.destination);
  shimmer.connect(shimmerGain).connect(audioContext.destination);
  osc.start(now); shimmer.start(now);
  osc.stop(now + .065); shimmer.stop(now + .04);
}

function openProject(index) {
  viewerProjectIndex = mod(index, projects.length);
  const project = projects[viewerProjectIndex];
  viewer.classList.remove("has-error");
  viewerTitle.textContent = project.title;
  setRole(viewerRole, project.role);
  viewerIndex.textContent = `${pad(viewerProjectIndex + 1)} / ${pad(projects.length)}`;
  viewerVideo.src = mediaUrl(project.file);
  if (!viewer.open) viewer.showModal();
  viewerVideo.play().catch(() => {});
}

function closeViewer() {
  viewerVideo.pause();
  viewerVideo.removeAttribute("src");
  viewerVideo.load();
  viewer.close();
}

function navigateViewer(direction) {
  viewerVideo.pause();
  openProject(viewerProjectIndex + direction);
}

viewerClose.addEventListener("click", closeViewer);
viewerPrev.addEventListener("click", () => navigateViewer(-1));
viewerNext.addEventListener("click", () => navigateViewer(1));
viewerVideo.addEventListener("error", () => viewer.classList.add("has-error"));
viewer.addEventListener("click", (event) => {
  const rect = viewer.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeViewer();
});
viewer.addEventListener("close", () => {
  viewerVideo.pause();
  viewerVideo.removeAttribute("src");
});

function mediaUrl(file) { return `media/${encodeURIComponent(file)}`; }
function setRole(element, role) {
  element.textContent = role || "";
  element.hidden = !role;
}
function updateRingRadius() {
  carouselConfig = getCarouselConfig();
  const cardWidth = scene.getBoundingClientRect().width;
  const gap = clamp(cardWidth * carouselConfig.gapRatio, carouselConfig.minGap, carouselConfig.maxGap);
  const geometricRadius = (cardWidth + gap) / (2 * Math.tan(Math.PI / projects.length));
  const radius = clamp(geometricRadius, carouselConfig.minRadius, carouselConfig.maxRadius);
  document.documentElement.style.setProperty("--radius", `${Math.round(radius)}px`);
}

function getCarouselConfig() {
  const width = window.innerWidth;
  if (width <= 700) {
    return {
      dragSensitivity: .17,
      velocityScale: 7.2,
      maxVelocity: .85,
      wheelSensitivity: .085,
      frontAngle: 48,
      visibleAngle: 180,
      fadeDistance: 270,
      minOpacity: .16,
      gapRatio: .045,
      minGap: 5,
      maxGap: 8,
      minRadius: 220,
      maxRadius: clamp(width * .62, 220, 258)
    };
  }
  if (width <= 1024) {
    return {
      dragSensitivity: .2,
      velocityScale: 8.4,
      maxVelocity: 1.25,
      wheelSensitivity: .1,
      frontAngle: 68,
      visibleAngle: 180,
      fadeDistance: 270,
      minOpacity: .22,
      gapRatio: .065,
      minGap: 7,
      maxGap: 12,
      minRadius: 300,
      maxRadius: Math.min(430, width * .46)
    };
  }
  return {
    dragSensitivity: .24,
    velocityScale: 10,
    maxVelocity: Number.POSITIVE_INFINITY,
    wheelSensitivity: .12,
    frontAngle: 82,
    visibleAngle: 180,
    fadeDistance: 270,
    minOpacity: .3,
    gapRatio: .08,
    minGap: 8,
    maxGap: 16,
    minRadius: 0,
    maxRadius: Number.POSITIVE_INFINITY
  };
}
function mod(value, divisor) { return ((value % divisor) + divisor) % divisor; }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function pad(value) { return String(value).padStart(2, "0"); }
function shortestAngle(angle) { return ((angle + 180) % 360 + 360) % 360 - 180; }
function signedIndexDistance(target, current) {
  let distance = target - current;
  if (distance > projects.length / 2) distance -= projects.length;
  if (distance < -projects.length / 2) distance += projects.length;
  return distance;
}
function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

updateRingRadius();
window.addEventListener("resize", updateRingRadius);
animate();
