/* Ismot — cinematic scroll experience
   One pinned, scrubbing GSAP timeline drives all 8 phases.
   Scrub => fully reversible; stop halfway and the scene holds. */

gsap.registerPlugin(ScrollTrigger);

const stage = document.querySelector('.stage');
const $ = (id) => document.getElementById(id);

/* ------------------------------------------------------------- smooth scroll */
const lenis = new Lenis({
  duration: 1.35,
  smoothWheel: true,
  wheelMultiplier: 0.9,
  touchMultiplier: 1.4,
});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);

/* ------------------------------------------------------------- master timeline
   Phases (scroll %):
   00-15 living world   15-30 golden energy   30-45 product emergence
   45-60 oil streams    60-70 typography      70-80 info cards
   80-90 navigation     90-100 settle + CTA                                   */

const D = 100; // percent units for readability
const tl = gsap.timeline({
  defaults: { ease: 'none' },
  scrollTrigger: {
    trigger: '.scroll-space',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.8,
  },
});

/* ---- 0-15%  EMPTY WORLD COMES ALIVE -------------------------------------
   subtle forward dolly on the whole world, very slow zoom                  */
tl.fromTo(stage,
  { scale: 1.055, xPercent: 0, yPercent: 0 },
  { scale: 1.03, duration: 15, ease: 'sine.inOut' }, 0);

/* ---- 15-30%  GOLDEN ENERGY ENTERS --------------------------------------- */
tl.to('#fx-glow', { opacity: 1, duration: 10, ease: 'sine.in' }, 13);
tl.fromTo('#fx-rays', { opacity: 0.35 }, { opacity: 0.95, duration: 10 }, 13);
tl.to('#fx-grade', { opacity: 0.3, duration: 12 }, 15);

/* ---- 30-45%  PRODUCT EMERGENCE ------------------------------------------
   bottle rises from behind the podium surface, decelerates, lands          */
tl.fromTo('#L-bottle',
  { yPercent: 16, opacity: 0, scale: 0.985 },
  { yPercent: 0, opacity: 1, scale: 1, duration: 13, ease: 'power2.out' },
  30);
// golden sheen sweeping up the bottle as it catches the light
tl.fromTo('#L-bottle',
  { filter: 'brightness(0.55) saturate(0.7)' },
  { filter: 'brightness(1.06) saturate(1.05)', duration: 13, ease: 'sine.out' },
  30);
tl.fromTo('#fx-glow', { scale: 0.7 }, { scale: 1.15, duration: 14 }, 30);

/* ---- 45-60%  BOTANICAL REVEAL: golden oil streams ------------------------
   the two splash layers (cut from the photo) arc upward/outward            */
tl.fromTo('#L-splash-left',
  { opacity: 0, yPercent: 14, xPercent: -3, scale: 0.9, rotation: -4 },
  { opacity: 0.96, yPercent: 0, xPercent: 0, scale: 1, rotation: 0,
    duration: 13, ease: 'power2.out' }, 45);
tl.fromTo('#L-splash-right',
  { opacity: 0, yPercent: 12, xPercent: 3, scale: 0.9, rotation: 4 },
  { opacity: 0.96, yPercent: 0, xPercent: 0, scale: 1, rotation: 0,
    duration: 13, ease: 'power2.out' }, 46);

/* ---- 60-70%  ISMOT TYPOGRAPHY --------------------------------------------
   frosted letters fade up out of the bokeh, slight scale, depth blur       */
tl.fromTo('#L-typo',
  { opacity: 0, scale: 1.045, yPercent: 1.5, filter: 'blur(14px)' },
  { opacity: 0.94, scale: 1, yPercent: 0, filter: 'blur(0px)',
    duration: 9, ease: 'power1.out' }, 60);
tl.fromTo('#L-sprout',
  { opacity: 0, scale: 0.94, transformOrigin: '50% 90%' },
  { opacity: 1, scale: 1, duration: 4.5, ease: 'back.out(1.6)' }, 65.5);

/* ---- 70-80%  INFORMATION CARDS -------------------------------------------
   fade + small rise + blur-to-sharp, never sliding from offscreen          */
tl.fromTo('#L-card-left',
  { opacity: 0, yPercent: 26, filter: 'blur(10px)' },
  { opacity: 1, yPercent: 0, filter: 'blur(0px)',
    duration: 7, ease: 'power2.out' }, 70);
