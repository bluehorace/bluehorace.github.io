(function () {
  const config = window.PORTFOLIO_CONTENT_CONFIG || {};
  const isDetailPage = /\/projects\//.test(location.pathname);
  const fallbackUrl = isDetailPage ? config.detailFallbackUrl : config.fallbackUrl;

  const normalizeBoolean = value =>
    value === true || value === 1 || String(value).toLowerCase() === "true";

  const normalizeProject = project => ({
    ...project,
    number: String(project.number || "").padStart(2, "0"),
    published: normalizeBoolean(project.published),
    featured: normalizeBoolean(project.featured),
    sort_order: Number(project.sort_order) || 999,
    featured_order: Number(project.featured_order) || 999,
    directions: Array.isArray(project.directions) ? project.directions.filter(Boolean) : [],
    details: Array.isArray(project.details) ? project.details.filter(item => Array.isArray(item) && item[0]) : []
  });

  const validatePayload = payload => {
    if (!payload || !Array.isArray(payload.projects)) throw new Error("Invalid portfolio payload");
    const projects = payload.projects.map(normalizeProject).filter(project =>
      project.id &&
      project.number &&
      project.title &&
      project.category &&
      project.image_path &&
      project.concept &&
      project.directions.length === 3 &&
      project.details.length === 3
    );
    if (!projects.length) throw new Error("Portfolio payload has no valid projects");
    return { version: payload.version || "unknown", projects };
  };

  const fetchJson = async (url, timeoutMs = config.timeoutMs || 6000) => {
    if (!url) throw new Error("Missing URL");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      return validatePayload(await response.json());
    } finally {
      clearTimeout(timer);
    }
  };

  const readCache = () => {
    try {
      const cached = JSON.parse(localStorage.getItem(config.cacheKey));
      return validatePayload(cached);
    } catch {
      return null;
    }
  };

  const writeCache = payload => {
    try {
      localStorage.setItem(config.cacheKey, JSON.stringify(payload));
    } catch {
      // Browsing remains functional when storage is unavailable.
    }
  };

  window.PortfolioContent = {
    async load(onUpdate) {
      const cached = readCache();
      if (cached) onUpdate(cached, "cache");

      let fallback = null;
      try {
        fallback = await fetchJson(fallbackUrl);
        if (!cached) onUpdate(fallback, "fallback");
      } catch (error) {
        console.warn("Portfolio fallback unavailable", error);
      }

      if (!config.apiUrl) return cached || fallback;

      try {
        const remote = await fetchJson(config.apiUrl);
        writeCache(remote);
        onUpdate(remote, "remote");
        return remote;
      } catch (error) {
        console.warn("Portfolio API unavailable; using fallback", error);
        return cached || fallback;
      }
    }
  };
})();
