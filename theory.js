const THEORY_FORMS={
  "ii-v-i":{name:"ii–V–I",bars:["IIm7","V7","Imaj7","Imaj7"]},
  "turnaround":{name:"I–VI–II–V",bars:["Imaj7","VI7","IIm7","V7"]},
  "rhythm":{name:"Rhythm changes A",bars:["Imaj7","VI7","IIm7","V7","IIIm7","VI7","IIm7","V7"]},
  "bossa":{name:"Bossa cycle",bars:["Imaj7","Imaj7","IIm7","V7","Imaj7","VIm7","IIm7","V7"]},
  "blues":{name:"12-bar blues",bars:["I7","I7","I7","I7","IV7","IV7","I7","I7","V7","IV7","I7","V7"]},
  "gospel":{name:"Gospel 1–4 walk",bars:["I","I7","IV","IVmaj7","I","VI7","IIm7","V7"]},
  "neosoul":{name:"Neo-soul pocket",bars:["Imaj9","IIm11","V7sus4","Imaj9","VIm9","IIm11","V13","Imaj9"]},
  "pop":{name:"Pop 1–5–6–4",bars:["I","V","VIm","IV"]},
  "andalusian":{name:"Andalusian",bars:["Im","bVII","bVI","V7"]},
  "circle":{name:"Circle of fifths",bars:["Imaj7","IV7","VIImaj7","III7","VImaj7","II7","Vmaj7","I7"]}
};
const DEG={"I":0,"II":2,"III":4,"IV":5,"V":7,"VI":9,"VII":11,"bII":1,"bIII":3,"bV":6,"bVI":8,"bVII":10,"#IV":6};
function parseDegreeToken(tok){
  const m=String(tok).trim().match(/^(b|#)?(I{1,3}|IV|VI{0,2}|VII)(maj9|maj7|m11|m9|m7|sus4|7sus4|13|9|7|m)?$/i);
  if(!m)return null;
  return {roman:(m[1]||"")+m[2].toUpperCase(),q:m[3]||""};
}
function degreeToChord(token,keyRoot,flats){
  const p=parseDegreeToken(token);if(!p)return token;
  const off=DEG[p.roman];if(off===undefined)return token;
  return pitchName(noteIndex(keyRoot)+off,flats)+(p.q||"");
}
function formInKey(formId,keyRoot){
  const form=THEORY_FORMS[formId]||THEORY_FORMS["ii-v-i"];
  const flats=preferFlatsForKey(keyRoot,false);
  return {name:form.name,key:keyRoot,chords:form.bars.map(t=>degreeToChord(t,keyRoot,flats))};
}
function progressionToOnSong(title,key,chords,explain){
  const lines=[title,"Theory Bot","Key: "+key,"","Form:"];
  for(let i=0;i<chords.length;i+=4)lines.push(chords.slice(i,i+4).join("   "));
  lines.push("",explain||"");
  return lines.join("\n");
}
function parseTargetKey(s){
  const t=String(s||"");
  let m=t.match(/\b(?:in|to|key)\s+([A-G])([#b♯♭])?\s*(m|min|minor|maj|major)?\b/i);
  if(!m)m=t.match(/\b([A-G])([#b♯♭])(m)\b/i);
  if(!m)return null;
  const acc=(m[2]||"").replace("♯","#").replace("♭","b");
  const root=m[1].toUpperCase()+acc;
  const qual=(m[3]||"").toLowerCase();
  const minor=qual==="m"||qual==="min"||qual==="minor";
  return {root,minor,label:root+(minor?"m":"")};
}
function detectForm(s){
  const t=s.toLowerCase();
  if(/this song|this chart|imported|give me this|make this|put this/.test(t))return null;
  if(/12[- ]bar|blues/.test(t)&&!/style/.test(t))return "blues";
  if(/rhythm changes/.test(t))return "rhythm";
  if(/andalus|phryg/.test(t))return "andalusian";
  if(/circle of fifth/.test(t))return "circle";
  if(/turnaround/.test(t)&&!/this/.test(t))return "turnaround";
  if(/\bii-?v-?i\b|2-5-1|two five one/.test(t)&&!/this/.test(t))return "ii-v-i";
  return null;
}
function detectStyleHint(s){
  const t=s.toLowerCase();
  if(/bossa/.test(t))return "bossa";
  if(/light jazz|smooth jazz|jazz/.test(t))return "smooth-jazz";
  if(/gospel/.test(t))return "gospel";
  if(/neo|soul/.test(t))return "neo-soul";
  if(/ballad|pop/.test(t))return "pop-ballad";
  if(/funk/.test(t))return "funk";
  if(/blues/.test(t))return "blues";
  if(/latin|samba/.test(t))return "latin";
  if(/r\&?b|r and b/.test(t))return "rnb";
  if(/worship/.test(t))return "worship";
  if(/country/.test(t))return "country";
  return null;
}
function detectDensityHint(s){
  const t=s.toLowerCase();
  if(/paint only|just color|no extra/.test(t))return 0;
  if(/light/.test(t))return 1;
  if(/full|heavy|lots/.test(t))return 3;
  if(/medium/.test(t))return 2;
  return null;
}
function wantsCurrentChart(s){
  const t=s.toLowerCase();
  return /this song|this chart|the song|imported|give me this|make this|put this|transpose|restyle|in .+ style/.test(t);
}
function shiftName(name,semi,flats){return pitchName(noteIndex(name)+semi,flats);}
function transposeParsedSong(song,fromKey,toKey){
  const from=fromKey&&fromKey.root?fromKey:guessKey(collectChords(song),song.meta&&song.meta.key);
  const to=toKey;
  const semi=(noteIndex(to.root)-noteIndex(from.root)+12)%12;
  const flats=preferFlatsForKey(to.root,!!to.minor);
  const label=to.label||(to.root+(to.minor?"m":""));
  return {
    meta:{...song.meta,key:label},
    sections:(song.sections||[]).map(sec=>({
      name:sec.name,
      lines:(sec.lines||[]).map(line=>({
        type:line.type,
        parts:(line.parts||[]).map(p=>{
          if(!p.chord)return {...p};
          const c=parseChord(p.chord);
          if(!c||!c.root)return {...p};
          const moved={...c,root:shiftName(c.root,semi,flats),bass:c.bass?shiftName(c.bass,semi,flats):null};
          return {...p,chord:formatChord(moved,flats)};
        })
      }))
    })),
    source:song.source
  };
}
const WHY={
  "ii-v-i":"Classic cadence. ii sets subdominant color, V wants to resolve, I lands.",
  "turnaround":"VI7 is an applied dominant to ii. Walk 3rds or 7ths down.",
  "rhythm":"A-section of rhythm changes. Keep the 1–6–2–5 grid.",
  "bossa":"I stays open, then a soft ii–V. Do not rush the V.",
  "blues":"Dominant I, IV and V. Treat I7 as home.",
  "gospel":"I7 into IV is the handshake.",
  "neosoul":"Maj9 and m11 want space. 7sus4 delays the third.",
  "pop":"I–V–vi–IV. Color with add9.",
  "andalusian":"Minor descent. V7 at the bottom is the real dominant.",
  "circle":"Each chord is V of the next."
};
function theoryReply(prompt,ctx){
  const text=String(prompt||"").trim();
  if(!text)return {say:"Load a song, then say: this song in Em, light jazz style.",applyToSong:false};
  const target=parseTargetKey(text);
  const style=detectStyleHint(text);
  const density=detectDensityHint(text);
  const form=detectForm(text);
  const hasChart=ctx&&ctx.parsed&&(ctx.parsed.sections||[]).some(s=>(s.lines||[]).length);
  const useChart=hasChart&&(wantsCurrentChart(text)||(!form&&(target||style)));
  if(useChart){
    let parsed=ctx.parsed;
    const from=guessKey(collectChords(parsed),parsed.meta&&parsed.meta.key);
    if(target)parsed=transposeParsedSong(parsed,from,target);
    const newKey=target?target.label:(from.root+(from.minor?"m":""));
    const bits=[];
    if(target)bits.push("moved to "+newKey+(target.minor?" minor":""));
    if(style)bits.push((STYLES[style]||{}).name||style);
    if(density!=null)bits.push(["paint","light","medium","full"][density]+" extras");
    return {
      say:"Working on this chart"+(bits.length?" — "+bits.join(", "):".")+". Lyrics stay put; chords move with the key.",
      applyToSong:true,
      parsed,
      style,
      density,
      key:newKey
    };
  }
  if(!hasChart&&(wantsCurrentChart(text)||(!form&&(style||target)))){
    return {say:"No chart loaded yet. Import or paste a song first, then ask again.",applyToSong:false};
  }
  const key=(target&&target.root)||(ctx&&ctx.key)||"C";
  const useForm=form||"ii-v-i";
  const built=formInKey(useForm,key);
  return {
    say:built.name+" in "+key+": "+built.chords.join(" – ")+"\n"+(WHY[useForm]||""),
    chart:progressionToOnSong(built.name+" in "+key,key,built.chords,WHY[useForm]),
    style,
    density,
    applyToSong:false,
    form:useForm,
    key
  };
}
