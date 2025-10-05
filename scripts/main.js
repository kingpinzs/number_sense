//main.js
/* ========= Tabs (desktop + mobile) ========= */
const SECTIONS = ["assessment", "coach", "train", "cognition", "progress"];
const TITLES = { assessment: "Assessment", coach: "Coach", train: "Train", cognition: "Cognition", progress: "Progress" };
const tabset = document.getElementById('tabset');
const tabsel = document.getElementById('tabselect');
SECTIONS.forEach((id, i) => {
    const b = document.createElement('button'); b.className = 'tab-btn' + (i === 0 ? ' active' : ''); b.textContent = TITLES[id];
    b.onclick = () => activate(id); tabset.appendChild(b);
    const o = document.createElement('option'); o.value = id; o.textContent = TITLES[id]; tabsel.appendChild(o);
});
tabsel.onchange = () => activate(tabsel.value);
function activate(id) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    [...tabset.children].forEach(btn => btn.classList.toggle('active', btn.textContent === TITLES[id]));
    tabsel.value = id;
    if (id === 'progress') refreshPeek();
}




/* ========= Storage ========= */
const KEY = 'ns-suite-v2';
function dbGet() { try { return JSON.parse(localStorage.getItem(KEY)) || { train: { subitize: [], numline: [], facts: [] }, assessment: {}, plan: null, cog_runs: [], pal_pending: null }; } catch { return { train: { subitize: [], numline: [], facts: [] }, assessment: {}, plan: null, cog_runs: [], pal_pending: null }; } }
function dbSet(d) { localStorage.setItem(KEY, JSON.stringify(d)); }

/* ========= Wizard Overlay ========= */
const WIZ = {
    root: document.getElementById('wizard'),
    title: document.getElementById('wiz-title'),
    body: document.getElementById('wiz-body'),
    hint: document.getElementById('wiz-hint'),
    open(title) { this.title.textContent = title; this.body.innerHTML = ''; this.hint.textContent = ''; this.root.classList.add('on'); },
    close() { this.root.classList.remove('on'); this.body.innerHTML = ''; this.hint.textContent = ''; }
};
document.getElementById('wiz-back').onclick = () => WIZ.close();
document.getElementById('wiz-close').onclick = () => WIZ.close();

/* ========= Utilities ========= */
const sleep = ms => new Promise(r => setTimeout(r, ms));
const median = arr => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

/* ===== Global Enter-to-submit (delegated) ===== */
function installEnterToClick() {
    const findButton = (start) => {
        // priority search: same .row, then enclosing .card, then wizard body/panel
        const scopes = [
            start.closest('.row'),
            start.closest('.card'),
            start.closest('#wiz-body') || start.closest('#wiz-panel'),
            document
        ].filter(Boolean);

        for (const scope of scopes) {
            // 1) explicit target via data-enter on *any* ancestor
            const explicitSel = start.getAttribute('data-enter') || scope.getAttribute?.('data-enter');
            if (explicitSel) {
                const btn = document.querySelector(explicitSel);
                if (btn && !btn.disabled) return btn;
            }
            // 2) common primary ids
            let btn = scope.querySelector('button#go:not([disabled])');
            if (btn) return btn;
            // 3) first non-ghost, enabled button in scope
            btn = scope.querySelector('button:not(.ghost):not([disabled])');
            if (btn) return btn;
        }
        return null;
    };

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
        const el = e.target;
        if (!(el instanceof HTMLElement)) return;
        // only inputs/selects; ignore textarea to allow line breaks
        const tag = el.tagName.toLowerCase();
        if (!['input', 'select'].includes(tag)) return;
        if (el.getAttribute('data-enter-skip') === '1') return;

        const btn = findButton(el);
        if (btn) {
            e.preventDefault();
            btn.click();
        }
    }, true); // capture to beat other handlers if needed
}
/* ====== TRAIN quick modules (inline) ====== */
const grid = document.getElementById('s-grid');
// Build the grid ONCE
if (!grid.dataset.inited) {
    for (let i = 0; i < 25; i++) {
        const d = document.createElement('span');
        d.className = 'dot';
        d.style.visibility = 'hidden';
        grid.appendChild(d);
    }
    grid.dataset.inited = '1';
}

const dots = [...grid.children];
let answer = null;
let shownAt = 0;

const hideAll = () => dots.forEach(d => (d.style.visibility = 'hidden'));
const rngPick = (n) => {
    const idxs = [...dots.keys()];
    for (let i = idxs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
    }
    return idxs.slice(0, n);
};

function startTrial() {
    hideAll();
    const lvl = currentLevel('subitize');
    const conf = genSubitizeConfig(lvl);
    // Respect user’s dropdown as an upper bound, but let engine push higher if needed:
    const userMax = +document.getElementById('s-max').value || 6;
    const n = Math.max(1, Math.min(conf.maxDots, userMax));
    const ms = +document.getElementById('s-ms').value || conf.flashMs;

    answer = n;
    document.getElementById('s-guess').value = '';
    const pick = rngPick(n);
    pick.forEach(i => (dots[i].style.visibility = 'visible'));
    shownAt = performance.now();
    setTimeout(() => pick.forEach(i => (dots[i].style.visibility = 'hidden')), ms);
    document.getElementById('s-fb').textContent = 'Look carefully…';
}

function submit() {
    if (answer == null) return;
    const val = Number(document.getElementById('s-guess').value);
    const lat = Math.round(performance.now() - shownAt);
    const ok = val === answer;

    // log as before
    const d = dbGet();
    d.train.subitize.push({ target: answer, guess: val, correct: ok, latency_ms: lat, ts: new Date().toISOString() });
    dbSet(d);

    // adaptive difficulty (subitize domain)
    updateDifficulty('subitize', ok);

    document.getElementById('s-fb').textContent = ok ? `✓ ${lat} ms` : `✗ was ${answer} (${lat} ms)`;
    answer = null;
}

document.getElementById('s-start').onclick = startTrial;
document.getElementById('s-submit').onclick = submit;
document.getElementById('s-guess').addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });

/* ---------- Number Line (drag + ghost + adaptive tol + badge + ring + hint + mastery) ---------- */

const area = document.getElementById('nl-area');
const pointer = document.getElementById('nl-pointer');
const selRange = document.getElementById('nl-range');
const selTicks = document.getElementById('nl-ticks');
const fb = document.getElementById('nl-fb');
const btnNew = document.getElementById('nl-new');
const btnCheck = document.getElementById('nl-check');

/* One-time styles */
if (!document.getElementById('nl-extras-style2')) {
    const st = document.createElement('style');
    st.id = 'nl-extras-style2';
    st.textContent = `
      .nl-tooltip{position:absolute;transform:translate(-50%,-10px);padding:4px 8px;border-radius:8px;
        background:#fff;border:1px solid var(--line);font-size:12px;pointer-events:none;white-space:nowrap}
      .nl-badge{position:absolute;top:6px;right:10px;background:#fff;border:1px solid var(--line);border-radius:10px;
        padding:2px 8px;font-size:12px;color:var(--muted)}
      .nl-ring{display:inline-flex;align-items:center;gap:6px;margin-left:8px}
      .nl-ring svg{display:block}
      .nl-ring .pct{font-size:12px;color:var(--muted)}
      .nl-hint{position:absolute;left:12px;bottom:8px;background:#ffffffcc;border:1px solid var(--line);border-radius:8px;
        padding:4px 8px;font-size:12px;color:var(--muted);backdrop-filter:blur(4px)}
      .nl-ribbon{position:absolute;left:10px;top:-8px;background:linear-gradient(90deg,#2b9a66,#54c081);
        color:#fff;font-weight:600;font-size:12px;padding:4px 10px;border-radius:10px;box-shadow:0 2px 6px rgba(0,0,0,.1)}
      .nl-ribbon .sub{opacity:.9;font-weight:500;margin-left:6px}
    `;
    document.head.appendChild(st);
}

/* UI add-ons */
const badge = document.createElement('div'); badge.className = 'nl-badge'; area.appendChild(badge);
const ringWrap = document.createElement('span'); ringWrap.className = 'nl-ring';
ringWrap.innerHTML = `
    <svg width="26" height="26" viewBox="0 0 36 36" aria-label="success rate" title="Success rate (last 12)">
      <circle cx="18" cy="18" r="15" fill="none" stroke="#d9dde4" stroke-width="4"></circle>
      <circle id="nl-ring-prog" cx="18" cy="18" r="15" fill="none" stroke="var(--accent)" stroke-width="4"
        stroke-linecap="round" stroke-dasharray="100,100" stroke-dashoffset="100" transform="rotate(-90 18 18)"></circle>
    </svg>
    <span class="pct" id="nl-ring-pct">0%</span>`;
btnNew.insertAdjacentElement('afterend', ringWrap);
const ringProg = ringWrap.querySelector('#nl-ring-prog');
const ringPct = ringWrap.querySelector('#nl-ring-pct');

const ghost = document.createElement('div'); ghost.className = 'nl-tooltip'; ghost.style.display = 'none'; area.appendChild(ghost);
const hint = document.createElement('div'); hint.className = 'nl-hint'; hint.style.display = 'none'; hint.textContent = 'Tip: Press N to toggle snap'; area.appendChild(hint);
const ribbon = document.createElement('div'); ribbon.className = 'nl-ribbon'; ribbon.style.display = 'none';
ribbon.innerHTML = `MASTERED <span class="sub">≥90% over last 24</span>`; area.appendChild(ribbon);

