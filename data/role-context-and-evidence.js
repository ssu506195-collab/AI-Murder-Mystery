/* V6.10: Dialogue-layer perspective correction and guarded, evidence-oriented responses.
   The underlying data remains unchanged; only on-screen player questions are transformed.
   Source: original seven role scripts and organizer timeline, not hidden NPC data shared with player. */
const PW_ROLE_QUESTION_FIXES={
 '戴思齊':{
  '你的抓傷有沒有請戴醫生看過？':'你的抓傷是自己處理的嗎？為何當時沒有找我檢查？',
  '你怎麼處理傷口，為什麼沒請戴醫生？':'你怎麼處理傷口？當時為什麼沒有讓我替你檢查？',
  '當時你虎口傷得如何，戴醫生有沒有看過？':'你的虎口當時傷得多重？你記得我檢查時說過什麼嗎？',
  '有人在婚房看見戴醫生或紅豆，你也到過嗎？':'有人提到紅豆曾到婚房，你當時又為什麼接近那裡？',
  '你和戴醫生比較熟悉，昨天晚上有沒有再見過他或接受診治？':'你昨晚有沒有再來找我診治？那時你感到哪裡不舒服？',
  '戴醫生替你診治過多久？':'我替你看診有一段時間了，你從什麼時候開始感覺症狀不對？',
  '戴醫生有沒有請你幫忙取得某種樣本？':'我是否曾要求你替我拿取什麼東西？你當時怎麼理解那個要求？',
  '你和戴醫生是否有過私下交易？':'我們之前的私下往來，你願意說明是什麼性質嗎？',
  '你最想當面向戴醫生問什麼？':'如果現在當面問我，你最想確認的是哪一件事？',
  '經過密室事件後，你對陳老爺與戴醫生的信任有改變嗎？':'密室事件後，你對陳先生的判斷改變了嗎？那你對我的信任呢？',
  '老爺深夜把你搖醒時，戴醫生在哪裡？':'陳先生深夜把你搖醒時，你知道我當時在哪裡嗎？',
  '妳原本相信戴醫生，現在還敢讓他替妳看診嗎？':'你以前信任我，現在發生這麼多事，還願意讓我替你看診嗎？',
  '若注射器裡有殘留液體，你願意交給戴醫生檢驗嗎？':'若注射器裡確有殘留物，你願意交給我檢驗嗎？',
  '你有沒有想過她最信任的其實是戴醫生？':'你有沒有想過她對我的信任可能被人利用？',
  '戴醫生曾救你，也曾利用你，你如何面對？':'你覺得我以前幫過你，後來卻又利用你的信任嗎？你怎麼看？',
  '你會原諒戴醫生長期操控你嗎？':'若你認為我曾控制你的生活，你還願意原諒我嗎？',
  '戴醫生是否曾真心愛過你？':'你覺得我對你的感情曾經真誠過嗎？',
  '你會相信戴醫生能安全保管古法嗎？':'你會相信我能妥善保管《陳氏古法》嗎？'
 },
 '陳聿明':{
  '你收到的消息和陳老爺真身有沒有關係？':'你收到的消息是否涉及我的真正身分？',
  '經過密室事件後，你對陳老爺與戴醫生的信任有改變嗎？':'密室事件後，你還相信我嗎？那你對戴醫生的判斷呢？',
  '陳老爺是否早就發現妳和別人有聯絡？':'你認為我何時察覺你和其他人私下聯絡？',
  '你看到陳老爺保險櫃裡的另一半玉佩後想到了什麼？':'你看到我保險櫃裡的半塊玉佩後，聯想到了什麼？',
  '你願意向陳老爺說出自己父親身分？':'你願意現在告訴我你父親的真正身分嗎？'
 },
 '孟小婉':{
  '你和孟小婉的婚事究竟有多少是出於真心？':'你和我這場婚事，究竟有多少是出於真心？',
  '孟小婉後來身上出現針孔，你有什麼必須負責的事情？':'我身上的針孔，你有什麼必須向我交代的？'
 }
};
function roleSensitiveQuestion(question,player,target){
 if(target==='阿忠'&&question==='阿忠照顧的藥材究竟由誰熬成湯？')return '你照顧的娃娃眼藥草，是由誰負責熬成湯的？';
 if(target==='阿忠'&&question==='阿忠叔，工具包裡的麻繩是用來綁樹還是綁人？')return '你的工具包裡有麻繩，平時是用來綁樹，還是也曾用來捆人？';
 const specific=PW_ROLE_QUESTION_FIXES[player]||{};
 if(specific[question])return specific[question];
 // Fallback for content added in the future. Never write the player's full name as if discussing a third party.
 const aliases={
  '戴思齊':['戴思齊','戴醫生','戴医生','戴大夫'],
  '陳聿明':['陳聿明','陳老爺','陳先生','陈先生'],
  '東青':['東青','東管家'],
  '阿忠':['阿忠','阿忠叔'],
  '紅豆':['紅豆'],
  '孟小婉':['孟小婉','孟小姐'],
  '江靜儀':['江靜儀','江記者']
 };
 const mine=aliases[player]||[player];
 if(!mine.some(x=>question.includes(x)))return question;
 // In ambiguous sentences avoid inventing shared experiences: explicitly ask for concrete first-hand details.
 let q=question;
 for(const alias of mine)q=q.split(alias).join('我');
 q=q.replace(/我或我/g,'我').replace(/我與我/g,'我和你');
 return q;
}
function characterSafeAnswer(answer,act,target,question){
 if(target!=='阿忠'||act<4)return answer;
 const txt=String(answer||'');
 // NPC's written task is to deflect murder suspicion. He cannot explicitly confess even if pressed.
 if(/我控制不住怒氣，把繩子勒上|最後一次勒頸是我做的|我造成了最後那次|我動手時她還活著|我把她勒死|我勒死|親手殺害惠雯|我殺了惠雯|這不是替旁人背罪|我做過的事說成沒有發生/.test(txt)){
  return '我確實去過婚房，也和惠雯爭執過。她那時情緒不穩，房裡又有別人先留下的痕跡；你們若只拿我進房這件事定罪，就忽略了先前進出的人。我不願再談那些爭執細節，但我沒有親眼見到她最後斷氣。';
 }
 if(/是。前面可能還有人傷過她/.test(txt))return '你這是要我替所有傷痕認罪。我承認自己曾到場，也知道繩子和傷口會讓人起疑，但究竟哪一道造成死亡，應由懂驗傷的人查，不該由一句逼問決定。';
 if(/我離開時她已沒反應/.test(txt))return '我離開時房裡很混亂，我沒有留下來確認她的情況。後來有人又進出婚房，不能單憑我在場就斷定所有傷痕都出自同一個人。';
 if(/我跟惠雯爭吵，她提起火災/.test(txt))return '我們確實談到舊火災，吵得很難看。我沒有理由向大家交代每句氣話；如果你要指控我動手，就得拿出能把時刻和傷痕對上的證據。';
 if(/我不能再把自己的行動說成與她的死毫無關係/.test(txt))return '我當晚進過婚房，確實有可疑的地方；但前後有人先接觸過她，誰造成最後致命傷，不能只靠你們看到的繩子下結論。';
 return answer;
}
