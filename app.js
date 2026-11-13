'use strict';
/* 紙妻 V6.4｜單人免 Token 劇本殺。純靜態，不使用 API；所有進度保存在本機瀏覽器。 */
const D = window.PAPERWIFE_DATA;
const V = window.PAPERWIFE_VISUALS || {portraits:{},labels:{},caseCatalog:[]};
if (!D) throw new Error('未載入遊戲資料：請確認 data/game-data.js 已上傳。');
const $ = id => document.getElementById(id);
const STORE = 'paperwife_v6_notoken_save'; // 延用既有存檔；V6.2 增加公開與持有線索分離。
const ordered = D.roles;
let state = load();
let queue = [];
let queueDone = null;
let readerAfter = null;
let activeClue = null;
let sideTab = 'clues';
let typing = false;
let typeTimer = null;
let autoTimer = null;
let autoDialogue = false;
let autoHoldLast = false;
let currentLine = '';
let frontView = 'home';
let selectedRole = D.roles[0];
let randomRoleMode = false;
let openingIndex = 0;
function frontButton(label, fn, cls=''){
 const b=el('button','front-button '+cls,label);b.type='button';b.addEventListener('click',fn);return b;
}
const CAST_INTROS={
 '陳聿明':{role:'陳宅主人',meta:'PUBLIC INTRODUCTION',desc:'陳家大宅的主人，四十歲上下，掌控宅中一切安排。外界對他的評價一向兩極：有人說他是行善積德、散粥濟民的鄉紳，也有人說他命帶孤煞，前幾任姨太太與親近之人都沒有好下場。這次與孟小婉的婚事，是陳宅近年來最受矚目的大事。',quote:'明日就是我的婚禮。諸位既然來了，還請在宅中安心住下；若有不周到之處，盡可直說。'},
 '東青':{role:'陳宅管家',meta:'FIXED CHARACTER · PUBLIC INTRODUCTION',desc:'年輕管家，負責陳宅日常管理、賓客接待、婚禮安排與房間調度，對宅中出入、鑰匙、作息與規矩都最熟悉。表面謹慎守禮，做事井井有條，是目前陳宅最能穩住場面的人物之一。',quote:'我是東青，平日替老爺打理宅務、照應諸位起居。近來宅中怪事頻出，若各位夜裡聽見異響，也請先來告知我，不要擅自闖入上鎖的房間。'},
 '阿忠':{role:'花園園丁',meta:'PUBLIC INTRODUCTION',desc:'長年住在花園棚屋的園丁，寡言沉默，總戴著寬檐草帽，負責照看花木、修剪枝葉與搬運粗重雜務。雖然存在感不高，卻經常出沒於庭院、後門、工具間與偏僻角落，因此也比旁人更熟悉宅中那些不被注意的地方。',quote:'我平時只管花園和後院，不愛摻和屋裡的事。若你們半夜聽見什麼動靜，也未必都是風。'},
 '戴思齊':{role:'私人醫生',meta:'PUBLIC INTRODUCTION',desc:'來自上海的西醫，年輕斯文，談吐理性，近來會定期到陳宅為陳聿明看診。由於受過新式醫學教育，他對疾病、藥物與外界局勢都頗有見解，在這座迷信與怪談交錯的宅院裡，顯得格外冷靜。',quote:'我是戴思齊，這次來一是例行替陳先生診察身體，二也是順道參加婚禮。若今晚有人身體不適，或對宅中的怪事感到不安，都可以來找我。'},
 '孟小婉':{role:'待嫁新娘',meta:'PUBLIC INTRODUCTION',desc:'即將嫁入陳宅的年輕女子，年紀尚輕，氣質溫婉，看起來柔弱安靜。她的婚事是今晚所有準備的中心，然而近來宅中的怪談與深夜異象，似乎讓她始終無法真正安心。',quote:'我是孟小婉。承蒙陳先生照顧，才有了今日這門婚事……只是這幾晚我總覺得，走廊盡頭像有人在看著我，越到夜裡，心裡越發不踏實。'},
 '紅豆':{role:'陳宅女傭',meta:'PUBLIC INTRODUCTION',desc:'陳宅內負責廚房、打掃與跑腿的年輕女傭，表面上爽快勤快，與宅中每個人幾乎都有接觸。她經常在廚房、走廊、偏房與各個雜物處之間穿梭，因此對僕役間的細碎消息、房間擺設與日常變化最為敏感。',quote:'我叫紅豆，平時就在宅裡做飯、打掃、跑腿。各位若有什麼要拿要送的，儘管吩咐我；只是這幾天宅裡怪得很，有些地方連我都不太想靠近。'},
 '江靜儀':{role:'《滬上日報》記者',meta:'PUBLIC INTRODUCTION',desc:'自上海而來的女記者，以採訪陳家寨舊案為由來到陳宅。她觀察敏銳，說話俐落，不像一般賓客那樣只為婚禮而來，而是對陳宅過去的火災、失蹤案與瘟疫傳聞抱持強烈興趣。',quote:'我是江靜儀，《滬上日報》的記者。這次來，一是參加婚禮，二是想了解當年陳家寨瘟疫與陳宅舊案的真相。若真相仍被藏著，那總得有人把它挖出來。'}
};

