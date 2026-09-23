const SAMPLE=`The Girl From Next Door\nTraditional / Demo\nKey: F\n\nVerse:\n   Fmaj7          G7          Gm7         C7\nTall and tan and young and lovely\n`;
const AMAZING=`Amazing Grace\nJohn Newton\nKey: G\n\nVerse 1:\n[G]Amazing [G7]grace, how [C]sweet the [G]sound\nThat saved a wretch like [D]me\nI [G]once was [G7]lost, but [C]now am [G]found\nWas [Em]blind, but [D]now I [G]see\n`;
let state={raw:SAMPLE,parsed:null,styled:null,style:"bossa",density:2};
const $=s=>document.querySelector(s);
function renderStyleButtons(){
  const box=$("#styles");
  if(!box||typeof STYLES==="undefined")return;
  box.innerHTML="";
  Object.values(STYLES).forEach(st=>{
    const b=document.createElement("button");
    b.type="button";
    b.className="style"+(state.style===st.id?" on":"");
    b.innerHTML="<b>"+st.name+"</b><small>"+st.tags.join(" · ")+"</small>";
    b.onclick=()=>{state.style=st.id;renderStyleButtons();restyle();};
    box.appendChild(b);
  });
}
function renderDensity(){$("#dens").querySelectorAll("button").forEach(b=>b.classList.toggle("on",Number(b.dataset.d)===state.density));}
function parseCurrent(){state.parsed=parseSongText(state.raw);restyle();}
function restyle(){if(!state.parsed)state.parsed=parseSongText(state.raw);state.styled=applyStyleToSong(state.parsed,state.style,state.density);renderChart();}
function renderChart(){const song=state.styled;if(!song)return;const m=song.meta||{};$("#titleOut").textContent=m.title||"Untitled chart";$("#byOut").textContent=[m.artist,m.author].filter(Boolean).join(" — ");$("#badgeKey").textContent="Key "+(m.key||"?");$("#badgeStyle").textContent=m.style||((STYLES[state.style]||{}).name||"Style");const dens=$("#badgeDens");if(dens)dens.textContent=["Paint","Light","Medium","Full"][state.density]||"Medium";const body=$("#chartBody");body.innerHTML="";for(const sec of song.sections){if(sec.name){const h=document.createElement("div");h.className="section-name";h.textContent=sec.name;body.appendChild(h);}for(const line of sec.lines){if(line.type==="blank")continue;const row=document.createElement("div");row.className="lyric-block";(line.parts||[]).forEach(p=>{const wrap=document.createElement("span");wrap.className="pair";const ch=document.createElement("span");ch.className="ch"+(p.generated?" gen":"");ch.textContent=p.chord||"\u00a0";const ly=document.createElement("span");ly.className="ly";ly.textContent=p.lyric||"";wrap.append(ch,ly);row.appendChild(wrap);});body.appendChild(row);}}}
function downloadText(filename,text){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"text/plain"}));a.download=filename;a.click();}
function slug(s){return (s||"chart").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}
function looksBinary(bytes){
  const n=Math.min(bytes.length,800);
  let weird=0;
  for(let i=0;i<n;i++){const b=bytes[i];if(b===0)return true;if(b<9||(b>13&&b<32))weird++;}
  return weird>n*0.15;
}
function decodeText(buf){
  const bytes=new Uint8Array(buf);
  if(bytes.length>=2&&bytes[0]===0xFF&&bytes[1]===0xFE)return new TextDecoder("utf-16le").decode(buf);
  if(bytes.length>=2&&bytes[0]===0xFE&&bytes[1]===0xFF)return new TextDecoder("utf-16be").decode(buf);
  if(bytes.length>=2&&bytes[1]===0&&bytes[0]>=0x20)return new TextDecoder("utf-16le").decode(buf);
  return new TextDecoder("utf-8").decode(buf).replace(/^\uFEFF/,"");
}
async function handleFiles(files){
  const file=files&&files[0];
  if(!file)return;
  const name=(file.name||"").toLowerCase();
  try{
    const buf=await file.arrayBuffer();
    const bytes=new Uint8Array(buf);
    if(name.endsWith(".pdf")||(bytes[0]===0x25&&bytes[1]===0x50&&bytes[2]===0x44&&bytes[3]===0x46)){
      await loadPdfFromBuffer(buf);
      return;
    }
    if(name.endsWith(".zip")||(bytes[0]===0x50&&bytes[1]===0x4B)){
      alert("That is a ZIP / OnSong set. Export one song as OnSong, ChordPro, or Text — not Archive and not ZIP.");
      return;
    }
    if(looksBinary(bytes)){
      alert("That looks like an OnSong Archive (binary). In OnSong: Share → OnSong or ChordPro or Plain Text.");
      return;
    }
    const text=decodeText(buf);
    if(!text.trim()){
      alert("File was empty after reading. Export again as OnSong or ChordPro.");
      return;
    }
    loadChartText(text);
  }catch(e){
    alert("Could not read that file. Export from OnSong as OnSong or ChordPro text.");
  }
}
function loadChartText(text){state.raw=String(text||"").replace(/\r\n/g,"\n");const box=$("#src");if(box)box.value=state.raw;parseCurrent();}
function takeIncomingChart(){
  try{
    const q=new URLSearchParams(location.search);
    const fromQ=q.get("chart")||q.get("import");
    if(fromQ){loadChartText(fromQ);history.replaceState({},"",location.pathname);return;}
  }catch(e){}
  try{
    const h=location.hash||"";
    const m=h.match(/^#(?:chart|import)=([\s\S]+)/);
    if(m){loadChartText(decodeURIComponent(m[1]));history.replaceState({},"",location.pathname);}
  }catch(e){}
}
window.addEventListener("message",ev=>{
  const d=ev.data;
  if(!d||d.type!=="chart-color-import")return;
  if(typeof d.text==="string"&&d.text.trim())loadChartText(d.text);
});
async function loadPdfFromBuffer(buf){
  if(!window.pdfjsLib){alert("PDF engine still loading — wait a second and try again.");return;}
  const pdf=await pdfjsLib.getDocument({data:buf}).promise;
  let text="";
  for(let i=1;i<=pdf.numPages;i++){
    const page=await pdf.getPage(i);
    const content=await page.getTextContent();
    text+=extractTextFromPdfItems(content.items)+"\n\n";
  }
  loadChartText(text.trim()+"\n");
}
function wire(){
  renderStyleButtons();
  renderDensity();
  $("#src").value=state.raw;
  $("#dens").onclick=e=>{const b=e.target.closest("button");if(!b)return;state.density=Number(b.dataset.d);renderDensity();restyle();};
  $("#src").addEventListener("input",e=>state.raw=e.target.value);
  $("#go").onclick=parseCurrent;
  $("#sampleBossa").onclick=()=>{state.raw=SAMPLE;$("#src").value=SAMPLE;state.style="bossa";renderStyleButtons();parseCurrent();};
  $("#sampleGrace").onclick=()=>{state.raw=AMAZING;$("#src").value=AMAZING;state.style="gospel";renderStyleButtons();parseCurrent();};
  const paste=$("#pasteClip");
  if(paste)paste.onclick=async()=>{try{const t=await navigator.clipboard.readText();if(t&&t.trim())loadChartText(t);else alert("Clipboard is empty.");}catch(e){alert("Paste into the box instead.");}};
  $("#dlCho").onclick=()=>{if(!state.styled)parseCurrent();downloadText(slug(state.styled.meta.title)+".cho",toChordPro(state.styled));};
  $("#dlOnsong").onclick=()=>{if(!state.styled)parseCurrent();downloadText(slug(state.styled.meta.title)+".onsong",toOnSong(state.styled));};
  $("#dlTxt").onclick=()=>{if(!state.styled)parseCurrent();downloadText(slug(state.styled.meta.title)+"-chart.txt",toAlignedChart(state.styled));};
  $("#printBtn").onclick=()=>window.print();
  const drop=$("#drop"),file=$("#file");
  drop.onclick=()=>file.click();
  file.onchange=()=>handleFiles(file.files);
  drop.addEventListener("drop",e=>{e.preventDefault();handleFiles(e.dataTransfer.files);});
  ["dragover","dragenter"].forEach(ev=>drop.addEventListener(ev,e=>e.preventDefault()));
  takeIncomingChart();
  parseCurrent();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",wire);else wire();
