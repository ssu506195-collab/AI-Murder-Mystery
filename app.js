'use strict';
/* 紙妻｜單人免 Token 劇本殺。純靜態，不使用 API；所有進度保存在本機瀏覽器。 */
const D = window.PAPERWIFE_DATA;
const V = window.PAPERWIFE_VISUALS || {portraits:{},labels:{},caseCatalog:[]};
if (!D) throw new Error('未載入遊戲資料：請確認 data/game-data.js 已上傳。');
const $ = id => document.getElementById(id);
const STORE = 'paperwife_v6_notoken_save'; // V6 進度保留，V6.1 不覆寫舊存檔。
const ordered = D.roles;
let state = load();
let queue = [];
let queueDone = null;
let readerAfter = null;
let activeClue = null;
let sideTab = 'clues';
let typing = false;
let typeTimer = null;
let currentLine = '';
let frontView = 'home';
let selectedRole = D.roles[0];
let randomRoleMode = false;
let openingIndex = 0;
function frontButton(label, fn, cls=''){
 const b=el('button','front-button '+cls,label);b.type='button';b.addEventListener('click',fn);return b;
}
function frontSection(view){
 frontView=view;
 const f=$('frontScreen');
 if(view==='play'){f.hidden=true;$('app').hidden=false;return;}
 hideDialogue();
 f.hidden=false;$('app').hidden=true;
 const pane=$('frontInner');clear(pane);
 const background=$('frontHero');background.className='front-hero '+(view==='home'?'front-home':'front-interior');
 if(view==='home')renderHome(pane);else if(view==='cases')renderCases(pane);else if(view==='roles')renderRoleSelect(pane);
}
function renderHome(pane){
 const box=el('div','front-copy');
 box.append(el('div','front-eyebrow','A STORY BUILT ON SECRETS'));
 box.append(el('h1','front-headline','每個人都有秘密。'));
 box.append(el('h1','front-headline gold-line','但只有一個真相。'));
 box.append(el('p','front-summary','民國江南，長鹽山下的陳宅深夜。七位角色各懷秘密，婚禮、怪談與疑案交錯。你將成為其中一人，親自揭開埋藏多年的真相。'));
 const buttons=el('div','front-actions');
 buttons.append(frontButton('選擇劇本',()=>frontSection('cases'),'gold-button'));
 if(state.player){buttons.append(frontButton('繼續上次進度',()=>{frontSection('play');render();},'outline-button'));}
 box.append(buttons);box.append(el('div','front-footnote','純單人離線固定問答・無須 Token・繁體中文'));
 pane.append(box);
}
function renderCases(pane){
 pane.append(frontButton('← 返回首頁',()=>frontSection('home'),'text-button'));
 const area=el('section','case-library');area.append(el('div','front-eyebrow','CHOOSE YOUR CASE'));area.append(el('h2','front-section-title','選擇劇本'));area.append(el('p','front-muted','先選擇要體驗的故事，再決定扮演哪位角色。日後新增劇本可以擴充這份列表。'));
 for(const c of V.caseCatalog){
  const card=el('article','case-card');
  const cover=el('img','case-cover');cover.src=c.cover;cover.alt=c.title+' 劇本封面';card.append(cover);
  const info=el('div','case-info');info.append(el('div','front-eyebrow',c.category));info.append(el('h3','',c.title));info.append(el('p','',c.subtitle));info.append(el('p','case-spec','七位角色　·　四幕故事　·　87 張提示卡'));
  info.append(frontButton('進入劇本 →',()=>{if(c.available)frontSection('roles');},'gold-button'));card.append(info);area.append(card);
 }
 pane.append(area);
}
function renderRoleSelect(pane){
 clear(pane);
 pane.append(frontButton('← 返回劇本選擇',()=>frontSection('cases'),'text-button'));
 const area=el('section','role-library');area.append(el('div','front-eyebrow','YOUR SECRET IDENTITY'));area.append(el('h2','front-section-title','決定你的角色'));area.append(el('p','front-muted','你將扮演七位來客中的一人。每位角色都藏著不同的回憶與秘密，遊戲會按幕逐步揭露。'));
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
  state=newState();state.player=role;state.phase='prologue';save();frontSection('play');render();beginPrologue();
 },'gold-button'));area.append(footer);pane.append(area);
}
function beginPrologue(){
 // 劇本序章文字取自現有繁體文字資料；每一段獨立播放，並以打字方式呈現。
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

function newState(){return {player:null,act:1,phase:'start',readActs:[],interviewed:[],interviewTarget:null,questionPath:[],publicLog:[],drawn:[],owned:[],searchStage:null,playerDraws:0,playerAreas:[],aiDrawsDone:false,notes:'',solutions:{},votes:{},result:null,complete:false};}
function load(){try{const s=JSON.parse(localStorage.getItem(STORE));if(s && typeof s==='object' && (s.phase==='start'||ordered.includes(s.player)) && Number.isInteger(s.act)&&s.act>=1&&s.act<=4)return {...newState(),...s};}catch{}return newState();}
function save(){localStorage.setItem(STORE,JSON.stringify(state));}
function setPhase(phase){state.phase=phase;save();render();}
function el(tag,cls,txt){const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x;}
function clear(node){node.replaceChildren();}
function message(msg){const x=$('toast');x.textContent=msg;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2800);}
function setHeader(kicker,title,desc){$('sectionKicker').textContent=kicker;$('sectionTitle').textContent=title;$('sectionDesc').textContent=desc||'';clear($('options'));clear($('aux'));}
function option(label,fn,{primary=false,sub=''}={}){const b=el('button','option'+(primary?' primary':''));b.type='button';b.append(document.createTextNode(label));if(sub)b.appendChild(el('small','',sub));b.addEventListener('click',fn);$('options').appendChild(b);return b;}
function auxButton(label,fn){const b=el('button','',label);b.type='button';b.addEventListener('click',fn);$('aux').appendChild(b);return b;}
function hideDialogue(){
 queue=[];queueDone=null;clearInterval(typeTimer);typeTimer=null;typing=false;
 document.body.classList.remove('has-dialogue');$('dialogue').hidden=true;
 $('sceneCenter').style.opacity='1';showPortraits();
}
function typeLine(text){
 clearInterval(typeTimer);currentLine=text;const node=$('dialogueText');node.textContent='';typing=true;
 const units=Array.from(text);let i=0;
 $('advanceDialogue').textContent='顯示完整文字 ▸';
 typeTimer=setInterval(()=>{i=Math.min(units.length,i+2);node.textContent=units.slice(0,i).join('');if(i>=units.length)finishTyping();},28);
}
function finishTyping(){if(!typing)return;clearInterval(typeTimer);typeTimer=null;typing=false;$('dialogueText').textContent=currentLine;$('advanceDialogue').textContent='下一段 ▸';}