function frontSection(view){
 frontView=view;
 const f=$('frontScreen');
 if(view==='play'){f.hidden=true;$('app').hidden=false;return;}
 hideDialogue();
 f.hidden=false;$('app').hidden=true;
 const pane=$('frontInner');clear(pane);
 const background=$('frontHero');background.className='front-hero';
 background.classList.add(view==='home'?'front-home':view==='cases'?'front-case':'front-role');
 if(view==='home')renderHome(pane);else if(view==='cases')renderCases(pane);else if(view==='roles')renderRoleSelect(pane);
}
function renderHome(pane){
 const box=el('div','front-copy');
 box.append(el('div','front-eyebrow','IMMERSIVE MYSTERY ROLEPLAY'));
 box.append(el('h1','front-headline','穿越進入故事。'));
 box.append(el('h1','front-headline gold-line','親手找出真相。'));
 box.append(el('p','front-summary','這不是單純閱讀故事，而是一場你親自參與的劇本殺。進入案件後，你將成為故事中的其中一人，透過序章、角色自我介紹、公開問答、搜證與推理，一步步找出兇手、還原動機，並揭開被埋藏多年的真相。'));
 const buttons=el('div','front-actions');
 buttons.append(frontButton('選擇劇本',()=>frontSection('cases'),'gold-button'));
 if(state.player){buttons.append(frontButton('繼續上次進度',()=>{frontSection('play');render();},'outline-button'));}
 box.append(buttons);box.append(el('div','front-footnote','純單人離線固定問答・無須 Token・繁體中文'));
 pane.append(box);
}
function renderCases(pane){
 pane.append(frontButton('← 返回首頁',()=>frontSection('home'),'text-button'));
 const area=el('section','case-library');area.append(el('div','front-eyebrow','CHOOSE YOUR CASE'));area.append(el('h2','front-section-title','選擇劇本'));area.append(el('p','front-muted','先選擇要體驗的故事，再決定扮演哪位角色。劇本卡片下方只保留玩家最在意的資訊：故事簡介、角色人數與預估遊玩時間。'));
 for(const c of V.caseCatalog){
  const card=el('article','case-card');
  const cover=el('img','case-cover');cover.src=c.cover;cover.alt=c.title+' 劇本封面';card.append(cover);
  const info=el('div','case-info');info.append(el('div','front-eyebrow',c.category));info.append(el('h3','',c.title));info.append(el('p','',c.subtitle));info.append(el('p','case-spec',`${c.players||'7 人劇本'}　·　${c.duration||'約 4–6 小時'}`));
  info.append(frontButton('進入劇本 →',()=>{if(c.available)frontSection('roles');},'gold-button'));card.append(info);area.append(card);
 }
 pane.append(area);
}
function renderRoleSelect(pane){
 clear(pane);
 pane.append(frontButton('← 返回劇本選擇',()=>frontSection('cases'),'text-button'));
 const area=el('section','role-library');area.append(el('div','front-eyebrow','YOUR SECRET IDENTITY'));area.append(el('h2','front-section-title','決定你的角色'));area.append(el('p','front-muted','你將扮演七位角色中的一人。確認身分後，會先進入「在場人物」自我介紹，再正式開始序章與後續調查。'));
 const modes=el('div','role-modes');
 const choose=frontButton('◉ 自行選擇',()=>{randomRoleMode=false;renderRoleSelect(pane);},!randomRoleMode?'mode-current':'');
 const random=frontButton('◯ 隨機抽取',()=>{randomRoleMode=true;renderRoleSelect(pane);},randomRoleMode?'mode-current':'');
 modes.append(choose,random);area.append(modes);
 const grid=el('div','role-grid');
 D.roles.forEach((name,i)=>{
  const b=el('button','role-card'+(selectedRole===name&&!randomRoleMode?' selected':''));b.type='button';b.setAttribute('aria-pressed',String(selectedRole===name&&!randomRoleMode));
  const img=el('img','role-portrait');img.src=V.portraits[name]||'';img.alt=name+' 角色立繪';b.append(img);
  b.append(el('div','role-name',String(i+1).padStart(2,'0')+' · '+name));b.append(el('div','role-tag',V.labels[name]||''));
  b.addEventListener('click',()=>{selectedRole=name;randomRoleMode=false;frontSection('roles');});grid.append(b);
 });area.append(grid);
 const footer=el('div','role-bottom');footer.append(frontButton(randomRoleMode?'抽取我的角色':'確認選擇，進入故事',()=>{
  const role=randomRoleMode?D.roles[Math.floor(Math.random()*D.roles.length)]:selectedRole;
  if(!confirm('確定開始扮演「'+role+'」嗎？此操作會覆蓋目前的遊戲進度。'))return;
  state=newState();state.player=role;state.phase='cast';state.castIndex=0;save();frontSection('play');render();
 },'gold-button'));area.append(footer);pane.append(area);
}
function beginPrologue(){
 const narrative=D.intro.replace(/\r/g,'').split(/(?<=[。！？])|\n+/).map(x=>x.trim()).filter(Boolean);
 const merged=[];
 for(const sentence of narrative){
  if(merged.length && merged[merged.length-1].length<48)merged[merged.length-1]+=sentence;
  else merged.push(sentence);
 }
 const lines=merged.map(t=>({who:'旁白',text:t,left:'',right:''}));
 if(!lines.length)lines.push({who:'旁白',text:'民國的陳宅，故事由此開始。'});
 speak(lines,()=>{setPhase('read');openReader(true);});
}

