'use strict';
/* 紙妻 V6.9｜單人免 Token 劇本殺。純靜態，不使用 API；所有進度保存在本機瀏覽器。 */
const D = window.PAPERWIFE_DATA;
D.version="6.11";
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
 preloadPortraits();
 frontView=view;
 const f=$('frontScreen');
 if(view==='play'){f.hidden=true;$('app').hidden=false;return;}
 hideDialogue();
 f.hidden=false;$('app').hidden=true;
 const pane=$('frontInner');clear(pane);
 const background=$('frontHero');background.className='front-hero';
 background.classList.add(view==='home'?'front-home':view==='cases'||view==='overview'?'front-case':'front-role');
 if(view==='home')renderHome(pane);else if(view==='cases')renderCases(pane);else if(view==='overview')renderCaseOverview(pane);else if(view==='roles')renderRoleSelect(pane);
}
function renderHome(pane){
 const copy=el('section','ref-home-copy');
 copy.append(el('div','ref-home-brow','✦　互動式懸疑劇本殺'));
 copy.append(el('h1','ref-home-title','劇本殺'));
 copy.append(el('p','ref-home-subtitle','沉浸式推理・互動劇本遊戲'));
 copy.append(el('p','ref-home-summary','這不僅是一場遊戲。\n而是一次身臨其境的推理體驗。\n你將穿越時空，化身故事中的一員，\n在謎言與真相交織的劇情中，\n透過線索與證詞，抽絲剝繭，找出隱藏的兇手。'));
 const actions=el('div','ref-home-actions');
 actions.append(frontButton('開始遊戲',()=>frontSection('cases'),'gold-button'));
 actions.append(frontButton('劇本列表',()=>frontSection('cases'),'outline-button'));
 if(state.player)actions.append(frontButton('繼續遊戲',()=>{frontSection('play');render();},'outline-button'));
 copy.append(actions);pane.append(copy);
}
function renderCases(pane){
 const area=el('section','ref-case-library');
 area.append(el('div','front-eyebrow','CHOOSE YOUR CASE'));
 area.append(el('h2','front-section-title','選擇劇本'));
 area.append(el('p','front-muted','請選擇你想遊玩的劇本'));
 for(const c of V.caseCatalog){
  const card=el('article','ref-case-card');
  const cover=el('img','ref-case-cover');cover.src=c.cover;cover.alt=c.title+' 劇本封面';card.append(cover);
  const info=el('div','ref-case-info');
  const status=el('span','ref-case-status','進行中');info.append(status);
  info.append(el('h3','',c.title));info.append(el('p','ref-case-era',c.category));
  info.append(el('p','ref-case-story',c.subtitle));
  info.append(el('p','ref-case-facts',`♟　角色人數：${c.players||'7 人劇本'}　 ◷　預估遊玩時間：${c.duration||'約 4–6 小時'}`));
  const go=frontButton('閱讀《'+c.title+'》故事簡介  ›',()=>{if(c.available)frontSection('overview');},'ref-case-go');info.append(go);
  card.append(info);area.append(card);
 }
 area.append(frontButton('← 返回首頁',()=>frontSection('home'),'ref-small-back'));
 pane.append(area);
}
function renderCaseOverview(pane){
 const area=el('section','ref-story-overview');
 area.append(el('div','front-eyebrow','THE STORY BEGINS'));
 area.append(el('h2','front-section-title','紙妻・故事簡介'));
 area.append(el('p','ref-overview-guide','民國江南，濃霧深鎖陳宅。在選擇角色前，先聽聽這座宅院流傳的故事。'));
 const body=el('div','ref-overview-text');
 body.textContent=D.caseSynopsis||'';area.append(body);
 const actions=el('div','ref-overview-actions');
 actions.append(frontButton('選擇我要扮演的角色 ›',()=>frontSection('roles'),'gold-button'));
 actions.append(frontButton('← 返回劇本列表',()=>frontSection('cases'),'outline-button'));
 area.append(actions);pane.append(area);
}
function renderRoleSelect(pane){
 clear(pane);
 const area=el('section','ref-role-library');
 area.append(el('div','front-eyebrow','YOUR SECRET IDENTITY'));
 area.append(el('h2','front-section-title','決定你的角色'));
 area.append(el('p','front-muted','你將成為陳宅故事中的一名角色。每位角色都有自己的祕密與任務。'));
 const grid=el('div','ref-role-grid');
 D.roles.forEach(name=>{
  const b=el('button','ref-role-card'+(!randomRoleMode&&selectedRole===name?' selected':''));b.type='button';
  const img=el('img','ref-role-image');img.src=V.portraits[name]||'';img.alt=name+' 人物立繪';
  b.append(img,el('div','ref-role-name',name));
  b.addEventListener('click',()=>{selectedRole=name;randomRoleMode=false;renderRoleSelect(pane);});
  grid.append(b);
 });area.append(grid);
 const actions=el('div','ref-role-actions');
 actions.append(frontButton(randomRoleMode?'↔ 正在隨機抽角':'↔ 隨機分配角色',()=>{randomRoleMode=!randomRoleMode;renderRoleSelect(pane);},'ref-role-random'));
 actions.append(frontButton(randomRoleMode?'抽取我的角色':'確認我的角色',()=>{
  const role=randomRoleMode?D.roles[Math.floor(Math.random()*D.roles.length)]:selectedRole;
  state=newState();state.player=role;state.phase='cast';state.castIndex=0;save();frontSection('play');render();
 },'ref-role-confirm'));
 area.append(actions);area.append(frontButton('← 返回故事簡介',()=>frontSection('overview'),'ref-small-back'));
 pane.append(area);
}
function beginPrologue(){
 const source=D.sharedBackstory||'';
 const paragraphs=source.split(/\n{2,}/).map(s=>s.trim()).filter(Boolean);
 const lines=[];
 for(const para of paragraphs){
  // Group by sentence rather than cutting words in the middle.
  const sentences=para.match(/[^。！？]+[。！？]?/g)||[para];
  let chunk='';
  for(const sentence of sentences){
   const piece=sentence.trim();if(!piece)continue;
   if(chunk&&chunk.length+piece.length>105){lines.push({who:'旁白',text:chunk});chunk='';}
   chunk+=piece;
  }
  if(chunk)lines.push({who:'旁白',text:chunk});
 }
 if(!lines.length)lines.push({who:'旁白',text:'民國三十年代，清河縣的故事即將展開。'});
 speak(lines,()=>{setPhase('read');openReader(true);});
}