tl.fromTo('#L-card-right',
  { opacity: 0, yPercent: 26, filter: 'blur(10px)' },
  { opacity: 1, yPercent: 0, filter: 'blur(0px)',
    duration: 7, ease: 'power2.out' }, 73);

/* ---- 80-90%  NAVIGATION ---------------------------------------------------
   interface settles in with tiny vertical drift                             */
tl.fromTo('.nav img',
  { opacity: 0, y: -10 },
  { opacity: 1, y: 0, duration: 7, stagger: 0.9, ease: 'power2.out' }, 80);

/* ---- 90-100%  FINAL HERO LOCK --------------------------------------------
   the original photograph fades in on top; everything is pixel-identical   */
tl.fromTo('#L-settle', { opacity: 0 }, { opacity: 1, duration: 8.5,
  ease: 'power1.inOut' }, 90);
// micro-settle of the world beneath (imperceptible, ends perfectly stable)
tl.to(stage, { scale: 1.02, duration: 10, ease: 'sine.inOut' }, 90);

// ORDER NOW: simple fade + slide-up settle (no bounce, no flash)
tl.fromTo('#L-cta',
  { opacity: 0, y: 16 },
  { opacity: 1, y: 0, duration: 6, ease: 'power2.out' }, 92.5);

/* ============================================================ AMBIENT LIFE */

/* golden particles: botanical dust + tiny droplets -------------------------- */
const canvas = $('fx-canvas');
const ctx = canvas.getContext('2d');
const DPR = Math.min(devicePixelRatio || 1, 2);
function sizeCanvas() {
  canvas.width = 900 * DPR;
  canvas.height = 1200 * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
sizeCanvas();
addEventListener('resize', sizeCanvas);

const N = 90;
const parts = Array.from({ length: N }, () => spawn(true));

function spawn(anywhere) {
  const r = Math.random();
  return {
    x: Math.random() * 900,
    y: anywhere ? Math.random() * 1200 : 1200 + 20,
    r: 0.6 + Math.random() * 1.9,
    vy: -(0.10 + Math.random() * 0.28),
    vx: (Math.random() - 0.5) * 0.14,
    tw: Math.random() * Math.PI * 2,
    ts: 0.02 + Math.random() * 0.04,
    drop: r < 0.16,                 // some particles are tiny oil droplets
  };
}

let energy = 0;         // 0..1 golden-energy phase strength (drives amount)
ScrollTrigger.create({
  trigger: '.scroll-space',
  start: 'top top', end: 'bottom bottom',
  onUpdate: (self) => {
    const p = self.progress * 100;
    energy = Math.min(1, Math.max(0, (p - 13) / 17));   // ramps 13% -> 30%
  },
});

function drawParticles() {
  ctx.clearRect(0, 0, 900, 1200);
  const boost = energy;
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    p.y += p.vy;
    p.x += p.vx + Math.sin(p.tw) * 0.12;
    p.tw += p.ts;
    if (p.y < -30 || p.x < -30 || p.x > 930) parts[i] = spawn(false);
    const alpha = (p.drop ? 0.5 : 0.34) * (0.35 + 0.65 * Math.abs(Math.sin(p.tw)))
      * (0.25 + 0.75 * boost);
    if (alpha < 0.02) continue;
    ctx.beginPath();
    ctx.fillStyle = p.drop
      ? `rgba(255, 196, 90, ${alpha})`
      : `rgba(255, 226, 150, ${alpha})`;
    ctx.arc(p.x, p.y, p.r * (p.drop ? 1.25 : 1), 0, Math.PI * 2);
    ctx.fill();
  }
  requestAnimationFrame(drawParticles);
}
requestAnimationFrame(drawParticles);

/* idle life: endless gentle sway so the scene never feels frozen ---------- */
const idleTl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } });
idleTl.to('#fx-rays', { rotate: 1.1, opacity: 0.85, duration: 7 }, 0)
      .to('#fx-glow', { opacity: 0.9, scale: 1.04, duration: 6 }, 0)
      .to('#L-bottle', { yPercent: -0.35, duration: 5.2 }, 0)
      .to('#L-bottle', { filter: 'brightness(1.03)', duration: 5.2 }, 0);

/* progress bar -------------------------------------------------------------- */
ScrollTrigger.create({
  trigger: '.scroll-space',
  start: 'top top', end: 'bottom bottom',
  onUpdate: (self) => { $('progress-bar').style.width = (self.progress * 100) + '%'; },
});

/* keep stage perfectly framed on resize ------------------------------------- */
addEventListener('resize', () => ScrollTrigger.refresh());
