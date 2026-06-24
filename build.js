#!/usr/bin/env node
// PinPoint Survey 법적고지 정적 사이트 생성기.
// app/lib/src/features/legal/legal_docs.dart 의 본문을 그대로 읽어 index.html 생성
// → 앱과 웹 내용이 항상 일치. (실행: node build.js [dart파일경로])
const fs = require("fs");
const path = require("path");

const dartPath = process.argv[2] ||
  path.join(__dirname, "..", "PinPoint Survey", "app", "lib", "src",
    "features", "legal", "legal_docs.dart");
const src = fs.readFileSync(dartPath, "utf8");

// '''...''' 블록을 순서대로 추출: [terms.ko, terms.ja, terms.en, privacy.ko, privacy.ja, privacy.en]
const blocks = [...src.matchAll(/'''([\s\S]*?)'''/g)].map((m) => m[1]);
if (blocks.length !== 6) {
  console.error(`[오류] 본문 블록 6개를 기대했으나 ${blocks.length}개 발견`);
  process.exit(1);
}
const ver = (src.match(/kLegalVersion\s*=\s*'([^']+)'/) || [])[1] || "";
const eff = (src.match(/kLegalEffectiveDate\s*=\s*'([^']+)'/) || [])[1] || "";

const docs = {
  terms: {ko: blocks[0], ja: blocks[1], en: blocks[2]},
  privacy: {ko: blocks[3], ja: blocks[4], en: blocks[5]},
};
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;");

const UI = {
  ko: {title: "PinPoint Survey 약관 및 정책", terms: "이용약관",
    privacy: "개인정보처리방침"},
  ja: {title: "PinPoint Survey 規約とポリシー", terms: "利用規約",
    privacy: "プライバシーポリシー"},
  en: {title: "PinPoint Survey Terms & Policies", terms: "Terms of Service",
    privacy: "Privacy Policy"},
};

let panels = "";
for (const lang of ["ko", "ja", "en"]) {
  for (const doc of ["terms", "privacy"]) {
    panels += `<pre class="doc" data-lang="${lang}" data-doc="${doc}">` +
      esc(docs[doc][lang]) + `</pre>\n`;
  }
}

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PinPoint Survey — Terms &amp; Privacy</title>
<style>
:root{--accent:#e6007e;--ink:#1b2a38;--fg5:#5b6b7a;--bg:#f7f8fa;--line:#e2e7ec}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,
"Helvetica Neue",Arial,"Noto Sans KR","Noto Sans JP",sans-serif;color:var(--ink);
background:var(--bg);line-height:1.65}
header{background:var(--ink);color:#fff;padding:22px 20px}
.brand{font-size:22px;font-weight:800}.brand b{color:var(--accent)}
.sub{color:#aeb9c4;font-size:12px;margin-top:4px}
.wrap{max-width:860px;margin:0 auto;padding:18px 16px 60px}
.tabs{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 10px}
.tab{border:1px solid var(--line);background:#fff;border-radius:20px;
padding:7px 14px;font-size:13px;font-weight:700;color:var(--fg5);cursor:pointer}
.tab.on{border-color:var(--accent);color:var(--accent);
background:rgba(230,0,126,.08)}
.seg{display:flex;gap:8px;margin-bottom:14px}
.doc{display:none;white-space:pre-wrap;word-break:break-word;background:#fff;
border:1px solid var(--line);border-radius:14px;padding:20px;font-size:14px;
font-family:inherit;margin:0}
.doc.on{display:block}
footer{color:var(--fg5);font-size:12px;text-align:center;padding:24px 16px}
a{color:var(--accent)}
</style>
</head>
<body>
<header>
  <div class="brand">Pin<b>Point</b> Survey</div>
  <div class="sub">Terms of Service &amp; Privacy Policy · v${ver} · ${eff}</div>
</header>
<div class="wrap">
  <div class="tabs" id="langTabs">
    <div class="tab" data-lang="ko">한국어</div>
    <div class="tab" data-lang="ja">日本語</div>
    <div class="tab" data-lang="en">English</div>
  </div>
  <div class="tabs seg" id="docTabs">
    <div class="tab" data-doc="terms"></div>
    <div class="tab" data-doc="privacy"></div>
  </div>
  ${panels}
  <footer>© PinPoint Survey · <a href="mailto:aktgeo009@gmail.com">aktgeo009@gmail.com</a></footer>
</div>
<script>
const UI=${JSON.stringify(UI)};
let lang=(navigator.language||"ko").slice(0,2);
if(!["ko","ja","en"].includes(lang))lang="en";
let doc="terms";
function render(){
  document.documentElement.lang=lang;
  document.title=UI[lang].title;
  document.querySelectorAll("#langTabs .tab").forEach(t=>
    t.classList.toggle("on",t.dataset.lang===lang));
  document.querySelectorAll("#docTabs .tab").forEach(t=>{
    t.textContent=UI[lang][t.dataset.doc];
    t.classList.toggle("on",t.dataset.doc===doc);
  });
  document.querySelectorAll(".doc").forEach(p=>
    p.classList.toggle("on",p.dataset.lang===lang&&p.dataset.doc===doc));
}
document.querySelectorAll("#langTabs .tab").forEach(t=>
  t.onclick=()=>{lang=t.dataset.lang;render();});
document.querySelectorAll("#docTabs .tab").forEach(t=>
  t.onclick=()=>{doc=t.dataset.doc;render();});
render();
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(__dirname, "index.html"), html, "utf8");
console.log(`✓ index.html 생성 (v${ver}, ${eff}) — 블록 ${blocks.length}개`);
