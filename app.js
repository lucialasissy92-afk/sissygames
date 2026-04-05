// ==========================================
//  SISSY GAMES — COMPLETE APP v3 FIXED
// ==========================================

const DB = {
    get(key, def = null) {
        try { const v = localStorage.getItem('sg_' + key); return v ? JSON.parse(v) : def; }
        catch { return def; }
    },
    set(key, val) { localStorage.setItem('sg_' + key, JSON.stringify(val)); },
};

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
    showToast('+' + amount + ' XP — ' + source + ' 💕');
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

const ACHIEVEMENTS = [
    { id: 'first_game', name: '🎮 Prima Partita', desc: 'Gioca il primo gioco', check: function() { return profile.gamesPlayed >= 1; } },
    { id: 'ten_games', name: '🔟 Dieci Giochi', desc: 'Gioca 10 partite', check: function() { return profile.gamesPlayed >= 10; } },
    { id: 'streak_7', name: '🔥 7 Giorni', desc: 'Streak di 7 giorni', check: function() { return profile.bestStreak >= 7; } },
    { id: 'level_5', name: '⭐ Livello 5', desc: 'Raggiungi livello 5', check: function() { return profile.level >= 5; } },
    { id: 'level_10', name: '👑 Livello 10', desc: 'Raggiungi livello 10', check: function() { return profile.level >= 10; } },
    { id: 'first_session', name: '🧠 Prima Sessione', desc: 'Completa una sessione', check: function() { return profile.sessionsCompleted >= 1; } },
    { id: 'devoted', name: '💋 Devota', desc: 'Devotion a 50+', check: function() { return profile.dna.devotion >= 50; } },
    { id: 'xp1000', name: '✨ 1000 XP', desc: 'Accumula 1000 XP', check: function() { return profile.xp >= 1000; } },
];

function checkAchievements() {
    ACHIEVEMENTS.forEach(function(a) {
        if (!profile.achievements.includes(a.id) && a.check()) {
            profile.achievements.push(a.id);
            DB.set('profile', profile);
            showToast('🏆 ' + a.name);
        }
    });
}

function updateAllUI() {
    var set = function(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; };
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
    var titles = ['Curious','Awakening','Becoming','Embracing','Devoted','Addicted','Owned','Complete'];
    set('profile-title', titles[Math.min(Math.floor(profile.level / 3), titles.length - 1)]);
    Object.keys(profile.dna).forEach(function(key) {
        var bar = document.getElementById('bar-' + key);
        var val = document.getElementById('val-' + key);
        if (bar) bar.style.width = profile.dna[key] + '%';
        if (val) val.textContent = Math.floor(profile.dna[key]);
    });
    var setup = document.getElementById('profile-setup');
    var view = document.getElementById('profile-view');
    if (setup && view) {
        setup.style.display = profile.name ? 'none' : 'block';
        view.style.display = profile.name ? 'block' : 'none';
    }
    var achList = document.getElementById('achievements-list');
    if (achList) {
        achList.innerHTML = ACHIEVEMENTS.map(function(a) {
            var unlocked = profile.achievements.includes(a.id);
            return '<div class="achievement-badge ' + (unlocked ? '' : 'locked') + '">' + a.name + '</div>';
        }).join('');
    }
    var today = new Date().toDateString();
    if (profile.checkinToday === today) {
        var cf = document.getElementById('checkin-form');
        var cd = document.getElementById('checkin-done');
        if (cf) cf.style.display = 'none';
        if (cd) cd.style.display = 'block';
    }
}

function showPage(id) {
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    var page = document.getElementById('page-' + id);
    if (page) page.classList.add('active');
    window.scrollTo(0, 0);
}

function showToast(msg) {
    var t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 3000);
}

// ============ CHECKIN ============
var checkinMood = null, checkinWear = null;
function selectMood(el, mood) {
    el.parentElement.querySelectorAll('.emoji-opt').forEach(function(e) { e.classList.remove('selected'); });
    el.classList.add('selected');
    checkinMood = mood;
}
function selectWear(el, wear) {
    el.parentElement.querySelectorAll('.emoji-opt').forEach(function(e) { e.classList.remove('selected'); });
    el.classList.add('selected');
    checkinWear = wear;
}
function submitCheckin() {
    if (!checkinMood || !checkinWear) { showToast('Seleziona tutto! 😘'); return; }
    profile.checkinToday = new Date().toDateString();
    addXP(50, 'Check-in');
    addDNA('femininity', checkinWear === 'yes' ? 3 : 1);
    addDNA('addiction', 1);
    DB.set('profile', profile);
    document.getElementById('checkin-form').style.display = 'none';
    document.getElementById('checkin-done').style.display = 'block';
}

// ============ GAME 1: COCK MEMORY ============
var memoryState = {};
var MEMORY_SYMBOLS = ['🍆','🍌','🌶️','🥒','🍄','🌭','🏛️','🗼','🚀','💄','👠','💎','🔑','🕯️','👅','💋','🍑','🍒','👑','⛓️','🎀','💕','🖤','🔥','💦','🫦','🩱','🧴','💜','🎭','🪭','🛁'];

function startMemory(size) {
    document.getElementById('memory-difficulty').style.display = 'none';
    document.getElementById('memory-result').style.display = 'none';
    var pairs = (size * size) / 2;
    var shuffled = MEMORY_SYMBOLS.slice().sort(function() { return Math.random() - 0.5; });
    var symbols = shuffled.slice(0, pairs);
    var cards = symbols.concat(symbols).sort(function() { return Math.random() - 0.5; });
    memoryState = { cards: cards, flipped: [], matched: 0, total: pairs, moves: 0, timer: 0, interval: null, locked: false, size: size };
    var board = document.getElementById('memory-board');
    board.style.gridTemplateColumns = 'repeat(' + size + ', 1fr)';
    board.style.display = 'grid';
    board.innerHTML = cards.map(function(s, i) {
        return '<div class="memory-card" onclick="flipCard(' + i + ')" id="mc-' + i + '"><span class="card-back">💋</span><span class="card-front">' + s + '</span></div>';
    }).join('');
    memoryState.interval = setInterval(function() {
        memoryState.timer++;
        document.getElementById('memory-timer').textContent = 'Tempo: ' + memoryState.timer + 's';
    }, 1000);
    updateMemoryUI();
}

function flipCard(i) {
    if (memoryState.locked) return;
    var card = document.getElementById('mc-' + i);
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    card.classList.add('flipped');
    memoryState.flipped.push(i);
    if (memoryState.flipped.length === 2) {
        memoryState.moves++;
        memoryState.locked = true;
        var a = memoryState.flipped[0], b = memoryState.flipped[1];
        if (memoryState.cards[a] === memoryState.cards[b]) {
            document.getElementById('mc-' + a).classList.add('matched');
            document.getElementById('mc-' + b).classList.add('matched');
            memoryState.matched++;
            memoryState.flipped = [];
            memoryState.locked = false;
            var msgs = ['Good girl! 💋','Brava! 💕','Ottimo! 🎀','Perfetto! 👅'];
            document.getElementById('memory-msg').textContent = msgs[Math.floor(Math.random() * msgs.length)];
            if (memoryState.matched === memoryState.total) { clearInterval(memoryState.interval); endMemory(); }
        } else {
            setTimeout(function() {
                document.getElementById('mc-' + a).classList.remove('flipped');
                document.getElementById('mc-' + b).classList.remove('flipped');
                memoryState.flipped = [];
                memoryState.locked = false;
            }, 800);
        }
        updateMemoryUI();
    }
}

function updateMemoryUI() {
    document.getElementById('memory-moves').textContent = 'Mosse: ' + memoryState.moves;
    document.getElementById('memory-pairs').textContent = 'Coppie: ' + memoryState.matched + '/' + memoryState.total;
}

