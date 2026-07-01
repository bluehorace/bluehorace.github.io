const menuButton = document.querySelector(".menu-button");
const nav = document.querySelector(".site-nav");
const navInner = document.querySelector(".nav-inner");
const navLinks = [...document.querySelectorAll(".site-nav a[href^='#']")];

if (menuButton && nav) {
  const closeMenu = () => {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "開啟選單");
    menuButton.classList.remove("is-open");
    nav.classList.remove("open");
    document.body.classList.remove("menu-open");
  };

  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    menuButton.setAttribute("aria-label", open ? "開啟選單" : "關閉選單");
    menuButton.classList.toggle("is-open", !open);
    nav.classList.toggle("open", !open);
    document.body.classList.toggle("menu-open", !open);
  });

  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenu();
  });
}

const sectionTargets = [...document.querySelectorAll("main section[id]")];
function setActiveNav(id) {
  navLinks.forEach(link => {
    const active = link.getAttribute("href") === `#${id}`;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

if (sectionTargets.length && "IntersectionObserver" in window) {
  setActiveNav("home");
  const navObserver = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible?.target?.id) setActiveNav(visible.target.id);
    entries.forEach(entry => entry.target.classList.toggle("in-view", entry.isIntersecting));
  }, { rootMargin: "-24% 0px -52% 0px", threshold: [0.12, 0.28, 0.48] });
  sectionTargets.forEach(section => navObserver.observe(section));
} else {
  setActiveNav("home");
  sectionTargets.forEach(section => section.classList.add("in-view"));
}

navInner?.addEventListener("pointermove", event => {
  const rect = navInner.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  navInner.style.setProperty("--nav-glass-x", `${x}%`);
}, { passive: true });

navInner?.addEventListener("pointerleave", () => {
  navInner.style.setProperty("--nav-glass-x", "50%");
}, { passive: true });

const workGrid = document.querySelector(".work-grid");
const featuredList = document.querySelector(".featured-list");
const filterButtons = [...document.querySelectorAll("[data-filter]")];
const workToggle = document.getElementById("workToggle");
let projects = [];
let currentFilter = "all";
let workExpanded = false;
let revealObserver;

const imageUrl = path => /^(https?:)?\/\//.test(path) ? path : path;

function attachImageFallback(image, fallbackPath) {
  if (!fallbackPath || fallbackPath === image.getAttribute("src")) return;
  image.addEventListener("error", () => {
    if (image.dataset.fallbackApplied) return;
    image.dataset.fallbackApplied = "true";
    image.src = imageUrl(fallbackPath);
  }, { once: true });
}

function createWorkCard(project, index) {
  const card = document.createElement("a");
  card.className = "work-card reveal";
  card.dataset.category = project.category;
  card.dataset.number = project.number;
  card.dataset.extra = String(index >= 6);
  card.href = `projects/project-detail.html?id=${encodeURIComponent(project.id)}`;
  card.innerHTML = `
    <div class="work-visual">
      <img src="${imageUrl(project.image_path)}" alt="${project.title} ${project.subtitle}" loading="lazy">
    </div>
    <div class="work-info">
      <p class="work-meta"><span>${project.meta}</span><span>${project.category}</span></p>
      <h3>${project.title}</h3>
      <p>${project.subtitle}</p>
    </div>`;
  attachImageFallback(card.querySelector("img"), project.fallback_image_path);
  return card;
}

function createFeaturedProject(project, index) {
  const article = document.createElement("article");
  article.className = `featured-project${index % 2 ? " reverse" : ""} reveal`;
  const href = `projects/project-detail.html?id=${encodeURIComponent(project.id)}`;
  const tags = project.details.map(([label]) => `<li>${label}</li>`).join("");
  article.innerHTML = `
    <a class="project-image" href="${href}">
      <img src="${imageUrl(project.image_path)}" alt="${project.title} ${project.subtitle}" loading="lazy">
    </a>
    <div class="project-copy">
      <p class="project-meta"><span>No. ${project.number} · ${project.meta}</span><span>${project.category}</span></p>
      <h3><a href="${href}">${project.title}</a></h3>
      <p>${project.concept}</p>
      <ul class="project-tags">${tags}</ul>
      <a class="text-link" href="${href}">閱讀作品 <span aria-hidden="true">→</span></a>
    </div>`;
  attachImageFallback(article.querySelector("img"), project.fallback_image_path);
  return article;
}

