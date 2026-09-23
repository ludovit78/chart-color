(function () {
  if (document.getElementById("chart-color-send")) return;
  const btn = document.createElement("button");
  btn.id = "chart-color-send";
  btn.type = "button";
  btn.textContent = "Send to Chart Color";
  btn.style.cssText = [
    "position:fixed","z-index:2147483647","right:16px","bottom:16px",
    "padding:12px 16px","border:0","border-radius:999px",
    "background:#c47a2c","color:#1a1410","font:700 14px/1 system-ui,sans-serif",
    "box-shadow:0 8px 24px rgba(0,0,0,.35)","cursor:pointer"
  ].join(";");
  btn.addEventListener("click", function () {
    const text = chartColorExtract();
    if (!text) {
      alert("No chord chart found on this page. Open the actual chords tab, not the search list.");
      return;
    }
    btn.textContent = "Sending…";
    chrome.runtime.sendMessage({ type: "chart-color-send", text: text }, function () {
      btn.textContent = "Sent";
      setTimeout(function () { btn.textContent = "Send to Chart Color"; }, 1500);
    });
  });
  document.documentElement.appendChild(btn);
})();