function endMemory() {
    var eff = Math.max(0, 100 - (memoryState.moves - memoryState.total) * 3);
    var mult = memoryState.size === 4 ? 1 : memoryState.size === 6 ? 2 : 3;
    var xp = Math.floor((eff + Math.max(0, 50 - memoryState.timer)) * mult);
    profile.gamesPlayed++;
    addDNA('devotion', 3 * mult);
    addDNA('addiction', 1);
    addXP(xp, 'Cock Memory');
    document.getElementById('memory-result').style.display = 'block';
    document.getElementById('memory-result-text').textContent = memoryState.moves + ' mosse in ' + memoryState.timer + 's. Efficienza: ' + eff + '%';
    document.getElementById('memory-result-xp').textContent = '+' + xp + ' XP';
    document.getElementById('memory-result-title').textContent = eff >= 80 ? 'Perfetto! 💋' : eff >= 50 ? 'Brava! 💕' : 'Continua! 🎀';
}

function resetMemory() {
    clearInterval(memoryState.interval);
    document.getElementById('memory-board').style.display = 'none';
    document.getElementById('memory-board').innerHTML = '';
    document.getElementById('memory-result').style.display = 'none';
    document.getElementById('memory-difficulty').style.display = 'block';
    document.getElementById('memory-msg').textContent = '';
}

// ============ GAME 2: REFLEX KNEEL ============
var reactionState = { timeout: null, startTime: 0, history: [] };

function startReaction() {
    document.getElementById('reaction-start').style.display = 'none';
    document.getElementById('reaction-result').style.display = 'none';
    document.getElementById('reaction-early').style.display = 'none';
    document.getElementById('reaction-go').style.display = 'none';
    document.getElementById('reaction-wait').style.display = 'flex';
    var delay = 2000 + Math.random() * 5000;
    reactionState.timeout = setTimeout(function() {
        document.getElementById('reaction-wait').style.display = 'none';
        document.getElementById('reaction-go').innerHTML = '<h1>👑 KNEEL! 👑</h1><p>CLICCA ORA!</p>';
        document.getElementById('reaction-go').style.display = 'flex';
        reactionState.startTime = Date.now();
    }, delay);
    document.getElementById('reaction-wait').onclick = function() {
        clearTimeout(reactionState.timeout);
        document.getElementById('reaction-wait').style.display = 'none';
        document.getElementById('reaction-early').style.display = 'block';
    };
}

function clickReaction() {
    var time = Date.now() - reactionState.startTime;
    document.getElementById('reaction-go').style.display = 'none';
    document.getElementById('reaction-result').style.display = 'block';
    reactionState.history.push(time);
    var comment, xp;
    if (time < 200) { comment = 'Incredibile! Istinto perfetto! 👑'; xp = 80; }
    else if (time < 350) { comment = 'Molto veloce! Obbediente! 💋'; xp = 60; }
    else if (time < 500) { comment = 'Buon riflesso! 💕'; xp = 40; }
    else { comment = 'Troppo lenta! Allenati! 🔥'; xp = 15; }
    document.getElementById('reaction-time-text').textContent = time + ' ms';
    document.getElementById('reaction-comment').textContent = comment;
    document.getElementById('reaction-xp').textContent = '+' + xp + ' XP';
    document.getElementById('reaction-history').textContent = reactionState.history.slice(-5).map(function(t, i) { return '#' + (i+1) + ': ' + t + 'ms'; }).join(' | ');
    profile.gamesPlayed++;
    addDNA('obedience', time < 350 ? 5 : 2);
    addXP(xp, 'Reflex Kneel');
}

// ============ GAME 3: COCK CATCHER ============
var catcherState = {};

function startCatcher() {
    var canvas = document.getElementById('catcher-canvas');
    var ctx = canvas.getContext('2d');
    canvas.style.display = 'block';
    document.getElementById('catcher-start').style.display = 'none';
    document.getElementById('catcher-result').style.display = 'none';
    catcherState = { running: true, score: 0, combo: 0, items: [], playerX: canvas.width / 2, animFrame: null, timeLeft: 60, timerInterval: null };
    canvas.onmousemove = function(e) { var r = canvas.getBoundingClientRect(); catcherState.playerX = (e.clientX - r.left) * (canvas.width / r.width); };
    canvas.ontouchmove = function(e) { e.preventDefault(); var r = canvas.getBoundingClientRect(); catcherState.playerX = (e.touches[0].clientX - r.left) * (canvas.width / r.width); };
    catcherState.timerInterval = setInterval(function() {
        catcherState.timeLeft--;
        document.getElementById('catcher-timer').textContent = 'Tempo: ' + catcherState.timeLeft + 's';
        if (catcherState.timeLeft <= 0) endCatcher();
    }, 1000);
    var goodE = ['🍆','🍌','🌶️','🥒','🍄'];
    var badE = ['❌','💀','🚫'];
    function spawn() {
        if (!catcherState.running) return;
        var good = Math.random() > 0.25;
        catcherState.items.push({
            x: Math.random() * (canvas.width - 40), y: -40, good: good,
            emoji: good ? goodE[Math.floor(Math.random() * goodE.length)] : badE[Math.floor(Math.random() * badE.length)],
            speed: 2 + Math.random() * 3
        });
        setTimeout(spawn, 400 + Math.random() * 800);
    }
    function loop() {
        if (!catcherState.running) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '35px serif';
        ctx.textAlign = 'center';
        ctx.fillText('👄', catcherState.playerX, canvas.height - 20);
        for (var i = catcherState.items.length - 1; i >= 0; i--) {
            var it = catcherState.items[i];
            it.y += it.speed;
            ctx.font = '28px serif';
            ctx.fillText(it.emoji, it.x + 20, it.y + 30);
            if (it.y + 40 >= canvas.height - 40 && Math.abs(it.x + 20 - catcherState.playerX) < 35) {
                if (it.good) { catcherState.score += 10 + catcherState.combo * 2; catcherState.combo++; }
                else { catcherState.score = Math.max(0, catcherState.score - 20); catcherState.combo = 0; }
                catcherState.items.splice(i, 1);
                document.getElementById('catcher-score').textContent = 'Score: ' + catcherState.score;
                document.getElementById('catcher-combo').textContent = 'Combo: ' + catcherState.combo;
                continue;
            }
            if (it.y > canvas.height + 40) { if (it.good) catcherState.combo = 0; catcherState.items.splice(i, 1); }
        }
        if (catcherState.combo >= 10) { ctx.fillStyle = '#ff69b4'; ctx.font = 'bold 18px sans-serif'; ctx.fillText('🔥 INSATIABLE! 🔥', canvas.width/2, 30); ctx.fillStyle = '#fff'; }
        else if (catcherState.combo >= 5) { ctx.fillStyle = '#ff69b4'; ctx.font = '16px sans-serif'; ctx.fillText('COCK HUNGRY! 👅', canvas.width/2, 30); ctx.fillStyle = '#fff'; }
        catcherState.animFrame = requestAnimationFrame(loop);
    }
    spawn();
    loop();
}

function endCatcher() {
    catcherState.running = false;
    cancelAnimationFrame(catcherState.animFrame);
    clearInterval(catcherState.timerInterval);
    document.getElementById('catcher-canvas').style.display = 'none';
    document.getElementById('catcher-result').style.display = 'block';
    var xp = Math.floor(catcherState.score * 0.5);
    document.getElementById('catcher-result-text').textContent = 'Score: ' + catcherState.score + ' — Combo max: ' + catcherState.combo;
    document.getElementById('catcher-xp').textContent = '+' + xp + ' XP';
    profile.gamesPlayed++;
    addDNA('devotion', Math.min(10, Math.floor(catcherState.score / 50)));
    addXP(xp, 'Cock Catcher');
}

// ============ GAME 4: SIZE SORTER ============
var sorterState = {};

