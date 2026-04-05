// ==========================================
//  SISSY GAMES — APP v4 FIXED
// ==========================================

const DB = {
    get: function(key, def) {
        if (def === undefined) def = null;
        try { var v = localStorage.getItem('sg_' + key); return v ? JSON.parse(v) : def; }
        catch(e) { return def; }
    },
    set: function(key, val) { localStorage.setItem('sg_' + key, JSON.stringify(val)); }
};

var profile = DB.get('profile', {
    name: '', xp: 0, level: 1, gamesPlayed: 0, sessionsCompleted: 0,
    streak: 0, bestStreak: 0, lastVisit: null, totalTime: 0,
    dna: { devotion: 0, femininity: 0, obedience: 0, submission: 0, addiction: 0 },
    achievements: [], checkinToday: null, diary: []
});

function saveProfile() {
    var input = document.getElementById('sissy-name-input');
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
    var today = new Date().toDateString();
    if (profile.lastVisit !== today) {
        var yesterday = new Date(Date.now() - 86400000).toDateString();
        profile.streak = (profile.lastVisit === yesterday) ? profile.streak + 1 : 1;
        profile.lastVisit = today;
        if (profile.streak > profile.bestStreak) profile.bestStreak = profile.streak;
        DB.set('profile', profile);
    }
}

var ACHIEVEMENTS = [
    { id: 'first_game', name: '🎮 Prima Partita', desc: 'Gioca il primo gioco', check: function() { return profile.gamesPlayed >= 1; } },
    { id: 'ten_games', name: '🔟 Dieci Giochi', desc: 'Gioca 10 partite', check: function() { return profile.gamesPlayed >= 10; } },
    { id: 'streak_7', name: '🔥 7 Giorni', desc: 'Streak di 7 giorni', check: function() { return profile.bestStreak >= 7; } },
    { id: 'level_5', name: '⭐ Livello 5', desc: 'Raggiungi livello 5', check: function() { return profile.level >= 5; } },
    { id: 'level_10', name: '👑 Livello 10', desc: 'Raggiungi livello 10', check: function() { return profile.level >= 10; } },
    { id: 'first_session', name: '🧠 Prima Sessione', desc: 'Completa una sessione', check: function() { return profile.sessionsCompleted >= 1; } },
    { id: 'devoted', name: '💋 Devota', desc: 'Devotion a 50+', check: function() { return profile.dna.devotion >= 50; } },
    { id: 'xp1000', name: '✨ 1000 XP', desc: 'Accumula 1000 XP', check: function() { return profile.xp >= 1000; } }
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
    if (!reactionState.startTime) return;
    var time = Date.now() - reactionState.startTime;
    reactionState.startTime = 0;
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
    catcherState = { running: true, score: 0, combo: 0, maxCombo: 0, items: [], playerX: canvas.width / 2, animFrame: null, timeLeft: 60, timerInterval: null };
    canvas.onmousemove = function(e) { var r = canvas.getBoundingClientRect(); catcherState.playerX = (e.clientX - r.left) * (canvas.width / r.width); };
    canvas.ontouchmove = function(e) { e.preventDefault(); var r = canvas.getBoundingClientRect(); catcherState.playerX = (e.touches[0].clientX - r.left) * (canvas.width / r.width); };
    document.getElementById('catcher-score').textContent = 'Score: 0';
    document.getElementById('catcher-combo').textContent = 'Combo: 0';
    document.getElementById('catcher-timer').textContent = 'Tempo: 60s';
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
                if (it.good) {
                    catcherState.score += 10 + catcherState.combo * 2;
                    catcherState.combo++;
                    if (catcherState.combo > catcherState.maxCombo) catcherState.maxCombo = catcherState.combo;
                } else {
                    catcherState.score = Math.max(0, catcherState.score - 20);
                    catcherState.combo = 0;
                }
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
    document.getElementById('catcher-result-text').textContent = 'Score: ' + catcherState.score + ' — Combo max: ' + catcherState.maxCombo;
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
    document.getElementById('mantra-timer').textContent = 'Tempo: 60s';
    document.getElementById('mantra-score').textContent = 'Score: 0';
    document.getElementById('mantra-completed').textContent = '0';
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
    gazeState = { running: true, timer: 0, interval: null, confirmTimeout: null, failed: false, nextConfirm: 15 + Math.floor(Math.random() * 15) };
    document.getElementById('gaze-center').innerHTML = '<div class="gaze-symbol">👑</div><div class="gaze-text" id="gaze-affirmation"></div>';
    document.getElementById('gaze-timer').textContent = '0:00';
    document.getElementById('gaze-btn').style.display = 'none';
    gazeState.interval = setInterval(function() {
        if (!gazeState.running) return;
        gazeState.timer++;
        var min = Math.floor(gazeState.timer / 60);
        var sec = gazeState.timer % 60;
        document.getElementById('gaze-timer').textContent = min + ':' + (sec < 10 ? '0' : '') + sec;
        if (gazeState.timer % 5 === 0) {
            var aff = GAZE_MSGS[Math.floor(Math.random() * GAZE_MSGS.length)];
            var el = document.getElementById('gaze-affirmation');
            if (el) { el.style.opacity = 0; setTimeout(function() { if (el) { el.textContent = aff; el.style.opacity = 0.7; } }, 500); }
        }
        if (gazeState.timer === gazeState.nextConfirm) {
            showGazeConfirm();
            gazeState.nextConfirm = gazeState.timer + 15 + Math.floor(Math.random() * 15);
        }
    }, 1000);
}

function showGazeConfirm() {
    var btn = document.getElementById('gaze-btn');
    if (btn) btn.style.display = 'block';
    gazeState.confirmTimeout = setTimeout(function() { if (gazeState.running) { gazeState.failed = true; endGaze(); } }, 3000);
}

function gazeConfirm() {
    clearTimeout(gazeState.confirmTimeout);
    document.getElementById('gaze-btn').style.display = 'none';
}

function endGaze() {
    if (!gazeState.running) return;
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
    { q: 'Un pene può fratturarsi?', o: ['No, non
