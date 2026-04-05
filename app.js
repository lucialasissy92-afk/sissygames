// ==========================================
//  SISSY GAMES — MAIN APPLICATION
// ==========================================

// ============ DATA MANAGEMENT ============
const DB = {
    get(key, def = null) {
        try { const v = localStorage.getItem('sg_' + key); return v ? JSON.parse(v) : def; }
        catch { return def; }
    },
    set(key, val) { localStorage.setItem('sg_' + key, JSON.stringify(val)); },
};

// ============ PROFILE DATA ============
let profile = DB.get('profile', {
    name: '',
    xp: 0,
    level: 1,
    gamesPlayed: 0,
    sessionsCompleted: 0,
    streak: 0,
    bestStreak: 0,
    lastVisit: null,
    totalTime: 0,
    dna: { devotion: 0, femininity: 0, obedience: 0, submission: 0, addiction: 0 },
    achievements: [],
    checkinToday: null,
    diary: []
});

function saveProfile() {
    const nameInput = document.getElementById('sissy-name-input');
    if (nameInput && nameInput.value.trim()) {
        profile.name = nameInput.value.trim();
    }
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
        if (profile.lastVisit === yesterday) {
            profile.streak++;
        } else if (profile.lastVisit) {
            profile.streak = 1;
        } else {
            profile.streak = 1;
        }
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
    { id: 'streak_30', name: '💎 30 Giorni', desc: 'Streak di 30 giorni', check: () => profile.bestStreak >= 30 },
    { id: 'level_5', name: '⭐ Livello 5', desc: 'Raggiungi il livello 5', check: () => profile.level >= 5 },
    { id: 'level_10', name: '👑 Livello 10', desc: 'Raggiungi il livello 10', check: () => profile.level >= 10 },
    { id: 'first_session', name: '🧠 Prima Sessione', desc: 'Completa una sessione BM', check: () => profile.sessionsCompleted >= 1 },
    { id: 'devoted', name: '💋 Devota', desc: 'Cock Devotion a 50+', check: () => profile.dna.devotion >= 50 },
    { id: 'feminine', name: '💃 Femminile', desc: 'Femininity a 50+', check: () => profile.dna.femininity >= 50 },
    { id: 'xp1000', name: '✨ 1000 XP', desc: 'Accumula 1000 XP', check: () => profile.xp >= 1000 },
];

function checkAchievements() {
    ACHIEVEMENTS.forEach(a => {
        if (!profile.achievements.includes(a.id) && a.check()) {
            profile.achievements.push(a.id);
            DB.set('profile', profile);
            showToast(`🏆 Achievement: ${a.name}`);
        }
    });
}

// ============ UI UPDATES ============
function updateAllUI() {
    // Home stats
    const els = {
        'hero-name': profile.name || 'Sissy',
        'home-streak': profile.streak,
        'home-xp': profile.xp,
        'home-level': profile.level,
        'home-games': profile.gamesPlayed,
    };
    Object.entries(els).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    });

    // Profile
    const pName = document.getElementById('profile-name');
    if (pName) pName.textContent = profile.name || 'Sissy';

    const pTitle = document.getElementById('profile-title');
    if (pTitle) {
        const titles = ['Curious', 'Awakening', 'Becoming', 'Embracing', 'Devoted', 'Addicted', 'Owned', 'Complete'];
        pTitle.textContent = titles[Math.min(Math.floor(profile.level / 3), titles.length - 1)];
    }

    // Profile stats
    const stats = {
        'stat-xp': profile.xp,
        'stat-level': profile.level,
        'stat-games': profile.gamesPlayed,
        'stat-sessions': profile.sessionsCompleted,
        'stat-streak': profile.streak,
        'stat-best-streak': profile.bestStreak,
        'stat-time': Math.floor(profile.totalTime / 60) + ' min',
        'modal-level': profile.level,
    };
    Object.entries(stats).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    });

    // DNA bars
    Object.keys(profile.dna).forEach(key => {
        const bar = document.getElementById('bar-' + key);
        const val = document.getElementById('val-' + key);
        if (bar) bar.style.width = profile.dna[key] + '%';
        if (val) val.textContent = Math.floor(profile.dna[key]);
    });

    // Profile setup/view toggle
    const setup = document.getElementById('profile-setup');
    const view = document.getElementById('profile-view');
    if (setup && view) {
        if (profile.name) {
            setup.style.display = 'none';
            view.style.display = 'block';
        } else {
            setup.style.display = 'block';
            view.style.display = 'none';
        }
    }

    // Achievements
    const achList = document.getElementById('achievements-list');
    if (achList) {
        achList.innerHTML = ACHIEVEMENTS.map(a => {
            const unlocked = profile.achievements.includes(a.id);
            return `<div class="achievement-badge ${unlocked ? '' : 'locked'}" title="${a.desc}">${a.name}</div>`;
        }).join('');
    }

    // Checkin
    const today = new Date().toDateString();
    if (profile.checkinToday === today) {
        const cf = document.getElementById('checkin-form');
        const cd = document.getElementById('checkin-done');
        if (cf) cf.style.display = 'none';
        if (cd) cd.style.display = 'block';
    }
}