function startSorter() {
    document.getElementById('sorter-intro').style.display = 'none';
    document.getElementById('sorter-result').style.display = 'none';
    document.getElementById('sorter-game').style.display = 'block';
    document.getElementById('sorter-check').style.display = 'none';
    var sizes = [];
    var used = {};
    for (var i = 0; i < 6; i++) {
        var s;
        do { s = 9 + Math.floor(Math.random() * 20); } while (used[s]);
        used[s] = true;
        sizes.push(s);
    }
    var items = sizes.map(function(s) {
        return { size: s, label: s < 13 ? '🤏 piccolo' : s < 17 ? '👌 medio' : s < 21 ? '😮 grande' : '🤯 enorme' };
    });
    var display = items.slice().sort(function() { return Math.random() - 0.5; });
    var correct = items.slice().sort(function(a, b) { return a.size - b.size; });
    sorterState = { items: display, selected: [], correct: correct };
    document.getElementById('sorter-items').innerHTML = display.map(function(it, i) {
        return '<div class="sorter-item" onclick="selectSorterItem(' + i + ')" id="si-' + i + '"><div style="font-size:2em">🍆</div><div>' + it.size + ' cm</div><div class="small-text">' + it.label + '</div></div>';
    }).join('');
    document.getElementById('sorter-order').innerHTML = '';
}

function selectSorterItem(i) {
    var el = document.getElementById('si-' + i);
    if (el.classList.contains('selected')) return;
    el.classList.add('selected');
    sorterState.selected.push(sorterState.items[i]);
    document.getElementById('sorter-order').innerHTML = sorterState.selected.map(function(s) { return '<span class="sorted-tag">' + s.size + 'cm</span>'; }).join(' → ');
    if (sorterState.selected.length === sorterState.items.length) document.getElementById('sorter-check').style.display = 'inline-block';
}

function checkSorter() {
    var selSizes = sorterState.selected.map(function(s) { return s.size; });
    var corSizes = sorterState.correct.map(function(s) { return s.size; });
    var ok = JSON.stringify(selSizes) === JSON.stringify(corSizes);
    document.getElementById('sorter-game').style.display = 'none';
    document.getElementById('sorter-result').style.display = 'block';
    var xp = ok ? 80 : 20;
    document.getElementById('sorter-result-title').textContent = ok ? 'Perfetto! Occhio esperto! 💋' : 'Ordine corretto: ' + corSizes.map(function(s) { return s + 'cm'; }).join(' → ');
    document.getElementById('sorter-result-text').textContent = ok ? 'Sai valutare perfettamente.' : 'Più pratica! 👀';
    document.getElementById('sorter-xp').textContent = '+' + xp + ' XP';
    profile.gamesPlayed++;
    addDNA('devotion', ok ? 5 : 1);
    addXP(xp, 'Size Sorter');
}

// ============ GAME 5: MANTRA TYPER ============
var mantraState = {};
var MANTRAS = ['I am a good girl','I love to obey','I know my place','I exist to serve','Alpha men are superior','I am feminine and soft','My purpose is to please','I belong on my knees','I embrace my true nature','Good girls always obey','Submission is freedom','I crave to worship','I surrender completely','I was made for this','Obedience brings me joy'];

function startMantra() {
    document.getElementById('mantra-start').style.display = 'none';
    document.getElementById('mantra-result').style.display = 'none';
    document.getElementById('mantra-game').style.display = 'block';
    mantraState = { timer: null, timeLeft: 60, score: 0, completed: 0, currentMantra: '' };
    nextMantra();
    var input = document.getElementById('mantra-input');
    input.value = '';
    input.focus();
    input.oninput = checkMantraInput;
    mantraState.timer = setInterval(function() {
        mantraState.timeLeft--;
        document.getElementById('mantra-timer').textContent = 'Tempo: ' + mantraState.timeLeft + 's';
        if (mantraState.timeLeft <= 0) endMantra();
    }, 1000);
}

function nextMantra() {
    mantraState.currentMantra = MANTRAS[Math.floor(Math.random() * MANTRAS.length)];
    document.getElementById('mantra-target').textContent = '"' + mantraState.currentMantra + '"';
    document.getElementById('mantra-input').value = '';
}

function checkMantraInput() {
    if (document.getElementById('mantra-input').value.toLowerCase().trim() === mantraState.currentMantra.toLowerCase()) {
        mantraState.completed++;
        mantraState.score += 100;
        document.getElementById('mantra-completed').textContent = mantraState.completed;
        document.getElementById('mantra-score').textContent = 'Score: ' + mantraState.score;
        var msgs = ['Good girl! 💋','Brava! 💕','Feel it... 🌀','You believe it. 👑','Deeper... 💜'];
        document.getElementById('mantra-feedback').textContent = msgs[Math.floor(Math.random() * msgs.length)];
        setTimeout(nextMantra, 400);
    }
}

function endMantra() {
    clearInterval(mantraState.timer);
    document.getElementById('mantra-game').style.display = 'none';
    document.getElementById('mantra-result').style.display = 'block';
    var xp = mantraState.completed * 25;
    document.getElementById('mantra-result-text').textContent = mantraState.completed + ' mantra in 60s. Score: ' + mantraState.score;
    document.getElementById('mantra-xp').textContent = '+' + xp + ' XP';
    profile.gamesPlayed++;
    addDNA('submission', mantraState.completed);
    addDNA('femininity', Math.floor(mantraState.completed / 2));
    addXP(xp, 'Mantra Typer');
}

// ============ GAME 6: GAZE LOCK ============
var gazeState = {};
var GAZE_MSGS = ['You can\'t look away...','This is where you belong...','Feel your mind softening...','You love what you see...','Deeper into submission...','Let go of resistance...','Surrender feels so good...','Good girl... keep watching...','Don\'t fight it...','Embrace what you are...'];

function startGaze() {
    document.getElementById('gaze-start').style.display = 'none';
    document.getElementById('gaze-result').style.display = 'none';
    document.getElementById('gaze-game').style.display = 'flex';
    gazeState = { running: true, timer: 0, interval: null, confirmTimeout: null, failed: false };
    document.getElementById('gaze-center').innerHTML = '<div class="gaze-symbol">👑</div><div class="gaze-text" id="gaze-affirmation"></div>';
    gazeState.interval = setInterval(function() {
        gazeState.timer++;
        var min = Math.floor(gazeState.timer / 60);
        var sec = gazeState.timer % 60;
        document.getElementById('gaze-timer').textContent = min + ':' + (sec < 10 ? '0' : '') + sec;
        if (gazeState.timer % 5 === 0) {
            var aff = GAZE_MSGS[Math.floor(Math.random() * GAZE_MSGS.length)];
            var el = document.getElementById('gaze-affirmation');
            if (el) { el.style.opacity = 0; setTimeout(function() { el.textContent = aff; el.style.opacity = 0.7; }, 500); }
        }
        if (gazeState.timer > 0 && gazeState.timer % (15 + Math.floor(Math.random() * 15)) === 0) showGazeConfirm();
    }, 1000);
}

function showGazeConfirm() {
    var btn = document.getElementById('gaze-btn');
    btn.style.display = 'block';
    gazeState.confirmTimeout = setTimeout(function() { if (gazeState.running) { gazeState.failed = true; endGaze(); } }, 3000);
}

function gazeConfirm() {
    clearTimeout(gazeState.confirmTimeout);
    document.getElementById('gaze-btn').style.display = 'none';
}