// State
let targetVal = null, dragging = false, px = null, snapOnRelease = true, lastVibeAt = 0;

// Persistence (prefs per range + global hint)
function prefsRoot() { const d = dbGet(); d.prefs = d.prefs || {}; d.prefs.numline = d.prefs.numline || {}; d.prefs.flags = d.prefs.flags || {}; return d; }
function getRangePrefs() {
    const d = prefsRoot(); const r = selRange.value;
    if (!d.prefs.numline[r]) {
        d.prefs.numline[r] = (r === '0-1') ? { level: 0, levels: [0.05, 0.02, 0.01], mastered: false, mastered_at: null }
            : { level: 0, levels: [5, 3, 1], mastered: false, mastered_at: null };
        dbSet(d);
    }
    return d.prefs.numline[r];
}
function setRangePrefs(upd) { const d = prefsRoot(); d.prefs.numline[selRange.value] = Object.assign(getRangePrefs(), upd); dbSet(d); }
function markHintShown() { const d = prefsRoot(); d.prefs.flags.snapHintShown = true; dbSet(d); }
const isHintShown = () => !!prefsRoot().prefs.flags.snapHintShown;
const tol = () => getRangePrefs().levels[getRangePrefs().level];

// Helpers
pointer.style.cursor = 'grab'; pointer.style.userSelect = 'none'; area.style.userSelect = 'none';
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const parseRange = (v) => (v === '0-1' ? [0, 1, true] : v.split('-').map(Number).concat(false));

function pxToVal(pxPos) { const [a, b] = parseRange(selRange.value); const L = 16, R = area.clientWidth - 16; const f = clamp((pxPos - L) / (R - L), 0, 1); const v = a + f * (b - a); return selRange.value === '0-1' ? Math.round(v * 100) / 100 : Math.round(v); }
function valToPx(val) { const [a, b] = parseRange(selRange.value); const L = 16, R = area.clientWidth - 16; const f = clamp((val - a) / (b - a), 0, 1); return L + f * (R - L); }

function drawTicks() {
    area.querySelectorAll('.nl-tick').forEach(n => n.remove());
    const L = 16, R = area.clientWidth - 16; const [a, b, is01] = parseRange(selRange.value);
    const add = (x) => { const t = document.createElement('div'); t.className = 'nl-tick'; t.style.left = x + 'px'; area.appendChild(t); };
    if (selTicks.value === 'full') { const steps = is01 ? 10 : (b - a); for (let i = 0; i <= steps; i++) add(L + (i / steps) * (R - L)); }
    else if (selTicks.value === 'ends') { add(L); add(R); }
}

function vibe(ms = 10) { if (!('vibrate' in navigator)) return; const now = performance.now(); if (now - lastVibeAt > 150) { navigator.vibrate(ms); lastVibeAt = now; } }
function showGhostAt(pxPos, v) { ghost.style.left = pxPos + 'px'; ghost.style.top = '22px'; ghost.textContent = String(v); ghost.style.display = 'block'; }
function hideGhost() { ghost.style.display = 'none'; }

function placePointerAt(pxPos, { snap = false, withGhost = false } = {}) {
    px = clamp(pxPos, 16, area.clientWidth - 16); let v = pxToVal(px);
    if (snap) { v = selRange.value === '0-1' ? Math.round(v * 100) / 100 : Math.round(v); px = valToPx(v); }
    pointer.style.left = px + 'px'; pointer.style.display = 'block'; if (withGhost) showGhostAt(px, v);
}

// Metrics
function lastAttempts(range) { return (dbGet().train.numline || []).filter(r => r.range === range).slice(-24); }
function successRate(range, tolVal, window = 12) {
    const a = (dbGet().train.numline || []).filter(r => r.range === range).slice(-window);
    if (!a.length) return 0;
    const s = a.filter(r => Math.abs(r.error) <= tolVal).length;
    return s / a.length;
}

// UI updates
function updateBadgeAndRing() {
    const range = selRange.value, tolVal = tol();
    const rate12 = successRate(range, tolVal, 12);
    const tolLabel = `±${tolVal}`;
    badge.textContent = `Tol ${tolLabel} • SR ${Math.round(rate12 * 100)}%`;
    badge.style.display = 'block';
    const pct = Math.round(rate12 * 100);
    ringProg.setAttribute('stroke-dashoffset', String(100 - pct));
    ringPct.textContent = `${pct}%`;
    ringWrap.title = `Success rate (last 12): ${pct}%`;
}
function updateRibbon() {
    const range = selRange.value, tolVal = tol();
    const a24 = lastAttempts(range);
    const rate24 = a24.length ? a24.filter(r => Math.abs(r.error) <= tolVal).length / a24.length : 0;
    const rp = getRangePrefs();
    const masteredNow = a24.length >= 24 && rate24 >= 0.90;

    if (masteredNow && !rp.mastered) {
        setRangePrefs({ mastered: true, mastered_at: new Date().toISOString() });
        ribbon.style.display = 'block'; vibe(80);
        fb.textContent = 'Mastery unlocked for this range!';
        setTimeout(() => { if (fb.textContent.includes('Mastery')) fb.textContent = ''; }, 1600);
    }
    ribbon.style.display = (rp.mastered || masteredNow) ? 'block' : 'none';
}

function newTarget() {
    const [a, b, is01] = parseRange(selRange.value);
    targetVal = is01 ? Math.round(Math.random() * 100) / 100 : Math.floor(Math.random() * (b - a + 1)) + a;
    fb.textContent = ''; btnNew.textContent = `New Target (${targetVal})`;
    pointer.style.display = 'none'; hideGhost(); px = null; drawTicks();
    updateBadgeAndRing(); updateRibbon();
}

// Drag
function clientX(e) { return e.touches ? e.touches[0].clientX : e.clientX; }
function startDrag(e) { dragging = true; pointer.style.cursor = 'grabbing'; const r = area.getBoundingClientRect(); placePointerAt(clientX(e) - r.left, { withGhost: true }); e.preventDefault(); }
function moveDrag(e) { if (!dragging) return; const r = area.getBoundingClientRect(); placePointerAt(clientX(e) - r.left, { withGhost: true }); }
function endDrag() { if (!dragging) return; dragging = false; pointer.style.cursor = 'grab'; hideGhost(); if (snapOnRelease) placePointerAt(px, { snap: true }); const guess = pxToVal(px); if (Math.abs(guess - targetVal) <= tol()) vibe(25); }

area.addEventListener('click', (e) => { if (dragging) return; const r = area.getBoundingClientRect(); placePointerAt(e.clientX - r.left, { snap: snapOnRelease, withGhost: true }); setTimeout(hideGhost, 500); });
pointer.addEventListener('mousedown', startDrag);
window.addEventListener('mousemove', moveDrag);
window.addEventListener('mouseup', endDrag);
pointer.addEventListener('touchstart', startDrag, { passive: false });
window.addEventListener('touchmove', moveDrag, { passive: false });
window.addEventListener('touchend', endDrag);

// Keyboard + snap toggle + first-focus hint
area.tabIndex = 0;
area.addEventListener('focus', () => {
    if (!isHintShown()) {
        hint.style.display = 'block';
        setTimeout(() => { hint.style.display = 'none'; markHintShown(); }, 2200);
    }
});
area.addEventListener('keydown', (e) => {
    if (pointer.style.display !== 'block') {
        if (e.key.toLowerCase() === 'n') { snapOnRelease = !snapOnRelease; fb.textContent = `Snap ${snapOnRelease ? 'ON' : 'OFF'} • Tol ±${tol()}`; setTimeout(() => { if (fb.textContent.startsWith('Snap')) fb.textContent = ''; }, 1200); }
        return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const step = selRange.value === '0-1' ? 0.01 : 1;
        const val = pxToVal(px) + (e.key === 'ArrowRight' ? step : -step);
        placePointerAt(valToPx(val), { snap: true, withGhost: true }); setTimeout(hideGhost, 300); e.preventDefault();
    }
    if (e.key.toLowerCase() === 'n') {
        snapOnRelease = !snapOnRelease;
        fb.textContent = `Snap ${snapOnRelease ? 'ON' : 'OFF'} • Tol ±${tol()}`;
        setTimeout(() => { if (fb.textContent.startsWith('Snap')) fb.textContent = ''; }, 1200);
    }
});

// Check + adaptive tolerance + mastery evaluation
btnCheck.onclick = () => {
    if (px == null) return;
    const guess = pxToVal(px);
    const err = Math.abs(guess - targetVal);
    fb.textContent = `guess ${guess} → error ${Math.round(err * 100) / 100} • tol ±${tol()}`;

    const d = dbGet();
    d.train.numline.push({ range: selRange.value, target: targetVal, guess, error: err, ts: new Date().toISOString() });
    dbSet(d);

    if (err <= tol()) vibe(40);

    // Adaptive tol using last 12
    const rp = getRangePrefs();
    const attempts = (dbGet().train.numline || []).filter(r => r.range === selRange.value).slice(-12);
    const rate12 = attempts.length ? attempts.filter(r => Math.abs(r.error) <= tol()).length / attempts.length : 0;
    if (attempts.length >= 12) {
        if (rate12 >= 0.8 && rp.level < rp.levels.length - 1) { setRangePrefs({ level: rp.level + 1 }); vibe(60); fb.textContent += ' • Tightened tolerance'; }
        else if (rate12 <= 0.5 && rp.level > 0) { setRangePrefs({ level: rp.level - 1 }); fb.textContent += ' • Relaxed tolerance'; }
    }

    updateBadgeAndRing();
    updateRibbon(); // check mastery (last 24, ≥90%)
};