function updateWorkGrid() {
  const cards = [...document.querySelectorAll(".work-card[data-category]")];
  cards.forEach(card => {
    const matches = currentFilter === "all" || card.dataset.category === currentFilter;
    const concealedExtra = currentFilter === "all" && card.dataset.extra === "true" && !workExpanded;
    card.hidden = !matches || concealedExtra;
  });

  if (workToggle) {
    workToggle.hidden = currentFilter !== "all" || projects.length <= 6;
    workToggle.setAttribute("aria-expanded", String(workExpanded));
    workToggle.textContent = workExpanded ? "收合部分作品" : `查看更多作品（${Math.max(0, projects.length - 6)}）`;
  }
}

function setupRevealAnimations() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const items = document.querySelectorAll(".reveal:not([data-reveal-ready])");
  items.forEach(item => item.dataset.revealReady = "true");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    items.forEach(item => item.classList.add("visible"));
    return;
  }
  revealObserver ||= new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach(item => revealObserver.observe(item));
}

function renderPortfolio(payload, source) {
  document.documentElement.dataset.contentSource = source;
  projects = payload.projects
    .filter(project => project.published)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (workGrid) {
    workGrid.replaceChildren(...projects.map(createWorkCard));
    workGrid.setAttribute("aria-busy", "false");
  }

  const featured = projects
    .filter(project => project.featured)
    .sort((a, b) => a.featured_order - b.featured_order)
    .slice(0, 4);
  if (featuredList) {
    featuredList.replaceChildren(...featured.map(createFeaturedProject));
    featuredList.setAttribute("aria-busy", "false");
  }

  updateWorkGrid();
  setupRevealAnimations();
}

function formatPrice(plan) {
  const formatter = new Intl.NumberFormat("zh-TW");
  const from = Number(plan.price_from) || 0;
  const to = Number(plan.price_to) || 0;
  if (from && to && to > from) return `NT$ ${formatter.format(from)}–${formatter.format(to)}`;
  if (from) return `NT$ ${formatter.format(from)} 起`;
  if (to) return `NT$ ${formatter.format(to)}`;
  return "依需求報價";
}

function renderPricing(payload, source) {
  document.documentElement.dataset.pricingSource = source;
  const pricingGrid = document.querySelector("[data-pricing-grid]");
  const sourceLabel = document.querySelector("[data-pricing-source]");
  if (sourceLabel) {
    const label = source === "remote" ? "Google Sheet 即時資料" : source === "cache" ? "瀏覽器快取資料" : "本地備份資料";
    sourceLabel.textContent = `資料來源：${label} · ${payload.version}`;
  }
  if (!pricingGrid) return;

  pricingGrid.replaceChildren(...payload.pricing.map(plan => {
    const article = document.createElement("article");
    article.className = "pricing-card liquid-card reveal";
    const deliverables = plan.deliverables.length
      ? plan.deliverables.map(item => `<li>${item}</li>`).join("")
      : "<li>依專案需求確認交付內容</li>";
    article.innerHTML = `
      <p class="pricing-card-meta">${plan.category}</p>
      <h3>${plan.service_name}</h3>
      <p class="pricing-card-subtitle">${plan.subtitle || ""}</p>
      <p class="pricing-price">${formatPrice(plan)}${plan.price_unit ? `<span> / ${plan.price_unit}</span>` : ""}</p>
      <p>${plan.description}</p>
      <ul>${deliverables}</ul>
      <dl class="pricing-card-details">
        ${plan.timeline ? `<div><dt>時程</dt><dd>${plan.timeline}</dd></div>` : ""}
        ${plan.note ? `<div><dt>備註</dt><dd>${plan.note}</dd></div>` : ""}
      </dl>
      <a class="text-link" href="mailto:bluehorace.design@gmail.com?subject=${encodeURIComponent(plan.service_name + " 報價諮詢")}">${plan.cta_label || "討論合作"} <span aria-hidden="true">→</span></a>
    `;
    return article;
  }));
  pricingGrid.setAttribute("aria-busy", "false");
  setupRevealAnimations();
}

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    updateWorkGrid();
  });
});