function endGaze() {
    gazeState.running = false;
    clearInterval(gazeState.interval);
    clearTimeout(gazeState.confirmTimeout);
    document.getElementById('gaze-game').style.display = 'none';
    document.getElementById('gaze-result').style.display = 'block';
    var xp = Math.floor(gazeState.timer * 1.5);
    var title, text;
    if (gazeState.timer >= 300) { title = '5+ minuti! Completamente devota. 👑'; text = 'La tua mente è aperta.'; }
    else if (gazeState.timer >= 120) { title = 'Ottima concentrazione! 💋'; text = '2+ minuti di focus.'; }
    else if (gazeState.timer >= 60) { title = 'Buon inizio! 💕'; text = 'Un minuto. Puoi fare di più.'; }
    else { title = gazeState.failed ? 'Hai distolto lo sguardo! 😤' : 'Troppo breve. 🎀'; text = 'Riprova!'; }
    document.getElementById('gaze-result-title').textContent = title;
    document.getElementById('gaze-result-text').textContent = text;
    document.getElementById('gaze-xp').textContent = '+' + xp + ' XP';
    profile.gamesPlayed++;
    addDNA('devotion', Math.floor(gazeState.timer / 10));
    addDNA('submission', Math.floor(gazeState.timer / 20));
    addXP(xp, 'Gaze Lock');
}

// ============ GAME 7: COCK QUIZ ============
var QUIZ_QUESTIONS = [
    { q: 'Qual è la lunghezza media di un pene eretto?', o: ['10 cm','13.12 cm','16 cm','20 cm'], a: 1, cat: '📏 Anatomia' },
    { q: 'Come si chiama il tessuto spugnoso che si riempie di sangue durante l\'erezione?', o: ['Corpo cavernoso','Corpo luteo','Corpo calloso','Corpo vitreo'], a: 0, cat: '🔬 Scienza' },
    { q: 'Quale percentuale di uomini ha un pene più lungo di 18cm?', o: ['25%','15%','5%','1%'], a: 2, cat: '📊 Statistiche' },
    { q: 'Il prepuzio contiene circa quante terminazioni nervose?', o: ['2.000','8.000','20.000','50.000'], a: 2, cat: '🔬 Scienza' },
    { q: 'Qual è il termine medico per l\'erezione mattutina?', o: ['Priapismo','Tumescenza peniena notturna','Erezione riflessa','Erezione psicogena'], a: 1, cat: '📚 Terminologia' },
    { q: 'In media, quante erezioni ha un uomo durante il sonno?', o: ['1-2','3-5','6-8','10+'], a: 1, cat: '📊 Statistiche' },
    { q: 'Qual è la circonferenza media di un pene eretto?', o: ['9 cm','11.66 cm','14 cm','16 cm'], a: 1, cat: '📏 Anatomia' },
    { q: 'Il frenulo è:', o: ['La punta del pene','La banda di tessuto sotto il glande','La base del pene','Il rivestimento esterno'], a: 1, cat: '📏 Anatomia' },
    { q: 'Cosa significa "grower" vs "shower"?', o: ['Circonciso vs non','Piccolo flaccido ma cresce molto vs grande anche flaccido','Dritto vs curvo','Giovane vs anziano'], a: 1, cat: '📚 Terminologia' },
    { q: 'La zona più sensibile del pene è:', o: ['La base','Il corpo','Il frenulo e la corona del glande','I testicoli'], a: 2, cat: '🔬 Scienza' },
    { q: 'Un pene può fratturarsi?', o: ['No, non ha ossa','Sì, si può rompere la tunica albuginea','Solo se è molto freddo','Solo durante la pubertà'], a: 1, cat: '🔬 Scienza' },
    { q: 'La dimensione del pene è correlata alla dimensione di:', o: ['Mani','Piedi','Naso','Nessuna di queste'], a: 3, cat: '📊 Statistiche' },
    { q: 'Qual è la posizione più stimolante per il punto L (prostata)?', o: ['Missionario','Pecorina','Cowgirl','Dipende dall\'angolazione'], a: 3, cat: '🔬 Scienza' },
    { q: 'Il liquido pre-eiaculatorio viene prodotto da:', o: ['I testicoli','La prostata','Le ghiandole di Cowper','La vescica'], a: 2, cat: '🔬 Scienza' },
    { q: 'Qual è il record mondiale di lunghezza del pene?', o: ['25 cm','34 cm','42 cm','48 cm'], a: 2, cat: '📊 Statistiche' },
    { q: 'Quanto dura in media un\'erezione durante il rapporto?', o: ['2-3 minuti','5-7 minuti','15-20 minuti','30+ minuti'], a: 1, cat: '📊 Statistiche' },
    { q: 'Il colore del glande durante l\'erezione diventa più scuro perché:', o: ['È sporco','Aumenta l\'afflusso di sangue','È un\'infiammazione','Cambia la pigmentazione'], a: 1, cat: '🔬 Scienza' },
    { q: 'Come si chiama la piega di pelle che copre il glande?', o: ['Frenulo','Prepuzio','Smegma','Corona'], a: 1, cat: '📏 Anatomia' },
    { q: 'Un maschio alpha produce in media al giorno:', o: ['1 ml di testosterone','7 mg di testosterone','50 mg di testosterone','100 mg di testosterone'], a: 1, cat: '🔬 Scienza' },
    { q: 'Il feromone maschile principale è:', o: ['Estrogeno','Androstenone','Cortisolo','Melatonina'], a: 1, cat: '🔬 Scienza' },
];

var quizState = {};

function startQuiz() {
    document.getElementById('quiz-start').style.display = 'none';
    document.getElementById('quiz-result').style.display = 'none';
    document.getElementById('quiz-game').style.display = 'block';
    var shuffled = QUIZ_QUESTIONS.slice().sort(function() { return Math.random() - 0.5; });
    quizState = { questions: shuffled.slice(0, 10), current: 0, score: 0, answers: [] };
    showQuizQuestion();
}

function showQuizQuestion() {
    if (quizState.current >= quizState.questions.length) { endQuiz(); return; }
    var q = quizState.questions[quizState.current];
    document.getElementById('quiz-progress').textContent = 'Domanda ' + (quizState.current + 1) + '/' + quizState.questions.length;
    document.getElementById('quiz-score-display').textContent = 'Score: ' + quizState.score;
    document.getElementById('quiz-category').textContent = q.cat;
    document.getElementById('quiz-question').textContent = q.q;
    document.getElementById('quiz-feedback').textContent = '';
    document.getElementById('quiz-options').innerHTML = q.o.map(function(opt, i) {
        return '<button class="quiz-opt-btn" onclick="answerQuiz(' + i + ')">' + opt + '</button>';
    }).join('');
}

function answerQuiz(i) {
    var q = quizState.questions[quizState.current];
    var correct = i === q.a;
    var btns = document.querySelectorAll('.quiz-opt-btn');
    btns.forEach(function(btn, idx) {
        btn.disabled = true;
        if (idx === q.a) btn.classList.add('correct');
        if (idx === i && !correct) btn.classList.add('wrong');
    });
    if (correct) {
        quizState.score += 100;
        document.getElementById('quiz-feedback').textContent = 'Esatto! Brava! 💋';
        document.getElementById('quiz-feedback').style.color = '#4caf50';
    } else {
        document.getElementById('quiz-feedback').textContent = 'Sbagliato! La risposta era: ' + q.o[q.a];
        document.getElementById('quiz-feedback').style.color = '#ff4444';
    }
    quizState.answers.push(correct);
    quizState.current++;
    setTimeout(showQuizQuestion, 2000);
}

function endQuiz() {
    document.getElementById('quiz-game').style.display = 'none';
    document.getElementById('quiz-result').style.display = 'block';
    var correct = quizState.answers.filter(function(a) { return a; }).length;
    var total = quizState.questions.length;
    var pct = Math.round((correct / total) * 100);
    var xp = quizState.score;
    var title, text;
    if (pct >= 90) { title = 'Esperta di cazzi! 👑'; text = 'Sai tutto. Sei una vera devota del cazzo.'; }
    else if (pct >= 70) { title = 'Brava studentessa! 💋'; text = 'Buona conoscenza! Continua a studiare.'; }
    else if (pct >= 50) { title = 'Sufficiente 💕'; text = 'Devi ancora studiare molto...'; }
    else { title = 'Devi studiare di più! 📚'; text = 'Una sissy deve conoscere OGNI dettaglio del cazzo.'; }
    document.getElementById('quiz-result-title').textContent = title;
    document.getElementById('quiz-result-text').textContent = correct + '/' + total + ' corrette (' + pct + '%) — ' + text;
    document.getElementById('quiz-result-detail').textContent = '';
    document.getElementById('quiz-xp').textContent = '+' + xp + ' XP';
    profile.gamesPlayed++;
    addDNA('devotion', Math.floor(correct * 2));
    addDNA('addiction', 2);
    addXP(xp, 'Cock Quiz');
    DB.set('quizCount', (DB.get('quizCount', 0)) + 1);
}

