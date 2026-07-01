(function () {
  const config = window.PORTFOLIO_PRICING_CONFIG || {};

  const normalizeBoolean = value =>
    value === true || value === 1 || String(value).toLowerCase() === "true";

  const splitList = value => {
    if (Array.isArray(value)) return value.map(String).map(item => item.trim()).filter(Boolean);
    return String(value || "")
      .split(/\n|;|；/)
      .map(item => item.trim())
      .filter(Boolean);
  };

  const normalizePlan = plan => ({
    ...plan,
    published: normalizeBoolean(plan.published),
    sort_order: Number(plan.sort_order) || 999,
    price_from: Number(String(plan.price_from || "").replace(/[,，]/g, "")) || 0,
    price_to: Number(String(plan.price_to || "").replace(/[,，]/g, "")) || 0,
    deliverables: splitList(plan.deliverables)
  });

  const validatePayload = payload => {
    const rows = payload?.pricing || payload?.plans || payload?.items;
    if (!Array.isArray(rows)) throw new Error("Invalid pricing payload");
    const pricing = rows
      .map(normalizePlan)
      .filter(plan =>
        plan.published &&
        plan.service_name &&
        plan.category &&
        plan.description
      )
      .sort((a, b) => a.sort_order - b.sort_order);
    if (!pricing.length) throw new Error("Pricing payload has no valid plans");
    return { version: payload.version || "unknown", pricing };
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
      // Keep the page usable when storage is unavailable.
    }
  };

  window.PricingContent = {
    async load(onUpdate) {
      const cached = readCache();
      if (cached) onUpdate(cached, "cache");

      let fallback = null;
      try {
        fallback = await fetchJson(config.fallbackUrl);
        if (!cached) onUpdate(fallback, "fallback");
      } catch (error) {
        console.warn("Pricing fallback unavailable", error);
      }

      if (!config.apiUrl) return cached || fallback;

      try {
        const remote = await fetchJson(config.apiUrl);
        writeCache(remote);
        onUpdate(remote, "remote");
        return remote;
      } catch (error) {
        console.warn("Pricing API unavailable; using fallback", error);
        return cached || fallback;
      }
    }
  };
})();