function newState(){return {player:null,act:1,phase:'start',castIndex:0,readActs:[],interviewed:[],interviewTarget:null,questionPath:[],publicLog:[],drawn:[],owned:[],publicClues:[],npcSharedRounds:[],searchStage:null,playerDraws:0,playerAreas:[],aiDrawsDone:false,notes:'',solutions:{},votes:{},result:null,complete:false};}
function load(){try{const s=JSON.parse(localStorage.getItem(STORE));if(s && typeof s==='object' && (s.phase==='start'||ordered.includes(s.player)) && Number.isInteger(s.act)&&s.act>=1&&s.act<=4)return {...newState(),...s,publicClues:Array.isArray(s.publicClues)?s.publicClues:[],npcSharedRounds:Array.isArray(s.npcSharedRounds)?s.npcSharedRounds:[]};}catch{}return newState();}
function save(){localStorage.setItem(STORE,JSON.stringify(state));}
function setPhase(phase){state.phase=phase;save();render();}
function el(tag,cls,txt){const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x;}
function clear(node){node.replaceChildren();}
function message(msg){const x=$('toast');x.textContent=msg;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2800);}
function setHeader(kicker,title,desc){$('sectionKicker').textContent=kicker;$('sectionTitle').textContent=title;$('sectionDesc').textContent=desc||'';clear($('options'));clear($('aux'));}
function sceneInfoBox(){
 let box=$('sceneInfoBox');
 if(!box){box=el('div','scene-info-box');box.id='sceneInfoBox';$('scene').appendChild(box);}
 return box;
}
function clearSceneInfo(){
 const box=sceneInfoBox();
 box.hidden=true;box.className='scene-info-box';box.replaceChildren();
}
function showCastSceneInfo(name,info,idx,total){
 const box=sceneInfoBox();
 box.hidden=false;box.className='scene-info-box cast-scene-box';
 clear(box);
 const meta=el('div','cast-scene-meta',info.meta||'PUBLIC INTRODUCTION');
 const nm=el('div','cast-scene-name',name);
 const role=el('div','cast-scene-role',info.role||'');
 const desc=el('p','cast-scene-desc',info.desc||'');
 const quote=el('div','cast-scene-quote',info.quote||'');
 const count=el('div','cast-scene-count',`${String(idx+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`);
 box.append(meta,nm,role,desc,quote,count);
}
function option(label,fn,{primary=false,sub=''}={}){const b=el('button','option'+(primary?' primary':''));b.type='button';b.append(document.createTextNode(label));if(sub)b.appendChild(el('small','',sub));b.addEventListener('click',fn);$('options').appendChild(b);return b;}
function auxButton(label,fn){const b=el('button','',label);b.type='button';b.addEventListener('click',fn);$('aux').appendChild(b);return b;}
function hideDialogue(){
 queue=[];queueDone=null;clearInterval(typeTimer);clearTimeout(autoTimer);autoTimer=null;typeTimer=null;typing=false;autoDialogue=false;autoHoldLast=false;
 document.body.classList.remove('has-dialogue');$('dialogue').hidden=true;
 showPortraits();
}
function typeLine(text){
 clearInterval(typeTimer);clearTimeout(autoTimer);autoTimer=null;currentLine=text;const node=$('dialogueText');node.textContent='';typing=true;
 const units=Array.from(text);let i=0;
 $('advanceDialogue').textContent='顯示完整文字 ▸';
 typeTimer=setInterval(()=>{i=Math.min(units.length,i+2);node.textContent=units.slice(0,i).join('');if(i>=units.length)finishTyping();},28);
}
function finishTyping(){if(!typing)return;clearInterval(typeTimer);typeTimer=null;typing=false;$('dialogueText').textContent=currentLine;$('advanceDialogue').textContent=autoDialogue?'自動播放中…':'下一步 ▸';if(autoDialogue)autoTimer=setTimeout(showNext,880);}
function sceneConfig(){
 const act=state.act||1, phase=state.phase;
 if(phase==='cast'||phase==='prologue'||phase==='start')return {bg:'assets/scene/chen_exterior.webp',tag:'清河縣 · 陳宅外院'};
 if(phase==='ritual'||(act===1&&['interview','public'].includes(phase)))
  return {bg:'assets/scene/ritual.webp',tag:'陳宅 · 沖喜婚房'};
 if(phase==='searchSecret'||phase==='solveSecret')
  return {bg:'assets/scene/ritual.webp',tag:'陳宅 · 神秘密室'};
 if(phase==='search1'||phase==='search2')return {bg:'assets/scene/chen_exterior.webp',tag:'陳宅 · 內外搜證'};
 if(phase==='interview'||phase==='public')return {bg:'assets/scene/ritual.webp',tag:'陳宅 · 議事廳'};
 return {bg:'assets/scene/chen_exterior.webp',tag:'清河縣 · 陳宅'};
}
function applySceneVisual(){
 const cfg=sceneConfig();
 $('scene').style.backgroundImage=`linear-gradient(180deg,#09080615,#0b070ab3), url("${cfg.bg}")`;
 if(!queue.length)$('sceneTag').textContent=cfg.tag;
}
function showPortraits(left='',right='',who=''){
 const lp=$('leftPortrait'),rp=$('rightPortrait');
 for(const [node,name,nid] of [[lp,left,'leftName'],[rp,right,'rightName']]){
  const mapped=(name==='孔神婆附身'||name==='附身孔神婆')?'附身的孔神婆':name;
  const show=!!mapped && !!V.portraits[mapped];
  node.classList.toggle('visible',show);
  node.classList.toggle('active',!!who&&name===who);
  node.classList.toggle('dimmed',!!who&&name!==who);
  $(nid).textContent=name;
  const portrait=node.querySelector('img');if(show&&portrait.getAttribute('src')!==V.portraits[mapped])portrait.src=V.portraits[mapped];
 }
}
function speak(items,done,opts={}){
 if(queue.length) return;autoDialogue=!!opts.auto;autoHoldLast=!!opts.untilLast;queue=items.map(x=>({who:x.who,text:x.text,left:x.left||'',right:x.right||'',portrait:x.portrait||''}));queueDone=done||(()=>{});
 document.body.classList.add('has-dialogue');showNext();
}
function showNext(){
 clearTimeout(autoTimer);autoTimer=null;
 if(typing){finishTyping();return;}
 if(queue.length===0){const done=queueDone;hideDialogue();if(done)done();return;}
 const x=queue.shift();if(autoHoldLast&&queue.length===0)autoDialogue=false;$('dialogue').hidden=false;$('speaker').textContent=x.who;typeLine(x.text);
 showPortraits(x.portrait||x.left||((x.who!=='旁白')?x.who:''),x.right||'',x.portrait||x.who);
 $('sceneProgress').textContent='點擊對話框逐句播放';
}
$('advanceDialogue').addEventListener('click',ev=>{ev.stopPropagation();if(!autoDialogue)showNext();else if(typing)finishTyping();});
$('dialogue').addEventListener('click',()=>{if(!autoDialogue)showNext();else if(typing)finishTyping();});
window.addEventListener('keydown',ev=>{if((ev.key===' '||ev.key==='Enter')&&(queue.length||queueDone)&&!autoDialogue&&document.activeElement?.tagName!=='TEXTAREA'){ev.preventDefault();showNext();}});
function logTalk(who,text,act=state.act){state.publicLog.push({who,text,act});save();renderSidebar();}
function logLines(items){items.forEach(x=>logTalk(x.who,x.text));}
function renderCastIntro(){
 const idx=Math.max(0,Math.min(state.castIndex||0,ordered.length-1));
 const name=ordered[idx];
 const info=CAST_INTROS[name]||{role:V.labels[name]||'',meta:'PUBLIC INTRODUCTION',desc:'',quote:''};
 showPortraits('',name,'');
 showCastSceneInfo(name,info,idx,ordered.length);
 setHeader('在場人物','先認識今晚與死者有關的人','先閱讀大圖中的公開介紹，再繼續下一位角色。這一段的目的，是讓你在案件開始前，先建立對七名主要人物的第一印象。');
 const tip=el('article','cast-panel inline-note');
 tip.append(el('div','cast-meta','PUBLIC INTRODUCTION'));
 tip.append(el('p','',`目前顯示：${name}。請先閱讀上方主視覺中的公開介紹，再決定是否進入下一位角色。`));
 $('options').appendChild(tip);
 if(idx<ordered.length-1)option('下一位角色 →',()=>{state.castIndex=idx+1;save();render();},{primary:true});
 else option('我已了解，開始案件序章',()=>{state.castIndex=0;save();clearSceneInfo();setPhase('prologue');beginPrologue();},{primary:true});
 auxButton('返回角色選擇',()=>frontSection('roles'));
}
function stageLabel(){const map={start:'準備',cast:'在場人物',prologue:'案件序章',read:'劇本閱讀',ritual:'孔神婆儀式',interview:'人物問答',public:'公開討論',search1:'第一輪搜證',searchSecret:'密室搜證',solveSecret:'密室推理',search2:'第二輪搜證',identity:'身分推理',vote:'最終投票',ending:'真相揭曉'};return map[state.phase]||state.phase;}
function updateHeader(){
 applySceneVisual();
 $('chapterBadge').textContent=state.phase==='start'?'尚未開始':`第 ${state.act} 幕・${stageLabel()}`;
 if(!queue.length)$('sceneProgress').textContent=stageLabel();
 $('clueCount').textContent=`${(state.publicClues||[]).length} 張公開`;
 $('readerButton').disabled=!state.player;
}
function render(){updateHeader();document.querySelector('.play-area').classList.toggle('choice-mode',state.phase==='interview'&&!!state.interviewTarget);if(state.phase!=='cast')clearSceneInfo();if(queue.length)return;
 switch(state.phase){
 case 'start':return renderStart();
 case 'cast':return renderCastIntro();
 case 'prologue':return renderPrologue();
 case 'read':return renderRead();
 case 'ritual':return renderRitual();
 case 'interview':return renderInterview();
 case 'public':return renderPublic();
 case 'search1':return renderSearch('第一輪');
 case 'searchSecret':return renderSearch('密室');
 case 'solveSecret':return renderSolveSecret();
 case 'search2':return renderSearch('第二輪');
 case 'identity':return renderIdentity();
 case 'vote':return renderVote();
 case 'ending':return renderEnding();
 default:setPhase('start');
 }
}
function renderPrologue(){
 showPortraits();
 setHeader('PROLOGUE · 案件序章','陳宅深夜，故事即將開始','旁白會分段打字播放；你的選項顯示後，可以依序點擊繼續，慢慢進入這場婚禮與疑案交錯的長夜。');
 option('播放序章',()=>beginPrologue(),{primary:true});
}
function renderStart(){
 showPortraits();
 setHeader('民國 · 清河縣','請先從首頁選擇劇本與角色','本版入口已移到首頁。你可以返回劇本選擇，重新決定想扮演的角色。');
 option('返回首頁',()=>frontSection('home'),{primary:true});
}
function readerText(){const r=D.roleData[state.player];let t='';if(state.act===1)t=r.prelude+'\n\n────────── 第一幕 ──────────\n\n';
 else t=`第 ${state.act} 幕\n\n`;
 t+=r.acts[state.act-1];return t;
}
function openReader(forAdvance=false){if(!state.player)return;
 const r=D.roleData[state.player];$('readerTitle').textContent=state.act===1?`${state.player} · 人物故事與第一幕`:`${state.player} · 第 ${state.act} 幕`;
 $('readerKicker').textContent='私人劇本｜僅顯示本幕以前內容';
 const lines=readerText();$('readerContent').textContent=lines;
 $('readerContent').scrollTop=0;
 $('readerFooterText').textContent='請讀至本幕結束；之後的劇本不會提前解鎖。';
 $('readerDone').hidden=!forAdvance;
 $('readerOverlay').hidden=false;
 readerAfter=forAdvance?()=>{if(!state.readActs.includes(state.act))state.readActs.push(state.act);save();$('readerOverlay').hidden=true; if(state.act===1||state.act===3)setPhase('ritual');else if(state.act===2){state.playerDraws=0;state.playerAreas=[];state.aiDrawsDone=false;setPhase('search1');}else setPhase('interview');}:null;
}
$('readerButton').addEventListener('click',()=>openReader(false));
$('closeReader').addEventListener('click',()=>{if(readerAfter){message('請先完成本幕劇本閱讀，再進行下一階段。');return;}$('readerOverlay').hidden=true;});
$('readerDone').addEventListener('click',()=>{const cb=readerAfter;readerAfter=null;if(cb)cb();});
function renderRead(){setHeader(`第 ${state.act} 幕`,state.act===1?'人物故事與第一幕':'閱讀本幕角色劇本',`本幕只會顯示 ${state.player} 的角色劇本，不會開放未解鎖內容。`);option('開啟本幕劇本',()=>openReader(true),{primary:true});}
function renderRitual(){showPortraits();if(state.act===1){setHeader('第一幕 · 小劇場','孔神婆主持婚禮沖喜儀式','此段會切換到婚房儀式場景。神婆附身、眾人的反應，以及惠雯突然現身，都是後續推理的重要資訊。每按一次只播放一句。');option('開始孔神婆儀式',()=>speak(D.ritual.map((line,i)=>line.who==='孔神婆'&&i>=3&&i<=7?{...line,portrait:'附身的孔神婆'}:line),()=>setPhase('interview')),{primary:true});}
 else {setHeader('第三幕 · 小劇場','黑暗中的密室','依組織手冊演出「復活的惠雯」與密室現場，之後先進行密室搜證與推理。');option('進入密室劇場',()=>speak(D.haunt,()=>{state.playerDraws=0;state.playerAreas=[];state.aiDrawsDone=false;setPhase('searchSecret');}),{primary:true});}}