// ============ GAME 8: SIZE GUESS ============
var SG_DESCRIPTIONS = [
    { desc: 'Sottile e elegante. Non impressiona a prima vista ma sa fare il suo lavoro. Perfetto per il deepthroat di una principiante.', size: 13 },
    { desc: 'Medio, ben proporzionato. Leggermente curvo verso l\'alto. Il glande è rosato e lucido. Classico ragazzo della porta accanto.', size: 15 },
    { desc: 'Lungo e dritto come un\'asta. Vene prominenti lungo tutto il fusto. Il tipo che ti fa sentire piena.', size: 19 },
    { desc: 'Grosso. Molto grosso. La circonferenza è impressionante. Lo senti prima ancora di toccarlo. Fa male solo a guardarlo.', size: 22 },
    { desc: 'Piccolo ma fierissimo. Si fa notare per il glande sproporzionatamente grande rispetto al fusto. Come un funghetto arrabbiato.', size: 11 },
    { desc: 'Massiccio e scuro. Le vene pulsano visibilmente. Pesante. Quando lo appoggia sulla tua faccia senti il peso della dominanza.', size: 24 },
    { desc: 'Medio-lungo ma molto sottile. Scivola dentro facilmente. Perfetto per la gola. Non ti fa tossire ma ti riempie.', size: 17 },
    { desc: 'Un mostro. Devi usare entrambe le mani e non lo copri tutto. Il glande è grande come un\'albicocca. Ti fa paura e ti eccita.', size: 27 },
    { desc: 'Carino, compatto, circonciso. Il glande è sempre esposto, lucido e sensibile. Perfetto da adorare con la lingua.', size: 12 },
    { desc: 'Lungo, non circonciso, con un prepuzio abbondante. Quando si ritira rivela un glande rosa e umido. Profumo intenso.', size: 20 },
    { desc: 'Spesso come una lattina di birra. Non lunghissimo ma la circonferenza è devastante. Ti apre completamente.', size: 16 },
    { desc: 'BBC. Scuro, lungo, leggermente curvo. Le vene scorrono come fiumi. Quando è duro sembra di acciaio caldo.', size: 25 },
];

var sgState = {};

function startSizeGuess() {
    document.getElementById('sg-start').style.display = 'none';
    document.getElementById('sg-result').style.display = 'none';
    document.getElementById('sg-game').style.display = 'block';
    var shuffled = SG_DESCRIPTIONS.slice().sort(function() { return Math.random() - 0.5; });
    sgState = { rounds: shuffled.slice(0, 8), current: 0, score: 0, totalDiff: 0 };
    showSGRound();
}

function showSGRound() {
    if (sgState.current >= sgState.rounds.length) { endSizeGuess(); return; }
    var r = sgState.rounds[sgState.current];
    document.getElementById('sg-round').textContent = 'Round ' + (sgState.current + 1) + '/' + sgState.rounds.length;
    document.getElementById('sg-score-display').textContent = 'Score: ' + sgState.score;
    document.getElementById('sg-description').textContent = '📝 ' + r.desc;
    document.getElementById('sg-slider').value = 15;
    document.getElementById('sg-slider-value').textContent = '15 cm';
    document.getElementById('sg-feedback').textContent = '';
    document.getElementById('sg-submit').disabled = false;
}

function updateSGSlider() {
    var val = document.getElementById('sg-slider').value;
    document.getElementById('sg-slider-value').textContent = val + ' cm';
}

function submitSizeGuess() {
    var guess = parseInt(document.getElementById('sg-slider').value);
    var actual = sgState.rounds[sgState.current].size;
    var diff = Math.abs(guess - actual);
    sgState.totalDiff += diff;
    var points, msg;
    if (diff === 0) { points = 150; msg = '🎯 PERFETTO! Esattamente ' + actual + ' cm! Hai l\'occhio di un\'esperta!'; }
    else if (diff <= 1) { points = 100; msg = '🔥 Quasi perfetto! Era ' + actual + ' cm. Differenza: solo ' + diff + ' cm!'; }
    else if (diff <= 3) { points = 60; msg = '💕 Vicina! Era ' + actual + ' cm. Differenza: ' + diff + ' cm.'; }
    else if (diff <= 5) { points = 30; msg = '😤 Non male. Era ' + actual + ' cm. Differenza: ' + diff + ' cm. Studia di più!'; }
    else { points = 10; msg = '❌ Lontana! Era ' + actual + ' cm. Differenza: ' + diff + ' cm. Devi allenarti!'; }
    sgState.score += points;
    document.getElementById('sg-feedback').textContent = msg;
    document.getElementById('sg-submit').disabled = true;
    sgState.current++;
    setTimeout(showSGRound, 2500);
}

function endSizeGuess() {
    document.getElementById('sg-game').style.display = 'none';
    document.getElementById('sg-result').style.display = 'block';
    var avgDiff = (sgState.totalDiff / sgState.rounds.length).toFixed(1);
    var xp = sgState.score;
    var title, text;
    if (avgDiff <= 1) { title = 'Occhio infallibile! 👑'; text = 'Errore medio: ' + avgDiff + ' cm. Sei un\'esperta assoluta.'; }
    else if (avgDiff <= 3) { title = 'Brava estimatrice! 💋'; text = 'Errore medio: ' + avgDiff + ' cm. Ottima precisione.'; }
    else if (avgDiff <= 5) { title = 'Puoi migliorare 💕'; text = 'Errore medio: ' + avgDiff + ' cm. Serve più pratica.'; }
    else { title = 'Ancora tanto da imparare! 📏'; text = 'Errore medio: ' + avgDiff + ' cm. Una sissy deve saper valutare a occhio!'; }
    document.getElementById('sg-result-title').textContent = title;
    document.getElementById('sg-result-text').textContent = 'Score: ' + sgState.score + ' — ' + text;
    document.getElementById('sg-xp').textContent = '+' + xp + ' XP';
    profile.gamesPlayed++;
    addDNA('devotion', Math.floor(sgState.score / 100));
    addXP(xp, 'Size Guess');
}

// ============ GAME 9: ALPHA PROFILE ============
var ALPHA_PROFILES = [
    { name: 'Marcus', age: 28, height: '188cm', build: 'Muscoloso', job: 'Personal trainer', cock: '21cm, spesso, non circonciso', trait: 'Dominante silenzioso', eyes: 'Verdi', hair: 'Rasati', detail: 'Ha un tatuaggio tribale sul braccio destro. Quando entra in una stanza tutti lo guardano. Non alza mai la voce. Non ne ha bisogno.' },
    { name: 'Tyrone', age: 32, height: '193cm', build: 'Atletico, spalle larghe', job: 'Ex giocatore di basket', cock: '25cm, lungo e curvo, circonciso', trait: 'Carismatico e sicuro', eyes: 'Marroni scuri', hair: 'Corti, fade', detail: 'Ride forte e senza vergogna. Le sue mani sono enormi. Quando ti tocca la faccia, la sua mano la copre completamente.' },
    { name: 'Dimitri', age: 35, height: '185cm', build: 'Robusto, forte', job: 'Operaio edile', cock: '19cm, molto spesso, non circonciso', trait: 'Rude ma protettivo', eyes: 'Azzurri ghiaccio', hair: 'Castano scuro', detail: 'Puzza di sudore e ferro. Le mani callose e dure. Parla poco. Quando ti guarda senti le ginocchia cedere.' },
    { name: 'James', age: 26, height: '180cm', build: 'Snello ma definito', job: 'Studente di medicina', cock: '17cm, dritto, circonciso, glande grande', trait: 'Intellettuale dominante', eyes: 'Nocciola', hair: 'Biondi mossi', detail: 'Sa esattamente dove toccarti. Conosce ogni tuo punto sensibile. Ti fa sentire studiata, analizzata, posseduta con precisione chirurgica.' },
    { name: 'Antonio', age: 30, height: '178cm', build: 'Compatto, peloso', job: 'Chef', cock: '16cm, spesso, non circonciso, molto peloso alla base', trait: 'Passionale e vocale', eyes: 'Neri', hair: 'Neri ricci', detail: 'Odora di spezie e cuoio. Le sue dita sono forti. Ti afferra i capelli senza chiedere. Ti dice esattamente cosa fare.' },
];

