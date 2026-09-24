const SAMPLE=`The Girl From Next Door\nTraditional / Demo\nKey: F\n\nVerse:\n   Fmaj7          G7          Gm7         C7\nTall and tan and young and lovely\n`;
const AMAZING=`Amazing Grace\nJohn Newton\nKey: G\n\nVerse 1:\n[G]Amazing [G7]grace, how [C]sweet the [G]sound\nThat saved a wretch like [D]me\nI [G]once was [G7]lost, but [C]now am [G]found\nWas [Em]blind, but [D]now I [G]see\n`;
const LIB_KEY="chartColor.library.v1";
let state={raw:"",parsed:null,styled:null,style:"bossa",density:2};
let selectedLib=new Set();
const $=s=>document.querySelector(s);
function loadLib(){try{return JSON.parse(localStorage.getItem(LIB_KEY)||"[]");}catch(e){return [];}}
function saveLibStore(list){localStorage.setItem(LIB_KEY,JSON.stringify(list));renderLib();}
function renderStyleButtons(){
  const box=$("#styles");if(!box||typeof STYLES==="undefined")return;
  box.innerHTML="";
  Object.values(STYLES).forEach(st=>{
    const b=document.createElement("button");
    b.type="button";b.className="style"+(state.style===st.id?" on":"");
    b.innerHTML="<b>"+st.name+"</b><small>"+st.tags.join(" · ")+"</small>";
    b.onclick=()=>{state.style=st.id;renderStyleButtons();if(state.raw.trim())restyle();};
    box.appendChild(b);
  });
}
function renderDensity(){$("#dens").querySelectorAll("button").forEach(b=>b.classList.toggle("on",Number(b.dataset.d)===state.density));}
function parseCurrent(){if(!state.raw.trim()){state.parsed=null;state.styled=null;$("#chartBody").innerHTML="";$("#titleOut").textContent="Empty chart";return;}state.parsed=parseSongText(state.raw);restyle();}
function restyle(){if(!state.parsed)state.parsed=parseSongText(state.raw);state.styled=applyStyleToSong(state.parsed,state.style,state.density);renderChart();}
function renderChart(){
  const song=state.styled;if(!song)return;
  const m=song.meta||{};
  $("#titleOut").textContent=m.title||"Untitled chart";
  $("#byOut").textContent=[m.artist,m.author].filter(Boolean).join(" — ");
  $("#badgeKey").textContent="Key "+(m.key||"?");
  $("#badgeStyle").textContent=m.style||((STYLES[state.style]||{}).name||"Style");
  const dens=$("#badgeDens");if(dens)dens.textContent=["Paint","Light","Medium","Full"][state.density]||"Medium";
  const body=$("#chartBody");body.innerHTML="";
  for(const sec of song.sections){
    if(sec.name){const h=document.createElement("div");h.className="section-name";h.textContent=sec.name;body.appendChild(h);}
    for(const line of sec.lines){
      if(line.type==="blank")continue;
      const row=document.createElement("div");row.className="lyric-block";
      (line.parts||[]).forEach(p=>{
        const wrap=document.createElement("span");wrap.className="pair";
        const ch=document.createElement("span");ch.className="ch"+(p.generated?" gen":"");ch.textContent=p.chord||"\u00a0";
        const ly=document.createElement("span");ly.className="ly";ly.textContent=p.lyric||"";
        wrap.append(ch,ly);row.appendChild(wrap);
      });
      body.appendChild(row);
    }
  }
}
function downloadText(filename,text){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"text/plain"}));a.download=filename;a.click();}
function slug(s){return (s||"chart").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}
function looksBinary(bytes){const n=Math.min(bytes.length,800);let weird=0;for(let i=0;i<n;i++){const b=bytes[i];if(b===0)return true;if(b<9||(b>13&&b<32))weird++;}return weird>n*0.15;}
function decodeText(buf){const bytes=new Uint8Array(buf);if(bytes.length>=2&&bytes[0]===0xFF&&bytes[1]===0xFE)return new TextDecoder("utf-16le").decode(buf);if(bytes.length>=2&&bytes[0]===0xFE&&bytes[1]===0xFF)return new TextDecoder("utf-16be").decode(buf);if(bytes.length>=2&&bytes[1]===0&&bytes[0]>=0x20)return new TextDecoder("utf-16le").decode(buf);return new TextDecoder("utf-8").decode(buf).replace(/^\uFEFF/,"");}
async function handleFiles(files){
  const file=files&&files[0];if(!file)return;
  const name=(file.name||"").toLowerCase();
  try{
    const buf=await file.arrayBuffer();const bytes=new Uint8Array(buf);
    if(name.endsWith(".pdf")||(bytes[0]===0x25&&bytes[1]===0x50)){await loadPdfFromBuffer(buf);resetFileInput();return;}
    if(name.endsWith(".zip")||(bytes[0]===0x50&&bytes[1]===0x4B)){alert("ZIP / Archive not supported. Export OnSong, ChordPro, or Text.");resetFileInput();return;}
    if(looksBinary(bytes)){alert("That looks like an OnSong Archive. Share as OnSong or ChordPro.");resetFileInput();return;}
    const text=decodeText(buf);if(!text.trim()){alert("File was empty.");resetFileInput();return;}
    loadChartText(text);resetFileInput();
  }catch(e){alert("Could not read that file.");resetFileInput();}
}
function resetFileInput(){const f=$("#file");if(f)f.value="";}
function loadChartText(text){state.raw=String(text||"").replace(/\r\n/g,"\n");const box=$("#src");if(box)box.value=state.raw;parseCurrent();}
function clearSource(){
  state.raw="";state.parsed=null;state.styled=null;
  const box=$("#src");if(box)box.value="";
  resetFileInput();
  $("#chartBody").innerHTML="";
  $("#titleOut").textContent="Cleared — load another song";
  $("#byOut").textContent="";
  clearCompare();
}
function clearCompare(){
  selectedLib=new Set();
  const wrap=$("#compareWrap");
  if(wrap){wrap.hidden=true;wrap.innerHTML="";}
  renderLib();
}
function currentTitle(){return (state.styled&&state.styled.meta&&state.styled.meta.title)||"Untitled";}
function saveCurrent(){
  if(!state.raw.trim()){alert("Nothing to save.");return;}
  if(!state.styled)parseCurrent();
  const item={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),title:currentTitle(),style:(STYLES[state.style]||{}).name||state.style,density:state.density,raw:state.raw,styled:state.styled?toAlignedChart(state.styled):state.raw,savedAt:new Date().toISOString()};
  saveLibStore([item].concat(loadLib()).slice(0,40));
}
function renderLib(){
  const box=$("#libList");if(!box)return;const list=loadLib();
  box.innerHTML="";
  if(!list.length){box.innerHTML="<div class='lib-item'>Empty. Save a styled chart to compare later.</div>";return;}
  list.forEach(item=>{
    const row=document.createElement("div");row.className="lib-item";
    const cb=document.createElement("input");cb.type="checkbox";cb.checked=selectedLib.has(item.id);
    cb.onchange=()=>{if(cb.checked)selectedLib.add(item.id);else selectedLib.delete(item.id);};
    const meta=document.createElement("div");meta.style.flex="1";
    meta.innerHTML="<b>"+item.title+"</b><span>"+item.style+" · "+["Paint","Light","Medium","Full"][item.density||0]+"</span>";
    meta.onclick=()=>loadChartText(item.raw);
    const del=document.createElement("button");del.className="btn ghost";del.type="button";del.textContent="x";
    del.onclick=e=>{e.stopPropagation();saveLibStore(loadLib().filter(x=>x.id!==item.id));selectedLib.delete(item.id);};
    row.append(cb,meta,del);box.appendChild(row);
  });
}
function compareSelected(){
  const list=loadLib().filter(x=>selectedLib.has(x.id));
  if(list.length<2){alert("Tick two library items, then Compare.");return;}
  const wrap=$("#compareWrap");wrap.hidden=false;wrap.innerHTML="";
  const bar=document.createElement("div");bar.className="compare-bar";
  bar.innerHTML="<span>Compare</span>";
  const clr=document.createElement("button");clr.type="button";clr.className="btn ghost";clr.textContent="Clear compare";clr.onclick=clearCompare;
  bar.appendChild(clr);wrap.appendChild(bar);
  const grid=document.createElement("div");grid.className="compare-grid";
  list.slice(0,2).forEach(item=>{const col=document.createElement("div");col.className="col";col.textContent=item.title+" — "+item.style+"\n\n"+(item.styled||item.raw);grid.appendChild(col);});
  wrap.appendChild(grid);
}
function botSay(text,mine){
  const log=$("#botLog");if(!log)return;
  const p=document.createElement("div");
  p.style.color=mine?"#d4a054":"#f3ead9";
  p.textContent=(mine?"You: ":"Bot: ")+text;
  log.appendChild(p);log.scrollTop=log.scrollHeight;
}
function clearBotLog(){const log=$("#botLog");if(log)log.innerHTML="";}
function askBot(q){
  const prompt=q||($("#botIn")&&$("#botIn").value)||"";
  if(!prompt.trim())return;
  botSay(prompt,true);
  if(!state.parsed&&state.raw.trim())state.parsed=parseSongText(state.raw);
  const ctx={key:state.styled&&state.styled.meta&&state.styled.meta.key,parsed:state.parsed,raw:state.raw};
  const res=theoryReply(prompt,ctx);
  botSay(res.say,false);
  if(res.style){state.style=res.style;renderStyleButtons();}
  if(res.density!=null){state.density=res.density;renderDensity();}
  if(res.applyToSong&&res.parsed){
    state.parsed=res.parsed;
    restyle();
    if(state.styled){
      state.raw=toChordPro(state.styled);
      const box=$("#src");if(box)box.value=state.raw;
    }
  }else if(res.chart){
    loadChartText(res.chart);
  }else if(res.style||res.density!=null){
    if(state.raw.trim())restyle();
  }
  if($("#botIn"))$("#botIn").value="";
}
function takeIncomingChart(){
  try{const q=new URLSearchParams(location.search);const fromQ=q.get("chart")||q.get("import");if(fromQ){loadChartText(fromQ);history.replaceState({},"",location.pathname);return;}}catch(e){}
  try{const h=location.hash||"";const m=h.match(/^#(?:chart|import)=([\s\S]+)/);if(m){loadChartText(decodeURIComponent(m[1]));history.replaceState({},"",location.pathname);}}catch(e){}
}
window.addEventListener("message",ev=>{const d=ev.data;if(!d||d.type!=="chart-color-import")return;if(typeof d.text==="string"&&d.text.trim())loadChartText(d.text);});
async function loadPdfFromBuffer(buf){if(!window.pdfjsLib){alert("PDF engine still loading");return;}const pdf=await pdfjsLib.getDocument({data:buf}).promise;let text="";for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i);const content=await page.getTextContent();text+=extractTextFromPdfItems(content.items)+"\n\n";}loadChartText(text.trim()+"\n");}
function wire(){
  renderStyleButtons();renderDensity();renderLib();
  $("#src").value=state.raw;
  $("#dens").onclick=e=>{const b=e.target.closest("button");if(!b)return;state.density=Number(b.dataset.d);renderDensity();if(state.raw.trim())restyle();};
  $("#src").addEventListener("input",e=>state.raw=e.target.value);
  $("#go").onclick=parseCurrent;
  $("#clearSrc").onclick=clearSource;
  $("#saveLib").onclick=saveCurrent;
  $("#compareBtn").onclick=compareSelected;
  const cc=$("#clearCompare");if(cc)cc.onclick=clearCompare;
  $("#sampleBossa").onclick=()=>{state.style="bossa";renderStyleButtons();loadChartText(SAMPLE);};
  $("#sampleGrace").onclick=()=>{state.style="gospel";renderStyleButtons();loadChartText(AMAZING);};
  const paste=$("#pasteClip");if(paste)paste.onclick=async()=>{try{const t=await navigator.clipboard.readText();if(t&&t.trim())loadChartText(t);else alert("Clipboard empty");}catch(e){alert("Paste into the box");}};
  $("#dlCho").onclick=()=>{if(!state.styled)parseCurrent();if(state.styled)downloadText(slug(currentTitle())+".cho",toChordPro(state.styled));};
  $("#dlOnsong").onclick=()=>{if(!state.styled)parseCurrent();if(state.styled)downloadText(slug(currentTitle())+".onsong",toOnSong(state.styled));};
  $("#dlTxt").onclick=()=>{if(!state.styled)parseCurrent();if(state.styled)downloadText(slug(currentTitle())+"-chart.txt",toAlignedChart(state.styled));};
  $("#printBtn").onclick=()=>window.print();
  $("#botGo").onclick=()=>askBot();
  const clearBot=$("#clearBot");if(clearBot)clearBot.onclick=clearBotLog;
  $("#botIn").addEventListener("keydown",e=>{if(e.key==="Enter")askBot();});
  const chips=$("#botChips");
  [["This song in Em, light jazz","give me this song in Em, light jazz style"],["This song in F bossa","this song in F, bossa style"],["This song gospel medium","this song in gospel style, medium"],["ii-V-I in Bb","ii-V-I in Bb"]].forEach(([label,q])=>{const b=document.createElement("button");b.type="button";b.className="chip";b.textContent=label;b.onclick=()=>askBot(q);chips.appendChild(b);});
  botSay("Load a song, then type: this song in Em, light jazz style. I transpose the chart and color the chords.",false);
  const drop=$("#drop"),file=$("#file");
  drop.onclick=()=>file.click();
  file.onchange=()=>handleFiles(file.files);
  drop.addEventListener("drop",e=>{e.preventDefault();handleFiles(e.dataTransfer.files);});
  ["dragover","dragenter"].forEach(ev=>drop.addEventListener(ev,e=>e.preventDefault()));
  takeIncomingChart();
  if(state.raw)parseCurrent();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",wire);else wire();