// Controls + responsive
btnNew.onclick = newTarget;
window.addEventListener('resize', () => { drawTicks(); if (px != null) placePointerAt(px, { snap: false }); });
selRange.onchange = () => { newTarget(); };
selTicks.onchange = drawTicks;

// Init
badge.style.display = 'block';
newTarget();

function genSubitizeConfig(level) {
    // simple scaler: level 1→ max 4 dots; level 2→6; 3+→9; flash speeds down slightly
    const L = Math.max(1, level | 0);
    const maxDots = L <= 1 ? 4 : L === 2 ? 6 : 9;
    const flashMs = L <= 1 ? 1200 : L === 2 ? 1000 : 800;
    return { maxDots, flashMs };
}

/* ==== Engine shim (PRNG + levels + generator) ==== */
/* Place this just ABOVE the "Facts (timed)" block */

(function installEngineShim() {
    // if engine already present, do nothing
    if (typeof window.currentLevel === 'function'
        && typeof window.updateDifficulty === 'function'
        && typeof window.genArithmetic === 'function'
        && typeof window.ERNG !== 'undefined') return;

    // Seeded PRNG (Mulberry32)
    function makeRNG(seed) {
        return function () {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
    // one persistent seed per device
    const _eng = (function () {
        const d = dbGet(); d.engine = d.engine || {};
        if (!d.engine.seed) { d.engine.seed = Math.floor(Math.random() * 1e9); dbSet(d); }
        return d.engine;
    })();
    window.ERNG = makeRNG(_eng.seed);

    // simple recent-item filter to avoid immediate repeats
    const SEEN_KEY = 'seen';
    _eng[SEEN_KEY] = Array.isArray(_eng[SEEN_KEY]) ? _eng[SEEN_KEY] : [];
    const seenSet = new Set(_eng[SEEN_KEY]);
    function seenHas(k) { return seenSet.has(k); }
    function seenAdd(k) {
        if (seenSet.has(k)) return;
        seenSet.add(k);
        _eng[SEEN_KEY].push(k);
        if (_eng[SEEN_KEY].length > 300) {
            const old = _eng[SEEN_KEY].shift();
            seenSet.delete(old);
        }
        const d = dbGet(); d.engine = d.engine || {}; d.engine[SEEN_KEY] = _eng[SEEN_KEY]; dbSet(d);
    }

    // levels per domain (rolling 12 accuracy)
    function _levels() {
        const d = dbGet(); d.progress = d.progress || {};
        if (!d.progress.arithmetic) d.progress.arithmetic = { level: 1, hist: [] };
        if (!d.progress.subitize) d.progress.subitize = { level: 1, hist: [] };
        if (!d.progress.numline) d.progress.numline = { level: 1, hist: [] };
        dbSet(d); return d.progress;
    }
    window.currentLevel = function (domain) {
        const p = _levels();
        return (p[domain] && p[domain].level) || 1;
    };
    window.updateDifficulty = function (domain, ok) {
        const d = dbGet(); d.progress = d.progress || {};
        const cur = d.progress[domain] || { level: 1, hist: [] };
        cur.hist.push(ok ? 1 : 0);
        if (cur.hist.length > 12) cur.hist.shift();
        const avg = cur.hist.reduce((a, b) => a + b, 0) / cur.hist.length;
        if (avg >= 0.85) cur.level++;
        else if (avg < 0.60 && cur.level > 1) cur.level--;
        d.progress[domain] = cur; dbSet(d);
        return cur.level;
    };

    // arithmetic generator (clean division; scales with level)
    window.genArithmetic = function (rng, level) {
        const L = Math.max(1, level | 0);
        const ri = (a, b) => Math.floor(rng() * (b - a + 1)) + a;
        const pick = (arr) => arr[Math.floor(rng() * arr.length)];

        // occasional 3-term for L>=6
        if (L >= 6 && rng() < 0.35) {
            const ops = ['+', '-', '×', '÷'];
            const o1 = pick(ops), o2 = pick(ops);
            let A = ri(10, 99), B = ri(2, 20), C = ri(2, 20);
            const safeDiv = (x, y) => y === 0 ? 1 : x / y;
            const evalOp = (x, o, y) => o === '+' ? x + y : o === '-' ? x - y : o === '×' ? x * y : safeDiv(x, y);
            let expr = `${A} ${o1} ${B} ${o2} ${C}`;
            // make divisions clean-ish
            if (o1 === '÷') { const div = ri(1, 12); B = div; A = B * ri(0, 50); }
            if (o2 === '÷') { const div = ri(1, 12); C = div; B = C * ri(0, 50); }
            expr = `${A} ${o1} ${B} ${o2} ${C}`;
            const ans = evalOp(evalOp(A, o1, B), o2, C);
            const key = `expr:${expr}`;
            if (seenHas(key)) return window.genArithmetic(rng, level);
            seenAdd(key);
            return { question: expr, answer: Math.round((ans + Number.EPSILON) * 1e6) / 1e6 };
        }

        // base 2-term by bands
        let a = 0, b = 0, op = '+';
        if (L === 1) { a = ri(0, 9); b = ri(0, 9); op = rng() < 0.5 ? '+' : '-'; if (op === '-' && b > a) [a, b] = [b, a]; }
        else if (L === 2) { a = ri(0, 20); b = ri(0, 20); op = rng() < 0.5 ? '+' : '-'; if (op === '-' && b > a) [a, b] = [b, a]; }
        else if (L === 3) { const ops = ['+', '-', '×', '÷']; op = pick(ops); a = ri(0, 12); b = ri(1, 12); if (op === '-') { if (b > a) [a, b] = [b, a]; } if (op === '÷') { a = b * ri(0, 12); } }
        else if (L === 4) { op = rng() < 0.5 ? '+' : '-'; a = ri(10, 99); b = ri(10, 99); if (op === '-' && b > a) [a, b] = [b, a]; }
        else /* L>=5 */ { const ops = ['×', '÷', '+', '-']; op = pick(ops); a = ri(0, 99); b = ri(1, 99); if (op === '÷') { const div = ri(1, 12); b = div; a = b * ri(0, 50); } }

        const ans = (op === '+') ? a + b : (op === '-') ? a - b : (op === '×') ? a * b : a / b;
        const q = `${a} ${op} ${b}`;
        const key = `arith:${q}`;
        if (seenHas(key)) return window.genArithmetic(rng, level);

        seenAdd(key);
        return { question: q, answer: Math.round((ans + Number.EPSILON) * 1e6) / 1e6 };
    };
})();



/* ---------- Facts (timed) ---------- */
const btnStart = document.getElementById('ff-start');
const btnSubmit = document.getElementById('ff-submit');
const qEl = document.getElementById('ff-problem');
const ansEl = document.getElementById('ff-ans');
const fbEl = document.getElementById('ff-fb');
const timerEl = document.getElementById('ff-timer');

let state = null;   // {end, correct, attempts, level, cur:{q,ans}}
let timerId = null;

function nextItem(level) {
    // Take the user’s Op/Max as “hints”, but the generator is free-range & scales up
    const item = genArithmetic(ERNG, level);
    return { q: item.question, ans: item.answer };
}

// create chip if missing
let levelChip = document.getElementById('ff-level');
if (!levelChip) {
    levelChip = document.createElement('span');
    levelChip.id = 'ff-level';
    levelChip.className = 'muted';
    levelChip.style.marginLeft = '8px';
    levelChip.style.background = 'var(--bg-2)';
    levelChip.style.border = '1px solid var(--line)';
    levelChip.style.padding = '2px 6px';
    levelChip.style.borderRadius = '8px';
    timerEl.insertAdjacentElement('afterend', levelChip);
}
function updateLevelChip(lvl) { levelChip.textContent = `Lv ${lvl}`; }

function startFacts() {
    if (state) return;
    const sec = +document.getElementById('ff-sec').value || 60;

    const level = currentLevel('arithmetic');
    updateLevelChip(level);

    // start at current difficulty for arithmetic; engine will self-adjust
    const durationSec = +document.getElementById('ff-sec').value || 60;
    state = {
        end: Date.now() + durationSec * 1000,
        durationSec,
        correct: 0,
        attempts: 0,
        level,
        cur: nextItem(level)
    };

    fbEl.textContent = '';
    qEl.textContent = `${state.cur.q} = ?`;
    btnStart.disabled = true;
    ansEl.disabled = false; btnSubmit.disabled = false; ansEl.focus();

    timerId && clearInterval(timerId);
    timerId = setInterval(() => {
        const left = Math.max(0, state.end - Date.now());
        timerEl.textContent = (left / 1000 | 0) + 's';
        if (left === 0) stopFacts();
    }, 200);
}

function stopFacts() {
    if (!state) return;
    clearInterval(timerId); timerId = null;
    const d = dbGet();
    d.train.facts.push({
        correct: state.correct,
        attempts: state.attempts,
        seconds: state.durationSec,
        level_end: state.level,
        ts: new Date().toISOString()
    });
    dbSet(d);
    state = null;
    btnStart.disabled = false;
    ansEl.disabled = true; btnSubmit.disabled = true;
    fbEl.textContent = 'Saved.';
    timerEl.textContent = '—';
}

function evaluate() {
    if (!state) return;
    const val = Number(ansEl.value);
    state.attempts++;
    const ok = (val === state.cur.ans);
    if (ok) { state.correct++; fbEl.textContent = '✓'; } else { fbEl.textContent = `✗ (${state.cur.ans})`; }

    // Adaptive step (rolling over last 12)
    state.level = updateDifficulty('arithmetic', ok);
    updateLevelChip(state.level);

    // next item — unlimited
    ansEl.value = '';
    state.cur = nextItem(state.level);
    qEl.textContent = `${state.cur.q} = ?`;
}

btnStart.onclick = startFacts;
btnSubmit.onclick = evaluate;
ansEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') evaluate(); });

ansEl.disabled = true; btnSubmit.disabled = true;
timerEl.textContent = '—';



/* ========= Assessment (Wizard) ========= */
const TARGETS = { quantity: 0.8, symbol_map: 0.85, place_value: 0.9, facts: 0.9, procedural: 0.85, estimation: 0.8 };
document.getElementById('assess-start').onclick = () => startAssessment();

function makePlan(assessment, sessionsBeforeRetest) {
    const weights = {}; let total = 0;
    for (const k of Object.keys(TARGETS)) { const acc = assessment.domains[k]?.acc || 0; const gap = Math.max(0, TARGETS[k] - acc); const w = 0.1 + gap * 2.0; weights[k] = +w.toFixed(3); total += w; }
    for (const k in weights) { weights[k] = +(weights[k] / total).toFixed(3); }
    return { created_at: new Date().toISOString(), sessionsBeforeRetest, weights, targets: TARGETS, sessionsCompleted: 0 };
}


// --- REPLACE the whole startAssessment() function with this version ---
async function startAssessment() {
    const mode = document.getElementById('assess-mode').value;
    const sessionsBeforeRetest = +document.getElementById('assess-sessions').value;
    WIZ.open(`Assessment — ${mode === 'baseline' ? 'Baseline' : 'Retest'}`);
    const stage = WIZ.body;

    // Single reusable panel
    const panel = document.createElement('div');
    panel.className = 'card';
    stage.appendChild(panel);
    const show = (html) => { panel.innerHTML = html; return panel; };

    // RNG
    const seed = Math.floor(Math.random() * 1e9);
    const rng = (a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296 })(seed);

    const out = { meta: { mode, seed, ts: new Date().toISOString() }, domains: {} };
    const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const median = arr => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

    // Quantity
    out.domains.quantity = await (async () => {
        let ok = 0; const lats = [];
        for (let i = 0; i < 10; i++) {
            const n = Math.floor(rng() * 6) + 1;
            const el = show(`<div><strong>Subitize</strong> — How many?</div>
                       <div class="dotgrid" id="g"></div>
                       <div class="row"><input id="ans" type="number" placeholder="How many?">
                       <button id="go">Enter</button></div>`);
            setupCompactAndNumpad(panel);
            const g = el.querySelector('#g');
            for (let k = 0; k < 25; k++) { const d = document.createElement('span'); d.className = 'dot'; g.appendChild(d); }
            const dots = [...g.children];
            const idxs = [...dots.keys()].sort(() => rng() - 0.5).slice(0, n);
            idxs.forEach(i => dots[i].style.visibility = 'visible');
            const t0 = performance.now(); await sleep(1000);
            idxs.forEach(i => dots[i].style.visibility = 'hidden');
            await new Promise(res => {
                el.querySelector('#go').onclick = () => {
                    const guess = +el.querySelector('#ans').value;
                    const lat = Math.round(performance.now() - t0);
                    lats.push(lat);
                    if (guess === n) ok++;
                    res();
                };
            });
        }
        return { acc: ok / 10, latency_ms: median(lats) };
    })();

    // Symbol mapping
    out.domains.symbol_map = await (async () => {
        let ok = 0;
        for (let i = 0; i < 10; i++) {
            const n = Math.floor(rng() * 9) + 1;
            const mode = rng() > 0.5 ? 'dots→num' : 'num→dots';
            if (mode === 'dots→num') {
                const el = show(`<div><strong>Symbol mapping</strong> — dots → number</div>
                         <div class="dotgrid" id="g"></div>
                         <div class="row"><input id="ans" type="number"><button id="go">Enter</button></div>`);
                setupCompactAndNumpad(panel);
                const g = el.querySelector('#g');
                for (let k = 0; k < 25; k++) { const d = document.createElement('span'); d.className = 'dot'; d.style.visibility = 'hidden'; g.appendChild(d); }
                const dots = [...g.children];
                const idxs = [...dots.keys()].sort(() => rng() - 0.5).slice(0, n);
                idxs.forEach(i => dots[i].style.visibility = 'visible');
                await new Promise(res => {
                    el.querySelector('#go').onclick = () => {
                        if (+el.querySelector('#ans').value === n) ok++;
                        res();
                    };
                });
            } else {
                const el = show(`<div><strong>Symbol mapping</strong> — show <b>${n}</b> dots (tap to toggle)</div>
                         <div class="dotgrid" id="g"></div>
                         <div class="row"><button id="go">Done</button></div>`);
                setupCompactAndNumpad(panel);
                const g = el.querySelector('#g');
                for (let k = 0; k < 25; k++) {
                    const d = document.createElement('span');
                    d.className = 'dot'; d.style.visibility = 'hidden';
                    d.onclick = () => { d.style.visibility = d.style.visibility === 'hidden' ? 'visible' : 'hidden'; };
                    g.appendChild(d);
                }
                await new Promise(res => {
                    el.querySelector('#go').onclick = () => {
                        const cnt = [...g.children].filter(d => d.style.visibility === 'visible').length;
                        if (cnt === n) ok++;
                        res();
                    };
                });
            }
        }
        return { acc: ok / 10 };
    })();

    // Place value
    out.domains.place_value = await (async () => {
        let ok = 0;
        for (let i = 0; i < 10; i++) {
            const x = Math.floor(100 + rng() * 9000);
            const which = ['ones', 'tens', 'hundreds', 'thousands'][Math.floor(rng() * 4)];
            const m = { ones: 1, tens: 10, hundreds: 100, thousands: 1000 }[which];
            const digit = Math.floor(x / m) % 10;
            const el = show(`In <strong>${x}</strong>, which digit is in the <strong>${which}</strong> place?
                       <div class="row"><input id="ans" type="number" style="width:100px">
                       <button id="go">Enter</button></div>`);
            setupCompactAndNumpad(panel);
            await new Promise(res => {
                el.querySelector('#go').onclick = () => {
                    if (+el.querySelector('#ans').value === digit) ok++;
                    res();
                };
            });
        }
        return { acc: ok / 10 };
    })();

    // Facts
    // Facts
    out.domains.facts = await (async () => {
        let corr = 0, att = 0;
        const el = show(`<div><strong>Facts</strong> — 60s mixed</div>
    <div class="row">
      <div id="q" style="font-size:1.6rem;min-width:140px">—</div>
      <input id="a" type="number"><button id="go">Enter</button>
      <div id="t" class="muted">60</div>
    </div>
    <div id="fb" class="muted"></div>`);
        setupCompactAndNumpad(panel);
        const q = el.querySelector('#q'),
            a = el.querySelector('#a'),
            t = el.querySelector('#t'),
            fb = el.querySelector('#fb');

        function newQ() {
            const lvl = currentLevel('arithmetic') || 3;
            const item = genArithmetic(ERNG, lvl);
            return { text: item.question, ans: item.answer };
        }

        const end = Date.now() + 60000;
        let cur = newQ();
        q.textContent = `${cur.text} = ?`;

        await new Promise(res => {
            let finished = false;
            const finish = () => {
                if (finished) return;
                finished = true;
                a.disabled = true;
                el.querySelector('#go').disabled = true;
                clearInterval(timer);
                res();
            };

            const timer = setInterval(() => {
                const left = Math.max(0, end - Date.now());
                t.textContent = (left / 1000 | 0);
                if (left === 0) finish();
            }, 200);

            el.querySelector('#go').onclick = () => {
                att++;
                const val = +a.value;
                const ans = cur.ans;
                fb.textContent = (val === ans) ? '✓' : `✗ (${ans})`;
                if (val === ans) corr++;
                a.value = '';
                cur = newQ();
                q.textContent = `${cur.text} = ?`;
                if (Date.now() >= end) finish();
            };
        });

        return { acc: att ? corr / att : 0, detail: { correct: corr, attempts: att, seconds: 60 } };
    })();


    // Procedural
    out.domains.procedural = await (async () => {
        let ok = 0, att = 0;
        for (let i = 0; i < 6; i++) {
            const lvl = Math.max(4, currentLevel('arithmetic') || 4); // push slightly more complex than facts
            const item = genArithmetic(ERNG, lvl);
            const el = show(`Compute: <strong>${item.question}</strong>
   <div class="row"><input id="ans" type="number" style="width:140px">
   <button id="go">Enter</button></div>`);
            setupCompactAndNumpad(panel);
            await new Promise(res => {
                el.querySelector('#go').onclick = () => {
                    att++;
                    if (+el.querySelector('#ans').value === Number(item.answer)) ok++;
                    res();
                };
            });

        }
        return { acc: ok / att, detail: { correct: ok, attempts: att } };
    })();

    // Estimation
    out.domains.estimation = await (async () => {
        let ok = 0;
        for (let i = 0; i < 10; i++) {
            const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
            const A = ri(20, 200), B = ri(5, 50);
            const op = rng() > 0.5 ? '×' : '+';
            const approx = op === '×' ? (Math.round(A / 10) * 10) * (Math.round(B / 10) * 10) : (Math.round(A / 10) * 10 + Math.round(B / 10) * 10);
            const exact = op === '×' ? (A * B) : (A + B);
            const b1 = Math.round(approx * 0.9), b2 = Math.round(approx * 1.1);
            const el = show(`Is <strong>${exact}</strong> closer to <strong>${b1}</strong> or <strong>${b2}</strong>?
                       <div class="row"><select id="pick"><option value="${b1}">${b1}</option><option value="${b2}">${b2}</option></select>
                       <button id="go">Choose</button></div>`);
            setupCompactAndNumpad(panel);
            await new Promise(res => {
                el.querySelector('#go').onclick = () => {
                    const pick = +el.querySelector('#pick').value;
                    const close = (Math.abs(exact - b1) < Math.abs(exact - b2)) ? b1 : b2;
                    if (pick === close) ok++;
                    res();
                };
            });
        }
        return { acc: ok / 10 };
    })();

    // Save + plan + report
    const d = dbGet(); d.assessment[mode] = out; d.plan = makePlan(out, sessionsBeforeRetest); dbSet(d);
    WIZ.hint.textContent = 'Saved. Close to view the report.';
    renderAssessReport(out, d.plan);
}





function renderAssessReport(a, plan) {
    const rep = document.getElementById('assess-report'); rep.style.display = 'block';
    function row(k, label) { const acc = Math.round((a.domains[k]?.acc || 0) * 100); const tgt = Math.round((plan.targets[k] || 0) * 100); const w = plan.weights[k]; const cls = acc >= tgt ? 'ok' : 'err'; return `<tr><td>${label}</td><td>${acc}%</td><td>${tgt}%</td><td class="${cls}">${w}</td></tr>`; }
    rep.innerHTML = `<h3>${a.meta.mode === 'baseline' ? 'Baseline' : 'Retest'} Results</h3>
  <div class="muted">Seed ${a.meta.seed} • ${a.meta.ts}</div>
  <table><thead><tr><th>Domain</th><th>Accuracy</th><th>Target</th><th>Weight</th></tr></thead>
  <tbody>
    ${row('quantity', 'Quantity (subitize)')}
    ${row('symbol_map', 'Symbol mapping')}
    ${row('place_value', 'Place value')}
    ${row('facts', 'Facts (mixed)')}
    ${row('procedural', 'Procedural')}
    ${row('estimation', 'Estimation')}
  </tbody></table>
  <div class="row" style="margin-top:8px"><span class="muted">Plan active →</span><button class="secondary" onclick="activate('coach')">Open Coach</button></div>`;
}

/* ========= Coach (Wizard) ========= */
document.getElementById('coach-start').onclick = () => startCoach();
function pickWeighted(w) { const e = Object.entries(w); let r = Math.random(), u = 0; for (const [k, v] of e) { u += v; if (r <= u) return k; } return e[e.length - 1][0]; }
function latestCog() { const d = dbGet(); const a = d.cog_runs || []; return a.length ? a[a.length - 1] : null; }
function adjustWeightsWithCognition(weights, cog) {
    if (!cog) return weights;
    const wmBad = (cog?.digit?.back_span || 0) < 4 || (cog?.corsi?.span || 0) < 4;
    const slow = (cog?.crt?.mean_ms || 0) > 700;
    const impulsive = (cog?.gng?.commission_rate || 0) > 0.15;
    const skipVar = (cog?.cpt?.cov || cog?.cpt?.rt_cov || 0) > 0.30 || (cog?.cpt?.omissions || 0) >= 8;
    const tweak = (k, f) => weights[k] = +(Math.max(0.02, (weights[k] * f)).toFixed(3));
    if (wmBad) { tweak('procedural', 0.8); tweak('facts', 0.85); tweak('estimation', 1.15); tweak('symbol_map', 1.1); }
    if (slow) { tweak('facts', 0.9); tweak('place_value', 1.1); }
    if (impulsive) { tweak('facts', 0.9); tweak('procedural', 0.95); tweak('quantity', 1.05); }
    if (skipVar) { tweak('estimation', 1.1); }
    const tot = Object.values(weights).reduce((s, v) => s + v, 0) || 1; for (const k in weights) { weights[k] = +(weights[k] / tot).toFixed(3); }
    return weights;
}


async function startCoach() {
    const d = dbGet(); if (!d.plan) { alert('Run an Assessment first.'); return; }
    const blocks = +document.getElementById('coach-blocks').value;
    const factsSec = +document.getElementById('coach-fact-secs').value;
    WIZ.open('Coach Session');

    // Single reusable panel
    const stage = WIZ.body;
    const panel = document.createElement('div');
    panel.className = 'card';
    stage.appendChild(panel);
    const show = (title, innerHTML) => { panel.innerHTML = `<strong>${title}</strong><div style="margin-top:8px">${innerHTML || ''}</div>`; return panel; };

    const weights = adjustWeightsWithCognition({ ...d.plan.weights }, latestCog());
    const log = { started: new Date().toISOString(), blocks: [], factsSec };
    const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

    async function doBlock(domain) {
        if (domain === 'quantity') {
            let ok = 0;
            for (let t = 0; t < 10; t++) {
                show('Subitize', `<div class="dotgrid" id="g"></div><div class="row"><input id="ans" type="number" placeholder="How many?"><button id="go">Enter</button></div>`);
                const g = panel.querySelector('#g'); for (let i = 0; i < 25; i++) { const d = document.createElement('span'); d.className = 'dot'; g.appendChild(d); }
                const n = randInt(1, 6); const dots = [...g.children]; const idx = [...dots.keys()].sort(() => Math.random() - 0.5).slice(0, n);
                idx.forEach(i => dots[i].style.visibility = 'visible'); await new Promise(r => setTimeout(r, 1000)); idx.forEach(i => dots[i].style.visibility = 'hidden');
                await new Promise(res => panel.querySelector('#go').onclick = () => { if (+panel.querySelector('#ans').value === n) ok++; res(); });
            }
            return { acc: ok / 10 };
        }

        if (domain === 'symbol_map') {
            let ok = 0;
            for (let i = 0; i < 10; i++) {
                const n = randInt(1, 9); const mode = Math.random() > 0.5 ? 'dots→num' : 'num→dots';
                if (mode === 'dots→num') {
                    show('Symbol Map', `<div class="dotgrid" id="g"></div><div class="row"><input id="ans" type="number"><button id="go">Enter</button></div>`);
                    const g = panel.querySelector('#g'); for (let k = 0; k < 25; k++) { const d = document.createElement('span'); d.className = 'dot'; g.appendChild(d); }
                    const dots = [...g.children]; const idx = [...dots.keys()].sort(() => Math.random() - 0.5).slice(0, n); idx.forEach(i => dots[i].style.visibility = 'visible');
                    await new Promise(res => panel.querySelector('#go').onclick = () => { if (+panel.querySelector('#ans').value === n) ok++; res(); });

                } else {
                    // num → dots (toggle)
                    show('Symbol Map', `
    <div>Show <b>${n}</b> dots (tap to toggle)</div>
    <div class="dotgrid" id="g"></div>
    <div class="row"><button id="go">Done</button><span id="fb" class="muted" style="margin-left:8px"></span></div>
  `);

                    const g = panel.querySelector('#g');
                    const fb = panel.querySelector('#fb');

                    // Build 25 clickable “cells” that are always visible.
                    // We toggle a CSS class instead of visibility.
                    for (let k = 0; k < 25; k++) {
                        const d = document.createElement('span');
                        d.className = 'dot toggle';     // <- new class
                        d.onclick = () => d.classList.toggle('on');
                        g.appendChild(d);
                    }

                    await new Promise(res => {
                        panel.querySelector('#go').onclick = () => {
                            const cnt = [...g.children].filter(d => d.classList.contains('on')).length;
                            if (cnt === n) { ok++; fb.textContent = '✓'; } else { fb.textContent = `✗ (${cnt})`; }
                            setTimeout(res, 400);
                        };
                    });
                }
            }
            return { acc: ok / 10 };
        }

        if (domain === 'place_value') {
            let ok = 0;
            for (let i = 0; i < 8; i++) {
                const x = randInt(100, 9999); const which = ['ones', 'tens', 'hundreds', 'thousands'][randInt(0, 3)];
                const m = { ones: 1, tens: 10, hundreds: 100, thousands: 1000 }[which]; const digit = Math.floor(x / m) % 10;
                show('Place Value', `In <strong>${x}</strong>, ${which} digit?
             <div class="row"><input id="ans" type="number" style="width:120px"><button id="go">Enter</button></div>`);
                await new Promise(res => panel.querySelector('#go').onclick = () => { if (+panel.querySelector('#ans').value === digit) ok++; res(); });
            }
            return { acc: ok / 8 };
        }

        if (domain === 'estimation') {
            let ok = 0;
            for (let i = 0; i < 8; i++) {
                const target = randInt(0, 100);
                show('Number Line (mental)', `Place ${target} on 0–100 (type a number)<div class="row"><input id="ans" type="number" style="width:120px"><button id="go">Enter</button></div>`);
                await new Promise(res => panel.querySelector('#go').onclick = () => { const val = +panel.querySelector('#ans').value; if (Math.abs(val - target) <= 5) ok++; res(); });
            }
            return { acc: ok / 8 };
        }

        if (domain === 'facts') {
            let correct = 0, attempts = 0;
            const end = Date.now() + factsSec * 1000;

            show('Facts (timed)', `
    <div class="row">
      <div id="q" style="font-size:1.6rem;min-width:160px">—</div>
      <input id="a" type="number"><button id="go">Enter</button>
      <div id="t" class="muted">—</div>
    </div>
    <div id="fb" class="muted"></div>`);

            const q = panel.querySelector('#q'),
                a = panel.querySelector('#a'),
                t = panel.querySelector('#t'),
                fb = panel.querySelector('#fb');

            const ops = ['+', '-', '×', '÷'];
            const ri = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;

            function newQ() {
                const op = ops[ri(0, 3)];
                let A = ri(0, 12), B = ri(0, 12);
                if (op === '-') { if (B > A) [A, B] = [B, A]; }
                if (op === '÷') { B = ri(1, 12); A = B * ri(0, 12); }
                return { text: `${A} ${op} ${B}`, ans: op === '+' ? A + B : op === '-' ? A - B : op === '×' ? A * B : (B ? A / B : 0) };
            }

            let cur = newQ(); q.textContent = `${cur.text} = ?`;

            await new Promise(res => {
                let finished = false;
                const finish = () => {
                    if (finished) return;
                    finished = true;
                    a.disabled = true;
                    panel.querySelector('#go').disabled = true;
                    clearInterval(timer);
                    res();
                };

                const timer = setInterval(() => {
                    const left = Math.max(0, end - Date.now());
                    t.textContent = (left / 1000 | 0) + 's';
                    if (left === 0) finish();
                }, 200);

                panel.querySelector('#go').onclick = () => {
                    attempts++;
                    const val = +a.value;
                    const ans = cur.ans;
                    fb.textContent = (val === ans) ? '✓' : `✗ (${ans})`;
                    if (val === ans) correct++;
                    a.value = '';
                    cur = newQ();
                    q.textContent = `${cur.text} = ?`;
                    if (Date.now() >= end) finish();
                };
            });

            return { acc: attempts ? correct / attempts : 0 };
        }

    }

    function pickWeighted(w) { const e = Object.entries(w); let r = Math.random(), u = 0; for (const [k, v] of e) { u += v; if (r <= u) return k; } return e[e.length - 1][0]; }

    for (let i = 0; i < blocks; i++) {
        const domain = pickWeighted(weights);
        const res = await doBlock(domain);
        log.blocks.push({ domain, res });
    }

    // Save + micro reweight
    const dd = dbGet(); dd.plan.sessionsCompleted = (dd.plan.sessionsCompleted || 0) + 1; dd.plan.lastLog = log;
    for (const b of log.blocks) {
        const a = typeof b.res.acc === 'number' ? b.res.acc : null;
        if (a != null) {
            if (a >= 0.9) dd.plan.weights[b.domain] = Math.max(0.02, +(dd.plan.weights[b.domain] * 0.9).toFixed(3));
            if (a < 0.7) dd.plan.weights[b.domain] = +(dd.plan.weights[b.domain] * 1.1).toFixed(3);
        }
    }
    const tot = Object.values(dd.plan.weights).reduce((s, v) => s + v, 0) || 1;
    for (const k in dd.plan.weights) { dd.plan.weights[k] = +(dd.plan.weights[k] / tot).toFixed(3); }
    dbSet(dd);

    WIZ.hint.textContent = (dd.plan.sessionsCompleted % (dd.plan.sessionsBeforeRetest || 15) === 0)
        ? 'Session saved. Time to Retest in Assessment tab.'
        : 'Session saved.';
}



/* ========= Cognition (Wizard) ========= */
document.getElementById('cog-run').onclick = () => startCognition();
document.getElementById('cog-export').onclick = () => { const d = dbGet(); const last = d.cog_runs[d.cog_runs.length - 1]; if (!last) { alert('No cognition run yet.'); return; } const blob = new Blob([JSON.stringify(last, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'cognition_run.json'; a.click(); };



async function startCognition() {
    WIZ.open('Cognition Battery');

    // Single reusable panel
    const stage = WIZ.body;
    const panel = document.createElement('div');
    panel.className = 'card';
    stage.appendChild(panel);
    const show = (title, innerHTML) => { panel.innerHTML = `<strong>${title}</strong><div style="margin-top:8px">${innerHTML || ''}</div>`; return panel; };

    // Utils
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
    const statRT = (arr) => {
        const mean = arr.reduce((s, v) => s + v, 0) / Math.max(arr.length, 1);
        const sd = Math.sqrt(arr.reduce((s, v) => s + (v - mean) * (v - mean), 0) / Math.max(arr.length, 1));
        return { mean_ms: Math.round(mean || 0), cov: +((sd / Math.max(mean, 1)) || 0).toFixed(2) };
    };

    const run = { ts: new Date().toISOString() };

    // Digit Span (Forward / Backward)
    run.digit = await (async () => {
        const SHOW_MS_PER_DIGIT = 800;   // how long each digit shows (ms)
        const GAP_MS = 250;              // small gap between flashes

        async function showThenPrompt(len, reverse = false) {
            // 1) Study phase: flash digits one-by-one
            const seq = [...Array(len)].map(() => randInt(0, 9));
            for (let i = 0; i < len; i++) {
                const s = seq.slice(0, i + 1).join('');
                show(`Digit Span — ${reverse ? 'Backward' : 'Forward'}`, `
        <div class="muted">Memorize.</div>
        <div style="font-size:1.8rem;margin:10px 0;text-align:center;letter-spacing:2px">${s}</div>
      `);
                await sleep(SHOW_MS_PER_DIGIT);
                // brief blank between flashes
                show(`Digit Span — ${reverse ? 'Backward' : 'Forward'}`, `
        <div class="muted">Memorize.</div>
        <div style="font-size:1.8rem;margin:10px 0;text-align:center;letter-spacing:2px">​</div>
      `);
                await sleep(GAP_MS);
            }

            // 2) Recall phase: number is hidden; user types
            show(`Digit Span — ${reverse ? 'Backward' : 'Forward'}`, `
      <div class="muted">${reverse ? 'Type the digits in reverse.' : 'Type the digits exactly.'}</div>
      <div class="row"><input id="ans" autocomplete="off" inputmode="numeric" />
      <button id="go">Enter</button></div>
    `);

            const expected = reverse ? [...seq].reverse().join('') : seq.join('');
            let correct = false;
            await new Promise(res => {
                const btn = panel.querySelector('#go');
                const inp = panel.querySelector('#ans');
                btn.onclick = () => { correct = (inp.value.trim() === expected); res(); };
                inp.focus();
            });
            return correct;
        }

        let f = 0, b = 0;

        // Forward: increase until first miss
        for (let len = 3; len <= 9; len++) {
            const ok = await showThenPrompt(len, false);
            if (ok) f = len; else break;
        }

        // Backward: increase until first miss
        for (let len = 2; len <= 8; len++) {
            const ok = await showThenPrompt(len, true);
            if (ok) b = len; else break;
        }

        show('Digit Span — Done', `Forward ${f}, Backward ${b}`);
        await sleep(300);
        return { fwd_span: f, back_span: b };
    })();


    // Corsi (spatial span)
    run.corsi = await (async () => {
        const grid = `<div class="grid9" id="g"></div>`;
        show('Corsi (tap the flashing sequence in order)', grid);
        const g = panel.querySelector('#g'); const cells = [];
        for (let i = 0; i < 9; i++) { const d = document.createElement('div'); d.className = 'corsi'; g.appendChild(d); cells.push(d); }
        let span = 0;
        for (let len = 2; len <= 8; len++) {
            const seq = []; for (let i = 0; i < len; i++) seq.push(randInt(0, 8));
            for (const idx of seq) { cells[idx].classList.add('flash'); await sleep(500); cells[idx].classList.remove('flash'); await sleep(250); }
            show('Corsi', grid); // re-render tap grid fresh for input
            const g2 = panel.querySelector('#g'); const taps = []; for (let i = 0; i < 9; i++) {
                const d = document.createElement('div'); d.className = 'corsi'; g2.appendChild(d);
                d.onclick = () => { taps.push(i); if (taps.length === len) { /*noop*/ } };
            }
            await new Promise(res => {
                const chk = () => { if (taps.length === len) { g2.querySelectorAll('.corsi').forEach(c => c.onclick = null); res(); } else setTimeout(chk, 50); };
                chk();
            });
            if (taps.every((v, i) => v === seq[i])) span = len; else break;
            show('Corsi', `<div class="muted">Good. Next length…</div>`); await sleep(300);
        }
        show('Corsi — Done', `Span ${span}`); await sleep(300);
        return { span };
    })();

    // Simple Reaction Time (SRT) — 40 trials
    run.srt = await (async () => {
        const rts = []; show('SRT', `<div class="muted">Click the dot when it appears. 40 trials.</div>
      <div class="numline" style="height:120px"><div id="dot" style="position:absolute;width:24px;height:24px;border-radius:50%;background:var(--accent);left:calc(50% - 12px);top:48px;display:none"></div></div>`);
        const dot = panel.querySelector('#dot');
        for (let i = 0; i < 40; i++) { dot.style.display = 'none'; await sleep(randInt(600, 1500)); dot.style.display = 'block'; const t0 = performance.now(); await new Promise(r => dot.onclick = () => r()); rts.push(Math.round(performance.now() - t0)); await sleep(150); }
        const stats = statRT(rts); show('SRT — Done', `${stats.mean_ms} ms (CoV ${stats.cov})`); await sleep(300);
        return stats;
    })();

    // Choice Reaction Time (CRT) — 40 trials
    run.crt = await (async () => {
        const rts = []; let errs = 0;
        show('CRT', `<div class="muted">Click LEFT or RIGHT matching the dot position.</div>
      <div class="row"><button id="L">LEFT</button><button id="R">RIGHT</button></div>
      <div class="numline" style="height:120px"><div id="cue" style="position:absolute;width:24px;height:24px;border-radius:50%;background:var(--accent);display:none"></div></div>`);
        const cue = panel.querySelector('#cue'), L = panel.querySelector('#L'), R = panel.querySelector('#R');
        for (let i = 0; i < 40; i++) {
            const side = Math.random() > 0.5 ? 'L' : 'R'; cue.style.display = 'none'; await sleep(randInt(600, 1400));
            cue.style.top = '48px'; cue.style.left = side === 'L' ? '30%' : '70%'; cue.style.display = 'block';
            const t0 = performance.now(); const got = await new Promise(res => { const hL = () => { L.onclick = null; R.onclick = null; res('L') }; const hR = () => { L.onclick = null; R.onclick = null; res('R') }; L.onclick = hL; R.onclick = hR; });
            const rt = Math.round(performance.now() - t0); rts.push(rt); if (got !== side) errs++; await sleep(120);
        }
        const stats = statRT(rts); stats.errors = errs;
        show('CRT — Done', `${stats.mean_ms} ms (CoV ${stats.cov}) • errors ${errs}`); await sleep(300);
        return stats;
    })();

    // CPT — 5 minutes (click on letters except X)
    run.cpt = await (async () => {
        const letters = 'ABCDEFGHJKLMNPQRSTUVWY'; const end = Date.now() + 5 * 60 * 1000; const rts = []; let omissions = 0, commissions = 0;
        show('CPT (5 min)', `<div class="muted">Click when a letter appears (ignore X).</div>
      <div id="L" style="text-align:center;font-size:42px">+</div>`);
        const el = panel.querySelector('#L');
        while (Date.now() < end) {
            const isi = randInt(900, 1300); el.textContent = '+'; await sleep(isi);
            const showL = Math.random() < 0.1 ? 'X' : letters[randInt(0, letters.length - 1)];
            el.textContent = showL; const t0 = performance.now(); let clicked = false;
            await new Promise(res => { el.onclick = () => { clicked = true; res(); }; setTimeout(res, 600); }); el.onclick = null;
            if (showL === 'X') { if (clicked) { commissions++; } }
            else { if (!clicked) { omissions++; } else { rts.push(Math.round(performance.now() - t0)); } }
        }
        const { mean_ms, cov } = statRT(rts); const out = { omissions, commissions, rt_cov: cov };
        show('CPT — Done', `omissions ${omissions} • commissions ${commissions} • CoV ${cov}`); await sleep(300);
        return out;
    })();

    // Go/No-Go — 2 minutes
    run.gng = await (async () => {
        const end = Date.now() + 2 * 60 * 1000; let commission = 0, totalNo = 0;
        show('Go/No-Go (2 min)', `<div class="muted">Click for GO (green). Do NOT click for NO-GO (red).</div>
      <div style="text-align:center"><div id="stim" style="display:inline-block;width:80px;height:80px;border-radius:16px;background:#ccc"></div></div>`);
        const s = panel.querySelector('#stim');
        while (Date.now() < end) {
            await sleep(randInt(500, 800));
            const isNo = Math.random() < 0.25;
            s.style.background = isNo ? '#e26a6a' : '#54c081';
            let clicked = false; s.onclick = () => { clicked = true };
            await sleep(500);
            if (isNo) { totalNo++; if (clicked) commission++; }
            s.style.background = '#ccc'; s.onclick = null;
        }
        const result = { commission_rate: totalNo ? +(commission / totalNo).toFixed(2) : 0 };
        show('Go/No-Go — Done', `commission rate ${Math.round(result.commission_rate * 100)}%`); await sleep(300);
        return result;
    })();

    // Paired-Associate Learning (Immediate + schedule Delayed)
    run.pal = await (async () => {
        const pairs = [];
        const words1 = ['river', 'glass', 'paper', 'storm', 'garden', 'engine', 'silver', 'planet', 'forest', 'mirror', 'candle', 'harbor'];
        const words2 = ['stone', 'window', 'shell', 'cloud', 'path', 'bridge', 'ring', 'orbit', 'leaf', 'image', 'flame', 'anchor'];
        for (let i = 0; i < 12; i++) pairs.push([words1[i], words2[(i + randInt(0, 11)) % 12]]);
        let known = 0;
        for (let round = 1; round <= 2; round++) {
            show('PAL — Study', `<div class="muted">Memorize the pairs. Round ${round}/2</div>`);
            for (const [a, b] of pairs) { show('PAL — Study', `<div style="font-size:1.4rem">${a} — ${b}</div>`); await sleep(550); }
            for (const [a, b] of pairs) {
                show('PAL — Recall', `<div>Recall the pair:</div><div style="font-size:1.2rem;margin:6px 0">${a} — ?</div>
          <div class="row"><input id="ans" autocomplete="off"><button id="go">Enter</button></div>`);
                await new Promise(res => panel.querySelector('#go').onclick = () => { const g = (panel.querySelector('#ans').value || '').trim().toLowerCase(); if (g === b) known++; res(); });
            }
        }
        const immediate_acc = +((known / 24) || 0).toFixed(2);
        const dueAt = new Date(Date.now() + 25 * 60 * 1000).toISOString();
        const d = dbGet(); d.pal_pending = { pairs, dueAt }; dbSet(d);
        show('PAL — Immediate Done', `${Math.round(immediate_acc * 100)}% • delayed due ${dueAt}`);
        await sleep(300);
        return { immediate_acc, delayed_due_at: dueAt, delayed_acc: null, recognition_acc: null };
    })();

    // Save and report
    const d = dbGet(); d.cog_runs.push(run); dbSet(d);
    WIZ.hint.textContent = 'Saved. Close to view the report below.';
    renderCognitionReport(run);
}

/* ========= Compact + Persistent Numpad Helpers ========= */

/**
 * Mounts a persistent on-screen numeric keypad inside the current wizard panel,
 * wires it to the provided input, and triggers #go on Enter.
 *
 * It reuses the same keypad element across renders of the same panel.
 */
function attachNumpadTo(panel, input, onEnter) {
    if (!panel || !input) return;

    // Make sure the browser uses numeric keypad if it shows one
    input.setAttribute('inputmode', 'numeric');
    input.setAttribute('pattern', '[0-9]*');

    // Find or create the keypad container in this panel
    let pad = panel.querySelector('.wiz-numpad');
    if (!pad) {
        pad = document.createElement('div');
        pad.className = 'wiz-numpad';
        pad.innerHTML = `
      <div class="wiz-numpad-grid">
        <button data-k="1">1</button>
        <button data-k="2">2</button>
        <button data-k="3">3</button>
        <button data-k="4">4</button>
        <button data-k="5">5</button>
        <button data-k="6">6</button>
        <button data-k="7">7</button>
        <button data-k="8">8</button>
        <button data-k="9">9</button>
        <button data-k="C" class="wide">Clear</button>
        <button data-k="0">0</button>
        <button data-k="B">⌫</button>
        <button data-k="E" class="wide">Enter</button>
      </div>
    `;
        // Put it at the end of the body area so it stays visible and sticky
        const body = document.getElementById('wiz-body') || panel.parentElement || panel;
        body.appendChild(pad);

        // Delegate clicks
        pad.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-k]');
            if (!btn) return;
            const key = btn.getAttribute('data-k');

            // Always keep focus on the current input
            if (document.activeElement !== input) input.focus();

            if (key === 'C') {
                input.value = '';
            } else if (key === 'B') {
                input.value = String(input.value || '').slice(0, -1);
            } else if (key === 'E') {
                // Trigger the provided Enter handler (usually clicks #go)
                if (typeof onEnter === 'function') onEnter();
            } else {
                // digits
                input.value = (input.value || '') + key;
            }
        });
    }

    // Keep focus glued to the input so the system keyboard (if it appears) doesn't fight us.
    // (Our pad works even if the system keyboard is hidden.)
    setTimeout(() => input.focus(), 0);
}

/**
 * One-liner to call after you (re)render each wizard screen.
 * - Adds compact class on small screens
 * - Finds the numeric input in the panel
 * - Attaches persistent keypad
 * - Wires Enter to #go
 * - Re-focuses the input after submissions
 */
function setupCompactAndNumpad(panel) {
    if (!panel) return;

    // Compact mode on phones
    if (window.matchMedia('(max-width: 520px)').matches) {
        panel.classList.add('compact');
    }

    // Find the primary numeric answer input on this screen
    const input =
        panel.querySelector('input#ans, input#a, .row input[type="number"], .row input[inputmode="numeric"]');

    // Find the 'Enter/Next' button if present
    const goBtn = panel.querySelector('#go');

    if (input) {
        attachNumpadTo(panel, input, () => {
            if (goBtn && !goBtn.disabled) {
                goBtn.click();
            } else {
                // Fallback: submit the nearest form or trigger Enter keyup
                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            }
            // After submit, the panel usually re-renders; if not, keep focus
            setTimeout(() => input.focus(), 0);
        });

        // Also submit on physical Enter
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && goBtn && !goBtn.disabled) {
                e.preventDefault();
                goBtn.click();
                setTimeout(() => input.focus(), 0);
            }
        }, { once: false });

        // Ensure mobile OS doesn’t zoom because of small font
        input.style.fontSize = '16px';
    }
}