function renderInterview(){showPortraits(state.player,'','');const remaining=ordered.filter(n=>n!==state.player&&!state.interviewed.includes(n));
 if(state.interviewTarget)return renderInterviewTree();
 setHeader(`第 ${state.act} 幕 · 公開詢問`,`詢問角色（${state.interviewed.length}/2）`,'本幕選擇兩名不同角色各完成一組三層問答。每名角色有三個量身編寫的主問題，之後可再追問兩次，每層三個選項。所有對話公開記錄。');
 if(state.interviewed.length>=2){option('兩名角色詢問完成，開始其他角色公開討論',()=>setPhase('public'),{primary:true});return;}
 for(const n of remaining)option(`詢問 ${n}`,()=>{state.interviewTarget=n;state.questionPath=[];save();render();},{sub:'本幕 3 個角色專屬問題'});
}
function renderInterviewTree(){const target=state.interviewTarget;const path=state.questionPath;
 showPortraits(state.player,target,'');
 let items=D.questions[String(state.act)][target];for(const i of path){items=items[i].next||[];}
 const layer=path.length;
 if(layer===3||items.length===0){state.interviewed.push(target);state.interviewTarget=null;state.questionPath=[];save();render();return;}
 const labels=['選擇主要問題','選擇第一次追問','選擇第二次追問'];
 setHeader(`第 ${state.act} 幕 · 詢問 ${target}`,labels[layer],`你正在詢問 ${target}，第 ${layer+1} 層／共 3 層。這組問答完成後才會計入本幕的兩名角色額度。`);
 items.forEach((item,i)=>option(item.q,()=>{
  const line=[{who:state.player,text:item.q,left:state.player,right:target},{who:target,text:item.a,left:state.player,right:target}];
  state.questionPath.push(i);save();speak(line,()=>{logLines(line);render();},{auto:true,untilLast:true});
 }));
}
function renderPublic(){
 setHeader(`第 ${state.act} 幕 · 公開對話`,'其他人的質疑，也會影響你的判斷','先觀看其他角色之間的公開問答，再由其他角色反過來詢問你。每段對話都必須點擊繼續才會展示下一句。');
 option('觀看其他角色的公開討論',()=>runPublicPairs(),{primary:true});
}
function runPublicPairs(){
 const pairs=D.publicPairs[state.act].filter(x=>x[0]!==state.player&&x[1]!==state.player).slice(0,2);
 const items=[];for(const p of pairs){items.push({who:'旁白',text:`${p[0]} 對 ${p[1]} 提出了疑問。`});items.push({who:p[0],text:p[2],left:p[0],right:p[1]},{who:p[1],text:p[3],left:p[0],right:p[1]},{who:p[0],text:p[4],left:p[0],right:p[1]},{who:p[1],text:p[5],left:p[0],right:p[1]});}
 if(!pairs.length)items.push({who:'旁白',text:'眾人各懷心事，暫時沒人願意再多說。'});
 speak(items,()=>{logLines(items);renderChallenge();});
}
function renderChallenge(){const x=D.publicChallenges[String(state.act)][state.player];
 showPortraits(x.asker,state.player,'');
 setHeader(`第 ${state.act} 幕 · 你被詢問`,`${x.asker} 對你提出了疑問`,x.q);
 const first=[{who:'旁白',text:`${x.asker} 轉向了你，似乎對你的說法有所懷疑。`},{who:x.asker,text:x.q,left:x.asker,right:state.player}];
 // 先播對方提問，再顯示實際回答選項。
 speak(first,()=>{logLines(first);setHeader(`第 ${state.act} 幕 · 回答 ${x.asker}`,'選擇你的答覆','三個選項都是自然說法，不會明示哪一項屬於隱瞞或欺騙。');
  showPortraits(x.asker,state.player,'');
  x.options.forEach(reply=>option(reply,()=>{
   const ans=[{who:state.player,text:reply,left:x.asker,right:state.player},
   {who:x.asker,text:'我記下了你的說法。後續如果找到證據，希望你還能這麼回答。',left:x.asker,right:state.player}];
   speak(ans,()=>{logLines(ans);afterPublic();});
  }));
 });
}
function afterPublic(){state.interviewed=[];state.interviewTarget=null;state.questionPath=[];
 if(state.act<4){state.act+=1;setPhase('read');openReader(true);}
 else setPhase('vote');
}
function rngPick(items){if(!items.length)return null;return items[Math.floor(Math.random()*items.length)];}
function allClues(){return D.clues;}
function possible(round,category,actor,seen=state.drawn){return allClues().filter(c=>c.round===round&&!seen.includes(c.id)&&(!category||c.area===category||category==='個人'&&c.area!=='公共'&&c.area!=='密室'&&c.area!==actor));}
function personalAvailable(round,actor,areas=[],seen=state.drawn){return allClues().filter(c=>c.round===round&&!seen.includes(c.id)&&c.area!=='公共'&&c.area!=='密室'&&c.area!==actor&&!areas.includes(c.area));}
function drawChoice(round,actor,index,localDraws,areas,seen){
 let pool=[];
 if(round==='密室')pool=possible('密室',null,actor,seen);
 else if(round==='第一輪'){
  pool=index===0?possible('第一輪','公共',actor,seen):personalAvailable('第一輪',actor,areas,seen);
 } else if(round==='第二輪'){
  if(index<2)pool=possible('第二輪','公共',actor,seen);
  else {const already=areas.length?areas:[];pool=personalAvailable('第二輪',actor,(index===4&&new Set(already).size<2)?[already[0]]:[],seen);
   if(index>=3&&areas.length===1){const alternate=pool.filter(c=>c.area!==areas[0]);if(alternate.length)pool=alternate;}
  }
 }
 if(!pool.length)return null;
 const c=rngPick(pool);
 return c;
}
function recordClue(c,owner){
 if(!c||state.drawn.includes(c.id))return;
 state.drawn.push(c.id);state.owned.push({id:c.id,owner,act:state.act});
 // 組織手冊：公共線索必須公開；密室線索需於集體辨識屍塊時展示。
 if(c.area==='公共'||c.area==='密室')publicize(c.id);
 if(owner===state.player)activeClue=c;
 save();renderSidebar();
}
function publicize(id){
 if(!state.publicClues)state.publicClues=[];
 if(!state.publicClues.includes(id))state.publicClues.push(id);
 save();
}
function sharePlayerClue(id){
 const own=state.owned.some(x=>x.id===id&&x.owner===state.player);
 if(!own)return;publicize(id);renderSidebar();message('你已將這張私人線索分享給所有角色。');
}
function shareNpcClues(round){
 // AI 不再把所有搜到的個人線索一次性公布。每輪只分享少量可討論的線索。
 if(state.npcSharedRounds?.includes(round))return;
 const candidates=state.owned.filter(x=>x.owner!==state.player&&D.clues.some(c=>c.id===x.id&&c.round===round&&c.area!=='公共'&&c.area!=='密室'));
 const goal=round==='第一輪'?3:round==='第二輪'?4:0;
 // 跨角色挑選，比將整批 6×配額全發出更接近實際分享。
 const picked=[],areas=new Set();
 for(const c of candidates){const clue=D.clues.find(y=>y.id===c.id);if(!areas.has(clue.area)&&picked.length<goal){picked.push(c.id);areas.add(clue.area);}}
 for(const c of candidates){if(picked.length>=goal)break;if(!picked.includes(c.id))picked.push(c.id);}
 picked.forEach(publicize);
 state.npcSharedRounds.push(round);save();
 return picked.length;
}
function drawOne(round){const index=state.playerDraws;
 const c=drawChoice(round,state.player,index,index,state.playerAreas,state.drawn);
 if(!c){message('這個分類的提示卡已抽完，請檢查資料配置。');return;}
 recordClue(c,state.player);state.playerDraws++;
 if(c.area!=='公共'&&c.area!=='密室')state.playerAreas.push(c.area);
 save();render();}
