function findDeep(obj, keys) {
  if (!obj || typeof obj !== "object") return null;
  for (const k of keys) if (typeof obj[k] === "string" && obj[k].trim()) return obj[k];
  for (const v of Object.values(obj)) {
    const hit = findDeep(v, keys);
    if (hit) return hit;
  }
  return null;
}

function fromUgStore() {
  const el = document.querySelector(".js-store, [data-content]");
  if (!el) return null;
  const raw = el.getAttribute("data-content") || el.dataset.content;
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    const title = findDeep(data, ["song_name", "songName", "title"]);
    const artist = findDeep(data, ["artist_name", "artistName", "artist"]);
    const key = findDeep(data, ["tonality_name", "tonality", "key"]);
    let content = findDeep(data, ["content", "wiki_tab", "text"]);
    if (content && content.includes("[tab]")) {
      content = content.replace(/\[\/?(tab|ch)\]/g, "");
    }
    if (!content) return null;
    const head = [title, artist, key ? "Key: " + key : ""].filter(Boolean).join("\n");
    return (head ? head + "\n\n" : "") + content.replace(/\r\n/g, "\n").trim();
  } catch (e) {
    return null;
  }
}

function fromVisibleSheet() {
  const nodes = document.querySelectorAll(
    "pre, [class*='tablature'], [class*='js-tab-content'], [class*='chord-sheet'], [class*='cifra']"
  );
  let best = "";
  nodes.forEach((n) => {
    const t = (n.innerText || "").trim();
    if (t.length > best.length) best = t;
  });
  const title =
    document.querySelector("h1")?.innerText?.trim() ||
    document.title.replace(/\s*[|\-].*$/, "");
  if (!best) best = window.getSelection()?.toString()?.trim() || "";
  if (!best) return null;
  return title + "\n\n" + best;
}

(() => {
  const text = fromUgStore() || fromVisibleSheet();
  return text && text.trim() ? text.trim() : "";
})();