function showPortraits(left='',right='',who=''){
 const lp=$('leftPortrait'),rp=$('rightPortrait');
 for(const [node,name,nid] of [[lp,left,'leftName'],[rp,right,'rightName']]){
  const show=!!name && !!V.portraits[name];
  node.classList.toggle('visible',show);
  node.classList.toggle('active',!!who&&name===who);
  node.classList.toggle('dimmed',!!who&&name!==who);
  $(nid).textContent=name;
  const portrait=node.querySelector('img');if(show&&portrait.getAttribute('src')!==V.portraits[name])portrait.src=V.portraits[name];
 }
 $('sceneCenter').style.opacity=(left||right)?'0':'1';
}
function speak(items,done){
 if(queue.length) return;queue=items.map(x=>({who:x.who,text:x.text,left:x.left||'',right:x.right||''}));queueDone=done||(()=>{});
 document.body.classList.add('has-dialogue');showNext();
}
function showNext(){
 if(typing){finishTyping();return;}
 if(queue.length===0){const done=queueDone;hideDialogue();if(done)done();return;}
 const x=queue.shift();$('dialogue').hidden=false;$('speaker').textContent=x.who;typeLine(x.text);
 showPortraits(x.left||((x.who!=='旁白')?x.who:''),x.right||'',x.who);
 $('sceneProgress').textContent='點擊對話框逐句播放';
}
$('advanceDialogue').addEventListener('click',ev=>{ev.stopPropagation();showNext();});
$('dialogue').addEventListener('click',showNext);
window.addEventListener('keydown',ev=>{if((ev.key===' '||ev.key==='Enter')&&(queue.length||queueDone)&&document.activeElement?.tagName!=='TEXTAREA'){ev.preventDefault();showNext();}});
function logTalk(who,text,act=state.act){state.publicLog.push({who,text,act});save();renderSidebar();}
function logLines(items){items.forEach(x=>logTalk(x.who,x.text));}
function stageLabel(){const map={start:'準備',read:'劇本閱讀',ritual:'孔神婆儀式',interview:'人物問答',public:'公開討論',search1:'第一輪搜證',searchSecret:'密室搜證',solveSecret:'密室推理',search2:'第二輪搜證',identity:'身分推理',vote:'最終投票',ending:'真相揭曉'};return map[state.phase]||state.phase;}
function updateHeader(){
 $('chapterBadge').textContent=state.phase==='start'?'尚未開始':`第 ${state.act} 幕・${stageLabel()}`;
 $('sceneTag').textContent=state.player?`${state.player} · 陳宅`:'清河縣 · 陳宅';
 if(!queue.length)$('sceneProgress').textContent=stageLabel();
 $('clueCount').textContent=`${state.drawn.length} 張`;
 $('readerButton').disabled=!state.player;
}
function render(){updateHeader();if(queue.length)return;
 switch(state.phase){
 case 'start':return renderStart();
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
 setHeader('PROLOGUE · 案件序章','陳宅深夜，故事即將開始','旁白會分段打字播放，點擊對話框即可完成當前文字或進入下一段。');
 option('播放序章',()=>beginPrologue(),{primary:true});
}
function renderStart(){
 setHeader('民國 · 清河縣','選擇你要扮演的角色','一人遊玩，其餘六位角色由預先編寫的無 Token 對話驅動。選定角色後，只能閱讀當前已解鎖的幕次。');
 for(const name of ordered)option(name,()=>{if(!confirm(`確定要扮演「${name}」嗎？遊戲中的角色秘密會依幕次顯示。`))return;state=newState();state.player=name;setPhase('read');openReader(true);},{sub:D.styles[name]});
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
function renderRitual(){if(state.act===1){setHeader('第一幕 · 小劇場','孔神婆主持婚禮沖喜儀式','神婆附身、三位姨太太的言行，以及惠雯突然出現，都是日後推理的重要資訊。每按一次只播放一句。');option('開始孔神婆儀式',()=>speak(D.ritual,()=>setPhase('interview')),{primary:true});}
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
  state.questionPath.push(i);save();speak(line,()=>{logLines(line);render();});
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
function recordClue(c,owner){if(!c||state.drawn.includes(c.id))return;state.drawn.push(c.id);state.owned.push({id:c.id,owner,act:state.act});activeClue=c;save();renderSidebar();}
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
 state.aiDrawsDone=true;save();message(`其他角色共公布 ${num} 張已抽出的提示卡。`);render();
}
function renderSearch(round){
 const target=round==='密室'?2:round==='第一輪'?3:5;
 const desc=round==='密室'?'按手冊每位玩家抽取 2 張密室線索，七人合計 14 張。':round==='第一輪'?'按手冊每人 1 張公共線索＋2 張不同人物個人線索；不能搜自己的區域。':'按手冊每人 2 張公共線索＋3 張其他線索（至少涉及兩個人物），不能搜自己的區域。';
 setHeader(`第 ${state.act} 幕 · ${round}搜證`,`按鈕抽取提示卡（${state.playerDraws}/${target}）`,desc);
 if(activeClue){const box=el('div','clue-reveal');box.appendChild(el('strong','','提示卡'));box.appendChild(el('p','',activeClue.text));$('aux').appendChild(box);}
 if(state.playerDraws<target){const category=round==='密室'?'密室':round==='第一輪'?(state.playerDraws===0?'公共':'人物'):(state.playerDraws<2?'公共':'人物');
  option(`抽取第 ${state.playerDraws+1} 張提示卡 · ${category}`,()=>drawOne(round),{primary:true,sub:'一次只抽取一張，抽到後才公開到旁邊的提示卡區'});
 }else if(!state.aiDrawsDone){option('觀看其他六位角色本輪抽出的公開線索',()=>autoDraw(round),{primary:true,sub:'其他角色同樣依照各自搜證配額抽取；抽到後才公開'});}
 else if(round==='密室'){option('開始密室屍塊身分推理',()=>{activeClue=null;setPhase('solveSecret');},{primary:true});}
 else if(round==='第一輪'){option('第一輪搜證結束，開始第二幕人物問答',()=>{activeClue=null;setPhase('interview');},{primary:true});}
 else option('第二輪搜證結束，進入身分推理',()=>{activeClue=null;setPhase('identity');},{primary:true});
 if(state.playerDraws===target&&state.aiDrawsDone)auxButton('查看全部已公開的提示卡',()=>{sideTab='clues';renderSidebar();});
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
 $('clueCount').textContent=`${state.drawn.length} 張`;
 for(const [id,kind] of [['tabClue','clues'],['tabTalk','talk'],['tabNote','note']])$(id).classList.toggle('active',sideTab===kind);
 const pane=$('sideContent');clear(pane);
 if(sideTab==='clues'){
  if(!state.drawn.length)pane.appendChild(el('p','empty','還沒有抽到任何提示卡；第一幕不會發放線索。'));
  else for(const x of state.owned.slice().reverse()){
   const c=D.clues.find(c=>c.id===x.id);if(!c)continue;
   const box=el('article','clue-box');box.appendChild(el('h4','',`提示卡・${String(c.id).padStart(2,'0')}｜${c.area}`));box.appendChild(el('p','',c.text));
   box.appendChild(el('p','muted',`第 ${x.act} 幕 · ${x.owner} 搜證取得`));pane.appendChild(box);
  }
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
