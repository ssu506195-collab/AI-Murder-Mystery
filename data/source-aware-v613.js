/* V6.13：問題前提的可得性核對。不將完整真相裡的分鐘數當作提問者已知。 */
function sourceAwareQuestion(q,player,target,act,layer,priorAnswer=''){
 if(!q||act<2)return q;
 const selfText=String(D.roleData?.[player]?.acts?.slice(0,act).join(' ')||'');
 const publicText=(state.publicLog||[]).map(x=>x.text||'').join(' ') + ' ' +
 (state.publicClues||[]).map(id=>D.clues.find(c=>c.id===id)?.text||'').join(' ') + ' ' +
 (state.owned||[]).filter(x=>x.owner===player).map(x=>D.clues.find(c=>c.id===x.id)?.text||'').join(' ');
 const known=selfText+' '+publicText+' '+priorAnswer;
 // 只處理以精確時刻為前提的斷言；若證據來源未曾提到，應先要求本人說明時段。
 const times=[...String(q).matchAll(/(?:[012]?\d):[0-5]\d/g)].map(x=>x[0]);
 const unknown=times.filter(t=>!known.includes(t));
 if(!unknown.length)return q;
 // 主問優先詢問目擊與行蹤本身；追問可能由前一層即時回答提供，避免破壞可追問的分支。
 if(layer>0){
  const history=(state.publicLog||[]).map(x=>x.text||'').join(' ');
  if(unknown.every(t=>history.includes(t)))return q;
 }
 const event= /醫生|採血|針筒|注射/.test(q)?'醫療器械、病人及行動紀錄':
  /閣樓|腳步/.test(q)?'閣樓與走廊的動靜':
  /婚房|惠雯|勒痕/.test(q)?'婚房前後的出入及惠雯的狀況':
  /大門|出門|濕鞋/.test(q)?'大門開關和外出行蹤':
  /紅豆|火災|廚房/.test(q)?'廚房及三年前的大火':
  /涼亭|密室/.test(q)?'涼亭或密室的異常': '當夜的行蹤';
 if(/誰|有人|見過|看到|聽到/.test(q))return `關於${event}，你當時親眼看到了什麼、聽到了什麼？能否說清時間與位置？`;
 return `關於${event}，你能按照時間順序說明自己的所見與行動嗎？誰可以替你證明？`;
}