// ============ NAVIGATION ============
function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById('page-' + id);
    if (page) page.classList.add('active');
    window.scrollTo(0, 0);
}

function showUpgrade() {
    document.getElementById('upgrade-modal').style.display = 'flex';
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ============ CHECKIN ============
let checkinMood = null, checkinWear = null;

function selectMood(el, mood) {
    el.parentElement.querySelectorAll('.emoji-opt').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    checkinMood = mood;
}

function selectWear(el, wear) {
    el.parentElement.querySelectorAll('.emoji-opt').forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    checkinWear = wear;
}

function submitCheckin() {
    if (!checkinMood || !checkinWear) {
        showToast('Seleziona tutte le risposte! 😘');
        return;
    }
    profile.checkinToday = new Date().toDateString();
    addXP(50, 'Check-in giornaliero');
    addDNA('femininity', checkinWear === 'yes' ? 3 : 1);
    addDNA('addiction', 1);
    profile.diary.push({
        date: new Date().toISOString(),
        type: 'checkin',
        mood: checkinMood,
        wearing: checkinWear
    });
    DB.set('profile', profile);
    document.getElementById('checkin-form').style.display = 'none';
    document.getElementById('checkin-done').style.display = 'block';
}

// ============ GAME 1: COCK MEMORY ============
let memoryState = { cards: [], flipped: [], matched: 0, total: 0, moves: 0, timer: 0, interval: null, locked: false };

const MEMORY_SYMBOLS = ['🍆', '🍌', '🌶️', '🥒', '🍄', '🌭', '🏛️', '🗼', '🚀', '💄', '👠', '💎', '🔑', '🕯️', '👅', '💋', '🍑', '🍒', '👑', '⛓️', '🎀', '💕', '🖤', '🔥', '💦', '🫦', '🩱', '🧴', '💜', '🎭', '🪭', '🛁'];

function startMemory(size) {
    document.getElementById('memory-difficulty').style.display = 'none';
    document.getElementById('memory-result').style.display = 'none';

    const pairs = (size * size) / 2;
    const symbols = MEMORY_SYMBOLS.slice(0, pairs);
    let cards = [...symbols, ...symbols];
    cards = cards.sort(() => Math.random() - 0.5);

    memoryState = { cards, flipped: [], matched: 0, total: pairs, moves: 0, timer: 0, interval: null, locked: false, size };

    const board = document.getElementById('memory-board');
    board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    board.style.display = 'grid';
    board.innerHTML = cards.map((sym, i) => `
        <div class="memory-card" onclick="flipCard(${i})" id="mc-${i}">
            <span class="card-back">💋</span>
            <span class="card-front">${sym}</span>
        </div>
    `).join('');

    memoryState.interval = setInterval(() => {
        memoryState.timer++;
        document.getElementById('memory-timer').textContent = `Tempo: ${memoryState.timer}s`;
    }, 1000);

    updateMemoryUI();
}

function flipCard(i) {
    if (memoryState.locked) return;
    const card = document.getElementById('mc-' + i);
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

    card.classList.add('flipped');
    memoryState.flipped.push(i);

    if (memoryState.flipped.length === 2) {
        memoryState.moves++;
        memoryState.locked = true;
        const [a, b] = memoryState.flipped;

        if (memoryState.cards[a] === memoryState.cards[b]) {
            document.getElementById('mc-' + a).classList.add('matched');
            document.getElementById('mc-' + b).classList.add('matched');
            memoryState.matched++;
            memoryState.flipped = [];
            memoryState.locked = false;

            const messages = [
                "Good girl! 💋", "Brava! I tuoi occhi sono attenti 👀",
                "Perfetto! Stai imparando bene 💕", "Ottimo match! 🎀",
                "I tuoi occhi sanno dove guardare 😍", "Non ti sfugge niente! 👅"
            ];
            document.getElementById('memory-msg').textContent = messages[Math.floor(Math.random() * messages.length)];

            if (memoryState.matched === memoryState.total) {
                clearInterval(memoryState.interval);
                endMemory();
            }
        } else {
            setTimeout(() => {
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
    document.getElementById('memory-moves').textContent = `Mosse: ${memoryState.moves}`;
    document.getElementById('memory-pairs').textContent = `Coppie: ${memoryState.matched}/${memoryState.total}`;
}

function endMemory() {
    const efficiency = Math.max(0, 100 - (memoryState.moves - memoryState.total) * 3);
    const timeBonus = Math.max(0, 50 - memoryState.timer);
    const sizeMultiplier = memoryState.size === 4 ? 1 : memoryState.size === 6 ? 2 : 3;
    const xp = Math.floor((efficiency + timeBonus) * sizeMultiplier);

    profile.gamesPlayed++;
    addDNA('devotion', 3 * sizeMultiplier);
    addDNA('addiction', 1);
    addXP(xp, 'Cock Memory');

    document.getElementById('memory-result').style.display = 'block';
    document.getElementById('memory-result-text').textContent =
        `${memoryState.moves} mosse in ${memoryState.timer} secondi. Efficienza: ${efficiency}%`;
    document.getElementById('memory-result-xp').textContent = `+${xp} XP`;

    const titleEl = document.getElementById('memory-result-title');
    if (efficiency >= 80) titleEl.textContent = 'Perfetto! I tuoi occhi sono addestrati! 💋';
    else if (efficiency >= 50) titleEl.textContent = 'Brava! Stai migliorando! 💕';
    else titleEl.textContent = 'Continua a praticare! 🎀';
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

    let comment, xpAmount;
    if (time < 200) { comment = "Incredibile! Il tuo istinto è perfetto! 👑"; xpAmount = 80; }
    else if (time < 350) { comment = "Molto veloce! Stai diventando obbediente! 💋"; xpAmount = 60; }
    else if (time < 500) { comment = "Buon riflesso! Continua ad allenarti. 💕"; xpAmount = 40; }
    else if (time < 800) { comment = "Puoi fare meglio. Una sissy deve reagire più veloce. 😤"; xpAmount = 20; }
    else { comment = "Troppo lenta! Devi allenarti di più! 🔥"; xpAmount = 10; }

    document.getElementById('reaction-time-text').textContent = `${time} ms`;
    document.getElementById('reaction-comment').textContent = comment;
    document.getElementById('reaction-xp').textContent = `+${xpAmount} XP`;

    const historyHTML = reactionState.history.slice(-5).map((t, i) =>
        `Tentativo ${i + 1}: ${t}ms`
    ).join(' | ');
    document.getElementById('reaction-history').textContent = historyHTML;

    profile.gamesPlayed++;
    addDNA('obedience', time < 350 ? 5 : 2);
    addDNA('submission', 2);
    addXP(xpAmount, 'Reflex Kneel');
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

    canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        catcherState.playerX = (e.clientX - rect.left) * (canvas.width / rect.width);
    };

    canvas.ontouchmove = (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        catcherState.playerX = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
    };

    catcherState.timerInterval = setInterval(() => {
        catcherState.timeLeft--;
        document.getElementById('catcher-timer').textContent = `Tempo: ${catcherState.timeLeft}s`;
        if (catcherState.timeLeft <= 0) endCatcher();
    }, 1000);

    function spawnItem() {
        if (!catcherState.running) return;
        const good = Math.random() > 0.25;
        catcherState.items.push({
            x: Math.random() * (canvas.width - 30),
            y: -30,
            good: good,
            emoji: good ? ['🍆', '🍌', '🌶️', '🥒', '🍄'][Math.floor(Math.random() * 5)] : '❌',
            speed: 2 + Math.random() * 3
        });
        setTimeout(spawnItem, 400 + Math.random() * 800);
    }

    function gameLoop() {
        if (!catcherState.running) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw player
        ctx.font = '35px serif';
        ctx.textAlign = 'center';
        ctx.fillText('👄', catcherState.playerX, canvas.height - 20);

        // Update & draw items
        catcherState.items.forEach((item, i) => {
            item.y += item.speed;
            ctx.font = '28px serif';
            ctx.fillText(item.emoji, item.x + 15, item.y + 28);

            // Catch check
            if (item.y + 28 >= canvas.height - 40 && Math.abs(item.x + 15 - catcherState.playerX) < 35) {
                if (item.good) {
                    catcherState.score += 10 + catcherState.combo * 2;
                    catcherState.combo++;
                } else {
                    catcherState.score = Math.max(0, catcherState.score - 20);
                    catcherState.combo = 0;
                }
                catcherState.items.splice(i, 1);
                document.getElementById('catcher-score').textContent = `Score: ${catcherState.score}`;
                document.getElementById('catcher-combo').textContent = `Combo: ${catcherState.combo}`;
            }

            // Off screen
            if (item.y > canvas.height + 30) {
                if (item.good) catcherState.combo = 0;
                catcherState.items.splice(i, 1);
            }
        });

        // Combo messages
        if (catcherState.combo >= 10) {
            ctx.fillStyle = 'rgba(255,105,180,0.8)';
            ctx.font = 'bold 18px Quicksand';
            ctx.fillText('🔥 INSATIABLE! 🔥', canvas.width / 2, 30);
            ctx.fillStyle = '#fff';
        } else if (catcherState.combo >= 5) {
            ctx.fillStyle = 'rgba(255,105,180,0.6)';
            ctx.font = 'bold 16px Quicksand';
            ctx.fillText('COCK HUNGRY! 👅', canvas.width / 2, 30);
            ctx.fillStyle = '#fff';
        }

        catcherState.animFrame = requestAnimationFrame(gameLoop);
    }

    spawnItem();
    gameLoop();
}

function endCatcher() {
    catcherState.running = false;
    cancelAnimationFrame(catcherState.animFrame);
    clearInterval(catcherState.timerInterval);

    document.getElementById('catcher-canvas').style.display = 'none';
    document.getElementById('catcher-result').style.display = 'block';

    const xp = Math.floor(catcherState.score * 0.5);
    document.getElementById('catcher-result-text').textContent =
        `Score finale: ${catcherState.score} — Combo massimo: ${catcherState.combo}`;
    document.getElementById('catcher-xp').textContent = `+${xp} XP`;

    profile.gamesPlayed++;
    addDNA('devotion', Math.min(10, Math.floor(catcherState.score / 50)));
    addDNA('addiction', 2);
    addXP(xp, 'Cock Catcher');
}

// ============ GAME 4: SIZE SORTER ============
let sorterState = { items: [], selected: [], correct: [] };

function startSorter() {
    document.getElementById('sorter-intro').style.display = 'none';
    document.getElementById('sorter-result').style.display = 'none';
    document.getElementById('sorter-game').style.display = 'block';
    document.getElementById('sorter-check').style.display = 'none';

    const sizes = [];
    const count = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
        sizes.push(Math.floor(8 + Math.random() * 20));
    }
    // Make sure all unique
    const unique = [...new Set(sizes)];
    while (unique.length < count) unique.push(Math.floor(8 + Math.random() * 20));

    const shuffled = [...unique].sort(() => Math.random() - 0.5);
    const correct = [...unique].sort((a, b) => a - b);

    sorterState = { items: shuffled, selected: [], correct };

    const container = document.getElementById('sorter-items');
    container.innerHTML = shuffled.map((size, i) => `
        <div class="sorter-item" onclick="selectSorterItem(${i})" id="si-${i}">${size} cm</div>
    `).join('');

    document.getElementById('sorter-order').innerHTML = '';
}

function selectSorterItem(i) {
    const el = document.getElementById('si-' + i);
    if (el.classList.contains('selected')) return;
    el.classList.add('selected');
    sorterState.selected.push(sorterState.items[i]);

    const orderContainer = document.getElementById('sorter-order');
    orderContainer.innerHTML = sorterState.selected.map(s => `<span class="sorted-tag">${s} cm</span>`).join('');

    if (sorterState.selected.length === sorterState.items.length) {
        document.getElementById('sorter-check').style.display = 'inline-block';
    }
}

function checkSorter() {
    const correct = JSON.stringify(sorterState.selected) === JSON.stringify(sorterState.correct);
    document.getElementById('sorter-game').style.display = 'none';
    document.getElementById('sorter-result').style.display = 'block';

    const xp = correct ? 80 : 20;
    document.getElementById('sorter-result-title').textContent = correct
        ? 'Perfetto! Conosci le dimensioni a perfezione! 💋'
        : 'Non esattamente... L\'ordine corretto era: ' + sorterState.correct.map(s => s + 'cm').join(' → ');
    document.getElementById('sorter-result-text').textContent = correct
        ? 'I tuoi occhi sanno valutare perfettamente. Sei un\'esperta.'
        : 'Hai bisogno di più pratica. Continua a studiare! 👀';
    document.getElementById('sorter-xp').textContent = `+${xp} XP`;

    profile.gamesPlayed++;
    addDNA('devotion', correct ? 5 : 1);
    addXP(xp, 'Size Sorter');
}

// ============ GAME 5: MANTRA TYPER ============
let mantraState = { timer: null, timeLeft: 60, score: 0, completed: 0, currentMantra: '' };

const MANTRAS = [
    "I am a good girl",
    "I love to obey",
    "I know my place",
    "I exist to serve",
    "Alpha men are superior",
    "I am feminine and soft",
    "My purpose is to please",
    "I belong on my knees",
    "I embrace my true nature",
    "Good girls always obey",
    "I am becoming who I truly am",
    "Submission is freedom",
    "I crave to worship",
    "My femininity grows every day",
    "I surrender completely",
    "I am grateful for my place",
    "Obedience brings me joy",
    "I was made for this",
    "Every day I become more feminine",
    "I accept my nature with love"
];

function startMantra() {
    document.getElementById('mantra-start').style.display = 'none';
    document.getElementById('mantra-result').style.display = 'none';
    document.getElementById('mantra-game').style.display = 'block';

    mantraState = { timer: null, timeLeft: 60, score: 0, completed: 0, currentMantra: '' };
    nextMantra();

    const input = document.getElementById('mantra-input');
    input.value = '';
    input.focus();
    input.oninput = checkMantraInput;

    mantraState.timer = setInterval(() => {
        mantraState.timeLeft--;
        document.getElementById('mantra-timer').textContent = `Tempo: ${mantraState.timeLeft}s`;
        if (mantraState.timeLeft <= 0) endMantra();
    }, 1000);
}

function nextMantra() {
    mantraState.currentMantra = MANTRAS[Math.floor(Math.random() * MANTRAS.length)];
    document.getElementById('mantra-target').textContent = `"${mantraState.currentMantra}"`;
    document.getElementById('mantra-input').value = '';
}

function checkMantraInput() {
    const input = document.getElementById('mantra-input').value;
    const target = mantraState.currentMantra;

    if (input.toLowerCase().trim() === target.toLowerCase()) {
        mantraState.completed++;
        mantraState.score += 100;
        document.getElementById('mantra-completed').textContent = mantraState.completed;
        document.getElementById('mantra-score').textContent = `Score: ${mantraState.score}`;

        const feedback = document.getElementById('mantra-feedback');
        const msgs = ['Good girl! 💋', 'Brava! 💕', 'Feel it becoming true... 🌀', 'You believe it now. 👑', 'Deeper and deeper... 💜'];
        feedback.textContent = msgs[Math.floor(Math.random() * msgs.length)];
        feedback.style.color = '#ff69b4';

        setTimeout(nextMantra, 500);
    }
}

function endMantra() {
    clearInterval(mantraState.timer);
    document.getElementById('mantra-game').style.display = 'none';
    document.getElementById('mantra-result').style.display = 'block';

    const xp = mantraState.completed * 25;
    document.getElementById('mantra-result-text').textContent =
        `Hai scritto ${mantraState.completed} mantra in 60 secondi. Score: ${mantraState.score}`;
    document.getElementById('mantra-xp').textContent = `+${xp} XP`;

    profile.gamesPlayed++;
    addDNA('submission', mantraState.completed);
    addDNA('femininity', Math.floor(mantraState.completed / 2));
    addDNA('addiction', 2);
    addXP(xp, 'Mantra Typer');
}

// ============ GAME 6: GAZE LOCK ============
let gazeState = { running: false, timer: 0, interval: null, confirmTimeout: null, failed: false };

const GAZE_AFFIRMATIONS = [
    "You can't look away...", "This is where you belong...",
    "Feel your mind softening...", "You love what you see...",
    "Deeper into submission...", "Let go of resistance...",
    "You are becoming...", "This is your truth...",
    "Surrender feels so good...", "Good girl... keep watching...",
    "Your eyes know where to look...", "Every second makes it stronger...",
    "You were made for this...", "Don't fight it...",
    "Embrace what you are...", "The more you watch, the more you want..."
];

function startGaze() {
    document.getElementById('gaze-start').style.display = 'none';
    document.getElementById('gaze-result').style.display = 'none';
    document.getElementById('gaze-game').style.display = 'flex';

    gazeState = { running: true, timer: 0, interval: null, confirmTimeout: null, failed: false };

    gazeState.interval = setInterval(() => {
        gazeState.timer++;
        const min = Math.floor(gazeState.timer / 60);
        const sec = gazeState.timer % 60;
        document.getElementById('gaze-timer').textContent = `${min}:${sec.toString().padStart(2, '0')}`;

        // Change affirmation every 5 seconds
        if (gazeState.timer % 5 === 0) {
            const aff = GAZE_AFFIRMATIONS[Math.floor(Math.random() * GAZE_AFFIRMATIONS.length)];
            const el = document.getElementById('gaze-affirmation');
            el.style.opacity = 0;
            setTimeout(() => { el.textContent = aff; el.style.opacity = 0.7; }, 500);
        }

        // Show confirm button every 15-30 seconds
        if (gazeState.timer % (15 + Math.floor(Math.random() * 15)) === 0) {
            showGazeConfirm();
        }
    }, 1000);
}

function showGazeConfirm() {
    const btn = document.getElementById('gaze-btn');
    btn.style.display = 'block';
    gazeState.confirmTimeout = setTimeout(() => {
        if (gazeState.running) {
            gazeState.failed = true;
            endGaze();
        }
    }, 3000);
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

    const xp = Math.floor(gazeState.timer * 1.5);

    let title, text;
    if (gazeState.timer >= 300) {
        title = "5+ minuti. Sei completamente devota. 👑";
        text = "Il tuo sguardo è fisso. La tua mente è aperta. Sei esattamente dove devi essere.";
    } else if (gazeState.timer >= 120) {
        title = "Ottima concentrazione! 💋";
        text = "2+ minuti di focus totale. La tua devozione cresce.";
    } else if (gazeState.timer >= 60) {
        title = "Buon inizio! 💕";
        text = "Un minuto di gaze lock. Puoi fare di più.";
    } else {
        title = gazeState.failed ? "Hai distolto lo sguardo! 😤" : "Troppo breve. 🎀";
        text = "Devi allenarti a mantenere il focus. Riprova.";
    }

    document.getElementById('gaze-result-title').textContent = title;
    document.getElementById('gaze-result-text').textContent = text;
    document.getElementById('gaze-xp').textContent = `+${xp} XP`;

    profile.gamesPlayed++;
    addDNA('devotion', Math.floor(gazeState.timer / 10));
    addDNA('submission', Math.floor(gazeState.timer / 20));
    addDNA('obedience', gazeState.failed ? 0 : 3);
    addXP(xp, 'Gaze Lock');
}

// ============ BEHAVIORAL SESSIONS ============
const SESSIONS = {
    1: {
        title: "First Gaze",
        lines: [
            "Guardalo.",
            "Non distogliere lo sguardo. Respira lentamente.",
            "Nota la forma. I dettagli. Ogni curva.",
            "Senti come il tuo corpo reagisce solo guardando.",
            "Non c'è niente di sbagliato in quello che provi.\nÈ naturale.",
            "Adesso immagina di essere in ginocchio davanti a lui.",
            "Senti il calore che emana. Il profumo della sua pelle.",
            "La tua bocca si apre leggermente.\nÈ un istinto.",
            "Inizia a toccarti. Lentamente.\nI capezzoli prima.",
            "Senti come il piacere si collega a quello che vedi.",
            "Guarda. Tocca. Respira.\nTutto è collegato.",
            "Immagina la punta che tocca le tue labbra.",
            "Il sapore. Il calore. La consistenza.",
            "Scendi con la mano.\nTocca attraverso il tessuto. Come farebbe una ragazza.",
            "Guarda. Senti il tessuto. Respira.",
            "Questo è il tuo posto.\nIn ginocchio. Felice.",
            "Quando sei vicina, fermati.\nNon venire. Respira.",
            "Guarda ancora. Ringrazialo nella tua mente.",
            "Dì mentalmente:\n\"Grazie per avermi mostrato chi sono.\"",
            "Sessione completata.\nTorna domani. 💋"
        ]
    },
    2: {
        title: "Size Acceptance",
        lines: [
            "Guarda le due realtà.",
            "A sinistra: grande. Duro. Potente.\nFatto per dominare.",
            "A destra: piccola. Chiusa.\nNon fatta per quel compito.",
            "Non è un insulto.\nÈ una verità liberatoria.",
            "Respira e lascia che questa verità ti attraversi.",
            "Tu non sei fatta per penetrare.\nNon è il tuo ruolo.",
            "Il tuo ruolo è accogliere.\nServire. Adorare.",
            "Guarda la sinistra.\nToccati pensando a LUI, non a te.",
            "Il tuo piacere viene da LUI.\nNon dalla tua clitty.",
            "Sfiorala appena.\nSenti la frustrazione.",
            "Quella frustrazione è buona.\nSignifica che stai accettando.",
            "Concentrati solo sull'immagine di sinistra.",
            "Immagina le tue mani su di lui.\nLo senti pulsare.",
            "È caldo. È vivo.\nÈ tutto quello che la tua clitty non è.",
            "E questo ti rende felice.\nPerché il tuo piacere è nel servire il suo.",
            "Ripeti nella tua mente:\n\"Il suo è superiore. Il mio è inferiore.\nE va bene così.\"",
            "Ancora. Ripetilo.\nSentilo diventare vero.",
            "Adesso sorridi.\nSei al tuo posto. Sei dove devi essere.",
            "Sessione completata. 💋"
        ]
    },
    3: {
        title: "Surrender",
        lines: [
            "Lui ti sta guardando. Dall'alto.",
            "La sua mano scende verso di te.\nVerso il tuo mento.",
            "Ti alza il viso.\nTi costringe a guardarlo negli occhi.",
            "Respira.\nSenti il tuo corpo ammorbidirsi.",
            "Ogni resistenza che hai...\nlasciala andare.",
            "Non devi essere forte adesso.\nNon devi decidere niente.",
            "Lui decide. Tu segui.\nÈ semplice. È bello.",
            "Tocca il tuo viso come lo farebbe lui.\nMano sotto il mento. Alza lo sguardo.",
            "Dì ad alta voce, piano:\n\"Sono tua.\"",
            "Sentilo nelle ossa.\nNon è un gioco.\nÈ una verità che stai scoprendo.",
            "Chiudi gli occhi per 10 secondi.\nImmagina la scena completa.",
            "La stanza. Il suo odore.\nIl calore del suo corpo vicino.",
            "Apri gli occhi. Guardalo.\nToccati.",
            "Ogni tocco è un suo regalo.\nLui ti permette di provare piacere.",
            "La sua mano si sposta dalla tua faccia alla tua testa.\nTi guida verso il basso.",
            "Tu scendi volontariamente.\nNon c'è forza. C'è volontà.\nLa TUA volontà di servire.",
            "Questo è il vero potere:\nscegliere di arrendersi.",
            "Toccati con gratitudine.\nOgni sensazione è un regalo.",
            "Avvicinati al bordo.\nE quando sei lì, dì:\n\"Grazie, Sir.\"",
            "Poi fermati. Non venire.\nLa frustrazione è devozione.",
            "Sessione completata.\nLa resa è il primo passo verso la libertà. 💋"
        ]
    }
};

let sessionState = { running: false, sessionId: null, lineIndex: 0, timeout: null };

function startSession(id) {
    const session = SESSIONS[id];
    if (!session) return;

    showPage('session-player');
    sessionState = { running: true, sessionId: id, lineIndex: 0, timeout: null };

    document.getElementById('session-text').textContent = '';
    document.getElementById('session-text').classList.remove('visible');
    document.getElementById('session-bar').style.width = '0%';

    setTimeout(() => showSessionLine(), 1000);
}

function showSessionLine() {
    if (!sessionState.running) return;
    const session = SESSIONS[sessionState.sessionId];
    if (sessionState.lineIndex >= session.lines.length) {
        endSession();
        return;
    }

    const textEl = document.getElementById('session-text');
    textEl.classList.remove('visible');

    setTimeout(() => {
        textEl.textContent = session.lines[sessionState.lineIndex];
        textEl.classList.add('visible');

        const progress = ((sessionState.lineIndex + 1) / session.lines.length) * 100;
        document.getElementById('session-bar').style.width = progress + '%';

        sessionState.lineIndex++;
        sessionState.timeout = setTimeout(() => showSessionLine(), 8000);
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

    setTimeout(() => {
        showPage('sessions');
        showToast('Sessione completata! +150 XP 💋');
    }, 3000);
}

function exitSession() {
    sessionState.running = false;
    clearTimeout(sessionState.timeout);
    showPage('sessions');
}

// ============ INIT ============
function init() {
    updateStreak();
    updateAllUI();
    checkAchievements();

    // Start time tracking
    setInterval(() => {
        profile.totalTime++;
        if (profile.totalTime % 60 === 0) DB.set('profile', profile);
    }, 1000);
}

init();
