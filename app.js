const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "dcg-tournament-endpoint";
const endpointInput = $("endpoint");
endpointInput.value = localStorage.getItem(STORAGE_KEY) || "";

$("load-btn").addEventListener("click", loadData);
if (endpointInput.value) loadData();

function setNotice(message, kind="") {
  const el = $("notice");
  el.textContent = message;
  el.className = "notice" + (kind ? " " + kind : "");
}
async function loadData() {
  const url = endpointInput.value.trim();
  if (!url) return setNotice("Apps ScriptのウェブアプリURLを入力してください。", "error");
  try {
    new URL(url);
  } catch { return setNotice("URLの形式を確認してください。", "error"); }
  localStorage.setItem(STORAGE_KEY, url);
  setNotice("大会情報を読み込んでいます…");
  try {
    const response = await fetch(url, {cache:"no-store"});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    render(data);
    setNotice("大会情報を更新しました。", "success");
  } catch (err) {
    setNotice("読み込みに失敗しました。Apps Scriptの公開設定・URL・JSON出力を確認してください。", "error");
    console.error(err);
  }
}
function text(el, value, fallback="—") { el.textContent = value == null || value === "" ? fallback : value; }
function render(data) {
  const event = data.event || {};
  text($("event-title"), event.title, "DCG大会");
  text($("event-meta"), [event.date, event.format, event.status].filter(Boolean).join(" ・ "), "大会情報");
  text($("event-description"), event.description, "大会の説明はありません。");
  text($("status"), event.status, "開催情報");
  const players = data.players || [];
  const matches = data.matches || [];
  text($("player-count"), players.length, "0");
  text($("match-count"), matches.length, "0");
  const finalMatch = matches.filter(m => String(m.round) === String(data.finalRound || Math.max(0,...matches.map(m=>Number(m.round)||0))))
    .find(m => m.winner);
  text($("champion"), event.champion || (finalMatch ? finalMatch.winner : ""), "未確定");
  renderPlayers(players);
  renderMatches(matches, data.roundNames || {});
}
function renderPlayers(players) {
  const tbody = $("players"); tbody.replaceChildren();
  if (!players.length) {
    const tr=document.createElement("tr"),td=document.createElement("td");
    td.colSpan=3;td.className="muted";td.textContent="参加者はまだ登録されていません。";tr.append(td);tbody.append(tr);return;
  }
  for (const p of players) {
    const tr=document.createElement("tr");
    addCell(tr,p.name);
    addCell(tr,p.gameName);
    const td=document.createElement("td");
    if (p.deckUrl && safeUrl(p.deckUrl)) {
      const a=document.createElement("a");a.href=p.deckUrl;a.target="_blank";a.rel="noopener noreferrer";a.textContent="画像を見る";td.append(a);
    } else td.textContent="未提出";
    tr.append(td);tbody.append(tr);
  }
}
function addCell(tr,value){const td=document.createElement("td");td.textContent=value||"—";tr.append(td)}
function safeUrl(value){try{const u=new URL(value);return u.protocol==="https:"||u.protocol==="http:"}catch{return false}}
function renderMatches(matches, roundNames) {
  const root=$("bracket");root.replaceChildren();
  if (!matches.length) {const p=document.createElement("p");p.className="muted";p.textContent="対戦表はまだ作成されていません。";root.append(p);return;}
  const rounds=[...new Set(matches.map(m=>Number(m.round)))].sort((a,b)=>a-b);
  for (const roundNo of rounds) {
    const col=document.createElement("div");col.className="round";
    const heading=document.createElement("h3");heading.textContent=roundNames[roundNo]||`第${roundNo}ラウンド`;col.append(heading);
    matches.filter(m=>Number(m.round)===roundNo).sort((a,b)=>Number(a.matchNo)-Number(b.matchNo)).forEach(m=>{
      const box=document.createElement("div");box.className="match";
      const head=document.createElement("div");head.className="match-head";head.textContent=`対戦 ${m.matchNo}`;box.append(head);
      [m.player1,m.player2].forEach(name=>{
        const row=document.createElement("div");row.className="entrant";
        const label=document.createElement("span");label.textContent=name||"BYE";
        const result=document.createElement("span");result.className="result";
        if (m.winner && name && m.winner===name) {row.classList.add("winner");result.textContent="勝";} 
        else if (m.winner && name) result.textContent="敗";
        else if (!name && m.winner) result.textContent="不戦勝";
        row.append(label,result);box.append(row);
      });
      col.append(box);
    });
    root.append(col);
  }
}
