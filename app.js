// ==========================================
//  SISSY GAMES — COMPLETE APP v3
//  Con 11 giochi + 3 sessioni BM
// ==========================================

// ============ DATA MANAGEMENT ============
const DB = {
    get(key, def = null) {
        try { const v = localStorage.getItem('sg_' + key); return v ? JSON.parse(v) : def; }
        catch { return def; }
    },
    set(key, val) { localStorage.setItem('sg_' + key, JSON.stringify(val)); },
};

// ============ PROFILE ============
let profile = DB.get('profile', {
    name: '', xp: 0, level: 1, gamesPlayed: 0, sessionsCompleted: 0,
    streak: 0, bestStreak: 0, lastVisit: null, totalTime: 0,
    dna: { devotion: 0, femininity: 0, obedience: 0, submission: 0, addiction: 0 },
    achievements: [], checkinToday: null, diary: []
});

function saveProfile() {
    const input = document.getElementById('sissy-name-input');
    if (input && input.value.trim()) profile.name = input.value.trim();
    DB.set('profile', profile);
    updateAllUI();
}

function addXP(amount, source) {
    profile.xp += amount;
    profile.level = Math.floor(profile.xp / 200) + 1;
    DB.set('profile', profile);
    showToast(`+${amount} XP — ${source} 💕`);
    updateAllUI();
    checkAchievements();
}

function addDNA(stat, amount) {
    if (profile.dna[stat] !== undefined) {
        profile.dna[stat] = Math.min(100, profile.dna[stat] + amount);
        DB.set('profile', profile);
    }
}

function updateStreak() {
    const today = new Date().toDateString();
    if (profile.lastVisit !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        profile.streak = (profile.lastVisit === yesterday) ? profile.streak + 1 : 1;
        profile.lastVisit = today;
        if (profile.streak > profile.bestStreak) profile.bestStreak = profile.streak;
        DB.set('profile', profile);
    }
}

// ============ ACHIEVEMENTS ============
const ACHIEVEMENTS = [
    { id: 'first_game', name: '🎮 Prima Partita', desc: 'Gioca il tuo primo gioco', check: () => profile.gamesPlayed >= 1 },
    { id: 'ten_games', name: '🔟 Dieci Giochi', desc: 'Gioca 10 partite', check: () => profile.gamesPlayed >= 10 },
    { id: 'streak_7', name: '🔥 7 Giorni', desc: 'Streak di 7 giorni', check: () => profile.bestStreak >= 7 },
    { id: 'level_5', name: '⭐ Livello 5', desc: 'Raggiungi il livello 5', check: () => profile.level >= 5 },
    { id: 'level_10', name: '👑 Livello 10', desc: 'Raggiungi il livello 10', check: () => profile.level >= 10 },
    { id: 'first_session', name: '🧠 Prima Sessione', desc: 'Completa una sessione BM', check: () => profile.sessionsCompleted >= 1 },
    { id: 'devoted', name: '💋 Devota', desc: 'Devotion a 50+', check: () => profile.dna.devotion >= 50 },
    { id: 'xp1000', name: '✨ 1000 XP', desc: 'Accumula 1000 XP', check: () => profile.xp >= 1000 },
    { id: 'quiz_master', name: '🧠 Quiz Master', desc: 'Completa 5 quiz', check: () => (DB.get('quizCount', 0)) >= 5 },
    { id: 'confessor', name: '💋 Confessore', desc: 'Completa 3 confessioni', check: () => (DB.get('confCount', 0)) >= 3 },
];

function checkAchievements() {
    ACHIEVEMENTS.forEach(a => {
        if (!profile.achievements.includes(a.id) && a.check()) {
            profile.achievements.push(a.id);
            DB.set('profile', profile);
            showToast('🏆 Achievement: ' + a.name);
        }
    });
}