function autoDraw(round){const total=round==='密室'?2:round==='第一輪'?3:5;
 let num=0;
 for(const actor of ordered.filter(n=>n!==state.player)){
  const areas=[], seen=state.drawn;
  for(let i=0;i<total;i++){
   const c=drawChoice(round,actor,i,i,areas,seen);
   if(!c)continue;
   recordClue(c,actor);num++;
   if(c.area!=='公共'&&c.area!=='密室')areas.push(c.area);
  }
 }
 const shown=shareNpcClues(round)||0;state.aiDrawsDone=true;save();message(`其他角色本輪搜得 ${num} 張提示卡，其中 ${shown} 張私人線索選擇公開；其餘保留在各自手中。`);render();
}
function renderSearch(round){
 const target=round==='密室'?2:round==='第一輪'?3:5;
 const desc=round==='密室'?'按手冊每位玩家抽取 2 張密室線索，七人合計 14 張。':round==='第一輪'?'按手冊每人 1 張公共線索＋2 張不同人物個人線索；不能搜自己的區域。':'按手冊每人 2 張公共線索＋3 張其他線索（至少涉及兩個人物），不能搜自己的區域。';
 setHeader(`第 ${state.act} 幕 · ${round}搜證`,`按鈕抽取提示卡（${state.playerDraws}/${target}）`,desc);
 if(activeClue){const box=el('div','clue-reveal');box.appendChild(el('strong','','提示卡'));box.appendChild(el('p','',activeClue.text));$('aux').appendChild(box);}
 if(state.playerDraws<target){const category=round==='密室'?'密室':round==='第一輪'?(state.playerDraws===0?'公共':'人物'):(state.playerDraws<2?'公共':'人物');
  option(`抽取第 ${state.playerDraws+1} 張提示卡 · ${category}`,()=>drawOne(round),{primary:true,sub:'一次只抽取一張，抽到後才公開到旁邊的提示卡區'});
 }else if(!state.aiDrawsDone){option('讓其他角色完成本輪搜證並交流線索',()=>autoDraw(round),{primary:true,sub:'他們會持有各自抽到的私人卡片，公共卡片必公開，其餘只擇要分享'});}
 else if(round==='密室'){option('開始密室屍塊身分推理',()=>{activeClue=null;setPhase('solveSecret');},{primary:true});}
 else if(round==='第一輪'){option('第一輪搜證結束，開始第二幕人物問答',()=>{activeClue=null;setPhase('interview');},{primary:true});}
 else option('第二輪搜證結束，進入身分推理',()=>{activeClue=null;setPhase('identity');},{primary:true});
 if(state.playerDraws===target&&state.aiDrawsDone)auxButton('查看目前公開的提示卡及你的私人線索',()=>{sideTab='clues';renderSidebar();});
}
function renderSolveSecret(){setHeader('第三幕 · 密室推理','四具屍體，誰是最後一人？','密室中的十四條線索可指向四具不同的屍體；回想孔神婆先前附身時的話。');
 for(const answer of ['孔神婆','惠雯','秋萍','孟小婉'])option(answer,()=>{
  if(answer==='孔神婆'){state.solutions.secret=true;state.playerDraws=0;state.playerAreas=[];state.aiDrawsDone=false;setPhase('search2');}
  else message('再想想孔神婆儀式裡提到的碧雲、卿卿、憐兒，以及另一位死者。');
 });
}
function renderIdentity(){setHeader('第三幕 · 身分推理','誰頂替了陳宅主人？','依組織手冊，第三幕結束前必須推理出現任陳聿明的真實身分。');
 for(const x of ['現任陳聿明其實是駱午陽','東青其實是陳聿明','戴思齊其實是陳聿明','阿忠其實是孔神婆'])option(x,()=>{if(x.startsWith('現任陳聿明')){state.solutions.identity=true;setPhase('interview');}else message('請再比對黃埔軍校照片、手腕特徵和舊火災。');});
}
function renderVote(){setHeader('第四幕 · 最終抉擇','投出你認為的兇手','請按順序作出選擇：殺害惠雯的兇手、是否認為自己感染、是否服用娃娃眼，以及保留或銷毀《陳氏古法》。');
 const questions=[
 {key:'killer',title:'你認為殺害惠雯的真凶是誰？',opts:ordered},
 {key:'infected',title:'你認為自己是否受到瘟疫感染？',opts:['我認為已經感染','我認為沒有感染']},
 {key:'medicine',title:'你決定服用娃娃眼嗎？',opts:['決定服用','決定不服用']},
 {key:'ancient',title:'你希望如何處置《陳氏古法》？',opts:['銷毀《陳氏古法》','保留《陳氏古法》']}
 ];
 if(state.player==='孟小婉')questions.push({key:'partner',title:'你願意信任哪個人，與他共同面對結果？',opts:['陳聿明（駱午陽）','戴思齊']});
 const q=questions.find(x=>!state.votes[x.key]);
 if(q){$('sectionTitle').textContent=q.title;for(const choice of q.opts)option(choice,()=>{state.votes[q.key]=choice;save();render();});
  auxButton('返回查看劇本',()=>openReader(false));return;}
 option('揭曉案件真相與結局',()=>setPhase('ending'),{primary:true});
}
function renderEnding(){setHeader('最終章 · 復盤','紙妻 · 真相揭曉','本輪已結束。下方會根據你的投票顯示結果，你也可以回看自己累積的劇本與公開情報。');
 const knew=state.votes.killer==='阿忠';
 const infection={'陳聿明':false,'東青':true,'阿忠':true,'戴思齊':false,'孟小婉':true,'紅豆':true,'江靜儀':true}[state.player];
 const take=state.votes.medicine==='決定服用';
 const survive=(take===infection);
 const side=state.votes.ancient.startsWith('銷毀')?'銷毀':'保留';
 const lines=[`你投出的兇手：${state.votes.killer}${knew?'（與手冊復盤一致）':'（與手冊復盤不符）'}`,
  `惠雯的真正致命行為發生於 23:05 左右，阿忠在婚房勒死惠雯。紅豆在較早時候也曾勒住她，東青亦曾企圖下毒。`,
  `你選擇${take?'服用':'不服用'}娃娃眼；依角色原始結局設定，${state.player}${infection?'已感染':'未感染'}。${survive?'這項選擇與角色狀況一致。':'這項選擇與角色狀況不符。'}`,
  `你投票選擇${side}《陳氏古法》。在單人版中其餘六名角色不進行隨機計票，這裡直接呈現你的陣營選擇。`,
  '現任「陳聿明」是經過整容的情報人員駱午陽；真正的陳聿明是偽裝成園丁的阿忠。',
  '孔神婆遭駱午陽殺害，其屍體遭紅豆後續肢解藏匿。瘟疫、娃娃眼及《陳氏古法》的秘密，將所有人推向了同一場危機。'];
 for(const t of lines){const box=el('div','clue-reveal');box.style.marginBottom='10px';box.appendChild(el('p','',t));$('options').appendChild(box);}
 const faction=D.factionEndings[side];
 const endingBox=el('div','clue-reveal');endingBox.style.margin='12px 0';endingBox.appendChild(el('strong','','組織手冊｜'+side+'陣營結局'));endingBox.appendChild(el('p','',faction));$('options').appendChild(endingBox);
 auxButton('閱讀組織手冊完整復盤（全劇透）',()=>{readerAfter=null;$('readerKicker').textContent='組織手冊｜已通關';$('readerTitle').textContent='故事真相與完整時間線';$('readerContent').textContent=D.fullTruth;$('readerContent').scrollTop=0;$('readerFooterText').textContent='已到終局，現在可以閱讀全部案件真相。';$('readerDone').hidden=true;$('readerOverlay').hidden=false;});
 auxButton('回看第一幕至第四幕已解鎖劇本',()=>openReader(false));
 auxButton('重新遊玩',()=>{$('resetButton').click();});
 state.complete=true;save();
}
function renderSidebar(){
 $('clueCount').textContent=`${(state.publicClues||[]).length} 張公開`;
 for(const [id,kind] of [['tabClue','clues'],['tabTalk','talk'],['tabNote','note']])$(id).classList.toggle('active',sideTab===kind);
 const pane=$('sideContent');clear(pane);
 if(sideTab==='clues'){
  const pub=(state.publicClues||[]).map(id=>D.clues.find(c=>c.id===id)).filter(Boolean);
  pane.appendChild(el('h4','side-subtitle',`已公開的線索（${pub.length}）`));
  if(!pub.length)pane.appendChild(el('p','empty','目前還沒有公開線索。第一幕不會發放提示卡。'));
  for(const c of pub.slice().reverse()){
   const box=el('article','clue-box');box.appendChild(el('h4','',`提示卡・${String(c.id).padStart(2,'0')}｜${c.area}`));box.appendChild(el('p','',c.text));pane.appendChild(box);
  }
  const mine=state.owned.filter(x=>x.owner===state.player&&!(state.publicClues||[]).includes(x.id));
  if(mine.length){
   pane.appendChild(el('h4','side-subtitle',`我持有但尚未公開（${mine.length}）`));
   for(const x of mine.slice().reverse()){
    const c=D.clues.find(y=>y.id===x.id);if(!c)continue;
    const box=el('article','clue-box private-clue');box.appendChild(el('h4','',`私人提示卡・${String(c.id).padStart(2,'0')}`));box.appendChild(el('p','',c.text));
    const btn=el('button','share-clue','公開這張線索');btn.type='button';btn.addEventListener('click',()=>sharePlayerClue(c.id));box.appendChild(btn);pane.appendChild(box);
   }
  }
  const held=state.owned.filter(x=>x.owner!==state.player&&!(state.publicClues||[]).includes(x.id)).length;
  if(held)pane.appendChild(el('p','empty',`其他角色另有 ${held} 張未公開的個人線索，尚不能查看內容。`));
 }else if(sideTab==='talk'){
  if(!state.publicLog.length)pane.appendChild(el('p','empty','尚無公開問答。劇情對話會逐句顯示，播放後才寫入此處。'));
  else for(const x of state.publicLog.slice().reverse()){
   const box=el('article','log-box');box.appendChild(el('div','log-role',x.who));box.appendChild(el('p','',x.text));box.appendChild(el('div','log-time',`第 ${x.act} 幕`));pane.appendChild(box);
  }
 }else{
  const txt=el('textarea','note-input');txt.id='noteBox';txt.placeholder='記下可疑的時間、動機、誰說了什麼……';txt.value=state.notes||'';txt.addEventListener('input',()=>{state.notes=txt.value;save();});pane.appendChild(txt);pane.appendChild(el('p','empty','只儲存在目前瀏覽器，不會上傳任何伺服器。'));
 }
}
for(const [id,kind] of [['tabClue','clues'],['tabTalk','talk'],['tabNote','note']])$(id).addEventListener('click',()=>{sideTab=kind;renderSidebar();});
$('resetButton').addEventListener('click',()=>{if(!confirm('確定刪除目前遊玩進度並重新開始？'))return;localStorage.removeItem(STORE);state=newState();activeClue=null;hideDialogue();$('readerOverlay').hidden=true;sideTab='clues';renderSidebar();render();frontSection('home');});

$('homeButton').addEventListener('click',()=>frontSection('home'));
renderSidebar();render();frontSection('home');
