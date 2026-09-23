chrome.storage.local.get("pendingChart", function (data) {
  const text = data && data.pendingChart;
  if (!text) return;
  window.postMessage({ type: "chart-color-import", text: text }, "*");
  chrome.storage.local.remove("pendingChart");
});
