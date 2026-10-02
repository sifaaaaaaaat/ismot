/* VERA Skin — interactions */
(() => {
  "use strict";

  /* ---------------------------------------------------- aloe leaf artwork */
  const LEAF_SVG = `
    <svg viewBox="0 0 100 300" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="leafGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#8ecb63"/>
          <stop offset="0.45" stop-color="#57a344"/>
          <stop offset="1" stop-color="#2e6b2b"/>
        </linearGradient>
      </defs>
      <path d="M50 0 C64 45 80 100 81 155 C82 205 70 255 52 299 C34 255 20 205 19 155 C20 100 36 45 50 0 Z" fill="url(#leafGrad)"/>
      <path d="M50 10 L50 292" stroke="#24541f" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
      <path d="M50 55 C58 72 64 92 66 115 M50 105 C58 122 63 142 64 165 M50 155 C57 172 61 192 61 214 M50 205 C55 220 57 238 56 256 M50 250 C53 262 54 274 53 284" stroke="#2c6127" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.65"/>
      <path d="M50 55 C42 72 36 92 34 115 M50 105 C42 122 37 142 36 165 M50 155 C43 172 39 192 39 214 M50 205 C45 220 43 238 44 256" stroke="#2c6127" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.65"/>
      <path d="M46 12 C40 50 30 100 27 150" stroke="#a5d97e" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.35"/>
    </svg>`;
  document.querySelectorAll(".leaf").forEach((l) => (l.innerHTML = LEAF_SVG));

  /* ---------------------------------------------------- mobile drawer */
  const burger = document.getElementById("burger");
  const drawer = document.getElementById("drawer");

  const closeDrawer = () => {
    drawer.hidden = true;
    burger.setAttribute("aria-expanded", "false");
  };

  burger.addEventListener("click", () => {
    const open = drawer.hidden;
    drawer.hidden = !open;
    burger.setAttribute("aria-expanded", String(open));
  });

  drawer.addEventListener("click", (e) => {
    if (e.target.closest("a")) closeDrawer();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  /* ---------------------------------------------------- reveal on scroll */
  const revealables = document.querySelectorAll("[data-reveal]");
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
  );
  revealables.forEach((el) => io.observe(el));

  /* ---------------------------------------------------- hero parallax */
  const word = document.querySelector(".hero__word");
  const leaves = [...document.querySelectorAll(".leaf")];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduceMotion) {
    let targetX = 0, targetY = 0, curX = 0, curY = 0, raf = null;

    const tick = () => {
      curX += (targetX - curX) * 0.08;
      curY += (targetY - curY) * 0.08;

      word.style.transform = `translate(${curX * 1}px, ${curY * 1}px)`;
      for (const leaf of leaves) {
        const depth = Number(leaf.dataset.depth || 10);
        leaf.style.marginLeft = `${curX * (depth / 10)}px`;
        leaf.style.marginTop = `${curY * (depth / 10)}px`;
      }
      if (Math.abs(targetX - curX) + Math.abs(targetY - curY) > 0.05) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    };

    addEventListener("pointermove", (e) => {
      targetX = (e.clientX / innerWidth - 0.5) * 24;
      targetY = (e.clientY / innerHeight - 0.5) * 16;
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }

  /* ---------------------------------------------------- active nav link */
  const sections = ["home", "product", "ingredients", "benefits"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const navLinks = [...document.querySelectorAll(".nav__links a")];

  const sectionIo = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const id = `#${entry.target.id}`;
        navLinks.forEach((a) =>
          a.classList.toggle("is-active", a.getAttribute("href") === id)
        );
      }
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => sectionIo.observe(s));

  /* ---------------------------------------------------- add to bag */
  const addBtn = document.getElementById("addToBag");
  const bagNote = document.getElementById("bagNote");
  let inBag = 0;

  addBtn.addEventListener("click", () => {
    inBag += 1;
    addBtn.textContent = `Add to bag · ${inBag}`;
    bagNote.textContent = inBag === 1
      ? "Added — free shipping unlocked 🌿"
      : `${inBag} jars in your bag`;
  });
})();
