/*
 * 《紙妻》V6.14｜時間線一致、固定搜證分幕、證詞與物證連動。
 * 舊版七人問答與素材保留；本檔只修補確認有問題的資料和新的推理查證。
 * 編劇附加的重驗推論會標示其限制；角色仍可隱瞞動機與行動。
 */
(function(){
  'use strict';
  const d=window.PAPERWIFE_DATA;
  const fixed=window.PAPERWIFE_FIXED_CLUES_V613;
  if(!d||!fixed)return;
  d.version='6.14';
  // 第 33、34 卡發生於孔神婆遇害之後，不能在首次發現惠雯時取得。
  // 與第 19、37 卡等量對調，維持每輪、每人固定數量及公共卡比例。
  fixed['第一輪']['戴思齊'][0]=19;
  fixed['第一輪']['孟小婉'][0]=37;
  fixed['第二輪']['東青'][0]=33;
  fixed['第二輪']['陳聿明'][1]=34;
  for(const id of [19,37]){
    const card=d.clues.find(c=>c.id===id);
    if(card)card.round='第一輪';
  }
  for(const id of [33,34]){
    const card=d.clues.find(c=>c.id===id);
    if(card)card.round='第二輪';
  }
  // 劇本設定：採用原始「組織手冊」的右臂針孔，以及死後兩個時辰失效。
  // 這只校正編輯版文字差異，不改動角色刻意說謊的證詞。
  for(const role of Object.keys(d.roleData||{})){
    const info=d.roleData[role];
    const normalize=s=>String(s)
      .replace(/衝著惠雯的頸部血管扎了進去/g,'衝著惠雯的右臂血管扎了進去')
      .replace(/一個小時內失效/g,'兩個時辰內失效')
      .replace(/一小時內失效/g,'兩個時辰內失效');
    if(typeof info.prelude==='string')info.prelude=normalize(info.prelude);
    if(Array.isArray(info.acts))info.acts=info.acts.map(normalize);
  }
  // 矛盾應來自不可靠目擊、隱瞞或推理，而非卡片出現於事件之前。
  // 補充有限的現場觀察，不臆定拖動者，也不替任何人宣告死因。
  const card87=d.clues.find(c=>c.id===87);
  if(card87&&!card87.text.includes('床側至床底'))
    card87.text+=' 現場補查：床側至床底有短距離拖擦痕，附近留有衣料纖維。這能提示有人或物曾被移動，但無法僅憑痕跡認出移動者。';
  const card21=d.clues.find(c=>c.id===21);
  if(card21&&!card21.text.includes('單看深淺'))
    card21.text+=' 驗傷備註：勒痕深淺不一，可能不是同一時刻留下；單看深淺不能直接判斷致命傷由誰造成。';

  // 不把紅豆私人劇本的 23:25 誤寫成全員親眼發現遺體的時間（正式發現是 00:40）。
  const timelines=window.PAPERWIFE_TIMELINE_QUESTIONS||{};
  if(timelines['4']?.['戴思齊']?.[2]){
    const t=timelines['4']['戴思齊'][2];
    t.a='目前可靠的時間是有人在22:30左右見惠雯仍可活動、眾人於00:40發現遺體；屍檢推估至少死亡一小時。至於23點前後各人的行蹤，只能靠當事人或目擊者逐項核對，不能拿其他人的私人記憶直接當作公開證據。';
  }
  // 舊次級問答仍有「NPC 說出另一人未公開的私人時刻」的遺漏。
  // 只改與角色所知矛盾的措辭，保留問答原有事件方向。
  for(const act of ['2','3','4'])for(const [witness,tree] of Object.entries(timelines[act]||{})){
    function clean(node){
      if(!node||typeof node!=='object')return;
      if(witness==='戴思齊' && typeof node.q==='string' && node.q.includes('01:37婚房針孔與23:05可能的致命勒痕')){
        node.q='如果有人在死後才抽血，如何區分這種採樣與之前造成窒息的傷痕？';
        node.a='後半夜抽血與之前勒頸不是同一種傷，必須靠屍檢及出入時間核對。不能拿採樣的器械直接推定最初的死因。';
      }
      if(witness==='紅豆' && typeof node.q==='string' && node.q.includes('23:25醒來與00:03')){
        node.q='你說過夜裡有一段記憶空白，之後才去敲江記者的房門。中間誰能替你作證？';
        node.a='那段我大多單獨行動，不能要求江小姐替我更早的行蹤保證。我只能確定後來確實去過她的客房。';
      }
      if(witness==='紅豆' && typeof node.a==='string' && node.a.includes('我記得大約23:25醒來'))
        node.a='我醒來後確實看過時鐘，但那晚太混亂，我不願把記得的分鐘數說成人人都能證實的事。那時沒人能替我作證。';
      if(witness==='江靜儀' && typeof node.a==='string' && node.a.includes('22:50至23:25'))
        node.a='不能。我只能證明紅豆後來確實到了我房間，也和我一起聽見歌聲；她更早去哪裡、做過什麼，我從未親眼看過。';
      if(witness==='孟小婉' && typeof node.a==='string' && node.a.includes('00:40是再次經過婚房才發現她一動不動'))
        node.a=node.a.replace('00:40是再次經過婚房才發現她一動不動','眾人在00:40左右找人時，我在婚房發現她已倒地');
      for(const sub of node.next||[])clean(sub);
    }
    for(const root of tree)clean(root);
  }
  // 第二幕不給園丁白白可被交叉核對的完美不在場證明；他選擇曖昧地隱瞞上樓。
  if(window.PAPERWIFE_TIMELINE_PUBLIC?.['2']?.['阿忠']?.[0]){
    const arr=window.PAPERWIFE_TIMELINE_PUBLIC['2']['阿忠'][0];
    arr[1]='儀式後我大半時間在花園和棚屋整理東西，也曾經走進宅子。夜裡人少，沒有人能替我整晚作證。';
    arr[3]='我確實聽到過大門開關，但隔著院子沒看見人。管家有門匙，不等於我能替他確認那一刻去了哪裡。';
  }
  // 比對資訊揭露順序：東青知道自己密室中的行動；其他角色只能先發現濕鞋／異響。
  // 錯誤證詞的來源在於「當事人未說實話」，不是問答直接揭露未公開的精確時間。
  if(window.PAPERWIFE_TIMELINE_PUBLIC?.['4']?.['紅豆']?.[0]){
    const entry=window.PAPERWIFE_TIMELINE_PUBLIC['4']['紅豆'][0];
    entry[1]='我那晚在婚房附近曾經頭昏、失去一段記憶；醒來後發現情況已經不一樣。這段空白我自己也無法填上，不能替那時房裡還有誰作證。';
  }
  // 輔助修正：只有當事人曾主動公開，才能用紅豆的精確醒來時刻詢問旁觀者。
  for(const act of ['2','3','4'])for(const [person,trees] of Object.entries(timelines[act]||{})){
    for(const root of trees){
      function rewrite(node){
        if(!node||typeof node!=='object')return;
        if(typeof node.a==='string'&&person!=='紅豆')node.a=node.a
          .replace(/23:25(?:被發現已死|被發現死亡)/g,'00:40被眾人發現死亡')
          .replace(/23:25被發現/g,'00:40被發現');
        for(const next of node.next||[])rewrite(next);
      }
      rewrite(root);
    }
  }
  // 對既有高風險推理結論收斂措辭：不要稱單一玻璃碎片為完整鑑定，
  // 也不要把紅豆失憶當作證明惠雯當時一定活著。
  const basic=window.PAPERWIFE_EVIDENCE_CONFRONTATIONS_V613||[];
  const fix=(id,patch)=>{const entry=basic.find(e=>e.id===id);if(entry)Object.assign(entry,patch);};
  fix('glass_zhong',{
    a:'傷是在背上，我當時只覺得被刮了一下，沒有看清是哪裡的碎片。我做園丁常搬雜物，也可能碰過破損器具。可你們若想確認我進過婚房，應先把碎片來源和受傷時間查清。',
    check:'阿忠把傷歸為整理雜物時的意外，卻沒有指出可以核對的破損器具。這是可疑辯解，不是殺人自白；需要再找檢驗與目擊。'
  });
  fix('rope_red',{
    a:'我見過阿忠在儀式時拿繩子幫忙，但工具間的繩子不只他能拿。至於夜裡誰接近惠雯，我沒有一直在旁邊盯著。',
    check:'白天的麻繩不一定是夜間最後造成窒息的那條。紅豆有意避談自己的夜間行動，仍應比對用繩、昏睡與時間。'
  });
  fix('death_dai',{
    a:'若00:40發現遺體時已至少死亡一小時，23:40以後才發生的行為就不能直接視為首次致死。但這只能界定大致範圍，不能把22:50和23:05兩次可能的勒頸區分開。還要看現場移動、傷口及當事人的證詞。',
    check:'屍檢時間有助於排除較晚的注射，不能單獨分開22:50和23:05；應追查昏睡期間的移動及傷口來源。'
  });
  window.PAPERWIFE_DEDUCTION_CASES_V614={
    chronology:{'第一輪':[19,20,21,22,37,79,87],'第二輪':[33,34,86]},
    sourceNote:'新寫的重驗證詞是推理遊戲的補充線索，不是原稿已有的法醫定論。',
    evidenceOptions:[
      {
        id:'moved_unconscious_red',act:3,clues:[44,87],requiresAll:true,witness:'紅豆',selfCheck:true,selfQuestion:'重新核對自己昏迷前後的位置，以及床底拖痕。',selfAnswer:'你記得昏迷前自己並不在床底，醒來卻在床底下。這表示失去意識期間可能有人移動過你，但你沒有看見搬動者，也不能以此證明惠雯那時一定活著。',title:'床底拖痕與失去意識',
        q:'婚房床側到床底有拖擦痕，枕頭上又有接觸性迷藥。你那晚有沒有失去意識？醒來時人在哪裡？',
        a:'我確實有過一段完全不記得的時間。昏過去前我不在床底，醒來卻是在床底下。我不知道誰移動了我，也沒有親眼看見那段時間惠雯或其他人在做什麼。',
        check:'紅豆昏迷後位置有改變，代表她失去意識時房內仍發生過活動；搬動者未確認，不能據此直接宣告惠雯仍活著。'
      },
      {
        id:'moved_meng',act:3,clues:[44,87],requiresAll:true,requiresUsed:['moved_unconscious_red'],witness:'孟小婉',selfCheck:true,selfQuestion:'回想自己離開婚房時，床底是否已經有紅豆？',selfAnswer:'你記得惠雯在婚房仍能反抗，而且當時紅豆並未躺在床底。你離開後誰又進房，不能靠自己的記憶填補。',title:'核對床底人物的出現時序',
        q:'紅豆說昏睡後被移到床底。你較早到過婚房，離開時是否已看見紅豆躺在床底？',
        a:'沒有。我在婚房遇到惠雯時，她還會拉扯反抗；我逃出去時，沒有見到紅豆躺在床底。後來誰進房、誰搬人，我沒看見。',
        check:'孟小婉的目擊與紅豆醒來的位置可分出前後兩段；她沒看到移動者，仍不能替後段行兇作證。'
      },
      {
        id:'glass_fragment_review',act:3,clues:[43,87],requiresAll:true,witness:'戴思齊',selfCheck:true,selfQuestion:'以醫生的專業，比較阿忠背傷裡的玻璃屑和婚房碎片。',selfAnswer:'你比對發現碎片的厚薄與邊緣形態接近，但未能完整拼合，仍不足以斷言完全同源。這會提高阿忠與婚房破損的關聯，卻不能直接證明是他造成致命勒頸。',title:'玻璃屑與婚房碎片對照',
        q:'阿忠背傷有玻璃屑，婚房也有碎玻璃。兩者是否有可查的共同特徵？',
        a:'補查可見碎片厚薄與邊緣形態相近，至少值得懷疑與同類器物有關。但還沒有完整拼合，不能當成已證實同源，更不能憑此指認是誰勒住惠雯。應向阿忠核對那次新傷的地點與時間。',
        check:'玻璃的相似性提高阿忠接近婚房的可能，但仍屬未完全確認的物證連結；須核對他先前對傷口的說法。'
      },
      {
        id:'glass_reask_zhong',act:3,clues:[43,87],requiresAll:true,requiresUsed:['glass_fragment_review'],witness:'阿忠',title:'再查背傷的來源',
        q:'戴醫生說背傷裡的碎片與婚房碎玻璃特徵相近。你先前說可能是搬雜物刮到，究竟在哪裡搬的？',
        a:'我做園丁要搬很多破舊器具，夜裡慌忙，也記不得每一件。但這只是說傷有可能來自破物，不代表我曾拿玻璃跟誰爭執。你們可以繼續查，我不能給出那時的目擊證人。',
        check:'追問後阿忠仍提不出具體受傷地點或證人。沒有其他人能補上這個空白時，背傷與婚房碰撞的解釋更值得追查。'
      },
      {
        id:'last_alive_chen',act:3,clues:[21,60],requiresAll:true,witness:'陳聿明',selfCheck:true,selfQuestion:'檢查自己手臂抓傷的時間，對照更晚惠雯仍能活動的目擊。',selfAnswer:'你記得早先在閣樓被惠雯抓傷，離開時她仍有力氣。有人稍後在婚房見她仍能反抗，這讓早先的衝突不可能直接等同最後一次致命勒頸。',title:'較早的閣樓爭執',
        q:'你手臂留下抓傷，惠雯後來又被人在婚房見到仍會反抗。你能否說明當時為何受傷，誰能核對先後？',
        a:'我曾上閣樓查看她，受到驚嚇也受了傷。我沒有否認見過她，但你說她後來還能動，那就要先查誰在後來見過她，而不是把所有痕跡都算在我身上。',
        check:'手臂抓傷表明早期衝突；晚一段時間仍有存活目擊，削弱早期爭執已致死的說法，但無法證明此人後續完全無嫌疑。'
      },
      {
        id:'night_footsteps_dong',act:3,clues:[45],witness:'東青',selfCheck:true,selfQuestion:'回想自己濕鞋與回宅時聽到的婚房動靜。',selfAnswer:'你記得回宅後曾聽到婚房方向有聲響，因淋雨先回去換衣服。你沒有親眼看見誰出來，也不敢斷定那聲音表示惠雯還活著。',title:'夜裡回宅後聽到的動靜',
        q:'搜到你的濕鞋，表明你夜裡可能外出過。回宅後你有沒有聽到婚房方向的聲音，或看見誰離開？',
        a:'我回來後確實聽到那邊一陣響動，當時剛淋了雨，先回房換衣。我沒有看見出來的是誰，也不能保證那聲音來自活著的惠雯。',
        check:'東青提供的是聽覺證詞，不是目擊；其夜間外出仍可造成誤判，但聲音不足以確認房內人物。'
      },
      {
        id:'deeper_marks_dai',act:4,clues:[21,44,86],requiresAll:true,witness:'戴思齊',selfCheck:true,selfQuestion:'重新分析三道勒痕、枕頭迷藥與死亡時間的交集。',selfAnswer:'你認為不同勒痕可能不是同一次造成，最深的勒痕或許伴隨更持續的壓迫；但醫學痕跡不能單獨判定22:50或23:05是哪一次，須加上現場與目擊。',title:'勒痕與迷藥重驗',
        q:'三道勒痕深淺不一，枕頭又會使人昏迷。能不能僅憑屍檢分辨紅豆是否造成致命勒頸？',
        a:'不能把幾道勒痕視作同一刻留下。較深的一道有持續壓迫的可能，其餘可能來自之前的掙扎；但沒有傷口形成時的錄影或可靠目擊，就不能把這道最深的痕直接分配給任何人。紅豆的昏迷，也不能自己證明惠雯那時還活著。',
        check:'存在不同次勒壓的合理假設，但不具備單憑法醫痕跡指認兇手的條件；要與昏迷期間的移動及他人的新傷一起看。'
      },
      {
        id:'truthful_red_alibi_jiang',act:4,clues:[44,68],requiresAll:true,witness:'江靜儀',selfCheck:true,selfQuestion:'回想紅豆來房間陪伴你的時間，確認自己能替她證明哪一段。',selfAnswer:'你記得紅豆後來確實與自己在一起，也一起聽過歌聲。但你不知道她更早在婚房發生什麼事，歌聲也不能證明惠雯那時還活著。',title:'確認紅豆後半夜在場的部分',
        q:'紅豆說自己有一段記憶空白，但你們後來一起聽過歌聲。你究竟能替她證實哪個時間，不能證實哪段？',
        a:'她後來確實來我房間，也跟我一起聽到閣樓傳來歌聲。我只能證明我們在一起的那一段；更早時她在哪裡、是否昏倒，我沒有看見。歌聲也不能作為惠雯還活著的證據。',
        check:'江靜儀的證詞可以核對紅豆後半夜活動，不能替紅豆先前勒頸時段作不在場證明。'
      },
      {
        id:'death_judgment_compare',act:4,clues:[21,43,44,86,87],requiresAll:true,requiresUsed:['glass_fragment_review','moved_unconscious_red','deeper_marks_dai'],witness:'戴思齊',selfCheck:true,selfQuestion:'將三道勒痕、昏迷移動、背傷玻璃與死亡時間放在一起，重新比較各人嫌疑。',selfAnswer:'你不該僅憑一項物證宣告答案。紅豆昏迷後現場還有活動；同時有人在關鍵時間有無法解釋的新傷，碎玻璃又與婚房破損相似。醫學能協助排除一些死因，但仍須由你自己核對誰最可能在最後一段時間接近死者。',title:'把三組證據放在一起核對',
        q:'如果把床底拖痕、三道勒痕、背傷玻璃及屍檢時間合起來，你會如何篩選最後可能接近過惠雯的人？',
        a:'不能從任何一張卡直接認定兇手。先注意紅豆昏迷後房內仍有人移動、惠雯有數道不同勒痕，再檢查誰在關鍵時段有新傷、其傷處又與婚房破玻璃相似。這會提高那個人需要解釋的程度，但仍要對照他的行蹤與其他人的目擊；醫師不能替你宣布名字。',
        check:'綜合：有多次勒壓、昏迷期間的移動、未能合理解釋的背傷與婚房碎玻璃。重點核對誰有最後接觸機會，且沒有可檢驗的不在場證明。'
      }
    ]
  };
})();