var apState = {};

function startAlphaProfile() {
    document.getElementById('ap-start').style.display = 'none';
    document.getElementById('ap-result').style.display = 'none';
    document.getElementById('ap-worship').style.display = 'none';
    document.getElementById('ap-quiz').style.display = 'none';
    document.getElementById('ap-study').style.display = 'block';
    var p = ALPHA_PROFILES[Math.floor(Math.random() * ALPHA_PROFILES.length)];
    apState = { profile: p, score: 0, qIndex: 0, questions: [] };
    document.getElementById('ap-name').textContent = '👑 ' + p.name + ', ' + p.age;
    document.getElementById('ap-details').innerHTML =
        '<div class="alpha-stat">📏 Altezza: ' + p.height + '</div>' +
        '<div class="alpha-stat">💪 Fisico: ' + p.build + '</div>' +
        '<div class="alpha-stat">💼 Lavoro: ' + p.job + '</div>' +
        '<div class="alpha-stat">🍆 Cazzo: ' + p.cock + '</div>' +
        '<div class="alpha-stat">😈 Personalità: ' + p.trait + '</div>' +
        '<div class="alpha-stat">👁️ Occhi: ' + p.eyes + '</div>' +
        '<div class="alpha-stat">💇 Capelli: ' + p.hair + '</div>' +
        '<div class="alpha-stat">📝 ' + p.detail + '</div>';
    document.getElementById('ap-study-msg').textContent = 'Memorizza tutto... hai 30 secondi ⏳';
    var timerFill = document.getElementById('ap-timer-fill');
    timerFill.style.width = '100%';
    timerFill.style.transition = 'width 30s linear';
    setTimeout(function() { timerFill.style.width = '0%'; }, 100);
    setTimeout(function() { startAlphaQuiz(); }, 30000);
}

function startAlphaQuiz() {
    document.getElementById('ap-study').style.display = 'none';
    document.getElementById('ap-quiz').style.display = 'block';
    var p = apState.profile;
    apState.questions = [
        { q: 'Quanto è alto ' + p.name + '?', a: p.height, wrong: ['175cm','190cm','183cm'] },
        { q: 'Che lavoro fa?', a: p.job, wrong: ['Avvocato','Poliziotto','Ingegnere'] },
        { q: 'Com\'è il suo cazzo?', a: p.cock, wrong: ['15cm, sottile','20cm, dritto','12cm, piccolo'] },
        { q: 'Qual è la sua personalità?', a: p.trait, wrong: ['Timido','Aggressivo','Indifferente'] },
        { q: 'Di che colore sono i suoi occhi?', a: p.eyes, wrong: ['Grigi','Neri','Marroni'] },
    ];
    apState.questions = apState.questions.sort(function() { return Math.random() - 0.5; });
    apState.qIndex = 0;
    apState.score = 0;
    showAPQuestion();
}

