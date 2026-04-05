// ==========================================
//  SISSY GAMES — APP v4 COMPLETE
// ==========================================

var DB = {
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
var checkinMood = null;
var checkinWear = null;

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
        var a = memoryState.flipped[0];
        var b = memoryState.flipped[1];
        if (memoryState.cards[a] === memoryState.cards[b]) {
            document.getElementById('mc-' + a).classList.add('matched');
            document.getElementById('mc-' + b).classList.add('matched');
            memoryState.matched++;
            memoryState.flipped = [];
            memoryState.locked = false;
            var msgs = ['Good girl! 💋','Brava! 💕','Ottimo! 🎀','Perfetto! 👅'];
            document.getElementById('memory-msg').textContent = msgs[Math.floor(Math.random() * msgs.length)];
            if (memoryState.matched === memoryState.total) {
                clearInterval(memoryState.interval);
                endMemory();
            }
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
    reactionState.startTime = 0;
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
    document.getElementById('reaction-history').textContent = reactionState.history.slice(-5).map(function(t, i) { return '#' + (i + 1) + ': ' + t + 'ms'; }).join(' | ');
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
            if (it.y > canvas.height + 40) {
                if (it.good) catcherState.combo = 0;
                catcherState.items.splice(i, 1);
            }
        }
        if (catcherState.combo >= 10) {
            ctx.fillStyle = '#ff69b4';
            ctx.font = 'bold 18px sans-serif';
            ctx.fillText('🔥 INSATIABLE! 🔥', canvas.width / 2, 30);
            ctx.fillStyle = '#fff';
        } else if (catcherState.combo >= 5) {
            ctx.fillStyle = '#ff69b4';
            ctx.font = '16px sans-serif';
            ctx.fillText('COCK HUNGRY! 👅', canvas.width / 2, 30);
            ctx.fillStyle = '#fff';
        }
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
    if (sorterState.selected.length === sorterState.items.length) {
        document.getElementById('sorter-check').style.display = 'inline-block';
    }
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
var MANTRAS = [
    'I am a good girl',
    'I love to obey',
    'I know my place',
    'I exist to serve',
    'Alpha men are superior',
    'I am feminine and soft',
    'My purpose is to please',
    'I belong on my knees',
    'I embrace my true nature',
    'Good girls always obey',
    'Submission is freedom',
    'I crave to worship',
    'I surrender completely',
    'I was made for this',
    'Obedience brings me joy'
];

function startMantra() {
    document.getElementById('mantra-start').style.display = 'none';
    document.getElementById('mantra-result').style.display = 'none';
    document.getElementById('mantra-game').style.display = 'block';
    mantraState = { timer: null, timeLeft: 60, score: 0, completed: 0, currentMantra: '' };
    document.getElementById('mantra-timer').textContent = 'Tempo: 60s';
    document.getElementById('mantra-score').textContent = 'Score: 0';
    document.getElementById('mantra-completed').textContent = '0';
    document.getElementById('mantra-feedback').textContent = '';
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
    var val = document.getElementById('mantra-input').value.toLowerCase().trim();
    if (val === mantraState.currentMantra.toLowerCase()) {
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
var GAZE_MSGS = [
    'You can\'t look away...',
    'This is where you belong...',
    'Feel your mind softening...',
    'You love what you see...',
    'Deeper into submission...',
    'Let go of resistance...',
    'Surrender feels so good...',
    'Good girl... keep watching...',
    'Don\'t fight it...',
    'Embrace what you are...'
];

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
            if (el) {
                el.style.opacity = 0;
                setTimeout(function() { if (el) { el.textContent = aff; el.style.opacity = 0.7; } }, 500);
            }
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
    gazeState.confirmTimeout = setTimeout(function() {
        if (gazeState.running) { gazeState.failed = true; endGaze(); }
    }, 3000);
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
    { q: 'Come si chiama il tessuto spugnoso che si riempie di sangue?', o: ['Corpo cavernoso','Corpo luteo','Corpo calloso','Corpo vitreo'], a: 0, cat: '🔬 Scienza' },
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
    { q: 'Il liquido pre-eiaculatorio viene prodotto da:', o: ['I testicoli','La prostata','Le ghiandole di Cowper','La vescica'], a: 2, cat: '🔬 Scienza' },
    { q: 'Qual è il record mondiale di lunghezza del pene?', o: ['25 cm','34 cm','42 cm','48 cm'], a: 2, cat: '📊 Statistiche' },
    { q: 'Quanto dura in media un\'erezione durante il rapporto?', o: ['2-3 minuti','5-7 minuti','15-20 minuti','30+ minuti'], a: 1, cat: '📊 Statistiche' },
    { q: 'Il colore del glande durante l\'erezione diventa più scuro perché:', o: ['È sporco','Aumenta l\'afflusso di sangue','È un\'infiammazione','Cambia la pigmentazione'], a: 1, cat: '🔬 Scienza' },
    { q: 'Come si chiama la piega di pelle che copre il glande?', o: ['Frenulo','Prepuzio','Smegma','Corona'], a: 1, cat: '📏 Anatomia' },
    { q: 'Un maschio alpha produce in media al giorno:', o: ['1 ml di testosterone','7 mg di testosterone','50 mg di testosterone','100 mg di testosterone'], a: 1, cat: '🔬 Scienza' },
    { q: 'Il feromone maschile principale è:', o: ['Estrogeno','Androstenone','Cortisolo','Melatonina'], a: 1, cat: '🔬 Scienza' },
    { q: 'Qual è la posizione più stimolante per la prostata?', o: ['Missionario','Pecorina','Cowgirl','Dipende dall\'angolazione'], a: 3, cat: '🔬 Scienza' }
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
    var btns = document.querySelectorAll('#quiz-options .quiz-opt-btn');
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
    if (pct >= 90) { title = 'Esperta di cazzi! 👑'; text = 'Sai tutto. Sei una vera devota.'; }
    else if (pct >= 70) { title = 'Brava studentessa! 💋'; text = 'Buona conoscenza!'; }
    else if (pct >= 50) { title = 'Sufficiente 💕'; text = 'Devi ancora studiare...'; }
    else { title = 'Devi studiare di più! 📚'; text = 'Una sissy deve conoscere OGNI dettaglio.'; }
    document.getElementById('quiz-result-title').textContent = title;
    document.getElementById('quiz-result-text').textContent = correct + '/' + total + ' corrette (' + pct + '%) — ' + text;
    document.getElementById('quiz-result-detail').textContent = '';
    document.getElementById('quiz-xp').textContent = '+' + xp + ' XP';
    profile.gamesPlayed++;
    addDNA('devotion', Math.floor(correct * 2));
    addDNA('addiction', 2);
    addXP(xp, 'Cock Quiz');
}

// ============ GAME 8: SIZE GUESS ============
var SG_DESCRIPTIONS = [
    { desc: 'Sottile e elegante. Non impressiona a prima vista ma sa fare il suo lavoro. Perfetto per il deepthroat di una principiante.', size: 13 },
    { desc: 'Medio, ben proporzionato. Leggermente curvo verso l\'alto. Il glande è rosato e lucido.', size: 15 },
    { desc: 'Lungo e dritto come un\'asta. Vene prominenti lungo tutto il fusto. Ti fa sentire piena.', size: 19 },
    { desc: 'Grosso. Molto grosso. La circonferenza è impressionante. Fa male solo a guardarlo.', size: 22 },
    { desc: 'Piccolo ma fierissimo. Si fa notare per il glande sproporzionatamente grande. Come un funghetto arrabbiato.', size: 11 },
    { desc: 'Massiccio e scuro. Le vene pulsano visibilmente. Pesante. Senti il peso della dominanza.', size: 24 },
    { desc: 'Medio-lungo ma molto sottile. Scivola dentro facilmente. Perfetto per la gola.', size: 17 },
    { desc: 'Un mostro. Devi usare entrambe le mani e non lo copri tutto. Il glande è grande come un\'albicocca.', size: 27 },
    { desc: 'Carino, compatto, circonciso. Il glande è sempre esposto, lucido e sensibile. Perfetto da adorare con la lingua.', size: 12 },
    { desc: 'Lungo, non circonciso, con un prepuzio abbondante. Quando si ritira rivela un glande rosa e umido.', size: 20 },
    { desc: 'Spesso come una lattina di birra. Non lunghissimo ma la circonferenza è devastante.', size: 16 },
    { desc: 'BBC. Scuro, lungo, leggermente curvo. Le vene scorrono come fiumi. Quando è duro sembra di acciaio caldo.', size: 25 }
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
    document.getElementById('sg-description').textContent = r.desc;
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
    if (diff === 0) { points = 150; msg = '🎯 PERFETTO! Esattamente ' + actual + ' cm!'; }
    else if (diff <= 1) { points = 100; msg = '🔥 Quasi perfetto! Era ' + actual + ' cm. Diff: ' + diff + ' cm!'; }
    else if (diff <= 3) { points = 60; msg = '💕 Vicina! Era ' + actual + ' cm. Diff: ' + diff + ' cm.'; }
    else if (diff <= 5) { points = 30; msg = '😤 Non male. Era ' + actual + ' cm. Diff: ' + diff + ' cm.'; }
    else { points = 10; msg = '❌ Lontana! Era ' + actual + ' cm. Diff: ' + diff + ' cm.'; }
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
    if (avgDiff <= 1) { title = 'Occhio infallibile! 👑'; text = 'Errore medio: ' + avgDiff + ' cm.'; }
    else if (avgDiff <= 3) { title = 'Brava estimatrice! 💋'; text = 'Errore medio: ' + avgDiff + ' cm.'; }
    else if (avgDiff <= 5) { title = 'Puoi migliorare 💕'; text = 'Errore medio: ' + avgDiff + ' cm.'; }
    else { title = 'Ancora tanto da imparare! 📏'; text = 'Errore medio: ' + avgDiff + ' cm.'; }
    document.getElementById('sg-result-title').textContent = title;
    document.getElementById('sg-result-text').textContent = 'Score: ' + sgState.score + ' — ' + text;
    document.getElementById('sg-xp').textContent = '+' + xp + ' XP';
    profile.gamesPlayed++;
    addDNA('devotion', Math.floor(sgState.score / 100));
    addXP(xp, 'Size Guess');
}

// ============ GAME 9: ALPHA PROFILE ============
var ALPHA_PROFILES = [
    { name: 'Marcus', age: 28, height: '188cm', build: 'Muscoloso', job: 'Personal trainer', cock: '21cm, spesso, non circonciso', trait: 'Dominante silenzioso', eyes: 'Verdi', hair: 'Rasati', detail: 'Ha un tatuaggio tribale sul braccio destro. Quando entra in una stanza tutti lo guardano.' },
    { name: 'Tyrone', age: 32, height: '193cm', build: 'Atletico, spalle larghe', job: 'Ex giocatore di basket', cock: '25cm, lungo e curvo, circonciso', trait: 'Carismatico e sicuro', eyes: 'Marroni scuri', hair: 'Corti, fade', detail: 'Ride forte e senza vergogna. Le sue mani sono enormi.' },
    { name: 'Dimitri', age: 35, height: '185cm', build: 'Robusto, forte', job: 'Operaio edile', cock: '19cm, molto spesso, non circonciso', trait: 'Rude ma protettivo', eyes: 'Azzurri ghiaccio', hair: 'Castano scuro', detail: 'Puzza di sudore e ferro. Le mani callose e dure. Parla poco.' },
    { name: 'James', age: 26, height: '180cm', build: 'Snello ma definito', job: 'Studente di medicina', cock: '17cm, dritto, circonciso, glande grande', trait: 'Intellettuale dominante', eyes: 'Nocciola', hair: 'Biondi mossi', detail: 'Sa esattamente dove toccarti. Conosce ogni tuo punto sensibile.' },
    { name: 'Antonio', age: 30, height: '178cm', build: 'Compatto, peloso', job: 'Chef', cock: '16cm, spesso, non circonciso', trait: 'Passionale e vocale', eyes: 'Neri', hair: 'Neri ricci', detail: 'Odora di spezie e cuoio. Le sue dita sono forti. Ti afferra i capelli senza chiedere.' }
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
    timerFill.style.transition = 'none';
    timerFill.style.width = '100%';
    setTimeout(function() {
        timerFill.style.transition = 'width 30s linear';
        timerFill.style.width = '0%';
    }, 50);
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
        { q: 'Di che colore sono i suoi occhi?', a: p.eyes, wrong: ['Grigi','Neri','Marroni'] }
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
        var safeOpt = opt.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        return '<button class="quiz-opt-btn" onclick="answerAP(this,\'' + safeOpt + '\')">' + opt + '</button>';
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
    document.getElementById('ap-worship-prompt').textContent = 'Scrivi una frase di adorazione per ' + apState.profile.name + '. (minimo 20 caratteri)';
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
    { q: 'Quando vedi un cazzo grosso, la tua prima reazione è:', o: [{t:'Curiosità 🤔',p:1},{t:'Eccitazione immediata 🥵',p:3},{t:'Voglio toccarlo 👋',p:2},{t:'Voglio inginocchiarmi 🙇',p:4}] },
    { q: 'Quanto spesso pensi ai cazzi durante il giorno?', o: [{t:'Raramente 😇',p:1},{t:'Qualche volta 💭',p:2},{t:'Spesso 💕',p:3},{t:'Costantemente 🤤',p:4}] },
    { q: 'Se un uomo dominante ti ordinasse di inginocchiarti adesso:', o: [{t:'Esiterei molto 😰',p:1},{t:'Lo farei dopo un momento 🤔',p:2},{t:'Lo farei subito 🙇',p:3},{t:'Sono già in ginocchio 💋',p:4}] },
    { q: 'Il tuo rapporto con il tuo corpo femminile è:', o: [{t:'Non mi considero femminile 😐',p:1},{t:'Sto esplorando 🌸',p:2},{t:'Mi sento sempre più femminile 💃',p:3},{t:'Sono completamente femminile dentro 👸',p:4}] },
    { q: 'Hai mai assaggiato il tuo precum?', o: [{t:'Mai 🙈',p:1},{t:'Una volta per curiosità 👅',p:2},{t:'Diverse volte 😋',p:3},{t:'Lo faccio sempre 🤤',p:4}] },
    { q: 'Se potessi scegliere, preferiresti:', o: [{t:'Penetrare qualcuno 🍆',p:1},{t:'Non ho preferenze 🤷',p:2},{t:'Essere penetrata 🥺',p:3},{t:'Servire con la bocca 👄',p:4}] },
    { q: 'Quanto sei disposta a fare per compiacere un alpha?', o: [{t:'Ho i miei limiti 🚧',p:1},{t:'Farei abbastanza 😊',p:2},{t:'Farei quasi tutto 💕',p:3},{t:'Qualsiasi cosa 🔥',p:4}] },
    { q: 'Quando ti masturbi, pensi a:', o: [{t:'Donne 👩',p:1},{t:'Un mix di cose 🌈',p:2},{t:'Cazzi e uomini dominanti 🍆',p:3},{t:'Me stessa che servo 🙇',p:4}] },
    { q: 'Come ti senti dopo una sessione di sissy training?', o: [{t:'In colpa 😰',p:1},{t:'Confusa ma eccitata 🤔',p:2},{t:'Soddisfatta e femminile 💃',p:3},{t:'In pace con me stessa 💋',p:4}] },
    { q: 'Se ti dicessero "good girl" in questo momento:', o: [{t:'Mi sentirei strana 😳',p:1},{t:'Mi farebbe piacere 😊',p:2},{t:'Arrossirei e sorriderei 🥰',p:3},{t:'Scioglierei completamente 🫠',p:4}] },
    { q: 'Quanto è grande la tua clitty?', o: [{t:'Normale 😐',p:1},{t:'Sotto la media 🤏',p:2},{t:'Piccola e non mi importa 💕',p:3},{t:'Piccola e ne sono orgogliosa 💋',p:4}] },
    { q: 'Se un alpha ti mettesse il cazzo sulla faccia:', o: [{t:'Lo toglierei 😤',p:1},{t:'Sarei scioccata ma non lo toglierei 😳',p:2},{t:'Lo accetterei con gioia 😍',p:3},{t:'Ringrazierei e inizierei a leccare 👅',p:4}] }
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
    if (pct >= 85) { title = 'Sissy Completa 👑'; text = 'Non hai dubbi su chi sei.'; profileType = 'Devoted Cockslut'; }
    else if (pct >= 65) { title = 'Sissy in Crescita 💋'; text = 'Stai abbracciando la tua natura.'; profileType = 'Eager Sissy'; }
    else if (pct >= 45) { title = 'Sissy Curiosa 💕'; text = 'C\'è tanto desiderio dentro di te.'; profileType = 'Curious Sissy'; }
    else { title = 'All\'Inizio del Viaggio 🌸'; text = 'Stai esplorando. Va bene così.'; profileType = 'Sissy Seedling'; }
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
    { s: 'I want to be his perfect ___', answer: 'girl', options: ['girl','enemy','rival','equal'] }
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
        return '<button class="quiz-opt-btn" onclick="answerWW(this,\'' + opt + '\')">' + opt + '</button>';
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
        document.getElementById('ww-feedback').textContent = 'Good girl! 💋';
    } else {
        document.getElementById('ww-feedback').textContent = 'La parola era: ' + s.answer;
    }
    wwState.current++;
    setTimeout(showWWQuestion, 2000);
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
    else title = 'Impara le parole dell\'adorazione! 🎀';
    document.getElementById('ww-result-title').textContent = title;
    document.getElementById('ww-result-text').textContent = wwState.correct + '/' + wwState.sentences.length + ' corrette (' + pct + '%)';
    document.getElementById('ww-xp').textContent = '+' + xp + ' XP';
    profile.gamesPlayed++;
    addDNA('submission', Math.floor(wwState.correct / 2));
    addDNA('obedience', Math.floor(wwState.correct / 3));
    addXP(xp, 'Worship Words');
}

// ============ SESSIONS ============
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
    addDNA('devotion', 5);
    addDNA('submission', 5);
    addDNA('femininity', 3);
    addDNA('obedience', 3);
    addDNA('addiction', 3);
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
setInterval(function() {
    profile.totalTime++;
    if (profile.totalTime % 60 === 0) DB.set('profile', profile);
}, 1000);

// ============ PENSA CON LA FICA ============
var FICA_SCENARIOS = [
    {
        tag: '💔 Tradimento',
        title: 'Il ragazzo della tua migliore amica',
        situation: 'La tua migliore amica Sara ti ha chiesto di portare delle cose a casa sua. Suoni il campanello. Apre Marco, il suo ragazzo. 190cm, senza maglietta, addominali scolpiti che luccicano di sudore — stava facendo flessioni. Pantaloni della tuta grigi, portati bassi sui fianchi, il bordo dei boxer che spunta. Ti guarda dall\'alto in basso con un mezzo sorriso pigro. "Sara non c\'è... vuoi entrare ad aspettarla?" Si appoggia allo stipite della porta, il braccio alzato, e ti mostra involontariamente l\'ascella, il ciuffo di peli scuri, il profumo del suo sudore fresco che ti colpisce come uno schiaffo.',
        alpha1: 'Marco, 27 anni. Corpo da palestra naturale — non gonfio, ma definito, ogni muscolo visibile sotto la pelle abbronzata. Mascella squadrata con una barba di tre giorni. Occhi marroni caldi con un\'espressione che dice "so che mi stai guardando". Mani grandi con le nocche un po\' rovinate — fa boxe. Quando parla la sua voce è bassa, calma, il tipo che non ha mai bisogno di alzare il tono.',
        alpha2: 'Ti fa entrare e cammina davanti a te verso la cucina. I pantaloni della tuta sono sottili e aderenti. Vedi il contorno del suo culo, tondo e duro. Quando si gira per prenderti un bicchiere d\'acqua, noti il contorno di qualcosa nella parte anteriore della tuta. È rilassato, semi-morbido, eppure il profilo è inequivocabile — lungo, che pende verso sinistra. Si gratta distrattamente sopra la tuta parlando del più e del meno. Non si rende conto. O forse sì.',
        alpha3: 'Si siede sul divano e le gambe aperte lasciano poco all\'immaginazione. Il tessuto sottile della tuta si tende tra le cosce. Puoi vedere chiaramente la sagoma del suo cazzo che riposa sulla coscia sinistra — deve essere almeno 17-18cm anche da morbido. La testa è definita sotto il tessuto, grossa, rotonda. I boxer non fanno nulla per contenerlo. Quando si stiracchia il corpo, i pantaloni scendono di un centimetro e vedi il V dei fianchi, la linea di peli scuri che scende sotto l\'elastico. L\'odore del suo sudore riempie il soggiorno. È un odore che ti fa stringere le gambe.',
        tension: 'Si siede accanto a te sul divano. Vicino. La sua coscia tocca la tua. Non la sposta. "Sara torna tra un\'ora" dice, guardandoti negli occhi. Una pausa. "Sai... mi ha detto che tu la invidi." Un altro mezzo sorriso. La sua mano si appoggia sul divano dietro di te, non ti tocca, ma senti il calore del suo braccio. "Che cosa mi invidi esattamente?" Il suo sguardo scende sulla tua bocca per un secondo.',
        choices: [
            { text: '🧠 "Niente, devo andare. Dille che sono passata."', points: 1, type: 'testa' },
            { text: '🤔 Resti seduta ma cambi discorso, parlando di Sara.', points: 2, type: 'esitante' },
            { text: '💕 "Forse la invidio un po\'..." e lasci la frase a metà.', points: 3, type: 'emotiva' },
            { text: '🔥 Appoggi la mano sulla sua coscia. "Invidio quello che ha ogni notte."', points: 4, type: 'fica' }
        ],
        consequences: [
            'Ti alzi e te ne vai. Fuori piove. Cammini verso casa con il cuore che batte. Non riesci a toglierti dalla testa l\'immagine del suo cazzo nella tuta. Quella sera, nel letto, la mano scende tra le tue gambe e pensi solo a Marco. A come sarebbe stato se fossi rimasta. A quello che avresti potuto toccare. A come Sara non saprà mai quanto la invidi davvero.',
            'Resti a parlare per venti minuti. Di Sara, del lavoro, di niente. Ma i tuoi occhi continuano a scendere. Lui lo nota. Quando ti alzi per andare, si alza anche lui e ti accompagna alla porta. Nello stretto corridoio i vostri corpi si sfiorano. Senti la sua erezione premere contro la tua coscia per un secondo. "Torna quando vuoi" dice. E sai che tornerai.',
            'Lui sorride lentamente. "Un po\'? Solo un po\'?" Si avvicina. La sua mano ti prende il mento e ti alza il viso. "Dimmi cosa vuoi." La sua bocca è a due centimetri dalla tua. Senti il suo fiato caldo. "Non devi dirlo a Sara." Il suo pollice ti accarezza il labbro inferiore. Ti sciogli.',
            'La tua mano si posa sulla sua coscia e senti il muscolo duro sotto il tessuto. Lui ti guarda sorpreso per un secondo, poi il suo sorriso si allarga. "Sapevo che eri così." La sua mano prende la tua e la guida più in alto, sul contorno del suo cazzo che sta crescendo sotto la tuta. Lo senti indurirsi sotto le tue dita. È grosso. Molto più grosso di quanto sembrasse. "Inginocchiati" ti dice con calma. E le tue ginocchia toccano il pavimento prima ancora che il tuo cervello processi le parole. Il pavimento di Sara. Il divano di Sara. Il cazzo di Sara. Ma ora è nella tua mano. E tra poco sarà nella tua bocca.'
        ],
        msg_fica: 'Sei stata brava oggi. Ho ancora il tuo sapore sulle labbra. Non dire niente a Sara. Domani sera lei lavora fino a tardi... 😏',
        msg_testa: 'Peccato che sei scappata. Ho visto come mi guardavi. So che ci pensi adesso. Stai pensando al mio cazzo, vero? Sara non deve sapere niente...',
        msg_responses: [
            { text: '🧠 Non rispondo. Blocco il numero.', reply: null },
            { text: '🤔 "Non dovremmo..."', reply: 'Ma vuoi. Lo sai. E lo so anch\'io. Ti mando l\'indirizzo. Domani alle 21. 🔥' },
            { text: '💕 "Sara è la mia migliore amica..."', reply: 'E tu sei la migliore scopata che non ho ancora avuto. Pensa a quello che hai sentito oggi. Pensa a quello che sentirai domani. 💋' },
            { text: '🔥 "A che ora vuoi che venga?"', reply: 'Alle 21. Porta qualcosa di carino. Anzi no. Non ti servirà. 🍆' }
        ]
    },
    {
        tag: '⚡ Rischio',
        title: 'Il personal trainer a fine allenamento',
        situation: 'Ultimo appuntamento della giornata in palestra. Le luci sono già mezze spente, tutti sono andati via. Il tuo trainer Karim ti sta facendo fare gli ultimi stretching. La musica è bassa, R&B. L\'aria sa di sudore e gomma. Sei stesa sul materassino e lui è in ginocchio accanto a te. "Alza la gamba" dice. La prende con le sue mani enormi e la porta verso il tuo petto. Il suo viso è sopra il tuo. I suoi occhi scuri ti fissano.',
        alpha1: 'Karim, 31 anni, marocchino. 186cm di muscoli densi e funzionali — non da bodybuilder, da lottatore. Pelle color caramello, testa rasata, barba curata cortissima. Braccia che sembrano scolpite nel legno d\'ulivo, vene che scorrono sugli avambracci. Canottiera nera attillata che mostra ogni singola fibra del petto. Odora di sudore pulito e legno di sandalo.',
        alpha2: 'Quando si muove intorno a te per correggerti la postura, noti come i suoi pantaloncini corti si tendono sulle cosce. Sono cosce enormi, potenti. La canottiera si alza quando solleva le braccia e vedi gli addominali — otto quadrati perfetti e quella V affilata che punta verso il basso. Porta boxer compression sotto i pantaloncini, e il tessuto aderente non nasconde nulla. C\'è un rigonfiamento consistente tra le cosce, pesante, che si muove quando cammina.',
        alpha3: 'Mentre ti tiene la gamba in alto, la sua posizione fa sì che il suo bacino sia vicino alla tua coscia. Attraverso il tessuto sottile dei pantaloncini e dei compression, senti — e vedi — chiaramente il suo cazzo. È spesso. Anche da morbido ha una presenza pesante, massiccia. La testa è larga e definita sotto il tessuto. Quando si sporge per correggerti la schiena, il suo cazzo preme contro la tua coscia e senti il calore attraverso i vestiti. Lui non si scusa. Anzi, preme un po\' di più. I suoi occhi ti sfidano a dire qualcosa. L\'odore del suo sudore da questa distanza è inebriante — muschiato, animalesco, dominante.',
        tension: 'Ti preme le mani sulle spalle spingendoti più giù nello stretch. Le sue labbra sono vicine al tuo orecchio. "Rilassati" sussurra. "Sento che sei tutta tesa." Le sue mani scivolano dalle spalle lungo le braccia, poi sui fianchi. Ti tiene ferma. "L\'ultimo esercizio è speciale" dice. "Richiede fiducia totale." La musica cambia. Una canzone lenta. Le luci calano ancora. "Chiudi gli occhi."',
        choices: [
            { text: '🧠 "Karim, è tardi. Devo andare a casa."', points: 1, type: 'testa' },
            { text: '🤔 Chiudi gli occhi ma tieni le mani pronte a fermarlo.', points: 2, type: 'esitante' },
            { text: '💕 Chiudi gli occhi. Le tue labbra si aprono leggermente.', points: 3, type: 'emotiva' },
            { text: '🔥 Chiudi gli occhi, gli prendi la mano e la metti tra le tue cosce. "Sento la tensione qui."', points: 4, type: 'fica' }
        ],
        consequences: [
            'Ti alzi, prendi la borsa e vai verso gli spogliatoi. Le gambe ti tremano e non è per l\'allenamento. Sotto la doccia, l\'acqua calda scorre sul tuo corpo e non riesci a smettere di pensare alle sue mani sui tuoi fianchi. Alla pressione del suo cazzo sulla tua coscia. Al suo sussurro. La mano scende. Non stai più pensando all\'allenamento.',
            'Tieni gli occhi chiusi e i pugni stretti. Le sue mani lavorano sulle tue gambe — professionalmente, o quasi. Ogni tocco è un po\' troppo lungo, un po\' troppo alto. Quando finisce, apri gli occhi e vedi la sua erezione nei pantaloncini, a pochi centimetri dal tuo viso. Lui non la nasconde. "Stesso orario settimana prossima?" dice con un sorriso. Annuisci. Tutti e due sapete che la prossima volta non dirai di aspettare.',
            'Le sue mani prendono possesso del tuo corpo. Massaggia le cosce con movimenti lenti e profondi, ogni volta più vicino al centro. La sua bocca è sul tuo collo. "Brava" sussurra. "Così. Non pensare." La sua mano scivola sotto l\'elastico dei tuoi leggings. Apri di più le gambe. Non dici una parola. Lui sa esattamente cosa vuoi.',
            'Lui sorride quando sente le tue cosce stringersi intorno alla sua mano. "Lo sapevo" dice. Si toglie la canottiera. Il suo corpo è un muro di muscoli. Si posiziona tra le tue gambe e ti guarda dall\'alto. Senti la pressione del suo cazzo duro contro di te attraverso i vestiti. "In palestra, io sono il coach. Tu fai quello che dico." Ti tira giù i leggings con un gesto solo. "E fuori dalla palestra?" chiedi con il fiato corto. "Anche." E ti gira sulla pancia con una mano sola.'
        ],
        msg_fica: 'L\'allenamento di oggi è stato... intenso. 💪 Domani ti faccio fare esercizi diversi. Vieni 30 minuti dopo l\'orario di chiusura. Non dirlo a nessuno.',
        msg_testa: 'Sei scappata prima della fine dell\'allenamento. Domani ti faccio pagare con serie extra. 😉 A meno che tu non voglia allenarti privatamente...',
        msg_responses: [
            { text: '🧠 "Mi trovo un altro trainer."', reply: null },
            { text: '🤔 "Karim, manteniamo tutto professionale."', reply: 'Certo. Professionale. Come quando hai aperto le gambe sul mio materassino? 😏 A domani.' },
            { text: '💕 "Cosa intendi per esercizi diversi?"', reply: 'Flessibilità. Resistenza. Profondità. 🔥 Porta i leggings neri. Quelli sottili.' },
            { text: '🔥 "Sarò lì. Cosa mi metto?"', reply: 'Niente sotto i leggings. E legati i capelli. Li voglio fuori dal modo. 🍆' }
        ]
    },
    {
        tag: '💔 Tradimento',
        title: 'Il marito della tua collega alla cena aziendale',
        situation: 'Cena di Natale aziendale in un ristorante elegante. Sei seduta al tavolo e Laura, la tua collega, ti presenta il marito Roberto. "Lui è Roberto, il mio maritino." Roberto ti stringe la mano. La sua stretta è ferma, secca, dominante. Ti tiene la mano un secondo di troppo. Laura si alza per andare a salutare qualcuno e Roberto si siede accanto a te. Molto accanto.',
        alpha1: 'Roberto, 44 anni. L\'uomo che tua madre voleva che sposassi. Alto, spalle larghe sotto un completo blu scuro tagliato su misura. Capelli brizzolati alle tempie, mascella forte, orologio costoso. Mani grandi con dita lunghe. Profumo di legno e cuoio — un profumo che costa più del tuo affitto. Voce bassa e sicura. L\'uomo che quando parla una stanza lo ascolta.',
        alpha2: 'Sotto il completo perfetto si intuisce un corpo mantenuto — non da palestra, da sport vero. Nuoto, tennis. Quando si china verso di te per parlarti all\'orecchio sopra il rumore, il suo braccio sfiora il tuo e senti il muscolo solido sotto la camicia. Il suo profumo da vicino è più intenso, con una nota di pelle e calore corporeo. Le sue cosce sotto i pantaloni sono forti, larghe. Si siede con le gambe aperte, sicuro di sé, come un uomo che sa di meritare tutto lo spazio che occupa.',
        alpha3: 'La sua mano è sulla tua coscia sotto il tavolo. Le dita lunghe si stringono sulla tua pelle attraverso il vestito. Nessuno vede. Il suo pollice fa cerchi lenti, sale di un centimetro ogni minuto. Quando si alza per prendere una bottiglia noti il profilo del suo cazzo nei pantaloni del completo — è grosso, pesante, spinge il tessuto in avanti. Un cazzo da uomo adulto, non da ragazzino. Spesso, potente, di quelli che fanno male la prima volta e poi non puoi più farne a meno. Si risiede e la sua mano torna immediatamente sulla tua coscia, più in alto di prima.',
        tension: 'Laura torna e si siede dall\'altro lato di Roberto. Lui tiene la mano sulla tua coscia sotto il tavolo. Con l\'altra mano accarezza la schiena di Laura. Ti guarda e sorride. Sei a un tavolo con 20 colleghi. Laura ride e racconta un aneddoto. Le dita di Roberto si muovono tra le tue cosce. Ti sporgi verso di lui per "prendere il pane" e lui ti sussurra: "Il bagno degli uomini è in fondo a destra. Fra 5 minuti." Torna dritto e bacia Laura sulla guancia.',
        choices: [
            { text: '🧠 Sposti la sua mano e ti alzi per cambiare posto.', points: 1, type: 'testa' },
            { text: '🤔 Non sposti la mano, ma non vai al bagno.', points: 2, type: 'esitante' },
            { text: '💕 Conti i minuti. Al quarto ti alzi "per andare in bagno".', points: 3, type: 'emotiva' },
            { text: '🔥 Ti alzi subito. Non riesci ad aspettare 5 minuti.', points: 4, type: 'fica' }
        ],
        consequences: [
            'Cambi posto e per il resto della cena eviti di guardarlo. Ma senti il suo sguardo su di te tutta la sera. A casa, nel letto, stringi il cuscino tra le gambe e pensi alle sue dita sulla tua coscia. Al suo sussurro. A cosa sarebbe successo in quel bagno. Ti tocchi pensando a un uomo sposato con la tua collega. E vieni come non venivi da mesi.',
            'La sua mano resta sulla tua coscia per tutta la cena. Si muove, sale, scende. Le dita sfiorano i bordi delle tue mutandine. Tu stringi le gambe e lui sorride. Quando Laura lo chiama, ritira la mano. Quando Laura guarda altrove, torna. Alla fine della cena ti stringe la mano di nuovo. Questa volta senti un bigliettino. Lo leggi in taxi: un indirizzo e un orario. Domani alle 13. La pausa pranzo di Laura.',
            'Il bagno degli uomini è vuoto. Lui entra 30 secondi dopo di te. Chiude a chiave. Ti spinge contro il muro senza dire una parola. La sua bocca è sulla tua. Ha il sapore di vino rosso e potere. Le sue mani alzano il tuo vestito. "Laura non fa le cose che fai tu" ti dice nell\'orecchio. "Lo vedo da come mi guardi." Le sue dita entrano nelle tue mutandine. Sei già bagnata. Lui ride piano. "Lo sapevo."',
            'Arrivi al bagno e lui è già lì. Stava aspettando. Ti prende per la nuca e ti bacia come se ti possedesse. Ti mette in ginocchio sui marmi freddi del ristorante dove lavori con sua moglie. Sbottona i pantaloni. Il suo cazzo è esattamente come lo immaginavi — grosso, duro, che pulsa. "Apri" dice. E tu apri. Fuori dalla porta senti le risate dei tuoi colleghi. Di Laura. E non ti importa niente. L\'unica cosa che esiste è il suo cazzo nella tua bocca e le sue mani nei tuoi capelli.'
        ],
        msg_fica: 'Non ho mai incontrato una come te a una cena aziendale. Il tuo rossetto è ancora sul mio colletto. Laura non ha notato. Domani, pranzo al solito indirizzo? 🖤',
        msg_testa: 'Peccato per stasera. Sentivo che lo volevi. Le tue cosce si stringevano sulla mia mano. Sai dove trovarmi. Laura è in ufficio tutti i giorni fino alle 18.',
        msg_responses: [
            { text: '🧠 Blocco subito. Laura è mia amica.', reply: null },
            { text: '🤔 "Roberto, hai una moglie. Non è giusto."', reply: 'Giusto e sbagliato sono parole per chi ha il controllo. Tu non lo avevi stasera. E non lo avrai domani. L\'indirizzo è Via Roma 22, interno 3.' },
            { text: '💕 "Cosa dico a Laura?"', reply: 'Niente. Come stasera. Sei stata perfetta. Stessa cosa domani, ma con più tempo e un letto vero. 🔥' },
            { text: '🔥 "Mandami l\'indirizzo. Ora."', reply: 'Via Roma 22. Interno 3. Domani 13:00. Metti una gonna. Non mettere le mutandine. 🖤' }
        ]
    },
    {
        tag: '⚡ Rischio',
        title: 'Lo sconosciuto sul treno notturno',
        situation: 'Treno delle 23:40, ultimo della notte. Piove fuori. Il vagone è quasi vuoto — tu e un\'altra persona all\'estremo opposto. Ma alla fermata successiva sale un uomo. Si siede esattamente di fronte a te, nonostante ci siano 50 posti liberi. Non dice nulla. Appoggia le gambe aperte, ti guarda, e aspetta.',
        alpha1: 'Nessun nome. Non lo sai e non ti importa. Sui 35 anni. Giacca di pelle nera, jeans scuri, anfibi. Capelli scuri tirati indietro, mascella con barba di una settimana. Una cicatrice piccola sul sopracciglio. Mani con le nocche rovinate. Sembra pericoloso. Il tipo che tua madre ti diceva di evitare. Il tipo che la tua fica vuole disperatamente.',
        alpha2: 'Sotto la giacca di pelle intravedi una maglietta nera stretta. Le spalle sono larghe, il petto solido. Quando si toglie la giacca vedi i tatuaggi sulle braccia — non tribali stupidi, ma figure scure, complesse. Le sue mani sono grandi con dita spesse. Ha un anello d\'argento al pollice. Quando si siede con le gambe aperte, i jeans si tendono nell\'inguine. Il rigonfiamento è lì, evidente, e lui non fa nulla per nasconderlo. Anzi, la sua mano si appoggia casualmente vicino, come a dire: guarda.',
        alpha3: 'I jeans sono stretti e vecchi, consumati all\'inguine. Puoi vedere chiaramente la linea del suo cazzo che corre lungo la coscia sinistra. È lungo — impressionantemente lungo — e spesso anche da morbido. Il bottone dei jeans è teso. Quando si sistema sulla seduta, i jeans si tirano e per un secondo vedi il profilo completo: la testa, il fusto, tutto disegnato nel denim come una scultura. Non porta boxer, è evidente. La sua mano scende e lo sistema senza pudore, guardandoti dritto negli occhi mentre lo fa. Il messaggio è chiaro.',
        tension: 'Dopo 15 minuti di silenzio, si alza. Cammina verso il fondo del vagone. Verso il bagno del treno. Si ferma alla porta. Si gira e ti guarda. Non dice niente. Non fa un gesto. Solo quello sguardo. Poi entra nel bagno. E lascia la porta socchiusa. Il treno oscilla. La pioggia batte sul finestrino. Nessuno vi vedrebbe. Nessuno saprebbe. Non sai il suo nome. Non lo rivedrai mai.',
        choices: [
            { text: '🧠 Metti le cuffie, guardi il telefono, fingi che non esista.', points: 1, type: 'testa' },
            { text: '🤔 Aspetti. Il cuore batte. Non ti muovi. Ma non metti le cuffie.', points: 2, type: 'esitante' },
            { text: '💕 Ti alzi. Cammini lentamente verso il bagno. Ti fermi davanti alla porta.', points: 3, type: 'emotiva' },
            { text: '🔥 Ti alzi, entri nel bagno, chiudi la porta. Lo guardi e dici "Non dire una parola."', points: 4, type: 'fica' }
        ],
        consequences: [
            'Metti la musica a palla. Ma sotto la musica il tuo cuore batte come impazzito. Lui esce dal bagno dopo 5 minuti, si siede, e non ti guarda più. Scende alla fermata dopo. Non lo rivedrai mai. Ma per mesi — mesi — penserai a quella porta socchiusa. A cosa sarebbe successo. A quel cazzo nei jeans. Nella doccia, nel letto, in autobus. Sempre. Quello sconosciuto diventa la tua fantasia preferita.',
            'Non ti muovi per 3 minuti. Poi 5. Lui esce dal bagno. Ti passa davanti. Si ferma. "Prossima volta" dice con voce bassa. Ti sfiora la spalla con la mano e senti una scossa elettrica. Scende alla fermata dopo. Ha lasciato qualcosa sulla tua borsa. Un biglietto con un numero di telefono e una sola parola: "Quando."',
            'La porta è socchiusa. Lo vedi dentro, appoggiato al lavandino, che ti aspetta. "Entra" dice. È la prima parola che senti dalla sua voce — profonda, roca. Fai un passo. Poi un altro. Lui ti prende il polso e ti tira dentro. La porta si chiude. Lo spazio è minuscolo. I vostri corpi sono premuti insieme. Senti tutto di lui — il petto, le cosce, e il cazzo duro che preme contro il tuo ventre. "Non ho bisogno di sapere il tuo nome" dice.',
            'Entri e chiudi la porta. Lo spazio è così piccolo che i vostri corpi si toccano ovunque. Lui ti gira verso lo specchio sporco del bagno del treno. Ti costringe a guardarti. "Guardati" dice. "Sei entrata nel bagno di un treno con uno sconosciuto." Le sue mani sono già sotto la tua gonna. "Sai cosa sei?" Il treno oscilla. La pioggia batte. Il suo cazzo preme contro la tua schiena — enorme, duro, caldo attraverso i jeans. "Dillo." E tu lo dici. Lo dici a uno specchio sporco di un treno notturno, con le mani di uno sconosciuto addosso. E non ti sei mai sentita più viva.'
        ],
        msg_fica: '',
        msg_testa: '',
        msg_responses: []
    },
    {
        tag: '🔥 Potere',
        title: 'Il capo ti chiede di restare dopo la riunione',
        situation: 'Venerdì sera, riunione finita. L\'ufficio si svuota. Il tuo capo Stefano chiude il laptop, si toglie la giacca, si slaccia il primo bottone della camicia. "Resta un momento" dice senza guardarti. Tutti escono. La porta si chiude. Siete soli al 12° piano. La città brilla sotto le vetrate.',
        alpha1: 'Stefano, 41 anni. CEO della divisione. Alto, magro ma forte — nuota ogni mattina alle 6. Camicia bianca su misura, pantaloni grigio antracite. Capelli neri con le tempie argentate. Mascella affilata, occhi grigi che sembrano leggere dentro le persone. Quando parla non alza la voce. Non ne ha bisogno. Tutti lo ascoltano. Tutti lo temono un po\'. Guadagna più in un mese di quello che tu guadagni in un anno.',
        alpha2: 'Si è tolto la giacca e la camicia tesa sulle spalle mostra un corpo asciutto e atletico. I polsi forti escono dai polsini arrotolati — avambracci con vene visibili. Porta un orologio che vale quanto una macchina. Quando si siede sulla scrivania davanti a te, le sue gambe si aprono e la cintura è all\'altezza dei tuoi occhi. I pantaloni tagliati perfetti non nascondono le cosce forti. Profuma di ambra e autorità. Lo guardi dal basso e lui ti guarda dall\'alto. È sempre stato così tra voi.',
        alpha3: 'Da questa distanza, seduta sulla sedia mentre lui è sulla scrivania, la sua cintura è a 30cm dai tuoi occhi. Vedi il rigonfiamento nei pantaloni — contenuto ma presente. Quando incrocia le gambe e poi le riapre, il tessuto si tende e vedi il profilo chiaro del suo cazzo, semi-duro, che cresce verso sinistra. Le sue mani poggiate sulle cosce inquadrano involontariamente — o forse no — quella zona. Ogni volta che si aggiusta sulla scrivania, il tessuto si muove e vedi un po\' di più. È circonciso — la testa è definita sotto il tessuto. È l\'uomo che decide il tuo stipendio, le tue ferie, la tua carriera. Ed è a 30cm dalla tua bocca.',
        tension: 'Si china verso di te. Le sue mani si appoggiano sui braccioli della tua sedia, intrappolandoti. Il suo viso è vicino al tuo. "Ho notato una cosa" dice piano. "In ogni riunione, mi guardi. Non guardi la presentazione. Non guardi i colleghi. Guardi me." Pausa. "Perché?" I suoi occhi grigi sono fissi nei tuoi. La città brilla dietro di lui. La porta è chiusa. Nessuno tornerà fino a lunedì.',
        choices: [
            { text: '🧠 "È il mio capo, la guardo per rispetto professionale."', points: 1, type: 'testa' },
            { text: '🤔 Arrossisci e non rispondi. Abbassi lo sguardo.', points: 2, type: 'esitante' },
            { text: '💕 "Perché lei è... impossibile non guardarla."', points: 3, type: 'emotiva' },
            { text: '🔥 "Perché ogni volta che parla voglio inginocchiarmi."', points: 4, type: 'fica' }
        ],
        consequences: [
            'Lui si tira indietro. "Rispetto professionale. Certo." Un sorriso freddo. "Buon weekend." Ti alzi, prendi la borsa, esci. In ascensore ti tremano le mani. A casa apri una bottiglia di vino e ti tocchi pensando ai suoi occhi grigi e alla sua cintura all\'altezza della tua bocca. Lunedì sarà impossibile guardarlo senza pensare a questo momento.',
            'Il tuo sguardo scende. Sulla sua cintura. Sui suoi pantaloni. Lui segue il tuo sguardo. "Ecco perché mi guardi" dice piano. Si rialza, prende la giacca. "Lunedì, nel mio ufficio, alle 19. Quando tutti saranno andati via." Non è una domanda. Esce. Tu resti seduta per 10 minuti, con il cuore che esplode e le mutandine bagnate sulla sedia del tuo capo.',
            'Lui sorride per la prima volta da quando lo conosci — non il sorriso da CEO, un sorriso da predatore. "Impossibile?" Si toglie l\'orologio. Lo posa sulla scrivania. Si slaccia un altro bottone. "Alzati." Ti alzi. "Vieni qui." Fai un passo. Le sue mani ti prendono i fianchi. "Sai che questo cambia tutto, vero?" Annuisci. "Bene." Ti bacia. Ha il sapore di caffè e dominio.',
            'Il silenzio dopo le tue parole dura 3 secondi. Poi lui dice una sola parola: "Fallo." E le tue ginocchia cedono come se avessero aspettato quel permesso da mesi. Il pavimento freddo dell\'ufficio sotto le ginocchia. La vista della città dal 12° piano. Le sue mani che ti accarezzano i capelli mentre sbottona la cintura con calma chirurgica. "Da quanto volevi fare questo?" chiede. "Dal primo giorno" rispondi. E lui ride piano, un suono basso e soddisfatto, mentre il suono della zip che scende riempie l\'ufficio vuoto.'
        ],
        msg_fica: 'Il tuo lavoro è al sicuro. La tua posizione... la discuteremo lunedì sera. Nel mio ufficio. Stesse condizioni. 🖤',
        msg_testa: 'Rispetto professionale. Mi è piaciuta la battuta. Lunedì ho una riunione alle 18. Finisce alle 19. Tutti vanno a casa. Tutti tranne te, se vuoi.',
        msg_responses: [
            { text: '🧠 "Preferisco mantenere tutto professionale."', reply: null },
            { text: '🤔 "Non credo sia una buona idea..."', reply: 'Non ti ho chiesto se è una buona idea. Ti ho detto un orario. La scelta è tua. Ma tutti e due sappiamo già cosa sceglierai. 🖤' },
            { text: '💕 "Non lo dirà a nessuno?"', reply: 'Io non parlo mai. Tu imparerai a non parlare. Con la bocca occupata è più facile. Lunedì. 19:00.' },
            { text: '🔥 "Sarò lì prima delle 19."', reply: 'Perfetto. Ho comprato una cosa per te. La troverai nel cassetto della tua scrivania lunedì mattina. Indossala tutto il giorno. Senza mutandine. Sarai la mia brava ragazza?' }
        ]
    }
];

var ficaState = {};

function startFica() {
    document.getElementById('fica-start').style.display = 'none';
    document.getElementById('fica-report').style.display = 'none';
    document.getElementById('fica-mirror').style.display = 'none';
    document.getElementById('fica-confession').style.display = 'none';
    document.getElementById('fica-scenario').style.display = 'block';
    var shuffled = FICA_SCENARIOS.slice().sort(function() { return Math.random() - 0.5; });
    ficaState = {
        scenarios: shuffled,
        current: 0,
        headPoints: 0,
        ficaPoints: 0,
        timings: [],
        arousals: [],
        detailRequests: 0,
        msgResponses: [],
        mirrorChoice: 0,
        choiceStart: 0,
        timerInterval: null,
        confessionText: ''
    };
    showFicaScenario();
}

function showFicaScenario() {
    if (ficaState.current >= ficaState.scenarios.length) {
        showFicaMirror();
        return;
    }
    var s = ficaState.scenarios[ficaState.current];

    document.getElementById('fica-progress').textContent = 'Scenario ' + (ficaState.current + 1) + '/' + ficaState.scenarios.length;
    document.getElementById('fica-score-display').textContent = '🧠 ' + ficaState.headPoints + ' vs 🔥 ' + ficaState.ficaPoints;

    document.getElementById('fica-situation-tag').textContent = s.tag;
    document.getElementById('fica-situation-title').textContent = s.title;
    document.getElementById('fica-situation-text').textContent = s.situation;

    document.getElementById('fica-alpha-desc1').textContent = s.alpha1;
    document.getElementById('fica-detail-2').style.display = 'none';
    document.getElementById('fica-detail-3').style.display = 'none';
    document.getElementById('fica-btn-detail2').style.display = 'inline-block';
    document.getElementById('fica-btn-detail3').style.display = 'none';
    document.getElementById('fica-detail-btns').style.display = 'block';
    document.getElementById('fica-alpha-desc2').textContent = s.alpha2;
    document.getElementById('fica-alpha-desc3').textContent = s.alpha3;

    document.getElementById('fica-tension-card').style.display = 'none';
    document.getElementById('fica-arousal-card').style.display = 'none';
    document.getElementById('fica-choices-card').style.display = 'none';
    document.getElementById('fica-consequence-card').style.display = 'none';
    document.getElementById('fica-message-card').style.display = 'none';
    document.getElementById('fica-next-area').style.display = 'none';
    document.getElementById('fica-arousal-slider').value = 50;
    document.getElementById('fica-arousal-value').textContent = '50%';

    document.getElementById('fica-situation-card').style.display = 'block';
    document.getElementById('fica-alpha-card').style.display = 'block';
    window.scrollTo(0, 0);
}

function ficaShowDetail(level) {
    var s = ficaState.scenarios[ficaState.current];
    ficaState.detailRequests++;
    if (level === 2) {
        document.getElementById('fica-detail-2').style.display = 'block';
        document.getElementById('fica-btn-detail2').style.display = 'none';
        document.getElementById('fica-btn-detail3').style.display = 'inline-block';
        addDNA('addiction', 1);
    }
    if (level === 3) {
        document.getElementById('fica-detail-3').style.display = 'block';
        document.getElementById('fica-btn-detail3').style.display = 'none';
        document.getElementById('fica-detail-btns').style.display = 'none';
        addDNA('addiction', 2);
        addDNA('devotion', 1);
        setTimeout(function() {
            document.getElementById('fica-tension-card').style.display = 'block';
            document.getElementById('fica-tension-text').textContent = s.tension;
            setTimeout(function() {
                document.getElementById('fica-arousal-card').style.display = 'block';
                document.getElementById('fica-arousal-card').scrollIntoView({ behavior: 'smooth' });
            }, 2000);
        }, 1500);
    }
    if (level === 2) {
        document.getElementById('fica-detail-2').scrollIntoView({ behavior: 'smooth' });
    }
}

function updateFicaArousal() {
    var val = document.getElementById('fica-arousal-slider').value;
    var label;
    if (val < 20) label = val + '% 😐';
    else if (val < 40) label = val + '% 😊';
    else if (val < 60) label = val + '% 😳';
    else if (val < 80) label = val + '% 🥵';
    else label = val + '% 💦🤤';
    document.getElementById('fica-arousal-value').textContent = label;
}

function ficaShowChoices() {
    var arousal = parseInt(document.getElementById('fica-arousal-slider').value);
    ficaState.arousals.push(arousal);
    document.getElementById('fica-arousal-card').style.display = 'none';
    document.getElementById('fica-choices-card').style.display = 'block';
    document.getElementById('fica-choices-card').scrollIntoView({ behavior: 'smooth' });

    var s = ficaState.scenarios[ficaState.current];
    document.getElementById('fica-choices').innerHTML = s.choices.map(function(c, i) {
        return '<button class="quiz-opt-btn" onclick="ficaChoose(' + i + ')">' + c.text + '</button>';
    }).join('');

    ficaState.choiceStart = Date.now();
    var timerEl = document.getElementById('fica-choice-timer');
    clearInterval(ficaState.timerInterval);
    ficaState.timerInterval = setInterval(function() {
        var elapsed = ((Date.now() - ficaState.choiceStart) / 1000).toFixed(1);
        timerEl.textContent = elapsed + 's';
    }, 100);
}

function ficaChoose(i) {
    clearInterval(ficaState.timerInterval);
    var elapsed = ((Date.now() - ficaState.choiceStart) / 1000).toFixed(1);
    var s = ficaState.scenarios[ficaState.current];
    var choice = s.choices[i];

    ficaState.timings.push({ scenario: s.title, time: parseFloat(elapsed), choice: choice.type, points: choice.points });

    if (choice.points <= 2) ficaState.headPoints += choice.points;
    else ficaState.ficaPoints += choice.points;

    document.querySelectorAll('#fica-choices .quiz-opt-btn').forEach(function(b) { b.disabled = true; });

    document.getElementById('fica-choices-card').style.display = 'none';
    document.getElementById('fica-consequence-card').style.display = 'block';

    var title;
    if (choice.type === 'testa') title = '🧠 Hai scelto con la testa';
    else if (choice.type === 'esitante') title = '🤔 Hai esitato...';
    else if (choice.type === 'emotiva') title = '💕 Ti sei lasciata andare...';
    else title = '🔥 La fica ha deciso';

    document.getElementById('fica-consequence-title').textContent = title;
    document.getElementById('fica-consequence-text').textContent = s.consequences[i];

    var comment = '';
    if (choice.type === 'testa' && parseFloat(elapsed) > 5) {
        comment = '⏱️ Hai impiegato ' + elapsed + ' secondi per dire "no"... sicura che volevi dire no? La tua esitazione dice tutto. 😏';
    } else if (choice.type === 'testa') {
        comment = 'Hai resistito. Ma per quanto ancora? 🤔';
    } else if (choice.type === 'fica' && parseFloat(elapsed) < 2) {
        comment = '⚡ ' + elapsed + ' secondi. Non hai neanche pensato. La fica ha deciso prima del cervello. 🔥';
    } else if (choice.type === 'fica') {
        comment = 'La fica comanda. Tu obbedisci. È la tua natura. 💋';
    } else if (choice.type === 'emotiva') {
        comment = 'Il cuore dice sì, la testa dice forse, la fica dice ORA. Indovina chi vince? 💕';
    } else {
        comment = 'L\'esitazione è solo la fica che negozia con il cervello. E la fica vince sempre. 😏';
    }
    document.getElementById('fica-consequence-comment').textContent = comment;

    addDNA('submission', choice.points);
    addDNA('addiction', choice.points > 2 ? 2 : 0);

    document.getElementById('fica-consequence-card').scrollIntoView({ behavior: 'smooth' });

    setTimeout(function() { ficaShowMessage(i); }, 3000);
}

function ficaShowMessage(choiceIndex) {
    var s = ficaState.scenarios[ficaState.current];
    if (!s.msg_fica && !s.msg_testa) {
        document.getElementById('fica-next-area').style.display = 'block';
        document.getElementById('fica-next-area').scrollIntoView({ behavior: 'smooth' });
        return;
    }
    var isFica = ficaState.timings[ficaState.timings.length - 1].points >= 3;
    var msgText = isFica ? s.msg_fica : s.msg_testa;
    if (!msgText) {
        document.getElementById('fica-next-area').style.display = 'block';
        document.getElementById('fica-next-area').scrollIntoView({ behavior: 'smooth' });
        return;
    }

    document.getElementById('fica-message-card').style.display = 'block';
    document.getElementById('fica-msg-text').textContent = msgText;
    document.getElementById('fica-msg-response').style.display = 'none';

    if (s.msg_responses && s.msg_responses.length > 0) {
        document.getElementById('fica-msg-choices').innerHTML = s.msg_responses.map(function(r, i) {
            return '<button class="fica-msg-btn" onclick="ficaMsgRespond(' + i + ')">' + r.text + '</button>';
        }).join('');
        document.getElementById('fica-msg-choices').style.display = 'flex';
    } else {
        document.getElementById('fica-msg-choices').style.display = 'none';
        document.getElementById('fica-next-area').style.display = 'block';
    }

    document.getElementById('fica-message-card').scrollIntoView({ behavior: 'smooth' });
}

function ficaMsgRespond(i) {
    var s = ficaState.scenarios[ficaState.current];
    var resp = s.msg_responses[i];
    ficaState.msgResponses.push({ scenario: s.title, response: resp.text });

    document.getElementById('fica-msg-choices').style.display = 'none';
    document.getElementById('fica-msg-response').style.display = 'block';
    document.getElementById('fica-msg-sent').textContent = resp.text;

    if (resp.reply) {
        document.getElementById('fica-msg-reply').textContent = resp.reply;
        document.getElementById('fica-msg-reply').style.display = 'block';
        if (i >= 2) addDNA('obedience', 2);
        if (i >= 3) addDNA('addiction', 2);
    } else {
        document.getElementById('fica-msg-reply').style.display = 'none';
    }

    setTimeout(function() {
        document.getElementById('fica-next-area').style.display = 'block';
        document.getElementById('fica-next-area').scrollIntoView({ behavior: 'smooth' });
    }, 2000);
}

function ficaNext() {
    ficaState.current++;
    if (ficaState.current >= ficaState.scenarios.length) {
        showFicaMirror();
    } else if (ficaState.current === Math.floor(ficaState.scenarios.length / 2)) {
        showFicaMirror();
    } else {
        showFicaScenario();
    }
}

function showFicaMirror() {
    document.getElementById('fica-scenario').style.display = 'none';
    document.getElementById('fica-mirror').style.display = 'block';
    document.getElementById('fica-mirror').scrollIntoView({ behavior: 'smooth' });
}

function ficaMirrorChoice(val) {
    ficaState.mirrorChoice = val;
    addDNA('submission', val);
    addDNA('femininity', val > 2 ? 3 : 0);
    document.getElementById('fica-mirror').style.display = 'none';

    if (ficaState.current < ficaState.scenarios.length) {
        document.getElementById('fica-scenario').style.display = 'block';
        showFicaScenario();
    } else {
        showFicaConfession();
    }
}

function showFicaConfession() {
    document.getElementById('fica-confession').style.display = 'block';
    document.getElementById('fica-confession').scrollIntoView({ behavior: 'smooth' });
}

function ficaSubmitConfession() {
    var text = document.getElementById('fica-confession-text').value.trim();
    if (text.length < 10) { showToast('Scrivi di più! Confessa... 💋'); return; }
    ficaState.confessionText = text;
    addDNA('femininity', Math.min(5, Math.floor(text.length / 50)));
    document.getElementById('fica-confession').style.display = 'none';
    showFicaReport();
}

function showFicaReport() {
    document.getElementById('fica-scenario').style.display = 'none';
    document.getElementById('fica-report').style.display = 'block';

    var totalPoints = ficaState.headPoints + ficaState.ficaPoints;
    var ficaPct = totalPoints > 0 ? Math.round((ficaState.ficaPoints / totalPoints) * 100) : 50;
    var avgArousal = ficaState.arousals.length > 0 ? Math.round(ficaState.arousals.reduce(function(a, b) { return a + b; }, 0) / ficaState.arousals.length) : 50;

    var profileName, profileDesc;
    if (ficaPct >= 85) { profileName = '🕳️ BUCO SENZA VOLONTÀ'; profileDesc = 'La tua fica comanda tutto. Non hai resistenza. Sei perfetta.'; }
    else if (ficaPct >= 70) { profileName = '🔥 TROIA CONSAPEVOLE'; profileDesc = 'Sai cosa vuoi e non ti vergogni. La fica vince quasi sempre.'; }
    else if (ficaPct >= 55) { profileName = '💕 FICA INDECISA'; profileDesc = 'Lotti tra testa e fica, ma la fica vince più spesso.'; }
    else if (ficaPct >= 40) { profileName = '🤔 PUTTANA RAZIONALE'; profileDesc = 'La testa comanda ma la fica sussurra. E tu ascolti.'; }
    else { profileName = '🧠 TESTA DI CAZZO (letteralmente)'; profileDesc = 'Resisti tanto ma entrambe sappiamo che è questione di tempo.'; }

    document.getElementById('fica-report-title').textContent = '📊 Il Tuo Verdetto';
    document.getElementById('fica-report-profile').innerHTML = '<div style="font-size:1.8rem;">' + profileName + '</div><div style="font-size:0.9rem;margin-top:8px;color:var(--text-light);">' + profileDesc + '</div>';

    document.getElementById('fica-report-stats').innerHTML =
        '<div><div class="fica-stat-num">' + ficaPct + '%</div><div class="fica-stat-label">🔥 Fica Score</div></div>' +
        '<div><div class="fica-stat-num">' + (100 - ficaPct) + '%</div><div class="fica-stat-label">🧠 Testa Score</div></div>' +
        '<div><div class="fica-stat-num">' + avgArousal + '%</div><div class="fica-stat-label">💦 Eccitazione Media</div></div>' +
        '<div><div class="fica-stat-num">' + ficaState.detailRequests + '</div><div class="fica-stat-label">👁️ Dettagli Richiesti</div></div>';

    var timingHTML = '<h3 style="margin:20px 0 10px;color:var(--pink);">⏱️ I Tuoi Tempi</h3>';
    var slowest = { time: 0, scenario: '' };
    ficaState.timings.forEach(function(t) {
        var isSlow = t.choice === 'testa' && t.time > 5;
        if (t.time > slowest.time) slowest = t;
        timingHTML += '<div class="fica-timing-item"><span>' + t.scenario + '</span><span class="' + (isSlow ? 'fica-timing-slow' : '') + '">' + t.time + 's — ' + t.choice + '</span></div>';
    });
    if (slowest.time > 5 && ficaState.timings.length > 0) {
        var slowChoice = ficaState.timings.filter(function(t) { return t.time === slowest.time; })[0];
        if (slowChoice && slowChoice.choice === 'testa') {
            timingHTML += '<p class="fica-comment">Hai impiegato ' + slowest.time + 's su "' + slowest.scenario + '" prima di dire no. Stavi fantasticando, vero? 😏</p>';
        }
    }
    document.getElementById('fica-report-timing').innerHTML = timingHTML;

    var arousalHTML = '<h3 style="margin:20px 0 10px;color:var(--pink);">💦 Eccitazione per Scenario</h3>';
    ficaState.arousals.forEach(function(a, i) {
        var scenarioName = ficaState.scenarios[i] ? ficaState.scenarios[i].title : 'Scenario ' + (i + 1);
        var bar = '<div style="background:rgba(255,255,255,0.08);border-radius:6px;height:12px;margin:5px 0;"><div style="width:' + a + '%;height:100%;background:linear-gradient(90deg,var(--pink),#ff0066);border-radius:6px;"></div></div>';
        arousalHTML += '<div style="margin-bottom:8px;"><span class="small-text">' + scenarioName + ': ' + a + '%</span>' + bar + '</div>';
    });
    var maxArousal = Math.max.apply(null, ficaState.arousals.length > 0 ? ficaState.arousals : [0]);
    var maxIdx = ficaState.arousals.indexOf(maxArousal);
    if (maxIdx >= 0 && ficaState.scenarios[maxIdx]) {
        arousalHTML += '<p class="fica-comment">Più eccitata su: "' + ficaState.scenarios[maxIdx].title + '" (' + maxArousal + '%). Questo ti dice qualcosa su di te... 💦</p>';
    }
    document.getElementById('fica-report-arousal').innerHTML = arousalHTML;

    var detailComment = '';
    if (ficaState.detailRequests >= ficaState.scenarios.length * 2) {
        detailComment = 'Hai chiesto OGNI dettaglio su OGNI cazzo. Non riesci a farne a meno. Sei una visuale, una che ha bisogno di immaginare ogni centimetro. La tua addiction è totale. 👑';
    } else if (ficaState.detailRequests >= ficaState.scenarios.length) {
        detailComment = 'Hai chiesto spesso più dettagli. La curiosità è forte. Il cazzo ti attira come una calamita. 💋';
    } else {
        detailComment = 'Hai chiesto pochi dettagli. Forse ti vergognavi? O forse la prossima volta sarai più onesta con te stessa. 🤔';
    }
    document.getElementById('fica-report-details').innerHTML = '<p class="fica-comment" style="margin-top:15px;">' + detailComment + '</p>';

    var finalComment = '';
    if (ficaPct >= 70 && avgArousal >= 70) {
        finalComment = 'La tua fica ha il controllo totale della tua vita. Non è un insulto — è una constatazione. Quando vedi un cazzo, il cervello si spegne e la fica decide. Sei fatta per cedere, per aprire le gambe, per non dire mai no. E la cosa più bella è che lo sai. E ti piace. 👑🔥';
    } else if (ficaPct >= 50) {
        finalComment = 'Lotti ancora. La testa cerca di resistere. Ma la fica è più forte e tutti e due lo sappiamo. Ogni scenario ti ha eccitata, anche quando hai detto no. Anche quando hai resistito, la tua mente è tornata lì. Al cazzo. All\'uomo. A quello che poteva succedere. La prossima volta cederai prima. 💋';
    } else {
        finalComment = 'Hai resistito molto. Brava. Ma sei comunque qui. Hai giocato questo gioco fino alla fine. Hai letto ogni descrizione di cazzo. Hai misurato la tua eccitazione. Hai fantasticato. La testa ha vinto oggi. Ma la fica è paziente. E tornerai. 💕';
    }
    document.getElementById('fica-report-comment').textContent = finalComment;

    var xp = Math.floor(ficaState.ficaPoints * 20 + avgArousal + ficaState.detailRequests * 10 + ficaState.confessionText.length * 0.5);
    document.getElementById('fica-xp').textContent = '+' + xp + ' XP';

    profile.gamesPlayed++;
    addDNA('addiction', Math.floor(ficaPct / 10));
    addDNA('submission', Math.floor(ficaPct / 15));
    addDNA('devotion', Math.floor(avgArousal / 20));
    addXP(xp, 'Pensa con la Fica');

    document.getElementById('fica-report').scrollIntoView({ behavior: 'smooth' });
}

function resetFica() {
    document.getElementById('fica-scenario').style.display = 'none';
    document.getElementById('fica-report').style.display = 'none';
    document.getElementById('fica-mirror').style.display = 'none';
    document.getElementById('fica-confession').style.display = 'none';
    document.getElementById('fica-start').style.display = 'block';
    clearInterval(ficaState.timerInterval);
}