function renderCognitionReport(run) {
    const rep = document.getElementById('cog-report'); rep.style.display = 'block';
    rep.innerHTML = `<h3>Cognition Results</h3>
    <table>
      <tr><td>Digit Span</td><td>Fwd ${run.digit.fwd_span} • Back ${run.digit.back_span}</td></tr>
      <tr><td>Corsi</td><td>Span ${run.corsi.span}</td></tr>
      <tr><td>SRT</td><td>${run.srt.mean_ms} ms (CoV ${run.srt.cov})</td></tr>
      <tr><td>CRT</td><td>${run.crt.mean_ms} ms (CoV ${run.crt.cov}) • errors ${run.crt.errors || 0}</td></tr>
      <tr><td>CPT</td><td>omissions ${run.cpt.omissions} • commissions ${run.cpt.commissions} • CoV ${run.cpt.rt_cov || run.cpt.cov}</td></tr>
      <tr><td>Go/No-Go</td><td>commission rate ${Math.round((run.gng.commission_rate || 0) * 100)}%</td></tr>
      <tr><td>PAL (Immediate)</td><td>${Math.round((run.pal.immediate_acc || 0) * 100)}% • delayed due ${run.pal.delayed_due_at}</td></tr>
    </table>`;
}

/* ========= Progress ========= */
function refreshPeek() { document.getElementById('peek').textContent = JSON.stringify(dbGet(), null, 2); }
document.getElementById('export-csv').onclick = () => {
    const d = dbGet(); const rows = [];
    const pushRow = (type, obj) => rows.push([type, obj.ts || '', JSON.stringify(obj)]);
    d.train.subitize.forEach(r => pushRow('subitize', r));
    d.train.numline.forEach(r => pushRow('numline', r));
    d.train.facts.forEach(r => pushRow('facts', r));
    Object.keys(d.assessment || {}).forEach(k => rows.push(['assessment_' + k, d.assessment[k].meta.ts, JSON.stringify(d.assessment[k])]));
    (d.cog_runs || []).forEach(r => rows.push(['cognition', r.ts, JSON.stringify(r)]));
    const csv = ['type,ts,data', ...rows.map(r => r.map(x => `"${String(x).replaceAll('"', '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'number-sense-data.csv'; a.click();
};
document.getElementById('export-json').onclick = () => { const blob = new Blob([JSON.stringify(dbGet(), null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'number-sense-data.json'; a.click(); };
document.getElementById('reset-all').onclick = () => { if (confirm('Reset ALL data?')) { localStorage.removeItem(KEY); refreshPeek(); alert('Data cleared.'); } };

/* ========= Delayed PAL on load ========= */
window.addEventListener('load', () => {
    installEnterToClick();
    const d = dbGet(); const due = d.pal_pending?.dueAt ? new Date(d.pal_pending.dueAt).getTime() : null;
    if (due && Date.now() >= due) {
        if (confirm('It is time to run PAL Delayed Recall/Recognition. Do it now?')) {
            const pairs = d.pal_pending.pairs; let correct = 0;
            for (const [a, b] of pairs) { const g = (prompt(`Delayed: ${a} — ?`, '') || '').trim().toLowerCase(); if (g === b) correct++; }
            const delayed_acc = +(correct / pairs.length).toFixed(2);
            let recog = 0;
            for (const [a, b] of pairs) {
                const foils = ['road', 'paint', 'blade', 'field', 'rope', 'valley', 'clock', 'river', 'star', 'steam', 'metal', 'wheel'];
                const opts = [b, foils[randInt(0, foils.length - 1)], foils[randInt(0, foils.length - 1)], foils[randInt(0, foils.length - 1)]].sort(() => Math.random() - 0.5);
                const g = (prompt(`Recognition: ${a} — [${opts.join(', ')}]`, '') || '').trim().toLowerCase();
                if (g === b) recog++;
            }
            const recognition_acc = +(recog / pairs.length).toFixed(2);
            const runs = d.cog_runs; if (runs && runs.length) { runs[runs.length - 1].pal.delayed_acc = delayed_acc; runs[runs.length - 1].pal.recognition_acc = recognition_acc; }
            d.pal_pending = null; dbSet(d);
            alert(`Saved: Delayed ${Math.round(delayed_acc * 100)}% • Recognition ${Math.round(recognition_acc * 100)}%`);
            activate('cognition');
            renderCognitionReport(d.cog_runs[d.cog_runs.length - 1]);
        }
    }
});

/* ===== Progress Chart (Facts/Subitize/Numline + Assessments) ===== */
let _progChart = null;

function computeDailyAccBooleans(recs, okField = 'correct', dayKey = 'ts') {
    // group by YYYY-MM-DD; compute mean of booleans
    const bucket = new Map();
    for (const r of recs) {
        if (!r[dayKey]) continue;
        const d = new Date(r[dayKey]); if (isNaN(d)) continue;
        const key = d.toISOString().slice(0, 10);
        const ok = r[okField] ? 1 : 0;
        const arr = bucket.get(key) || [];
        arr.push(ok);
        bucket.set(key, arr);
    }
    return [...bucket.entries()].sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, arr]) => ({ x: key, y: arr.reduce((s, v) => s + v, 0) / arr.length }));
}

function computeDailyFactsAcc(recs) {
    const bucket = new Map(); // key -> {correct, attempts}
    for (const r of recs) {
        if (!r.ts) continue;
        const k = new Date(r.ts).toISOString().slice(0, 10);
        const agg = bucket.get(k) || { c: 0, a: 0 };
        agg.c += (r.correct || 0); agg.a += (r.attempts || 0);
        bucket.set(k, agg);
    }
    return [...bucket.entries()].sort((a, b) => a[0].localeCompare(b[0]))
        .map(([x, v]) => ({ x, y: v.a ? v.c / v.a : 0 }));
}

function computeDailyNumlineAcc(recs) {
    // Treat "success" as within 1 unit for integer ranges, or ≤0.02 for 0–1
    const bucket = new Map();
    for (const r of recs) {
        if (!r.ts) continue;
        const tol = (r.range === '0-1') ? 0.02 : 1;
        const ok = (Math.abs(r.error || Infinity) <= tol) ? 1 : 0;
        const k = new Date(r.ts).toISOString().slice(0, 10);
        const arr = bucket.get(k) || [];
        arr.push(ok);
        bucket.set(k, arr);
    }
    return [...bucket.entries()].sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, arr]) => ({ x: key, y: arr.reduce((s, v) => s + v, 0) / arr.length }));
}

function collectAssessmentDomainSeries(assess) {
    // Build per-domain sparse time series from Assessment results
    const points = {}; // domain -> [{x,y}]
    for (const mode of Object.keys(assess || {})) {
        const run = assess[mode];
        const when = run?.meta?.ts ? new Date(run.meta.ts).toISOString().slice(0, 10) : null;
        if (!when) continue;
        for (const [dom, val] of Object.entries(run.domains || {})) {
            const y = typeof val?.acc === 'number' ? val.acc : null;
            if (y == null) continue;
            (points[dom] ||= []).push({ x: when, y });
        }
    }
    // sort each by date
    for (const k of Object.keys(points)) points[k].sort((a, b) => a.x.localeCompare(b.x));
    return points;
}

function renderProgressChart() {
    const ctx = document.getElementById('progChart');
    if (!ctx || !window.Chart) return;

    const d = dbGet();

    // TRAIN series
    const subitizeSeries = computeDailyAccBooleans(d.train?.subitize || []);
    const factsSeries = computeDailyFactsAcc(d.train?.facts || []);
    const numlineSeries = computeDailyNumlineAcc(d.train?.numline || []);

    // ASSESSMENT domain snapshots
    const assessPoints = collectAssessmentDomainSeries(d.assessment || {}); // {domain: [{x,y}]}

    // datasets
    const datasets = [
        { label: 'Train: Subitize', data: subitizeSeries, tension: 0.25, borderWidth: 2 },
        { label: 'Train: Facts', data: factsSeries, tension: 0.25, borderWidth: 2 },
        { label: 'Train: Numline', data: numlineSeries, tension: 0.25, borderWidth: 2 }
    ];

    // include assessment domains (sparse points; show as dotted line + points)
    for (const [dom, data] of Object.entries(assessPoints)) {
        datasets.push({
            label: `Assess: ${dom}`,
            data,
            tension: 0.25,
            borderWidth: 2,
            borderDash: [4, 4],
            pointRadius: 3
        });
    }

    // (re)create chart
    if (_progChart) { _progChart.destroy(); _progChart = null; }

    _progChart = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            parsing: false,
            animation: false,
            scales: {
                x: { type: 'time', time: { unit: 'day' }, grid: { display: false } },
                y: { min: 0, max: 1, ticks: { callback: v => Math.round(v * 100) + '%' } }
            },
            plugins: {
                legend: { position: 'bottom' },
                tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${Math.round(c.parsed.y * 100)}%` } }
            }
        }
    });
}

// also re-render whenever you open the Progress tab
const _oldActivate = activate;
activate = function (id) { _oldActivate(id); if (id === 'progress') { refreshPeek(); renderProgressChart(); } };