function showAPQuestion() {
    if (apState.qIndex >= apState.questions.length) { showAlphaWorship(); return; }
    var q = apState.questions[apState.qIndex];
    document.getElementById('ap-q-progress').textContent = 'Domanda ' + (apState.qIndex + 1) + '/' + apState.questions.length;
    document.getElementById('ap-q-score').textContent = 'Score: ' + apState.score;
    document.getElementById('ap-question').textContent = q.q;
    document.getElementById('ap-feedback').textContent = '';
    var options = [q.a].concat(q.wrong).sort(function() { return Math.random() - 0.5; });
    document.getElementById('ap-options').innerHTML = options.map(function(opt) {
        return '<button class="quiz-opt-btn" onclick="answerAP(this, \'' + opt.replace(/'/g, "\\'") + '\')">' + opt + '</button>';
    }).join('');
}

function answerAP(btn, answer) {
    var q = apState.questions[apState.qIndex];
    var correct = answer === q.a;
    var btns = document.querySelectorAll('#ap-options .quiz-opt-btn');
    btns.forEach(function(b) {
        b.disabled = true;
        if (b.textContent === q.a) b.classList.add('correct');
        if (b === btn && !correct) b.classList.add('wrong');
    });
    if (correct) {
        apState.score += 100;
        document.getElementById('ap-feedback').textContent = 'Sì! Lo conosci bene! 💋';
    } else {
        document.getElementById('ap-feedback').textContent = 'No! Era: ' + q.a;
    }
    apState.qIndex++;
    setTimeout(showAPQuestion, 2000);
}

function showAlphaWorship() {
    document.getElementById('ap-quiz').style.display = 'none';
    document.getElementById('ap-worship').style.display = 'block';
    document.getElementById('ap-worship-prompt').textContent = 'Scrivi una frase di adorazione per ' + apState.profile.name + '. Descrivi cosa faresti per lui, cosa provi guardandolo, perché lo meriti. (minimo 20 caratteri)';
    document.getElementById('ap-worship-text').value = '';
}

function submitWorship() {
    var text = document.getElementById('ap-worship-text').value.trim();
    if (text.length < 20) { showToast('Scrivi di più! Almeno 20 caratteri. 💕'); return; }
    var bonusXP = Math.min(100, text.length);
    apState.score += bonusXP;
    document.getElementById('ap-worship').style.display = 'none';
    document.getElementById('ap-result').style.display = 'block';
    var xp = apState.score;
    document.getElementById('ap-result-title').textContent = apState.score >= 400 ? 'Devota perfetta! 👑' : apState.score >= 200 ? 'Buona adoratrice! 💋' : 'Devi prestare più attenzione! 💕';
    document.getElementById('ap-result-text').textContent = 'Score quiz: ' + (apState.score - bonusXP) + ' + Adorazione: ' + bonusXP + ' = Totale: ' + apState.score;
    document.getElementById('ap-xp').textContent = '+' + xp + ' XP';
    profile.gamesPlayed++;
    addDNA('devotion', 5);
    addDNA('submission', 3);
    addDNA('femininity', 2);
    addXP(xp, 'Alpha Profile');
}

// ============ GAME 10: COCK CONFESSION ============
var CONFESSIONS = [
    { q: 'Quando vedi un cazzo grosso, la tua prima reazione è:', o: [{t:'Curiosità 🤔', p:1},{t:'Eccitazione immediata 🥵', p:3},{t:'Voglio toccarlo 👋', p:2},{t:'Voglio inginocchiarmi 🙇', p:4}] },
    { q: 'Quanto spesso pensi ai cazzi durante il giorno?', o: [{t:'Raramente 😇', p:1},{t:'Qualche volta 💭', p:2},{t:'Spesso 💕', p:3},{t:'Costantemente, non riesco a smettere 🤤', p:4}] },
    { q: 'Se un uomo dominante ti ordinasse di inginocchiarti adesso:', o: [{t:'Esiterei molto 😰', p:1},{t:'Lo farei dopo un momento 🤔', p:2},{t:'Lo farei subito 🙇', p:3},{t:'Sono già in ginocchio 💋', p:4}] },
    { q: 'Il tuo rapporto con il tuo corpo femminile è:', o: [{t:'Non mi considero femminile 😐', p:1},{t:'Sto esplorando 🌸', p:2},{t:'Mi sento sempre più femminile 💃', p:3},{t:'Sono completamente femminile dentro 👸', p:4}] },
    { q: 'Hai mai assaggiato il tuo precum?', o: [{t:'Mai 🙈', p:1},{t:'Una volta per curiosità 👅', p:2},{t:'Diverse volte 😋', p:3},{t:'Lo faccio sempre, mi piace 🤤', p:4}] },
    { q: 'Se potessi scegliere, preferiresti:', o: [{t:'Penetrare qualcuno 🍆', p:1},{t:'Non ho preferenze 🤷', p:2},{t:'Essere penetrata 🥺', p:3},{t:'Servire con la bocca, solo quello 👄', p:4}] },
    { q: 'Quanto sei disposta a fare per compiacere un alpha?', o: [{t:'Ho i miei limiti 🚧', p:1},{t:'Farei abbastanza 😊', p:2},{t:'Farei quasi tutto 💕', p:3},{t:'Qualsiasi cosa, senza limiti 🔥', p:4}] },
    { q: 'Quando ti masturbi, pensi a:', o: [{t:'Donne 👩', p:1},{t:'Un mix di cose 🌈', p:2},{t:'Cazzi e uomini dominanti 🍆', p:3},{t:'Me stessa in ginocchio che servo 🙇', p:4}] },
    { q: 'Come ti senti dopo una sessione di sissy training?', o: [{t:'In colpa 😰', p:1},{t:'Confusa ma eccitata 🤔', p:2},{t:'Soddisfatta e femminile 💃', p:3},{t:'In pace con me stessa, è chi sono 💋', p:4}] },
    { q: 'Se ti dicessero "good girl" in questo momento:', o: [{t:'Mi sentirei strana 😳', p:1},{t:'Mi farebbe piacere 😊', p:2},{t:'Arrossirei e sorriderei 🥰', p:3},{t:'Scioglierei, è tutto ciò che voglio sentire 🫠', p:4}] },
    { q: 'Quanto è grande la tua clitty?', o: [{t:'Normale 😐', p:1},{t:'Sotto la media 🤏', p:2},{t:'Piccola e non mi importa 💕', p:3},{t:'Piccola e ne sono orgogliosa, conferma chi sono 💋', p:4}] },
    { q: 'Se un alpha ti mettesse il cazzo sulla faccia senza chiedere:', o: [{t:'Lo toglierei 😤', p:1},{t:'Sarei scioccata ma non lo toglierei 😳', p:2},{t:'Lo accetterei con gioia 😍', p:3},{t:'Ringrazierei e inizierei a leccare 👅', p:4}] },
];

var confState = {};

function startConfession() {
    document.getElementById('conf-start').style.display = 'none';
    document.getElementById('conf-result').style.display = 'none';
    document.getElementById('conf-game').style.display = 'block';
    var shuffled = CONFESSIONS.slice().sort(function() { return Math.random() - 0.5; });
    confState = { questions: shuffled.slice(0, 10), current: 0, score: 0, maxScore: 0, answers: [] };
    showConfQuestion();
}

function showConfQuestion() {
    if (confState.current >= confState.questions.length) { endConfession(); return; }
    var q = confState.questions[confState.current];
    document.getElementById('conf-progress').textContent = 'Domanda ' + (confState.current + 1) + '/' + confState.questions.length;
    document.getElementById('conf-score-display').textContent = 'Punti: ' + confState.score;
    document.getElementById('conf-question').textContent = q.q;
    document.getElementById('conf-feedback').textContent = '';
    document.getElementById('conf-options').innerHTML = q.o.map(function(opt, i) {
        return '<button class="quiz-opt-btn" onclick="answerConf(' + i + ')">' + opt.t + '</button>';
    }).join('');
}

function answerConf(i) {
    var q = confState.questions[confState.current];
    var points = q.o[i].p;
    confState.score += points;
    confState.maxScore += 4;
    confState.answers.push({ q: q.q, a: q.o[i].t, p: points });
    var msgs = ['Hmm... 🤔','Interessante... 💭','Oh! 💕','Molto onesta! 💋'];
    document.getElementById('conf-feedback').textContent = msgs[points - 1];
    document.querySelectorAll('#conf-options .quiz-opt-btn').forEach(function(b) { b.disabled = true; });
    confState.current++;
    setTimeout(showConfQuestion, 1500);
}

function endConfession() {
    document.getElementById('conf-game').style.display = 'none';
    document.getElementById('conf-result').style.display = 'block';
    var pct = Math.round((confState.score / confState.maxScore) * 100);
    var xp = confState.score * 15;
    var title, text, profileType;
    if (pct >= 85) { title = 'Sissy Completa 👑'; text = 'Non hai dubbi su chi sei. La tua devozione è totale.'; profileType = 'Devoted Cockslut'; }
    else if (pct >= 65) { title = 'Sissy in Crescita 💋'; text = 'Stai abbracciando la tua natura. Continua così.'; profileType = 'Eager Sissy'; }
    else if (pct >= 45) { title = 'Sissy Curiosa 💕'; text = 'C\'è tanto desiderio dentro di te. Lascialo uscire.'; profileType = 'Curious Sissy'; }
    else { title = 'All\'Inizio del Viaggio 🌸'; text = 'Stai esplorando. Va bene così. Ogni passo conta.'; profileType = 'Sissy Seedling'; }
    document.getElementById('conf-result-title').textContent = title;
    document.getElementById('conf-result-text').textContent = 'Score: ' + confState.score + '/' + confState.maxScore + ' (' + pct + '%) — ' + text;
    document.getElementById('conf-result-profile').textContent = '💜 Il tuo profilo: ' + profileType;
    document.getElementById('conf-xp').textContent = '+' + xp + ' XP';
    profile.gamesPlayed++;
    addDNA('submission', Math.floor(pct / 10));
    addDNA('devotion', Math.floor(pct / 15));
    addDNA('femininity', Math.floor(pct / 20));
    addDNA('addiction', 3);
    addXP(xp, 'Cock Confession');
    DB.set('confCount', (DB.get('confCount', 0)) + 1);
}

// ============ GAME 11: WORSHIP WORDS ============
var WW_SENTENCES = [
    { s: 'I am a ___ girl who loves to serve', answer: 'good', options: ['good','bad','strong','free'] },
    { s: 'My place is on my ___ before him', answer: 'knees', options: ['knees','feet','back','chair'] },
    { s: 'A real sissy always ___ her master', answer: 'obeys', options: ['obeys','ignores','questions','leaves'] },
    { s: 'The alpha\'s cock deserves my complete ___', answer: 'worship', options: ['worship','attention','criticism','ignorance'] },
    { s: 'I exist to ___ and serve', answer: 'please', options: ['please','fight','resist','complain'] },
    { s: 'When he says kneel, I ___ immediately', answer: 'kneel', options: ['kneel','run','think','laugh'] },
    { s: 'His cock is ___ and I am small', answer: 'superior', options: ['superior','equal','inferior','similar'] },
    { s: 'I feel most ___ when I am submissive', answer: 'feminine', options: ['feminine','angry','bored','masculine'] },
    { s: 'My mouth was made to ___ cock', answer: 'worship', options: ['worship','bite','avoid','hate'] },
    { s: 'Submission brings me ___ and peace', answer: 'joy', options: ['joy','pain','anger','confusion'] },
    { s: 'I ___ my sissy nature with pride', answer: 'embrace', options: ['embrace','deny','hide','fight'] },
    { s: 'A good sissy never says ___', answer: 'no', options: ['no','yes','please','thanks'] },
    { s: 'I am ___ to this feeling and I love it', answer: 'addicted', options: ['addicted','immune','opposed','indifferent'] },
    { s: 'His ___ makes me feel complete', answer: 'dominance', options: ['dominance','weakness','absence','kindness'] },
    { s: 'I want to be his perfect ___', answer: 'girl', options: ['girl','enemy','rival','equal'] },
];

var wwState = {};

function startWorshipWords() {
    document.getElementById('ww-start').style.display = 'none';
    document.getElementById('ww-result').style.display = 'none';
    document.getElementById('ww-game').style.display = 'block';
    var shuffled = WW_SENTENCES.slice().sort(function() { return Math.random() - 0.5; });
    wwState = { sentences: shuffled.slice(0, 10), current: 0, score: 0, correct: 0 };
    showWWQuestion();
}

function showWWQuestion() {
    if (wwState.current >= wwState.sentences.length) { endWorshipWords(); return; }
    var s = wwState.sentences[wwState.current];
    document.getElementById('ww-progress').textContent = 'Frase ' + (wwState.current + 1) + '/' + wwState.sentences.length;
    document.getElementById('ww-score-display').textContent = 'Score: ' + wwState.score;
    document.getElementById('ww-sentence').textContent = s.s;
    document.getElementById('ww-feedback').textContent = '';
    var opts = s.options.slice().sort(function() { return Math.random() - 0.5; });
    document.getElementById('ww-options').innerHTML = opts.map(function(opt) {
        return '<button class="quiz-opt-btn" onclick="answerWW(this, \'' + opt + '\')">' + opt + '</button>';
    }).join('');
}

function answerWW(btn, answer) {
    var s = wwState.sentences[wwState.current];
    var correct = answer === s.answer;
    var btns = document.querySelectorAll('#ww-options .quiz-opt-btn');
    btns.forEach(function(b) {
        b.disabled = true;
        if (b.textContent === s.answer) b.classList.add('correct');
        if (b === btn && !correct) b.classList.add('wrong');
    });
    if (correct) {
        wwState.score += 100;
        wwState.correct++;
        document.getElementById('ww-feedback').textContent = 'Good girl! 💋 ' + s.s.replace('___', '✨' + s.answer + '✨');
    } else {
        document.getElementById('ww-feedback').textContent = 'La parola era: ' + s.answer + ' — ' + s.s.replace('___', s.answer);
    }
    wwState.current++;
    setTimeout(showWWQuestion, 2500);
}

function endWorshipWords() {
    document.getElementById('ww-game').style.display = 'none';
    document.getElementById('ww-result').style.display = 'block';
    var pct = Math.round((wwState.correct / wwState.sentences.length) * 100);
    var xp = wwState.score;
    var title;
    if (pct >= 90) title = 'Vocabolario devoto perfetto! 👑';
    else if (pct >= 70) title = 'Brava! Conosci le parole giuste! 💋';
    else if (pct >= 50) title = 'Devi espandere il tuo vocabolario! 💕';
    else title = 'Una sissy deve conoscere le parole dell\'adorazione! 🎀';
    document.getElementById('ww-result-title').textContent = title;
    document.getElementById('ww-result-text').textContent = wwState.correct + '/' + wwState.sentences.length + ' corrette (' + pct + '%)';
    document.getElementById('ww-xp').textContent = '+' + xp + ' XP';
    profile.gamesPlayed++;
    addDNA('submission', Math.floor(wwState.correct / 2));
    addDNA('obedience', Math.floor(wwState.correct / 3));
    addXP(xp, 'Worship Words');
}

// ============ SESSIONS BM ============
var SESSIONS = {
    1: { title: 'First Gaze', lines: [
        'Guardalo.','Non distogliere lo sguardo. Respira lentamente.','Nota la forma. I dettagli. Ogni curva.',
        'Senti come il tuo corpo reagisce solo guardando.','Non c\'è niente di sbagliato. È naturale.',
        'Immagina di essere in ginocchio davanti a lui.','Senti il calore. Il profumo della sua pelle.',
        'La tua bocca si apre leggermente. È un istinto.','Inizia a toccarti. Lentamente.',
        'Guarda. Tocca. Respira. Tutto è collegato.','Questo è il tuo posto. In ginocchio. Felice.',
        'Quando sei vicina, fermati. Respira.','Dì mentalmente: "Grazie per avermi mostrato chi sono."',
        'Sessione completata. Torna domani. 💋'
    ]},
    2: { title: 'Size Acceptance', lines: [
        'Guarda le due realtà.','A sinistra: grande. Duro. Potente.','A destra: piccola. Chiusa. Non fatta per quel compito.',
        'Non è un insulto. È una verità liberatoria.','Tu non sei fatta per penetrare. Non è il tuo ruolo.',
        'Il tuo ruolo è accogliere. Servire. Adorare.','Il tuo piacere viene da LUI. Non dalla tua clitty.',
        'Sfiorala appena. Senti la frustrazione.','Quella frustrazione è buona. Stai accettando.',
        'Concentrati solo sull\'immagine grande.','È caldo. È vivo. È tutto quello che il tuo non è.',
        'E questo ti rende felice.','Ripeti: "Il suo è superiore. Il mio è inferiore. E va bene così."',
        'Sessione completata. 💋'
    ]},
    3: { title: 'Surrender', lines: [
        'Lui ti sta guardando. Dall\'alto.','La sua mano scende verso il tuo mento.',
        'Ti alza il viso. Ti costringe a guardarlo.','Respira. Senti il tuo corpo ammorbidirsi.',
        'Ogni resistenza... lasciala andare.','Non devi essere forte adesso. Lui decide. Tu segui.',
        'Tocca il tuo viso come lo farebbe lui.','Dì ad alta voce, piano: "Sono tua."',
        'Sentilo nelle ossa. Non è un gioco.','Chiudi gli occhi 10 secondi. Immagina la scena.',
        'Apri gli occhi. Toccati.','Ogni tocco è un suo regalo.',
        'La sua mano ti guida verso il basso.','Tu scendi volontariamente. Non c\'è forza. C\'è volontà.',
        'Questo è il vero potere: scegliere di arrendersi.','Avvicinati al bordo. Dì: "Grazie, Sir." Poi fermati.',
        'La resa è il primo passo verso la libertà. 💋'
    ]}
};

var sessionState = {};

function startSession(id) {
    var session = SESSIONS[id];
    if (!session) return;
    showPage('session-player');
    sessionState = { running: true, sessionId: id, lineIndex: 0, timeout: null };
    document.getElementById('session-text').textContent = '';
    document.getElementById('session-text').classList.remove('visible');
    document.getElementById('session-bar').style.width = '0%';
    setTimeout(function() { showSessionLine(); }, 1000);
}

function showSessionLine() {
    if (!sessionState.running) return;
    var session = SESSIONS[sessionState.sessionId];
    if (sessionState.lineIndex >= session.lines.length) { endSession(); return; }
    var textEl = document.getElementById('session-text');
    textEl.classList.remove('visible');
    setTimeout(function() {
        textEl.textContent = session.lines[sessionState.lineIndex];
        textEl.classList.add('visible');
        var progress = ((sessionState.lineIndex + 1) / session.lines.length) * 100;
        document.getElementById('session-bar').style.width = progress + '%';
        sessionState.lineIndex++;
        sessionState.timeout = setTimeout(function() { showSessionLine(); }, 8000);
    }, 1500);
}

function endSession() {
    sessionState.running = false;
    profile.sessionsCompleted++;
    addDNA('devotion', 5); addDNA('submission', 5); addDNA('femininity', 3); addDNA('obedience', 3); addDNA('addiction', 3);
    addXP(150, 'Sessione: ' + SESSIONS[sessionState.sessionId].title);
    setTimeout(function() { showPage('sessions'); showToast('Sessione completata! +150 XP 💋'); }, 3000);
}

function exitSession() {
    sessionState.running = false;
    clearTimeout(sessionState.timeout);
    showPage('sessions');
}

// ============ INIT ============
updateStreak();
updateAllUI();
checkAchievements();
setInterval(function() { profile.totalTime++; if (profile.totalTime % 60 === 0) DB.set('profile', profile); }, 1000);
