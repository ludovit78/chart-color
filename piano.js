const WHITE_PC=[0,2,4,5,7,9,11];
const BLACK_PC=[1,3,6,8,10];
function chordIntervals(ch){
  if(!ch||!ch.root||ch.kind==="nc")return [];
  const q=String(ch.quality||"").toLowerCase();
  let iv;
  if(ch.kind==="dim"||/^dim/.test(q))iv=/7/.test(q)?[0,3,6,9]:[0,3,6];
  else if(ch.kind==="aug"||/^aug|^\+/.test(q))iv=[0,4,8];
  else if(ch.kind==="m7b5"||/m7b5|0/.test(q))iv=[0,3,6,10];
  else if(ch.kind==="sus2"||/sus2/.test(q))iv=[0,2,7];
  else if(/7sus|sus4.*7|sus7/.test(q)||(ch.kind==="sus4"&&/7/.test(q)))iv=[0,5,7,10];
  else if(ch.kind==="sus4"||/^sus/.test(q))iv=[0,5,7];
  else if(/maj9|maj7.*9/.test(q))iv=[0,4,7,11,2];
  else if(/maj7|maj/.test(q))iv=[0,4,7,11];
  else if(/m11/.test(q))iv=[0,3,7,10,2,5];
  else if(/m9/.test(q))iv=[0,3,7,10,2];
  else if(/m6/.test(q))iv=[0,3,7,9];
  else if(/^m7/.test(q)||(ch.kind==="min"&&/7/.test(q)))iv=[0,3,7,10];
  else if(ch.kind==="min")iv=[0,3,7];
  else if(/7#9|7b10/.test(q))iv=[0,4,7,10,3];
  else if(/13/.test(q))iv=[0,4,7,10,2,9];
  else if(/11/.test(q))iv=[0,4,7,10,2,5];
  else if(/9/.test(q)&&!/add/.test(q)&&!/^2$/.test(q))iv=[0,4,7,10,2];
  else if(/add9|^2$/.test(q))iv=[0,4,7,2];
  else if(/^6/.test(q))iv=[0,4,7,9];
  else if(/^7/.test(q)||ch.kind==="dom")iv=[0,4,7,10];
  else iv=[0,4,7];
  const root=noteIndex(ch.root);
  const pcs=[...new Set(iv.map(n=>(root+n)%12))];
  if(ch.bass)pcs.push(noteIndex(ch.bass));
  return [...new Set(pcs)];
}
function stackFromBass(pcs,bass){
  const b=((bass%12)+12)%12;
  return pcs.slice().sort((a,c)=>((a-b+12)%12)-((c-b+12)%12));
}
function voicingSet(ch){
  const pcs=chordIntervals(ch);
  if(!pcs.length)return [];
  const root=noteIndex(ch.root);
  const third=pcs.find(p=>p===(root+3)%12||p===(root+4)%12);
  const seventh=pcs.find(p=>p===(root+10)%12||p===(root+11)%12||p===(root+9)%12);
  const ninth=pcs.find(p=>p===(root+2)%12||p===(root+3)%12&&p!==third);
  const list=[];
  const names=["Root","1st inv","2nd inv","3rd inv"];
  const cycle=stackFromBass(pcs,root);
  cycle.forEach((bass,i)=>{
    if(i>=4)return;
    list.push({id:"inv"+i,label:names[i]||("Inv "+i),pcs,bass,hint:pitchName(bass,true)+" in the bass"});
  });
  if(ch.bass)list.unshift({id:"slash",label:"As written /"+ch.bass,pcs,bass:noteIndex(ch.bass),hint:"Slash bass as on the chart"});
  const shellPcs=[root,seventh,third].filter(n=>n!=null);
  if(shellPcs.length>=2)list.push({id:"shell",label:"Shell (R + 7 + 3)",pcs:[...new Set(shellPcs)],bass:root,hint:"Left hand root, right hand 7 and 3"});
  const color=[third,seventh,ninth].filter(n=>n!=null);
  if(color.length>=2)list.push({id:"color",label:"Color (3 + 7 + 9)",pcs:[...new Set(color)],bass:color[0],hint:"No root — band already has the bass"});
  return list;
}
function drawOctave(el,pcs,bass){
  el.innerHTML="";
  const board=document.createElement("div");board.className="kb";
  const whites=document.createElement("div");whites.className="kb-white";
  const blacks=document.createElement("div");blacks.className="kb-black";
  WHITE_PC.concat([12]).forEach((pc,i)=>{
    const real=pc%12;
    const k=document.createElement("div");
    k.className="k-w"+(pcs.includes(real)?" on":"")+(bass===real?" bass":"");
    k.innerHTML="<span>"+pitchName(real,false)+"</span>";
    whites.appendChild(k);
  });
  const blackSlots=[0,1,3,4,5];
  BLACK_PC.forEach((pc,i)=>{
    const k=document.createElement("div");
    k.className="k-b"+(pcs.includes(pc)?" on":"")+(bass===pc?" bass":"");
    k.style.left=(blackSlots[i]*(100/7)+9)+"%";
    blacks.appendChild(k);
  });
  board.append(whites,blacks);el.appendChild(board);
}
let pianoState={list:[],i:0,name:""};
function renderPianoSheet(){
  const v=pianoState.list[pianoState.i];if(!v)return;
  $("#pianoName").textContent=pianoState.name;
  $("#pianoHint").textContent=v.label+" — "+v.hint;
  drawOctave($("#pianoKb"),v.pcs,v.bass);
  const tabs=$("#pianoTabs");tabs.innerHTML="";
  pianoState.list.forEach((item,idx)=>{
    const b=document.createElement("button");
    b.type="button";b.className="chip"+(idx===pianoState.i?" on":"");
    b.textContent=item.label;
    b.onclick=()=>{pianoState.i=idx;renderPianoSheet();};
    tabs.appendChild(b);
  });
}
function openPiano(name){
  const ch=parseChord(name);
  const list=voicingSet(ch);
  if(!list.length)return;
  pianoState={list,i:0,name:name};
  $("#pianoSheet").hidden=false;
  renderPianoSheet();
}
function closePiano(){$("#pianoSheet").hidden=true;}
function bindChordHold(el){
  let t=null,moved=false;
  const start=e=>{
    if(!el.textContent||el.textContent==="\u00a0")return;
    moved=false;
    t=setTimeout(()=>{t=null;openPiano(el.textContent.trim());},420);
  };
  const cancel=()=>{if(t){clearTimeout(t);t=null;}};
  el.addEventListener("touchstart",start,{passive:true});
  el.addEventListener("touchend",cancel);
  el.addEventListener("touchmove",()=>{moved=true;cancel();});
  el.addEventListener("mousedown",start);
  el.addEventListener("mouseup",cancel);
  el.addEventListener("mouseleave",cancel);
  el.addEventListener("click",e=>{
    if(e.detail>=2){e.preventDefault();openPiano(el.textContent.trim());}
  });
}