workToggle?.addEventListener("click", () => {
  workExpanded = !workExpanded;
  updateWorkGrid();
  if (workExpanded) {
    const firstExtra = document.querySelector('.work-card[data-extra="true"] h3');
    firstExtra?.setAttribute("tabindex", "-1");
    firstExtra?.focus({ preventScroll: true });
  }
});

setupRevealAnimations();
if (window.PortfolioContent && (workGrid || featuredList)) {
  window.PortfolioContent.load(renderPortfolio);
}
if (window.PricingContent && document.querySelector("[data-pricing-grid]")) {
  window.PricingContent.load(renderPricing);
}

/*
 * Rounded-rectangle SVG displacement map adapted from
 * shuding/liquid-glass (MIT, Copyright 2025 Shu Ding).
 * https://github.com/shuding/liquid-glass
 */
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const liquidTargets = [...document.querySelectorAll(".liquid-card, .liquid-filter, .liquid-nav, .glass-surface")];

function smoothStep(a, b, value) {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function createLiquidGlass(element, index) {
  if (!finePointer || window.innerWidth <= 900 || reducedMotion || !window.ResizeObserver) return;
  let svg;
  let displacement;
  let visible = true;
  let resizeFrame;
  const filterId = `portfolio-liquid-glass-${index}`;

  function destroyFilter() {
    svg?.remove();
    svg = null;
    element.style.backdropFilter = "";
  }

  function buildFilter() {
    destroyFilter();
    const rect = element.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (width < 2 || height < 2) return;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    const pixels = context.createImageData(width, height);
    const radius = Math.min(28, Math.max(16, Math.round(Math.min(width, height) * .23)));
    const edge = Math.min(22, Math.max(12, Math.round(Math.min(width, height) * .2)));

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const qx = Math.abs(x - width / 2) - (width / 2 - radius);
        const qy = Math.abs(y - height / 2) - (height / 2 - radius);
        const distance = Math.min(Math.max(qx, qy), 0) +
          Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - radius;
        const bend = smoothStep(edge, -2, distance);
        const dx = (x - width / 2) * (1 - bend) * .68;
        const dy = (y - height / 2) * (1 - bend) * .68;
        const offset = (y * width + x) * 4;
        pixels.data[offset] = 128 + Math.max(-127, Math.min(127, dx));
        pixels.data[offset + 1] = 128 + Math.max(-127, Math.min(127, dy));
        pixels.data[offset + 2] = 128;
        pixels.data[offset + 3] = 255;
      }
    }

    context.putImageData(pixels, 0, 0);
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.position = "absolute";
    svg.style.pointerEvents = "none";
    svg.innerHTML = `<defs><filter id="${filterId}" x="0" y="0" width="${width}" height="${height}"
      filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feImage href="${canvas.toDataURL()}" width="${width}" height="${height}" result="map" />
      <feDisplacementMap in="SourceGraphic" in2="map" scale="34" xChannelSelector="R" yChannelSelector="G" />
    </filter></defs>`;
    document.body.appendChild(svg);
    displacement = svg.querySelector("feDisplacementMap");
    const filterValue = element.classList.contains("liquid-nav")
      ? `url(#${filterId}) blur(7px) saturate(1.4)`
      : `url(#${filterId}) blur(3px) saturate(1.65) contrast(1.12)`;
    element.style.backdropFilter = filterValue;
  }

  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(buildFilter);
  });
  resizeObserver.observe(element);
  new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? true;
  }).observe(element);

  element.addEventListener("pointermove", event => {
    if (!visible) return;
    const rect = element.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    element.style.setProperty("--glass-x", `${x}%`);
    element.style.setProperty("--glass-y", `${y}%`);
    if (displacement) {
      const distance = Math.hypot(x - 50, y - 50) / 70;
      displacement.setAttribute("scale", String(30 + Math.min(1, distance) * 12));
    }
  }, { passive: true });
  element.addEventListener("pointerleave", () => {
    element.style.setProperty("--glass-x", "50%");
    element.style.setProperty("--glass-y", "25%");
    displacement?.setAttribute("scale", "34");
  }, { passive: true });
  buildFilter();
}

liquidTargets.forEach(createLiquidGlass);
