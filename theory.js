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
  const roman=(m[1]||"")+m[2].toUpperCase();
  const q=m[3]||"";
  return {roman,q};
}
function degreeToChord(token,keyRoot,flats){
  const p=parseDegreeToken(token);
  if(!p)return token;
  const off=DEG[p.roman];
  if(off===undefined)return token;
  const root=pitchName(noteIndex(keyRoot)+off,flats);
  return root+(p.q||"");
}
function formInKey(formId,keyRoot){
  const form=THEORY_FORMS[formId]||THEORY_FORMS["ii-v-i"];
  const flats=preferFlatsForKey(keyRoot,false);
  return {
    name:form.name,
    key:keyRoot,
    chords:form.bars.map(t=>degreeToChord(t,keyRoot,flats))
  };
}
function progressionToOnSong(title,key,chords,explain){
  const lines=[title,"Theory Bot", "Key: "+key,"", "Form:"];
  for(let i=0;i<chords.length;i+=4){
    lines.push(chords.slice(i,i+4).join("   "));
  }
  lines.push("",explain||"");
  return lines.join("\n");
}
function detectKeyFromText(s){
  const m=String(s).match(/\b(?:in|key)\s+([A-G][#b]?)\b/i);
  if(m)return m[1].charAt(0).toUpperCase()+m[1].slice(1);
  return null;
}
function detectForm(s){
  const t=s.toLowerCase();
  if(/blues|12/.test(t))return "blues";
  if(/rhythm|i got rhythm/.test(t))return "rhythm";
  if(/bossa|jobim|samba/.test(t))return "bossa";
  if(/gospel|walk/.test(t))return "gospel";
  if(/neo|soul/.test(t))return "neosoul";
  if(/pop|axis/.test(t))return "pop";
  if(/andalus|phryg/.test(t))return "andalusian";
  if(/circle|fifths/.test(t))return "circle";
  if(/turnaround|i[- ]vi/.test(t))return "turnaround";
  if(/ii|2-5-1|two five/.test(t))return "ii-v-i";
  return null;
}
function detectStyleHint(s){
  const t=s.toLowerCase();
  if(/bossa/.test(t))return "bossa";
  if(/jazz|smooth/.test(t))return "smooth-jazz";
  if(/gospel/.test(t))return "gospel";
  if(/neo|soul/.test(t))return "neo-soul";
  if(/funk/.test(t))return "funk";
  if(/blues/.test(t))return "blues";
  if(/latin|samba/.test(t))return "latin";
  if(/worship/.test(t))return "worship";
  if(/country/.test(t))return "country";
  return null;
}
const WHY={
  "ii-v-i":"Classic cadence. ii sets subdominant color, V wants to resolve, I lands. Add 9/13 on V in jazz; keep it diatonic in pop.",
  "turnaround":"Gets you home without sitting on I. VI7 is an applied dominant to ii. Piano: walk 3rds or 7ths down.",
  "rhythm":"A-section of rhythm changes. Secondary dominants every two bars. Keep the 1–6–2–5 grid under substitutions.",
  "bossa":"I stays open (maj7/maj9), then a soft ii–V. Do not rush the V. Left hand: root–5, right hand: 3–7–9.",
  "blues":"Dominant I, IV and V. Treat I7 as home, not as a problem to resolve. #9 on V is piano language.",
  "gospel":"I7 into IV is the handshake. Passing dim or walk-up 1–2–3–4 into IV. Resolve IV back through ii–V or a walk-down.",
  "neosoul":"Maj9 and m11 want space. 7sus4 delays the third. Do not fill every beat.",
  "pop":"I–V–vi–IV. Melody sits on chord tones 1 and 5. Color with add9, not 13s.",
  "andalusian":"Minor descent. V7 at the bottom is the only real dominant. Hold the bass motion.",
  "circle":"Each chord is V of the next. Good for bridges and modulating up a fourth."
};
function theoryReply(prompt,ctx){
  const text=String(prompt||"").trim();
  if(!text)return {say:"Give me a key and a form. Example: bossa in F, or 12-bar blues in G.",chart:null,style:null};
  if(/reharm|color this|apply|current/.test(text.toLowerCase())){
    return {say:"Using the current chart. Pick a style on the left and hit Restyle — extra chords land on the words. Save that version to the library to compare.",chart:null,style:detectStyleHint(text)};
  }
  const key=detectKeyFromText(text)||(ctx&&ctx.key)||"C";
  const form=detectForm(text)||"ii-v-i";
  const style=detectStyleHint(text);
  const built=formInKey(form,key);
  const why=WHY[form]||"";
  const chart=progressionToOnSong(built.name+" in "+key,key,built.chords,why);
  return {
    say:built.name+" in "+key+": "+built.chords.join(" – ")+"\n"+why,
    chart,
    style,
    form,
    key
  };
}