function newState(){return {player:null,act:1,phase:'start',castIndex:0,publicDoneActs:[],readActs:[],interviewed:[],interviewTarget:null,questionPath:[],publicLog:[],drawn:[],owned:[],publicClues:[],npcSharedRounds:[],latestNpcPublicIds:[],latestNpcRound:'',searchStage:null,playerDraws:0,playerAreas:[],aiDrawsDone:false,notes:'',solutions:{},votes:{},result:null,complete:false};}
function load(){try{const s=JSON.parse(localStorage.getItem(STORE));if(s && typeof s==='object' && (s.phase==='start'||ordered.includes(s.player)) && Number.isInteger(s.act)&&s.act>=1&&s.act<=4)return {...newState(),...s,publicClues:Array.isArray(s.publicClues)?s.publicClues:[],npcSharedRounds:Array.isArray(s.npcSharedRounds)?s.npcSharedRounds:[],latestNpcPublicIds:Array.isArray(s.latestNpcPublicIds)?s.latestNpcPublicIds:[],publicDoneActs:Array.isArray(s.publicDoneActs)?s.publicDoneActs:[]};}catch{}return newState();}
function save(){localStorage.setItem(STORE,JSON.stringify(state));}
function setPhase(phase){state.phase=phase;save();render();}
function el(tag,cls,txt){const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x;}
function clear(node){node.replaceChildren();}
function message(msg){const x=$('toast');x.textContent=msg;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2800);}
function setHeader(kicker,title,desc){$('sectionKicker').textContent=kicker;$('sectionTitle').textContent=title;$('sectionDesc').textContent=desc||'';const opts=$('options');const aux=$('aux');opts.className='options';aux.className='aux';clear(opts);clear(aux);}
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
 const action=el('button','cast-scene-next',idx<total-1?'下一位　›':'進入故事　›');
 action.type='button';action.addEventListener('click',()=>{
  if(idx<total-1){state.castIndex=idx+1;save();render();}
  else{state.castIndex=0;save();clearSceneInfo();setPhase('prologue');beginPrologue();}
 });box.append(action);
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
 if((act===1&&phase==='ritual')||(act===1&&['interview','public'].includes(phase)))
  return {bg:'assets/scene/ritual.webp',tag:'陳宅 · 沖喜婚房'};
 if(phase==='searchSecret'||phase==='solveSecret'||(act===3&&phase==='ritual'))
  return {bg:'assets/scene/secret_chamber.webp',tag:'陳宅 · 密室深處'};
 if(phase==='search1'||phase==='search2')return {bg:'assets/scene/chen_exterior.webp',tag:'陳宅 · 內外搜證'};
 if(phase==='interview'||phase==='public')return {bg:'assets/scene/ritual.webp',tag:'陳宅 · 議事廳'};
 return {bg:'assets/scene/chen_exterior.webp',tag:'清河縣 · 陳宅'};
}
function applySceneVisual(){
 const cfg=sceneConfig();
 $('scene').style.backgroundImage=`linear-gradient(180deg,#09080615,#0b070ab3), url("${cfg.bg}")`;
 if(!queue.length)$('sceneTag').textContent=cfg.tag;
}
const portraitCache=new Map();
function preloadPortraits(){
 Object.values(V.portraits||{}).forEach(src=>{if(!src||portraitCache.has(src))return;const img=new Image();img.decoding='async';img.src=src;portraitCache.set(src,img);});
}
function showPortraits(left='',right='',who=''){
 const lp=$('leftPortrait'),rp=$('rightPortrait');
 for(const [node,name,nid] of [[lp,left,'leftName'],[rp,right,'rightName']]){
  const mapped=(name==='孔神婆附身'||name==='附身孔神婆')?'附身的孔神婆':name;
  const src=V.portraits[mapped];
  const show=Boolean(mapped && src);
  const portrait=node.querySelector('img');
  // The previous character must disappear before requesting the new one.
  node.classList.remove('visible','active','dimmed');
  $(nid).textContent=show?name:'';
  if(!show){portrait.removeAttribute('src');portrait.removeAttribute('data-src');continue;}
  node.classList.toggle('active',Boolean(who && (name===who || mapped===who)));
  node.classList.toggle('dimmed',Boolean(who && name!==who && mapped!==who));
  const requested=portrait.getAttribute('data-src');
  if(requested!==src){
   portrait.setAttribute('data-src',src);
   portrait.onload=()=>{if(portrait.getAttribute('data-src')===src)node.classList.add('visible');};
   portrait.onerror=()=>{node.classList.remove('visible');};
   portrait.src=src;
  }
  if(portrait.complete && portrait.naturalWidth>0)node.classList.add('visible');
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
function renderCastThumbStrip(current){
 const wrap=el('div','cast-thumb-strip');
 ordered.forEach((name,idx)=>{
  const card=el('button','cast-thumb'+(name===current?' active':''));card.type='button';
  const img=el('img','cast-thumb-image');img.src=V.portraits[name]||'';img.alt=name;
  const meta=el('div','cast-thumb-meta');
  meta.append(el('div','cast-thumb-index',String(idx+1).padStart(2,'0')));
  meta.append(el('div','cast-thumb-name',name));
  meta.append(el('div','cast-thumb-role',V.labels[name]||''));
  card.append(img,meta);
  card.addEventListener('click',()=>{state.castIndex=idx;save();render();});
  wrap.append(card);
 });
 return wrap;
}
function renderCastIntro(){
 const idx=Math.max(0,Math.min(state.castIndex||0,ordered.length-1));
 const name=ordered[idx];
 const info=CAST_INTROS[name]||{role:V.labels[name]||'',meta:'PUBLIC INTRODUCTION',desc:'',quote:''};
 showPortraits(name,'','');
 showCastSceneInfo(name,info,idx,ordered.length);
 $('castPageHeading').hidden=false;$('castPageCount').hidden=false;
 $('castPageCount').textContent=`${String(idx+1).padStart(2,'0')} / ${String(ordered.length).padStart(2,'0')}`;
 setHeader('在場人物','在場人物・自我介紹','在開始調查之前，先認識今晚出現在陳宅的人物。');
}
function stageLabel(){const map={start:'準備',cast:'在場人物',prologue:'案件序章',read:'劇本閱讀',ritual:'孔神婆儀式',interview:'人物問答',public:'公開盤問・證詞交換',search1:'第一輪搜證',searchSecret:'密室搜證',solveSecret:'密室推理',search2:'第二輪搜證',identity:'身分推理',vote:'最終投票',ending:'真相揭曉'};return map[state.phase]||state.phase;}
function updateHeader(){
 applySceneVisual();
 $('chapterBadge').textContent=state.phase==='start'?'尚未開始':`第 ${state.act} 幕・${stageLabel()}`;
 if(!queue.length)$('sceneProgress').textContent=stageLabel();
 $('clueCount').textContent=`${(state.publicClues||[]).length} 張公開`;
 const canReview=!!state.player&&!['cast','prologue','start'].includes(state.phase);
 $('readerButton').disabled=!canReview;
 $('theaterReader').disabled=!canReview;
}
function render(){
 updateHeader();
 document.body.dataset.phase=state.phase;
 if(state.phase!=='cast'){$('castPageHeading').hidden=true;$('castPageCount').hidden=true;}
 const play=document.querySelector('.play-area');
 play.classList.toggle('choice-mode',state.phase==='interview'&&!!state.interviewTarget);
 play.classList.toggle('target-mode',state.phase==='interview'&&!state.interviewTarget);
 if(state.phase!=='cast')clearSceneInfo();
 if(queue.length)return;
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
function readerText(forAdvance=false){
 const r=D.roleData[state.player];
 if(forAdvance){
  const prefix=state.act===1?r.prelude+'\n\n────────── 第一幕 ──────────\n\n':`────────── 第 ${state.act} 幕 ──────────\n\n`;
  return prefix+r.acts[state.act-1];
 }
 // 回顧模式只顯示已到達的幕次；沒有解鎖的後幕永遠不會寫入視窗。
 const unlocked=Math.max(1,Math.min(4,state.act));
 const blocks=[r.prelude,'────────── 第一幕 ──────────',r.acts[0]];
 for(let act=2;act<=unlocked;act++)blocks.push(`────────── 第 ${act} 幕 ──────────`,r.acts[act-1]);
 return blocks.filter(Boolean).join('\n\n');
}
function openReader(forAdvance=false){if(!state.player)return;
 const unlocked=Math.max(1,Math.min(4,state.act));
 $('readerTitle').textContent=forAdvance?(state.act===1?`${state.player} · 你的故事開始與第一幕`:`${state.player} · 第 ${state.act} 幕`):`${state.player} · 第一幕至第 ${unlocked} 幕`;
 $('readerKicker').textContent=forAdvance?'本幕角色劇本｜未解鎖內容不顯示':'我的劇本｜已到達幕次完整回顧';
 $('readerContent').textContent=readerText(forAdvance);
 $('readerFooterText').textContent=forAdvance?'請讀至本幕結束；之後的劇本不會提前解鎖。':`已到達第 ${unlocked} 幕。以下幕次尚未解鎖。`;
 $('readerDone').hidden=!forAdvance;
 $('readerOverlay').hidden=false;
 $('readerContent').scrollTop=0;
 $('readerContent').scrollTo?.({top:0,behavior:'instant'});
 requestAnimationFrame(()=>{$('readerContent').scrollTop=0;});
 readerAfter=forAdvance?()=>{if(!state.readActs.includes(state.act))state.readActs.push(state.act);save();$('readerOverlay').hidden=true;if(state.act===1||state.act===3)setPhase('ritual');else if(state.act===2){state.playerDraws=0;state.playerAreas=[];state.aiDrawsDone=false;setPhase('search1');}else setPhase('public');}:null;
}
$('readerButton').addEventListener('click',()=>openReader(false));
$('theaterReader').addEventListener('click',()=>openReader(false));
$('closeReader').addEventListener('click',()=>{if(readerAfter){message('請先完成本幕劇本閱讀，再進行下一階段。');return;}$('readerOverlay').hidden=true;});
$('readerDone').addEventListener('click',()=>{const cb=readerAfter;readerAfter=null;if(cb)cb();});
function renderRead(){setHeader(`第 ${state.act} 幕`,state.act===1?'你的故事開始・第一幕':'閱讀本幕角色劇本',`本幕只會顯示 ${state.player} 的角色劇本，不會開放未解鎖內容。`);option('開啟本幕劇本',()=>openReader(true),{primary:true});}
function renderRitual(){showPortraits();if(state.act===1){setHeader('第一幕 · 小劇場','孔神婆主持婚禮沖喜儀式','此段會切換到婚房儀式場景。神婆附身、眾人的反應，以及惠雯突然現身，都是後續推理的重要資訊。每按一次只播放一句。');option('開始孔神婆儀式',()=>speak(D.ritual.map((line,i)=>line.who==='孔神婆'?{...line,left:'孔神婆',right:'',portrait:(i>=3?'附身的孔神婆':'孔神婆')}: {...line,left:'',right:''}),()=>{state.act=2;state.interviewed=[];state.interviewTarget=null;state.questionPath=[];setPhase('read');openReader(true);}),{primary:true});}
 else {setHeader('第三幕 · 小劇場','黑暗中的密室','昏暗的密室深處，古老機關與離奇屍塊正等待你們調查。之後將進入密室搜證與推理。');option('進入密室劇場',()=>speak(D.haunt,()=>{state.playerDraws=0;state.playerAreas=[];state.aiDrawsDone=false;setPhase('searchSecret');}),{primary:true});}}

const PLAYER_CHALLENGE_OVERRIDES={
 '1':{
  '陳聿明':{asker:'江靜儀',q:'你一邊說婚禮要從簡，一邊又刻意避開陳家寨與過去姨太太失蹤的舊案。你究竟是在怕流言，還是在怕有人對上時間線？',options:[{text:'我怕的是婚禮前再生風波，舊案本就眾說紛紜，今天不是翻舊帳的好時機。',react:'既然你說會在婚後交代清楚，那我就記下這句話，日後會拿證據來核對。 '},{text:'陳家寨的事牽涉當年大量死者，我不願把那段慘事當作今夜賓客茶餘飯後的談資。',react:'你強調尊重死者，卻又對關鍵細節閉口不談，這份克制未必能洗清嫌疑。 '},{text:'我並非拒談，而是想先把眼前婚禮與怪事處理完，再把舊事按次序說清楚。',react:'好，這算是你的正式承諾；若後面仍一味拖延，就只能視作心虛。 '}]},
  '東青':{asker:'紅豆',q:'今天宅裡很多怪事都像是你最先知道。從請神婆到安排儀式、巡夜與分配房間，你到底只是盡責，還是故意把局面往你能掌控的方向推？',options:[{text:'我是管家，宅中安排本就落在我身上；怪事頻傳時，當然得先把場面穩住。',react:'你把責任說得理所當然，但也因此你比任何人都更容易動手腳。 '},{text:'請神婆是為了安撫人心，不是為了演戲；若我想操弄局面，何必把整件事鬧得人人不安。',react:'可偏偏最知道流程的人也是你，這點反而讓人更難完全信任。 '},{text:'我只負責執行老爺的意思，至於大家各自藏著什麼心事，我未必比你們知道得更多。',react:'你嘴上說不知道，卻總在最關鍵的時候剛好出現，這巧合未免太多。 '}]},
  '阿忠':{asker:'江靜儀',q:'你平時最少說話，卻熟悉後院、棚屋、工具間與每一條暗路。若宅裡真有人半夜活動，你應該最容易發現。你今晚到底看見了什麼？',options:[{text:'我只管花木和後院，不愛摻和屋裡的事；可最近院裡確實多了幾次不該有的腳步聲。',react:'這句話至少比你先前什麼都不說要有價值得多，我會記下那些「不該有」的腳步。 '},{text:'我沒看清人，只知道有人在夜裡動過後院和雜物一帶，不像單純起夜那麼簡單。',react:'也就是說，有人在避開正廳與走廊活動，這點對我們很重要。 '},{text:'怪事不是一兩天，真正詭異的是有人明明熟宅子，卻偏要裝作什麼都沒發生。',react:'你像是在點名宅裡的「熟人作案」。若之後你還不肯說得更明白，就很難不被懷疑。 '}]},
  '戴思齊':{asker:'陳聿明',q:'你是外來客，也是少數受過新式醫學教育的人。你一方面說宅中怪事多半有現實原因，一方面又對惠雯、藥物與血液反應特別敏感。你究竟在留意什麼？',options:[{text:'我是醫生，自然先看症狀與病理。惠雯的蒼白、躁亂與傷口狀況，都不像單純裝神弄鬼。',react:'你這麼說，等於承認你早覺得惠雯的情況可能牽涉疾病，而不只是瘋病。 '},{text:'我留意的是有人把迷信當幌子，真正危險的反而是藥、傷口與接觸史。',react:'這句話很關鍵，若後面再找到藥物與血液線索，你就會成為重要證人。 '},{text:'宅子裡每個人都比表面複雜，我只是比旁人更早意識到，「鬼」未必比活人可怕。',react:'你倒說得坦白，也等於暗示這屋裡真正該防的是人。 '}]},
  '孟小婉':{asker:'紅豆',q:'你才來宅裡不久，卻偏偏成了這場婚事的中心。最近你又老說自己見到走廊盡頭有人影。你到底只是受驚，還是其實知道有人在暗中盯著你？',options:[{text:'我是真的害怕；越接近婚期，越覺得有人在走廊盡頭看著我，連夜裡都不敢獨自出門。',react:'若你不是裝的，那就表示宅裡真的有人在觀察你，甚至故意給你壓力。 '},{text:'我不知道那是不是人影，但那種被盯著的感覺很真，我不認為只是自己胡思亂想。',react:'好，我會把「被盯梢」記下來；這比單純鬧鬼更值得查。 '},{text:'我只想平安把婚禮辦完，可這幾天發生的事，讓我越來越覺得自己像被捲進了別人的舊怨。',react:'這句話倒像實話。若你是被捲進來的人，那真正的衝突可能早在你進宅前就開始了。 '}]},
  '紅豆':{asker:'江靜儀',q:'你是宅裡最常跑動的人，廚房、走廊、偏房、客房你都會去。若誰的房裡少了東西、位置有變、飯菜藥碗出過問題，你恐怕最清楚。你願意說到什麼程度？',options:[{text:'我能說的都會說。這幾天確實有幾個房間像被人翻動過，連擺設都和先前不一樣。',react:'這就不是小事了；若房間被翻過，代表有人在找東西，而不只是夜裡走動。 '},{text:'我不敢保證看見一切，但宅裡最近東西常莫名換位，連平常安靜的角落都有人去過。',react:'也就是說，許多人都不在自己該在的位置，這對排時間線很有幫助。 '},{text:'我只是個做事的人，可也看得出最近大家心裡都有鬼，誰都不像表面那麼單純。',react:'你雖沒指名道姓，卻是在提醒我們：僕役也未必只是旁觀者。 '}]},
  '江靜儀':{asker:'戴思齊',q:'你說是記者來採訪，卻一到宅裡就直問陳家寨舊案，甚至比一般記者更在意每個人的時間與話術。你是來參加婚禮，還是來查一樁早就盯上的案子？',options:[{text:'我本來就不是單純赴宴。既然舊案牽涉數百條人命，我當然要查到底。',react:'這回答倒很直接，也證明你今晚的每一步都不是臨時起意。 '},{text:'如果沒人願意把當年的事說清楚，總得有人逼近真相；我只是選擇不裝作沒看見。',react:'你這份執著會幫我們，也可能讓你自己成為衝突中心。 '},{text:'我來之前就知道陳宅不乾淨。至於掌握了多少，不到必要時我不會全數攤開。',react:'你承認自己另有準備，等於也承認你身上藏著還沒公開的資訊。 '}]}
 },
 '2':{
  '陳聿明':{asker:'江靜儀',q:'惠雯在婚房被發現之前，你曾去過閣樓、又在夜裡四處走動。若你真只是在安撫場面，為何你的行蹤總出現在最接近案發的地方？',options:[{text:'惠雯是宅裡最不穩定的人，她的狀況本就需要我盯著；我靠近她，不代表我要害她。',react:'靠近不等於行兇，但代表你比旁人更有機會下手，這點無法回避。 '},{text:'我去閣樓是因為她白天已失控，我擔心她再闖禍；之後夜裡走動，也是為了確認宅裡沒再出事。',react:'至少你的理由自洽，但還需要別的證據來支持。 '},{text:'如果我真想掩飾，大可什麼都不說。正因我知道自己行蹤可疑，才更願意把時間點攤開。',react:'很好，那我們接下來就按時間來對。你若有一處說不通，嫌疑只會更重。 '}]},
  '東青':{asker:'陳聿明',q:'昨夜從晚飯後到停電前，你幾乎一直在宅裡各處跑動：送藥、看婚禮細節、巡視、鎖門。你能不能把自己離開人群的時間說清楚？',options:[{text:'我承認我忙著跑動，但多半是為了婚禮和宅務；我的時間點很多人都能互相印證。',react:'若真能互相印證，你的嫌疑會小很多；反之，任何空檔都值得追。 '},{text:'我去過書房、廚房、樓上走廊和大門，可每一步都是辦宅務，不是私下行動。',react:'你把地點說得很完整，這至少讓我們有跡可循。 '},{text:'我是管家，本來就不可能整晚站在一處；但若要問我是否有長時間失聯，我不認為有。',react:'那麼關鍵就是那些短暫空檔，往往命案就是在空檔裡發生。 '}]},
  '阿忠':{asker:'紅豆',q:'昨夜古樹倒下前後，你既出現在後院，也最清楚哪裡能躲雨、哪裡能藏人。你究竟何時進過大宅、又何時離開過大家視線？',options:[{text:'我不愛往屋裡走，但昨夜雨勢和動靜都不對，我確實比平常更留意宅子的情況。',react:'也就是說，你不是完全置身事外，這點比你先前說的更接近實情。 '},{text:'我進出都是為了避雨、報信和找人，沒想過會被當成兇手；但我承認自己知道哪些路不顯眼。',react:'知道暗路本身不是罪，可在命案夜裡，這正是極重要的能力。 '},{text:'你們若要查時間，我能說的只有：有人比我更早進出屋裡，也更有理由接近惠雯。',react:'這句話像是在排嫌，也像是在指控別人；後面最好拿得出更多內容。 '}]},
  '戴思齊':{asker:'江靜儀',q:'你昨夜既看過東青的傷，又在夜裡多次離開房間。醫生身分確實方便你接近每個人，但也讓你更有機會接觸血液、藥物與屍體。你自己怎麼說？',options:[{text:'醫生接觸傷口與病人是自然的，不能因我懂藥理就倒推我有罪。',react:'懂藥理不等於有罪，但也代表你比旁人更知道怎樣留下最少痕跡。 '},{text:'我離開房間多半是因為宅裡接連出事，不少人情緒失控，我不可能袖手旁觀。',react:'你若是照料他人，那應該會有人記得你出現的時間與地點。 '},{text:'若真要追，我願意把我看見的症狀、血色與每個人的精神狀況說得更細，這比鬼神說有用。',react:'這正是我們需要的。只要你肯說細節，你就不只是嫌疑人，也是重要證人。 '}]},
  '孟小婉':{asker:'東青',q:'案發前後你多次單獨行動，既回房、又靠近婚房；而被發現時，偏偏又是你先尖叫。這讓人很難不懷疑你是否比旁人更早知道婚房裡的情況。',options:[{text:'我不是預先知道，而是恰好走近時先看見了那一幕；若你親眼見到，也一樣會失聲。',react:'先看到的人不一定有罪，但也意味著你是第一批接近現場的人。 '},{text:'我承認我昨夜心神不寧，幾次離房都和婚禮與白天那些怪事有關，並不是去害人。',react:'你的不安能理解，但時間點仍需要逐一對上。 '},{text:'若我真有心掩飾，大可裝作什麼都沒看到；我會尖叫，正因那場面遠超出我能承受。',react:'這說法有道理，不過還不足以完全排除你接近現場的動機。 '}]},
  '紅豆':{asker:'東青',q:'昨晚從晚飯後到停電前，你送藥、做點心、又在樓上樓下跑。你最容易靠近惠雯、也最容易接觸繩子、藥碗和婚房。你願不願把自己的路線說清楚？',options:[{text:'我願意說。我先在廚房忙，後來送藥、送甜點，也被差去叫人；忙亂不代表我有害人之心。',react:'工作繁忙能解釋走動，但也意味著你有非常多接近每個場景的機會。 '},{text:'我確實四處跑，可多半都是被吩咐去做事；若真要查，廚房和樓上的人都能證明我去過哪些地方。',react:'很好，這至少讓你的時間線能被交叉印證。 '},{text:'我不是唯一一個到過那些地方的人，只是因為我是下人，所以好像做什麼都更可疑。',react:'身分不代表有罪，但你接觸的物件太多，不能不查。 '}]},
  '江靜儀':{asker:'戴思齊',q:'昨晚你不只一次在走廊、客房和婚房附近出現，甚至比一般記者更積極追著命案跑。若你只是採訪，為何你的行動像在主動蒐證，甚至像在追某個特定真相？',options:[{text:'我本來就在查陳宅舊案，命案一出，自然更不可能裝聾作啞。',react:'這點說得通；你確實不像只想寫一篇社會版新聞的人。 '},{text:'我不是亂跑，而是在確認每個人的說法是否對得上；這是記者也是調查者該做的事。',react:'你承認自己在核對口供，那就代表你手裡也累積了不少判斷。 '},{text:'我確實在追某個真相，但那不代表我動了手；正相反，我更需要活人把話說清楚。',react:'若你是真想查清楚，那你身上未公開的線索，後面最好別再藏著。 '}]}
 },
 '3':{
  '陳聿明':{asker:'戴思齊',q:'書房裡的電台、涼亭裡的衝突、還有你突然變得像在收拾某種危險痕跡——這些事串起來後，你已不只是「宅主人」那麼簡單。你要不要主動交代你到底在替誰做事？',options:[{text:'我承認我與外界有聯繫，但那不等於我策劃了宅中的一切；有些事不便當眾說透。',react:'你終於承認另有身分，這已足夠改變大家對你的判斷。 '},{text:'若我不與外界聯繫，這宅裡發生的事根本沒人能處理；我不是在害人，而是在設法控制局面。',react:'「控制局面」這四個字分量很重，也代表你掌握的秘密遠比你先前承認的多。 '},{text:'我現在不能把所有合作方都說出來，但能保證我調查的核心與瘟疫、感染和這宅子的舊案有關。',react:'至少你終於把瘟疫擺上桌面，後面的每個回答都得圍繞這點接受檢驗。 '}]},
  '東青':{asker:'江靜儀',q:'從偷配鑰匙、巡夜、知道誰住哪裡，到可能接觸密室與私人物件，你身上的「便利條件」實在太多。若把宅裡的祕密分成明面與暗面，你顯然都摸得到。你到底藏了多少？',options:[{text:'我掌管鑰匙與起居，知道得多是職責使然，不代表我參與了每一件骯髒事。',react:'知道得多不是罪，但在我們看來，你幾乎天然就具備做手腳的條件。 '},{text:'我承認我看過一些不該看的東西，也察覺過一些關係不尋常的人，但不是所有事都由我主導。',react:'這句話比先前有份量得多，也等於證明你一直在選擇性隱瞞。 '},{text:'若我真的想把所有祕密埋住，根本不會留到現在。只是這宅裡有些東西，一說出口就會牽連很多人。',react:'可也正因為你一直不說，大家才更難排除你。 '}]},
  '阿忠':{asker:'陳聿明',q:'密室、閣樓、婚房機關、後院工具——你越來越不像只是個園丁。若真正的關鍵人物藏在僕役身分之下，那你比誰都更像那個人。你打算什麼時候說實話？',options:[{text:'我承認我在這宅子待得夠久，也知道一些旁人不知道的舊路舊物；但知道，不代表我願意立刻全說。',react:'你不否認自己比表面更深，這已經足夠讓所有人重新看待你。 '},{text:'有些事我不說，是因為一旦講開，就不是一條命的恩怨，而是整個陳宅二十多年的舊債。',react:'這樣的說法等於承認你與舊案有直接牽連。 '},{text:'如果你們真想知道，先別再把我只當成園丁；我和這宅子的關係，確實不止如此。',react:'這句話幾乎已經是在明示：你的真正身分比大家想得更重要。 '}]},
  '戴思齊':{asker:'孟小婉',q:'你對血液、注射、藥物和《陳氏古法》的反應都太快了，快到像是早就研究過這一切。你到底是為了救人，還是其實一直把這些當成自己的研究對象？',options:[{text:'我承認我對這類病例有強烈興趣，因為只有理解它，才有可能控制它。',react:'「控制」這個詞很危險，也說明你與一般醫者的出發點並不完全相同。 '},{text:'若我只是想害人，不必辛苦收集症狀、比對血色與發作方式；我是在尋找規律。',react:'尋找規律也可能是研究者的心態，這並不能自動洗清你的動機。 '},{text:'救人與研究從來不完全分離。眼下最重要的，是誰真正接觸過病毒與血液，而不是先把懂醫的人當兇手。',react:'你說得有道理，但也等於提醒我們：最懂方法的人，往往也最懂如何利用方法。 '}]},
  '孟小婉':{asker:'江靜儀',q:'從婚前的接近、到昨夜的單獨行動，再到你身上越來越多說不清的接頭痕跡，你顯然不只是被動的新娘。你究竟是在替誰辦事，又想從陳宅拿走什麼？',options:[{text:'我承認我一開始帶著目的接近陳宅，但事情早已不像我最初以為的那樣簡單。',react:'這句話非常重要，因為它代表你原本就背負任務，而不是純粹偶然捲入。 '},{text:'我有自己的壓力與不得已，可我從沒想過把所有人推向死路。現在很多事都超出了我的控制。',react:'也就是說，你參與其中，卻未必主導全局；這對排嫌很關鍵。 '},{text:'若我真只為利益而來，根本不會在現在還猶豫。正因我被夾在幾方之間，才會一步錯、步步亂。',react:'你把自己說成夾縫中的人，這至少能解釋你為何一直前後矛盾。 '}]},
  '紅豆':{asker:'阿忠',q:'你表面是最不起眼的女傭，可你對舊火災、惠雯、房間變化與某些遺物都敏感得異常。若說這宅裡有人不是為了工錢留下，那你很可能也是其中之一。你來陳宅，到底想找什麼？',options:[{text:'我留在這裡，的確不只是為了工錢。我想知道一些舊事的真相，尤其是和火災有關的。',react:'這等於承認你有明確目的，也能解釋你為何總盯著某些異常不放。 '},{text:'我見過太多不像巧合的細節，所以不甘心只當個端茶送水的人。',react:'這不是明說身分，卻足夠表明你並非局外人。 '},{text:'有些真相若不自己挖，永遠不會有人替我說。就算你們覺得我可疑，我也不會裝作什麼都沒發現。',react:'這句話雖硬，卻有力量；至少可以確定你在查某段與自己切身相關的舊事。 '}]},
  '江靜儀':{asker:'東青',q:'你身上的記者身分、毒癮痕跡、對舊案的執念，已經讓你不只是旁觀者。若你掌握的不是一般採訪資料，而是足以改寫整個案子的線索，現在還要繼續藏著嗎？',options:[{text:'我手上的確有一些未公開的資料，但在查清來源之前，我不會任意把它丟到桌面上。',react:'也就是說，你確實帶著底稿與預設目標來到這裡。 '},{text:'我不是故意藏，而是知道有些話一旦說出來，會逼得某些人立刻翻臉。',react:'這句話很像威脅，也說明你握著足以刺痛人的證據。 '},{text:'我可以承認自己不單是記者，可我追的不是熱鬧，而是真相；這點沒有變。',react:'若真如此，你接下來就必須拿出能讓大家信服的實證。 '}]}
 },
 '4':{
  '陳聿明':{asker:'阿忠',q:'現在大家都在懷疑「陳聿明」這個身分本身。若名字是假、臉也可能是假，那你剩下能讓人信任的，只有你做過的事。你打算怎麼為自己辯護？',options:[{text:'我承認身分有不能明說之處，但我做的許多決定，至少不是為了把宅裡的人都推向死路。',react:'也就是說，你希望大家用行為而不是名字來審判你。 '},{text:'若只問名字，我確實未必配得上「陳聿明」三字；但若問我是否一直在查真相，我沒有退過。',react:'這樣的辯護相當坦白，也讓你從單純說謊者變成有目的的冒名者。 '},{text:'我會承擔該承擔的責任，但也請你們分清：有些罪是我隱瞞的，有些罪卻不是我犯的。',react:'這句話很關鍵，因為它主動區分了「身分欺瞞」與「殺人真兇」。 '}]},
  '東青':{asker:'紅豆',q:'到了這一步，大家最難原諒的不一定是兇手，而是那些明明知道很多卻一直裝作忠心辦事的人。若你真的不是核心凶手，那你願不願承認自己到底替誰傳過話、掩過什麼？',options:[{text:'我可以承認自己做過不少不光彩的事，但不代表每一件命案都由我主導。',react:'這種承認雖然不乾淨，卻至少開始把你從「全盤否認」拉回實話。 '},{text:'我替人辦過事，也替自己留過後路；只是有些事若當時不做，我根本活不到今天。',react:'你把自己說成求生者，某種程度上也解釋了你為何總在夾縫中周旋。 '},{text:'若要我全說，我會說；但你們得先接受一件事：這宅裡沒有誰是完全乾淨的。',react:'這句話雖像轉移焦點，卻也符合眼下局勢。 '}]},
  '阿忠':{asker:'陳聿明',q:'若把所有假象都撕掉，你在這宅裡的位置可能比誰都久、也比誰都深。現在真正該問的不是你像不像園丁，而是你究竟背著哪一段舊身分活到了今天。你還要躲嗎？',options:[{text:'躲了這麼久，不是不想說，而是很多事一說出口，就再也回不去了。',react:'這幾乎等於承認你真正躲藏的不是去向，而是身分本身。 '},{text:'你們若真查到這一步，也該明白我和陳宅的牽連不是幾句「園丁」就能帶過。',react:'這句話已足夠讓人確信：你不是邊緣角色，而是核心當事人之一。 '},{text:'我能承認的是，我對火災、惠雯與宅裡的舊規矩都不只是聽說而已。',react:'光這一句，就足夠把你推進最關鍵的嫌疑與真相交界。 '}]},
  '戴思齊':{asker:'江靜儀',q:'你的知識、手段與冷靜讓人不得不防。可若真相已經攤開，我更想知道的是：在你眼裡，人命、研究與真相，究竟哪一樣排在最前面？',options:[{text:'我先在乎真相與方法，因為不理解這東西，就談不上拯救任何人。',react:'這回答很像你，也很危險——因為它沒有把人命放在最前面。 '},{text:'我不否認自己有研究者的冷酷，但若沒有這份冷酷，我們永遠摸不到瘟疫的邊。',react:'這種自白會讓人敬佩，也會讓人恐懼。 '},{text:'若只能三選一，我至少不會把虛假的安慰放在最前面。真相比溫情更能救命。',react:'你把自己放在理性極端的一側，這也解釋了大家為何始終不敢完全信你。 '}]},
  '孟小婉':{asker:'戴思齊',q:'你一路被不同人影響、利用與拉扯，可最後做決定的人還是你自己。現在若要你回頭看，你最想證明的是自己不是兇手，還是自己不是任何人的棋子？',options:[{text:'我最想證明的是，我雖然做錯過選擇，卻沒有想把誰推向死亡。',react:'這句話偏向排嫌，也承認你確實做過選擇。 '},{text:'我不想再當別人的棋子；很多決定不是我主導，但從現在起，我願意自己負責。',react:'這回答讓你從被動者變成了願意承擔的人。 '},{text:'如果可以，我希望大家分清楚：我有隱瞞，也有利用別人的地方，但不等於我是這場命案的核心。',react:'這樣的辯白很有力，因為它不是全面洗白，而是明確切割罪責。 '}]},
  '紅豆':{asker:'東青',q:'你看似最年輕、最弱勢，可走到最後，你顯然不再只是廚房裡的女孩。若真正推著你往前走的是家恨而不是工錢，你現在願不願承認，你查的一直是自己的舊債？',options:[{text:'是，我留下來從來不只為了工錢。有些仇與真相，不親手查，永遠不會有人替我討回。',react:'這種坦白會讓人重新理解你的每一步。 '},{text:'我做過很多衝動的事，可若沒有那些執念，我也撐不到現在。',react:'也就是說，你的行動邏輯來自私人牽連，而不是單純的好奇。 '},{text:'我承認我一直在查和自己有關的舊事，但查真相不等於我就是兇手。',react:'這個區分很重要，也正是大家現在最需要判斷的地方。 '}]},
  '江靜儀':{asker:'孟小婉',q:'你一路扮演記者、調查者、旁觀者，但其實誰都看得出，你查這件事不只是工作。若最後真相會刺傷你自己，你還是會選擇把它說出來嗎？',options:[{text:'會。若真相只對別人殘忍、對自己卻要遮掩，那根本不算追真相。',react:'這句話很有你的風格，也顯示你至少在核心立場上沒有動搖。 '},{text:'我害怕，但我更害怕被謊言牽著活一輩子，所以即使刺痛，我也會說。',react:'這讓你顯得不像單純來挖新聞的人，而像在追問自己的人。 '},{text:'如果我最後仍選擇說出來，那不是因為我不痛，而是因為有人早該為這些死去的人開口。',react:'這回答有力，也讓人更能理解你對舊案的執著。 '}]}
 }
};

const INTERVIEW_DISCLOSURES={
 '1':{
  '陳聿明':'若你們真要查怪事，我能先給一個方向：腳印、被翻動的房間，以及惠雯夜裡的異樣，恐怕都不是同一個人造成的。',
  '東青':'白天從請神婆到安排婚房，幾乎每一步都經過我手；若真有人借流程掩飾目的，那他一定也很熟這宅子的運作。',
  '阿忠':'最近後院、雜物間和牆根下確實有人走動，而且不像只走一次；比起鬧鬼，我更信是有人在躲人。',
  '戴思齊':'從我的角度看，眼前最不尋常的不是怪談，而是某些人的蒼白、躁動與對血液的反應，這些都值得記下。',
  '孟小婉':'若要說可疑，我最在意的是那種被人盯梢的感覺。它不像空穴來風，反而像有人故意讓我察覺。',
  '紅豆':'房間被翻動、首飾或小物換位、連廚房與偏房都有人去過；這宅裡有人在找東西，而且不只一個。',
  '江靜儀':'陳家寨舊案、失蹤姨太太與眼下怪事之間未必是三件事；我懷疑它們本來就是同一條線上的不同節點。'
 },
 '2':{
  '陳聿明':'昨夜真正重要的，是誰在 20:10 後仍有能力自由出入閣樓、婚房與走廊，因為惠雯的死亡不可能只經過一個人之手。',
  '東青':'你們若要對時間線，請特別看 20:00 到 22:30 之間誰在樓上、誰去過廚房、誰碰過鑰匙與藥碗，那段空檔最密。',
  '阿忠':'昨夜很多人都不在自己該在的位置。若只盯著發現屍體那一刻，反而會忽略更早的接近與衝突。',
  '戴思齊':'從屍體呈現的異常與大家提到的症狀看，惠雯遇害前後很可能不只一次被接觸，甚至可能被不同方式傷害。',
  '孟小婉':'我最想說的是：婚房不是單一現場。昨夜不只一個人進過那裡，所以最先尖叫的人未必就是最後動手的人。',
  '紅豆':'若你們查昨夜，別忘了廚房、甜點、藥碗、繩子和樓上跑動的人；我做工時看到的零碎事，拼起來其實很嚇人。',
  '江靜儀':'我建議把每個人離房、回房、再度出現的時間都寫下來，尤其是 21 點後；很多矛盾會自己浮上來。'
 },
 '3':{
  '陳聿明':'到第三幕為止，已經不能再只把這案子當成家宅命案；它同時牽涉身分偽裝、舊火災、瘟疫與外部勢力。',
  '東青':'若要問我最危險的是什麼，不是密室本身，而是有人把密室、鑰匙、監視與私人物件都串成了一張網。',
  '阿忠':'許多「機關」其實都是老宅原本就有的，只是知道的人越少，越容易被拿來製造不在場與藏匿祕密。',
  '戴思齊':'我現在更在意的是病毒與血液流向，而不是誰喊得最大聲；因為真正的危險，可能在眾人身上都已留下痕跡。',
  '孟小婉':'若你們覺得我前後矛盾，那是因為我一直同時被兩三股力量拉扯。我確實有隱瞞，但不是唯一在演戲的人。',
  '紅豆':'密室與屍塊讓很多舊事一起爆開了。若只把我當女傭看，你們會錯過我為什麼非查火災不可。',
  '江靜儀':'走到這裡，最該做的不是各自護短，而是把「誰從何時開始知道不只一個身分真相」這件事攤開來。'
 },
 '4':{
  '陳聿明':'到最後，要分清三件事：誰在說謊、誰有舊身分、誰才是真正殺害惠雯的人。這三者不必然完全重合。',
  '東青':'若要對我下判斷，我希望你們把「貪、怕、保身」和「真正下殺手」分開。我的錯很多，但不一定都指向同一條罪。',
  '阿忠':'若你們已經看出我與陳宅舊事關聯極深，那就該再往前一步想：誰最有舊仇、誰最懂惠雯、誰最知道火災後遺下了什麼。',
  '戴思齊':'你們若要判斷我，請同時看我的知識如何被我使用：是用來揭開瘟疫真相，還是把別人當成達成目的的材料。',
  '孟小婉':'請把「曾被利用」「曾有任務」「是否為核心兇手」拆開看。我不乾淨，但不代表所有血都該算在我身上。',
  '紅豆':'我一路做的許多事，都與火災和家恨有關。若真要評斷我，請至少先弄清我到底失去了什麼。',
  '江靜儀':'我不怕你們質疑我藏了資料，怕的是你們把所有說謊的人都當成同等的惡。有人是為活命，有人是為滅口，差別很大。'
 }
};

function getPlayerChallenge(act,role){
 const authored=window.PAPERWIFE_PLAYER_TIMELINE_CHALLENGES?.[String(act)]?.[role];
 if(authored)return {asker:authored[0],q:authored[1],options:authored[2].map(p=>({text:p[0],react:p[1]}))};
 return (PLAYER_CHALLENGE_OVERRIDES[String(act)]||{})[role] || D.publicChallenges[String(act)][role];
}
function getInterviewDisclosure(act,target,layer){
 if(layer!==0) return '';
 return ((INTERVIEW_DISCLOSURES[String(act)]||{})[target]) || '';
}

function renderInterview(){showPortraits(state.player,'','');const remaining=ordered.filter(n=>n!==state.player&&!state.interviewed.includes(n));
 if(state.interviewTarget)return renderInterviewTree();
 setHeader(`第 ${state.act} 幕 · 公開詢問`,`詢問角色（${state.interviewed.length}/2）`,'本幕選擇兩名不同角色各完成一組三層問答。每名角色有三個量身編寫的主問題，之後可再追問兩次，每層三個選項。所有對話公開記錄。');
 if(state.interviewed.length>=2){option('兩名角色詢問完成，進入其他角色對你的質問',()=>renderChallenge(),{primary:true});return;}
 for(const n of remaining)option(`詢問 ${n}`,()=>{state.interviewTarget=n;state.questionPath=[];save();render();},{sub:'本幕 3 個角色專屬問題'});
}
function playerAwareQuestion(item){
 const role=state.player;
 const override=(window.PAPERWIFE_ROLE_AWARE||{})[role]?.[item.q];
 return {q:override?.q||item.q,a:override?.a||item.a};
}
function hasKnownEvidence(question){
 const publicText=(state.publicClues||[]).map(id=>D.clues.find(c=>c.id===id)?.text||'').join(' ');
 const talks=(state.publicLog||[]).map(x=>x.text).join(' ');
 const corpus=publicText+' '+talks;
 const markers=['娃娃眼','麻繩','繩子','針孔','針筒','藥粉','巧克力','錄音機','玉佩','蘭花香','夜梟','血','勒痕','鳥','紋身','電台','照片','枕頭','工具間'];
 const found=markers.filter(word=>question.includes(word));
 // The first act's shared scene (ritual) is an independent public source.
 const shared='惠雯 童謠 娃娃眼 東青 阿忠 繩子 婚紗 孔神婆 閣樓';
 return !found.length || found.every(word=>corpus.includes(word)||(state.act>=2&&shared.includes(word)));
}
function renderInterviewTree(){const target=state.interviewTarget;const path=state.questionPath;
 showPortraits(state.player,target,'');
 let items=(window.PAPERWIFE_TIMELINE_QUESTIONS?.[String(state.act)]?.[target]||D.questions[String(state.act)][target]);for(const i of path){items=items[i].next||[];}
 const layer=path.length;
 if(layer===3||items.length===0){state.interviewed.push(target);state.interviewTarget=null;state.questionPath=[];save();render();return;}
 const labels=['選擇主要問題','選擇第一次追問','選擇第二次追問'];
 setHeader(`第 ${state.act} 幕 · 詢問 ${target}`,labels[layer],`你正在詢問 ${target}，第 ${layer+1} 層／共 3 層。這輪問答會盡量提供能排除嫌疑、釐清時間線與動機的有效資訊。`);
 items.forEach((item,i)=>{const authored=!!window.PAPERWIFE_TIMELINE_QUESTIONS?.[String(state.act)]?.[target];
 const dialogue=authored?{q:item.q,a:item.a}:playerAwareQuestion(item);
 if(!authored){const grounded=layer===0?(window.PAPERWIFE_SAFE_MAIN||{})[String(state.act)]?.[target]?.[i]:null;if(grounded)dialogue.q=grounded;const safe=(window.PAPERWIFE_GROUNDED_GUARDS||{})[String(state.act)]?.[dialogue.q];if(safe&&!hasKnownEvidence(dialogue.q)){dialogue.q=safe[0];dialogue.a=safe[1];}}

 // 最後才根據當前玩家身分修正稱謂：包含 deep-dialogues、grounded、第二層追問覆寫結果。
 dialogue.q=roleSensitiveQuestion(dialogue.q,state.player,target);
 if(!authored)dialogue.a=characterSafeAnswer(dialogue.a,state.act,target,dialogue.q);
 option(dialogue.q,()=>{
  const line=[{who:state.player,text:dialogue.q,left:state.player,right:target},{who:target,text:dialogue.a,left:state.player,right:target}];
  // 每一條主問題與第一層追問均有專屬詳述，不再附加重複的制式補充。
  state.questionPath.push(i);save();speak(line,()=>{logLines(line);render();},{auto:true,untilLast:true});
 });});
}
function buildPublicDebates(){
 const candidates=ordered.filter(name=>name!==state.player), used=new Map(), result=[];
 const topics=window.PAPERWIFE_TIMELINE_PUBLIC?.[String(state.act)]||{};
 const clues=(state.publicClues||[]).map(id=>D.clues.find(c=>c.id===id)).filter(Boolean);
 const clueTalk=window.PAPERWIFE_TIMELINE_CLUES||{};
 // A clue is used only when a manually-authored, factually relevant response exists.
 // One clue per target per round; all other discussions use source-grounded witness timelines.
 candidates.forEach((asker,i)=>{
  for(const offset of [1,2]){
   const target=candidates[(i+offset)%candidates.length];
   const count=used.get(target)||0; used.set(target,count+1);
   const scene=(topics[target]||[])[Math.min(count,1)]; if(!scene)continue;
   let [q,a,follow,reply]=scene;
   const matched=clues.filter(c=>clueTalk[c.id]?.[0]===target);
   if(count===1&&matched.length){
    const c=matched[(i+state.act)%matched.length], answer=clueTalk[c.id];
    [q,a,follow,reply]=answer.slice(1);
    q=`公開的第 ${c.id} 號提示卡記載「${c.text.replace(/\s+/g,' ').slice(0,120)}${c.text.length>120?'……':''}」。${q}`;
   }
   // Public discussion is spoken by an NPC, not the user: keep character names as third-person.
   result.push({asker,target,q,a,follow,reply});
  }
 });
 return result;
}
function renderPublic(){
 showPortraits();
 if(state.act===1){state.act=2;setPhase('read');openReader(true);return;}
 if((state.publicDoneActs||[]).includes(state.act)){setPhase('interview');return;}
 const debates=buildPublicDebates();
 setHeader(`第 ${state.act} 幕 · 公開證詞交換`,'先聽其他人的詢問，再決定自己要問什麼',`本輪共有 ${debates.length} 組公開詢問。六位電腦角色各向兩個不同對象提問，每人也會被詢問兩次。每段證詞都會進入公開問答紀錄，之後才輪到你選兩名角色追問。`);
 option(`開始公開詢問（${debates.length} 組）`,()=>runPublicPairs(debates),{primary:true});
}
function runPublicPairs(debates=buildPublicDebates()){
 const items=[];
 debates.forEach((d,i)=>{
  items.push({who:'旁白',text:`公開詢問 ${i+1}／${debates.length}：${d.asker} 決定向 ${d.target} 追問。`});
  items.push({who:d.asker,text:d.q,left:d.asker,right:d.target});
  items.push({who:d.target,text:d.a,left:d.asker,right:d.target});
  items.push({who:d.asker,text:d.follow,left:d.asker,right:d.target});
  items.push({who:d.target,text:d.reply,left:d.asker,right:d.target});
 });
 speak(items,()=>{
  logLines(items);
  if(!state.publicDoneActs)state.publicDoneActs=[];
  if(!state.publicDoneActs.includes(state.act))state.publicDoneActs.push(state.act);
  save();setPhase('interview');
 });
}
function renderChallenge(){const x=getPlayerChallenge(state.act,state.player);
 showPortraits(x.asker,state.player,'');
 setHeader(`第 ${state.act} 幕 · 你被詢問`,`${x.asker} 對你提出了疑問`,x.q);
 const first=[{who:'旁白',text:`${x.asker} 轉向了你，顯然想逼你把話說得更明白。`},{who:x.asker,text:x.q,left:x.asker,right:state.player}];
 speak(first,()=>{logLines(first);setHeader(`第 ${state.act} 幕 · 回答 ${x.asker}`,'選擇你的答覆','你的回覆會隨情境改變；請依你想扮演的態度選擇回答。');
  showPortraits(x.asker,state.player,'');
  (x.options||[]).forEach(replyObj=>{
   const text=typeof replyObj==='string'?replyObj:replyObj.text;
   const react=typeof replyObj==='string'?'我記下你的說法了。':(replyObj.react||'我先記下這句話。');
   option(text,()=>{
    const ans=[{who:state.player,text,left:x.asker,right:state.player},{who:x.asker,text:react,left:x.asker,right:state.player}];
    speak(ans,()=>{logLines(ans);afterPublic();});
   });
  });
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
 const beforePublic=new Set(state.publicClues||[]);let num=0;
 for(const actor of ordered.filter(n=>n!==state.player)){
  const areas=[], seen=state.drawn;
  for(let i=0;i<total;i++){
   const c=drawChoice(round,actor,i,i,areas,seen);
   if(!c)continue;
   recordClue(c,actor);num++;
   if(c.area!=='公共'&&c.area!=='密室')areas.push(c.area);
  }
 }
 const shown=shareNpcClues(round)||0;state.latestNpcPublicIds=(state.publicClues||[]).filter(id=>!beforePublic.has(id));state.latestNpcRound=round;state.aiDrawsDone=true;save();render();
 // 第一次收到其他角色的搜證情報，直接開啟公開情報，不要求玩家自己尋找入口。
 openRecordPanel('clues');$('sideContent').scrollTop=0;
 message(`其他角色完成搜證：新增公開的私人線索 ${shown} 張，已開啟公開情報供你閱讀。閱讀後按 × 返回搜證。`);
}
function renderSearch(round){
 const target=round==='密室'?2:round==='第一輪'?3:5;
 const desc=round==='密室'?'本輪每位玩家取得 2 張密室線索，七人合計 14 張。':round==='第一輪'?'每人取得 1 張公共線索及 2 張不同人物線索，不能搜自己的區域。':'每人取得 2 張公共線索及 3 張其他線索，至少涉及兩個人物。';
 showPortraits();
 setHeader(`第 ${state.act} 幕 · ${round}搜證`,`按鈕抽取提示卡（${state.playerDraws}/${target}）`,desc);
 const opts=$('options');opts.className='options search-options';
 const grid=el('div','search-stage-grid');
 const left=el('section','search-pane search-actions');
 const right=el('section','search-pane search-card-pane');
 left.append(el('div','search-round-badge',`目前階段：${round}搜證`));
 left.append(el('h3','search-pane-title',`你的搜證進度 ${state.playerDraws} / ${target}`));
 left.append(el('p','search-pane-desc',desc));
 left.append(el('p','search-inline-tip',round==='密室'?'請留意屍塊特徵，以及哪些部位屬於同一人。':round==='第一輪'?'重點：時間線、房間與人物關係。':'重點：動機、物證和前後證詞的矛盾。'));
 // Draw button stays next to the card title rather than below the first column.
 const header=el('div','search-card-toolbar');
 header.append(el('div','search-card-heading','提示卡'));
 const actionWrap=el('div','search-action-wrap');
 let button=null;
 if(state.playerDraws<target){
  const category=round==='密室'?'密室':round==='第一輪'?(state.playerDraws===0?'公共':'人物'):(state.playerDraws<2?'公共':'人物');
  button=el('button','search-draw-button',`抽取第 ${state.playerDraws+1} 張 · ${category}`);
  button.addEventListener('click',()=>drawOne(round));
 }else if(!state.aiDrawsDone){
  button=el('button','search-draw-button','其他角色搜證');button.addEventListener('click',()=>autoDraw(round));
 }else if(round==='密室'){
  button=el('button','search-draw-button','開始密室推理');button.addEventListener('click',()=>{activeClue=null;setPhase('solveSecret');});
 }else if(round==='第一輪'){
  button=el('button','search-draw-button','進入人物問答');button.addEventListener('click',()=>{activeClue=null;setPhase('public');});
 }else{
  button=el('button','search-draw-button','進入身分推理');button.addEventListener('click',()=>{activeClue=null;setPhase('identity');});
 }
 button.type='button';actionWrap.append(button);header.append(actionWrap);right.append(header);
 if(activeClue){
  const card=el('article','search-clue-card');
  card.append(el('div','search-clue-id',`提示卡・${String(activeClue.id).padStart(2,'0')}｜${activeClue.area}`));
  card.append(el('p','search-clue-text',activeClue.text));right.append(card);
 }else{
  right.append(el('div','search-clue-placeholder','尚未抽取提示卡，請點選上方按鈕。'));
 }
 grid.append(left,right);opts.append(grid);
}

function renderSolveSecret(){setHeader('第三幕 · 密室推理','四具屍體，誰是最後一人？','密室中的十四條線索可指向四具不同的屍體；回想孔神婆先前附身時的話。');
 for(const answer of ['孔神婆','惠雯','秋萍','孟小婉'])option(answer,()=>{
  if(answer==='孔神婆'){state.solutions.secret=true;state.playerDraws=0;state.playerAreas=[];state.aiDrawsDone=false;setPhase('search2');}
  else message('再想想孔神婆儀式裡提到的碧雲、卿卿、憐兒，以及另一位死者。');
 });
}
function renderIdentity(){setHeader('第三幕 · 身分推理','誰頂替了陳宅主人？','第三幕的證據已逐漸指向陳宅主人的祕密。請比對人物證詞與照片，找出他的真實身分。');
 for(const x of ['現任陳聿明其實是駱午陽','東青其實是陳聿明','戴思齊其實是陳聿明','阿忠其實是孔神婆'])option(x,()=>{if(x.startsWith('現任陳聿明')){state.solutions.identity=true;setPhase('public');}else message('請再比對黃埔軍校照片、手腕特徵和舊火災。');});
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
 const lines=[`你指認的兇手是${state.votes.killer}。${knew?'指認正確！':'指認錯誤。'}真正殺害惠雯的兇手是阿忠。`,
  `惠雯的真正致命行為發生於 23:05 左右，阿忠在婚房勒死惠雯。紅豆在較早時候也曾勒住她，東青亦曾企圖下毒。`,
  `你選擇${take?'服用':'不服用'}娃娃眼。事實上，${state.player}${infection?'已感染瘟疫':'並未感染瘟疫'}。${survive?'這個決定符合你目前的身體狀況。':'這個決定可能讓你付出代價。'}`,
  `最後，你選擇${side}《陳氏古法》。這個抉擇將影響陳宅眾人接下來的命運。`,
  '現任「陳聿明」是經過整容的情報人員駱午陽；真正的陳聿明是偽裝成園丁的阿忠。',
  '孔神婆遭駱午陽殺害，其屍體遭紅豆後續肢解藏匿。瘟疫、娃娃眼及《陳氏古法》的秘密，將所有人推向了同一場危機。'];
 for(const t of lines){const box=el('div','clue-reveal');box.style.marginBottom='10px';box.appendChild(el('p','',t));$('options').appendChild(box);}
 const faction=D.factionEndings[side];
 const endingBox=el('div','clue-reveal');endingBox.style.margin='12px 0';endingBox.appendChild(el('strong','',side+'・陣營結局'));endingBox.appendChild(el('p','',faction));$('options').appendChild(endingBox);
 auxButton('閱讀完整真相與事件時間線（全劇透）',()=>{readerAfter=null;$('readerKicker').textContent='案件結局・已通關';$('readerTitle').textContent='故事真相與完整時間線';$('readerContent').textContent=D.fullTruth;$('readerContent').scrollTop=0;$('readerFooterText').textContent='已到終局，現在可以閱讀全部案件真相。';$('readerDone').hidden=true;$('readerOverlay').hidden=false;requestAnimationFrame(()=>{$('readerContent').scrollTop=0;});});
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
  const freshIds=new Set(state.latestNpcPublicIds||[]);
  const fresh=pub.filter(c=>freshIds.has(c.id));
  if(fresh.length&&state.aiDrawsDone){
   pane.appendChild(el('h4','side-subtitle',`${state.latestNpcRound||'最近一輪'}・其他角色新公開（${fresh.length} 張）`));
   pane.appendChild(el('p','empty','這些是其他角色本輪公開、你現在可以用來盤問的內容。其他人的私人未公開卡不會在這裡顯示。'));
   for(const c of fresh.slice().reverse()){
    const box=el('article','clue-box fresh-public-clue');box.appendChild(el('h4','',`新公開・提示卡 ${String(c.id).padStart(2,'0')}｜${c.area}`));box.appendChild(el('p','',c.text));pane.appendChild(box);
   }
   const done=el('button','review-done','我已讀完，返回遊戲');done.type='button';done.addEventListener('click',closeRecordPanel);pane.appendChild(done);
  }
  pane.appendChild(el('h4','side-subtitle',`全部已公開的線索（${pub.length}）`));
  if(!pub.length)pane.appendChild(el('p','empty','目前還沒有公開線索。第一幕不會發放提示卡。'));
  for(const c of pub.filter(c=>!freshIds.has(c.id)||!state.aiDrawsDone).slice().reverse()){
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
function openRecordPanel(tab){sideTab=tab;renderSidebar();$('app').classList.add('record-open');}
function closeRecordPanel(){$('app').classList.remove('record-open');}
for(const [id,tab] of [['recordOpen','clues'],['talkOpen','talk'],['noteOpen','note']]){
 $(id)?.addEventListener('click',()=>openRecordPanel(tab));
}
$('recordClose')?.addEventListener('click',closeRecordPanel);
$('theaterHome')?.addEventListener('click',()=>frontSection('home'));
$('recordBackdrop')?.addEventListener('click',closeRecordPanel);
window.addEventListener('keydown',e=>{if(e.key==='Escape')closeRecordPanel();});
renderSidebar();render();frontSection('home');
