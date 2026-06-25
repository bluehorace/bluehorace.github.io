const id = new URLSearchParams(location.search).get("id") || "life-is-great";
const main = document.getElementById("main");

function detailImageUrl(path) {
  if (/^(https?:)?\/\//.test(path)) return path;
  return path.startsWith("../") ? path : `../${path}`;
}

function renderUnavailable() {
  document.title = "作品目前未公開 — Horace";
  document.getElementById("projectMeta").textContent = "Portfolio";
  document.getElementById("projectTitle").textContent = "此作品目前未公開";
  document.getElementById("projectSummary").textContent = "你可以返回作品列表，查看其他已發布的設計作品。";
  document.querySelector(".case-actions").hidden = true;
  document.querySelector(".case-cover").hidden = true;
  document.querySelectorAll(".case-section").forEach(section => section.hidden = true);
  document.querySelector(".case-facts").hidden = true;
  main.setAttribute("aria-busy", "false");
}

function renderProject(project) {
  document.title = `${project.title} — Horace`;
  document.querySelector('meta[name="description"]').content = project.concept;
  document.getElementById("projectMeta").textContent = `No. ${project.number} · ${project.meta}`;
  document.getElementById("projectTitle").innerHTML = `${project.title}<br><span>${project.subtitle}</span>`;
  document.getElementById("projectSummary").textContent = project.concept;
  document.getElementById("projectType").textContent = project.type || project.meta;
  document.getElementById("projectDisciplines").textContent = project.disciplines || project.category;
  document.getElementById("projectTools").textContent = project.tools || "Design & Visual Production";

  const image = document.getElementById("projectImage");
  image.dataset.fallbackApplied = "";
  image.src = detailImageUrl(project.image_path);
  image.alt = `${project.title} 專案視覺`;
  image.onerror = () => {
    if (image.dataset.fallbackApplied || !project.fallback_image_path) return;
    image.dataset.fallbackApplied = "true";
    image.src = detailImageUrl(project.fallback_image_path);
  };

  document.getElementById("projectConcept").textContent = project.concept;
  document.getElementById("projectDirections").innerHTML =
    project.directions.map(item => `<li>${item}</li>`).join("");
  document.getElementById("projectContent").textContent = project.content;
  document.getElementById("projectDetails").innerHTML =
    project.details.map(([title, detail]) =>
      `<div class="project-detail"><strong>${title}</strong><span>${detail}</span></div>`
    ).join("");
  document.getElementById("projectPresentation").textContent = project.presentation;
  ["projectBehance", "projectBehanceBottom"].forEach(elementId => {
    document.getElementById(elementId).href = project.behance_url;
  });
  main.setAttribute("aria-busy", "false");
}

window.PortfolioContent.load((payload, source) => {
  const project = payload.projects.find(item => item.id === id && item.published);
  if (project) {
    renderProject(project);
  } else if (source === "remote" || !payload.projects.length) {
    renderUnavailable();
  }
});
