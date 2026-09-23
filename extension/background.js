const APP = "https://ludovit78.github.io/chart-color/?from=ext=1";

function openWith(text) {
  chrome.storage.local.set({ pendingChart: text }, function () {
    chrome.tabs.create({ url: APP });
  });
}

chrome.runtime.onMessage.addListener(function (msg, _sender, sendResponse) {
  if (msg && msg.type === "chart-color-send" && msg.text) {
    openWith(msg.text);
    if (sendResponse) sendResponse({ ok: true });
  }
  return true;
});

chrome.action.onClicked.addListener(async function (tab) {
  if (!tab || !tab.id) return;
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: function () {
        if (typeof chartColorExtract === "function") return chartColorExtract();
        const sel = window.getSelection ? String(window.getSelection()) : "";
        const pre = document.querySelector("pre");
        return (sel || (pre && pre.innerText) || document.body.innerText || "").trim();
      }
    });
    if (!result) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function () { alert("No chord chart found."); }
      });
      return;
    }
    openWith(result);
  } catch (e) {
    chrome.tabs.create({ url: APP });
  }
});
