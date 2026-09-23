const APP = "https://ludovit78.github.io/chart-color/";

async function grab(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    files: ["extract.js"]
  });
  return result || "";
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  let text = "";
  try {
    text = await grab(tab.id);
  } catch (e) {
    text = "";
  }
  if (!text.trim()) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => alert("No chord chart found on this page. Open a chords tab, then try again.")
    });
    return;
  }
  const url = APP + "#import=" + encodeURIComponent(text);
  chrome.tabs.create({ url });
});
