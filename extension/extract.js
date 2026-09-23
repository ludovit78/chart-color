function chartColorDeep(obj, keys) {
  if (!obj || typeof obj !== "object") return null;
  for (const k of keys) {
    if (typeof obj[k] === "string" && obj[k].trim().length > 8) return obj[k];
  }
  if (Array.isArray(obj)) {
    for (const v of obj) {
      const hit = chartColorDeep(v, keys);
      if (hit) return hit;
    }
    return null;
  }
  for (const v of Object.values(obj)) {
    const hit = chartColorDeep(v, keys);
    if (hit) return hit;
  }
  return null;
}
function chartColorCleanUg(text) {
  return String(text || "")
    .replace(/\[\/?(tab)\]/gi, "")
    .replace(/\[ch\]/gi, "")
    .replace(/\[\/ch\]/gi, "")
    .replace(/\r\n/g, "\n")
    .trim();
}
function chartColorFromStore() {
  const el = document.querySelector(".js-store, [data-content]");
  if (!el) return null;
  const raw = el.getAttribute("data-content");
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    const title = chartColorDeep(data, ["song_name", "songName", "title"]) || "";
    const artist = chartColorDeep(data, ["artist_name", "artistName", "artist"]) || "";
    const key = chartColorDeep(data, ["tonality_name", "tonality", "key"]) || "";
    const content = chartColorCleanUg(
      chartColorDeep(data, ["content", "wiki_tab", "text"]) || ""
    );
    if (!content) return null;
    return [title, artist, key ? "Key: " + key : ""].filter(Boolean).join("\n") + "\n\n" + content;
  } catch (e) {
    return null;
  }
}
function chartColorFromDom() {
  const picks = document.querySelectorAll(
    "pre, code, [class*='tablature'], [class*='js-tab-content'], [class*='tab-content'], [class*='chord-sheet'], [class*='cifra_cnt'], [class*='cifra']"
  );
  let best = "";
  picks.forEach((n) => {
    const t = (n.innerText || "").trim();
    if (t.length > best.length) best = t;
  });
  const sel = (window.getSelection && String(window.getSelection()).trim()) || "";
  if (sel.length > best.length) best = sel;
  if (!best) return null;
  const title = (document.querySelector("h1") || {}).innerText || document.title;
  return String(title).trim() + "\n\n" + best;
}
function chartColorExtract() {
  return (chartColorFromStore() || chartColorFromDom() || "").trim();
}