// ============ UI ============
function updateAllUI() {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('hero-name', profile.name || 'Sissy');
    set('home-streak', profile.streak);
    set('home-xp', profile.xp);
    set('home-level', profile.level);
    set('home-games', profile.gamesPlayed);
    set('profile-name', profile.name || 'Sissy');
    set('stat-xp', profile.xp);
    set('stat-level', profile.level);
    set('stat-games', profile.gamesPlayed);
    set('stat-sessions', profile.sessionsCompleted);
    set('stat-streak', profile.streak);
    set('stat-best-streak', profile.bestStreak);
    set('stat-time', Math.floor(profile.totalTime / 60) + ' min');

    const titles = ['Curious', 'Awakening', 'Becoming', 'Embracing', 'Devoted', 'Addicted', 'Owned', 'Complete'];
    set('profile-title', titles[Math.min(Math.floor(profile.level / 3), titles.length - 1)]);

    Object.keys(profile.dna).forEach(key => {
        const bar = document.getElementById('bar-' + key);
        const val = document.getElementById('val-' + key);
        if (bar) bar.style.width = profile.dna[key] + '%';
        if (val) val.textContent = Math.floor(profile.dna[key]);
    });

    const setup = document.getElementById('profile-setup');
    const view = document.getElementById('profile-view');
    if (setup && view) {
        setup.style.display = profile.name ? 'none' : 'block';
        view.style.display = profile.name ? 'block' : 'none';
    }

    const achList = document.getElementById('achievements-list');
    if (achList) {
        achList.innerHTML = ACHIEVEMENTS.map(a => {
            const unlocked = profile.achievements.includes(a.id);
            return '<div class="achievement-badge ' + (unlocked ? '' : 'locked') + '">' + a.name + '</div>';
        }).join('');
    }

    const today = new Date().toDateString();
    if (profile.checkinToday === today) {
        const cf = document.getElementById('checkin-form');
        const cd = document.getElementById('checkin-done');
        if (cf) cf.style.display = 'none';
        if (cd) cd.style.display = 'block';
    }
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById('page-' + id);
    if (page) page.classList.add('active');
    window.scrollTo(0, 0);
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ============ CHECKIN ============
let checkinMood = null, checkinWear = null;
function selectMood(el, mood) { el.parentElement.querySelectorAll('.emoji-opt').forEach(e => e.classList.remove('selected')); el.classList.add('selected'); checkinMood = mood; }
function selectWear(el, wear) { el.parentElement.querySelectorAll('.emoji-opt').forEach(e => e.classList.remove('selected')); el.classList.add('selected'); checkinWear = wear; }
function submitCheckin() {
    if (!checkinMood || !checkinWear) { showToast('Seleziona tutte le risposte! 😘'); return; }
    profile.checkinToday = new Date().toDateString();
    addXP(50, 'Check-in');
    addDNA('femininity', checkinWear === 'yes' ? 3 : 1);
    addDNA('addiction', 1);
    DB.set('profile', profile);
    document.getElementById('checkin-form').style.display = 'none';
    document.getElementById('checkin-done').style.display = 'block';
}

// ============ GAME 1: COCK MEMORY ============
let memoryState = {};
const MEMORY_SYMBOLS = ['🍆','🍌','🌶️','🥒','🍄','🌭','🏛️','🗼','🚀','💄','👠','💎','🔑','🕯️','👅','💋','🍑','🍒','👑','⛓️','🎀','💕','🖤','🔥','💦','🫦','🩱','🧴','💜','🎭','🪭','🛁'];

function startMemory(size) {
    document.getElementById('memory-difficulty').style.display = 'none';
    document.getElementById('memory-result').style.display = 'none';
    const pairs = (size * size) / 2;
    let symbols = [...MEMORY_SYMBOLS].sort(() => Math.random() - 0.5).slice(0, pairs);
    let cards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
    memoryState = { cards, flipped: [], matched: 0, total: pairs, moves: 0, timer: 0, interval: null, locked: false, size };
    const board = document.getElementById('memory-board');
    board.style.gridTemplateColumns = `repeat(\${size}, 1fr)`;
    board.style.display = 'grid';
    board.innerHTML = cards.map((s, i) => `<div class="memory-card" onclick="flipCard(${i})" id="mc-${i}"><span class="card-back">💋</span><span class="card-front">${s}</span></div>`).join('');
    memoryState.interval = setInterval(() => { memoryState.timer++; document.getElementById('memory-timer').textContent = 'Tempo: ' + memoryState.timer + 's'; }, 1000);
    updateMemoryUI();
}
function flipCard(i) {
    if (memoryState.locked) return;
    const card = document.getElementById('mc-' + i);
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    card.classList.add('flipped');
    memoryState.flipped.push(i);
    if (memoryState.flipped.length === 2) {
        memoryState.moves++; memoryState.locked = true;
        const [a, b] = memoryState.flipped;
        if (memoryState.cards[a] === memoryState.cards[b]) {
            document.getElementById('mc-' + a).classList.add('matched');
            document.getElementById('mc-' + b).classList.add('matched');
            memoryState.matched++; memoryState.flipped = []; memoryState.locked = false;
            if (memoryState.matched === memoryState.total) { clearInterval(memoryState.interval); endMemory(); }
        } else {
            setTimeout(() => { document.getElementById('mc-' + a).classList.remove('flipped'); document.getElementById('mc-' + b).classList.remove('flipped'); memoryState.flipped = []; memoryState.locked = false; }, 800);
        }
        updateMemoryUI();
    }
}
function updateMemoryUI() { document.getElementById('memory-moves').textContent = 'Mosse: ' + memoryState.moves; document.getElementById('memory-pairs').textContent = 'Coppie: ' + memoryState.matched + '/' + memoryState.total; }
function endMemory() {
    const eff = Math.max(0, 100 - (memoryState.moves - memoryState.total) * 3);
    const xp = Math.floor((eff + Math.max(0, 50 - memoryState.timer)) * (memoryState.size === 4 ? 1 : memoryState.size === 6 ? 2 : 3));
    profile.gamesPlayed++; addDNA('devotion', 3); addDNA('addiction', 1); addXP(xp, 'Cock Memory');
    document.getElementById('memory-result').style.display = 'block';
    document.getElementById('memory-result-text').textContent = memoryState.moves + ' mosse in ' + memoryState.timer + 's';
    document.getElementById('memory-result-xp').textContent = '+' + xp + ' XP';
    document.getElementById('memory-result-title').textContent = eff >= 80 ? 'Perfetto! 💋' : eff >= 50 ? 'Brava! 💕' : 'Continua! 🎀';
}
function resetMemory() { clearInterval(memoryState.interval); document.getElementById('memory-board').style.display = 'none'; document.getElementById('memory-board').innerHTML = ''; document.getElementById('memory-result').style.display = 'none'; document.getElementById('memory-difficulty').style.display = 'block'; }

// ============ GAME 2: REFLEX KNEEL ============
let reactionState = { timeout: null, startTime: 0, history: [] };
function startReaction() {
    document.getElementById('reaction-start').style.display = 'none';
    document.getElementById('reaction-result').style.display = 'none';
    document.getElementById('reaction-early').style.display = 'none';
    document.getElementById('reaction-go').style.display = 'none';
    document.getElementById('reaction-wait').style.display = 'flex';
    const delay = 2000 + Math.random() * 5000;
    reactionState.timeout = setTimeout(() => {
        document.getElementById('reaction-wait').style.display = 'none';
        document.getElementById('reaction-go').innerHTML = '<h1>👑 KNEEL! 👑</h1><p>CLICCA ORA!</p>';
        document.getElementById('reaction-go').style.display = 'flex';
        reactionState.startTime = Date.now();
    }, delay);
    document.getElementById('reaction-wait').onclick = () => {
        clearTimeout(reactionState.timeout);
        document.getElementById('reaction-wait').style.display = 'none';
        document.getElementById('reaction-early').style.display = 'block';
    };
}
function clickReaction() {
    const time = Date.now() - reactionState.startTime;
    document.getElementById('reaction-go').style.display = 'none';
    document.getElementById('reaction-result').style.display = 'block';
    reactionState.history.push(time);
    let comment, xp;
    if (time < 200) { comment = "Incredibile! Istinto perfetto! 👑"; xp = 80; }
    else if (time < 350) { comment = "Molto veloce! Obbediente! 💋"; xp = 60; }
    else if (time < 500) { comment = "Buon riflesso! 💕"; xp = 40; }
    else { comment = "Troppo lenta! Allenati! 🔥"; xp = 15; }
    document.getElementById('reaction-time-text').textContent = time + ' ms';
    document.getElementById('reaction-comment').textContent = comment;
    document.getElementById('reaction-xp').textContent = '+' + xp + ' XP';
    document.getElementById('reaction-history').textContent = reactionState.history.slice(-5).map((t, i) => '#' + (i + 1) + ': ' + t + 'ms').join(' | ');
    profile.gamesPlayed++; addDNA('obedience', time < 350 ? 5 : 2); addXP(xp, 'Reflex Kneel');
}

// ============ GAME 3: COCK CATCHER ============
let catcherState = { running: false, score: 0, combo: 0, items: [], playerX: 200, animFrame: null, timeLeft: 60, timerInterval: null };
function startCatcher() {
    const canvas = document.getElementById('catcher-canvas');
    const ctx = canvas.getContext('2d');
    canvas.style.display = 'block';
    document.getElementById('catcher-start').style.display = 'none';
    document.getElementById('catcher-result').style.display = 'none';
    catcherState = { running: true, score: 0, combo: 0, items: [], playerX: canvas.width / 2, animFrame: null, timeLeft: 60, timerInterval: null };
    canvas.onmousemove = (e) => { const r = canvas.getBoundingClientRect(); catcherState.playerX = (e.clientX - r.left) * (canvas.width / r.width); };
    canvas.ontouchmove = (e) => { e.preventDefault(); const r = canvas.getBoundingClientRect(); catcherState.playerX = (e.touches[0].clientX - r.left) * (canvas.width / r.width); };
    catcherState.timerInterval = setInterval(() => { catcherState.timeLeft--; document.getElementById('catcher-timer').textContent = 'Tempo: ' + catcherState.timeLeft + 's'; if (catcherState.timeLeft <= 0) endCatcher(); }, 1000);
    const goodE = ['🍆','🍌','🌶️','🥒','🍄']; const badE = ['❌','💀','🚫'];
    function spawn() { if (!catcherState.running) return; const good = Math.random() > 0.25; catcherState.items.push({ x: Math.random() * (canvas.width - 40), y: -40, good, emoji: good ? goodE[Math.floor(Math.random() * goodE.length)] : badE[Math.floor(Math.random() * badE.length)], speed: 2 + Math.random() * 3 }); setTimeout(spawn, 400 + Math.random() * 800); }
    function loop() {
        if (!catcherState.running) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '35px serif'; ctx.textAlign = 'center'; ctx.fillText('👄', catcherState.playerX, canvas.height - 20);
        for (let i = catcherState.items.length - 1; i >= 0; i--) {
            const it = catcherState.items[i]; it.y += it.speed;
            ctx.font = '28px serif'; ctx.fillText(it.emoji, it.x + 20, it.y + 30);
            if (it.y + 40 >= canvas.height - 40 && Math.abs(it.x + 20 - catcherState.playerX) < 35) {
                if (it.good) { catcherState.score += 10 + catcherState.combo * 2; catcherState.combo++; } else { catcherState.score = Math.max(0, catcherState.score - 20); catcherState.combo = 0; }
                catcherState.items.splice(i, 1);
                document.getElementById('catcher-score').textContent = 'Score: ' + catcherState.score;
                document.getElementById('catcher-combo').textContent = 'Combo: ' + catcherState.combo;
                continue;
            }
            if (it.y > canvas.height + 40) { if (it.good) catcherState.combo = 0; catcherState.items.splice(i, 1); }
        }
        catcherState.animFrame = requestAnimationFrame(loop);
    }
    spawn(); loop();
}
function endCatcher() {
    catcherState.running = false; cancelAnimationFrame(catcherState.animFrame); clearInterval(catcherState.timerInterval);
    document.getElementById('catcher-canvas').style.display = 'none';
    document.getElementById('catcher-result').style.display = 'block';
    const xp = Math.floor(catcherState.score * 0.5);
    document.getElementById('catcher-result-text').textContent = 'Score: ' + catcherState.score + ' — Combo max: ' + catcherState.combo;
    document.getElementById('catcher-xp').textContent = '+' + xp + ' XP';
    profile.gamesPlayed++; addDNA('devotion', Math.min(10, Math.floor(catcherState.score / 50))); addXP(xp, 'Cock Catcher');
}

// ============ GAME 4: SIZE SORTER ============
let sorterState = {};
function startSorter() {
    document.getElementById('sorter-intro').style.display = 'none';
    document.getElementById('sorter-result').style.display = 'none';
    document.getElementById('sorter-game').style.display = 'block';
    document.getElementById('sorter-check').style.display = 'none';
    const sizes = []; const used = new Set();
    for (let i = 0; i < 6; i++) { let s; do { s = 9 + Math.floor(Math.random() * 20); } while (used.has(s)); used.add(s); sizes.push(s); }
    const items = sizes.map(s => ({ size: s, label: s < 13 ? 'piccolo' : s < 17 ? 'medio' : s < 21 ? 'grande' : 'enorme' }));
    const display = [...items].sort(() => Math.random() - 0.5);
    const correct = [...items].sort((a, b) => a.size - b.size);
    sorterState = { items: display, selected: [], correct };
    document.getElementById('sorter-items').innerHTML = display.map((it, i) => `<div class="sorter-item" onclick="selectSorterItem(${i})" id="si-${i}"><div style="font-size:2em">🍆</div><div>${it.size} cm</div><div class="small-text">\${it.label}</div></div>`).join('');
    document.getElementById('sorter-order').innerHTML = '';
}
function selectSorterItem(i) {
    const el = document.getElementById('si-' + i);
    if (el.classList.contains('selected')) return;
    el.classList.add('selected');
    sorterState.selected.push(sorterState.items[i]);
    document.getElementById('sorter-order').innerHTML = sorterState.selected.map(s => '<span class="sorted-tag">' + s.size + 'cm</span>').join(' → ');
    if (sorterState.selected.length === sorterState.items.length) document.getElementById('sorter-check').style.display = 'inline-block';
}
function checkSorter() {
    const ok = JSON.stringify(sorterState.selected.map(s => s.size)) === JSON.stringify(sorterState.correct.map(s => s.size));
    document.getElementById('sorter-game').style.display = 'none';
    document.getElementById('sorter-result').style.display = 'block';
    const xp = ok ? 80 : 20;
    document.getElementById('sorter-result-title').textContent = ok ? 'Perfetto! Occhio esperto! 💋' : 'L\'ordine era: ' + sorterState.correct.map(s => s.size + 'cm').join(' → ');
    document.getElementById('sorter-result-text').textContent = ok ? 'Sai valutare perfettamente.' : 'Più pratica!';
    document.getElementById('sorter-xp').textContent = '+' + xp + ' XP';
    profile.gamesPlayed++; addDNA('devotion', ok ? 5 : 1); addXP(xp, 'Size Sorter');
}

// ============ GAME 5: MANTRA TYPER ============
let mantraState = {};
const MANTRAS = ["I am a good girl","I love to obey","I know my place","I exist to serve","Alpha men are superior","I am feminine and soft","My purpose is to please","I belong on my knees","I embrace my true nature","Good girls always obey","Submission is freedom","I crave to worship","My femininity grows every day","I surrender completely","I was made for this","Obedience brings me joy"];
function startMantra() {
    document.getElementById('mantra-start').style.display = 'none';
    document.getElementById('mantra-result').style.display = 'none';
    document.getElementById('mantra-game').style.display = 'block';
    mantraState = { timer: null, timeLeft: 60, score: 0, completed: 0 };
    nextMantra();
    const input = document.getElementById('mantra-input'); input.value = ''; input.focus(); input.oninput = checkMantraInput;
    mantraState.timer = setInterval(() => { mantraState.timeLeft--; document.getElementById('mantra-timer').textContent = 'Tempo: ' + mantraState.timeLeft + 's'; if (mantraState.timeLeft <= 0) endMantra(); }, 1000);
}
function nextMantra() { mantraState.currentMantra = MANTRAS[Math.floor(Math.random() * MANTRAS.length)]; document.getElementById('mantra-target').textContent = '"' + mantraState.currentMantra + '"'; document.getElementById('mantra-input').value = ''; }
function checkMantraInput() {
    if (document.getElementById('mantra-input').value.toLowerCase().trim() === mantraState.currentMantra.toLowerCase()) {
        mantraState.completed++; mantraState.score += 100;
        document.getElementById('mantra-completed').textContent = mantraState.completed;
        document.getElementById('mantra-score').textContent = 'Score: ' + mantraState.score;
        const msgs = ['Good girl! 💋','Brava! 💕','Feel it... 🌀','You believe it. 👑','Deeper... 💜'];
        document.getElementById('mantra-feedback').textContent = msgs[Math.floor(Math.random() * msgs.length)];
        setTimeout(nextMantra, 400);
    }
}
function endMantra() {
    clearInterval(mantraState.timer);
    document.getElementById('mantra-game').style.display = 'none';
    document.getElementById('mantra-result').style.display = 'block';
    const xp = mantraState.completed * 25;
    document.getElementById('mantra-result-text').textContent = mantraState.completed + ' mantra in 60s. Score: ' + mantraState.score;
    document.getElementById('mantra-xp').textContent = '+' + xp + ' XP';
    profile.gamesPlayed++; addDNA('submission', mantraState.completed); addDNA('femininity', Math.floor(mantraState.completed / 2)); addXP(xp, 'Mantra Typer');
}

// ============ GAME 6: GAZE LOCK ============
let gazeState = {};
const GAZE_MSGS = ["You can't look away...","This is where you belong...","Feel your mind softening...","You love what you see...","Deeper into submission...","Let go of resistance...","Surrender feels so good...","Good girl... keep watching...","Your eyes know where to look...","Don't fight it...","Embrace what you are..."];
function startGaze() {
    document.getElementById('gaze-start').style.display = 'none';
    document.getElementById('gaze-result').style.display = 'none';
    document.getElementById('gaze-game').style.display = 'flex';
    gazeState = { running: true, timer: 0, interval: null, confirmTimeout: null, failed: false };
    document.getElementById('gaze-center').innerHTML = '<div class="gaze-symbol">👑</div><div class="gaze-text" id="gaze-aff
