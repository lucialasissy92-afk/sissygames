// ==========================================
//  SISSY GAMES — MAIN APPLICATION v2
//  Con supporto immagini per ogni gioco
// ==========================================

// ============ CONFIGURAZIONE IMMAGINI ============
const IMAGES = {
    memory: Array.from({length: 32}, (_, i) => `img/memory/${String(i+1).padStart(2,'0')}.jpg`),
    catcher: {
        good: Array.from({length: 10}, (_, i) => `img/catcher/good${i+1}.jpg`),
        bad: Array.from({length: 5}, (_, i) => `img/catcher/bad${i+1}.jpg`),
    },
    gaze: Array.from({length: 10}, (_, i) => `img/gaze/${String(i+1).padStart(2,'0')}.jpg`),
    sorter: {
        small: Array.from({length: 3}, (_, i) => `img/sorter/small${i+1}.jpg`),
        medium: Array.from({length: 3}, (_, i) => `img/sorter/medium${i+1}.jpg`),
        big: Array.from({length: 3}, (_, i) => `img/sorter/big${i+1}.jpg`),
        huge: Array.from({length: 3}, (_, i) => `img/sorter/huge${i+1}.jpg`),
    },
    reaction: Array.from({length: 5}, (_, i) => `img/reaction/${String(i+1).padStart(2,'0')}.jpg`),
    mantra: Array.from({length: 3}, (_, i) => `img/mantra/bg${i+1}.jpg`),
    sessions: {
        1: 'img/sessions/session1.jpg',
        2: 'img/sessions/session2.jpg',
        3: 'img/sessions/session3.jpg',
    }
};

// Verifica se un'immagine esiste
function imgExists(url) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

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

    const pName = document.getElementById('profile-name');
    if (pName) pName.textContent = profile.name || 'Sissy';

    const pTitle = document.getElementById('profile-title');
    if (pTitle) {
        const titles = ['Curious', 'Awakening', 'Becoming', 'Embracing', 'Devoted', 'Addicted', 'Owned', 'Complete'];
        pTitle.textContent = titles[Math.min(Math.floor(profile.level / 3), titles.length - 1)];
    }

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

    Object.keys(profile.dna).forEach(key => {
        const bar = document.getElementById('bar-' + key);
        const val = document.getElementById('val-' + key);
        if (bar) bar.style.width = profile.dna[key] + '%';
        if (val) val.textContent = Math.floor(profile.dna[key]);
    });

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

    const achList = document.getElementById('achievements-list');
    if (achList) {
        achList.innerHTML = ACHIEVEMENTS.map(a => {
            const unlocked = profile.achievements.includes(a.id);
            return `<div class="achievement-badge ${unlocked ? '' : 'locked'}" title="${a.desc}">${a.name}</div>`;
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

// ============ GAME 1: COCK MEMORY (CON IMMAGINI) ============
let memoryState = { cards: [], flipped: [], matched: 0, total: 0, moves: 0, timer: 0, interval: null, locked: false };

const MEMORY_SYMBOLS = ['🍆', '🍌', '🌶️', '🥒', '🍄', '🌭', '🏛️', '🗼', '🚀', '💄', '👠', '💎', '🔑', '🕯️', '👅', '💋', '🍑', '🍒', '👑', '⛓️', '🎀', '💕', '🖤', '🔥', '💦', '🫦', '🩱', '🧴', '💜', '🎭', '🪭', '🛁'];

function startMemory(size) {
    document.getElementById('memory-difficulty').style.display = 'none';
    document.getElementById('memory-result').style.display = 'none';

    const pairs = (size * size) / 2;
    
    // Mescola le immagini e prendi quelle che servono
    const shuffledImages = [...IMAGES.memory].sort(() => Math.random() - 0.5);
    const selectedItems = [];
    
    for (let i = 0; i < pairs; i++) {
        if (i < shuffledImages.length) {
            selectedItems.push({ type: 'img', src: shuffledImages[i] });
        } else {
            selectedItems.push({ type: 'emoji', src: MEMORY_SYMBOLS[i % MEMORY_SYMBOLS.length] });
        }
    }
    
    // Duplica per fare le coppie e mescola
    let cards = [...selectedItems, ...selectedItems];
    cards = cards.sort(() => Math.random() - 0.5);

    memoryState = { cards, flipped: [], matched: 0, total: pairs, moves: 0, timer: 0, interval: null, locked: false, size };

    const board = document.getElementById('memory-board');
    board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    board.style.display = 'grid';
    
    board.innerHTML = cards.map((item, i) => {
        let frontContent;
        if (item.type === 'img') {
            frontContent = `<img src="${item.src}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" onerror="this.parentElement.innerHTML='🍆'">`;
        } else {
            frontContent = item.src;
        }
        return `
            <div class="memory-card" onclick="flipCard(${i})" id="mc-${i}">
                <span class="card-back">💋</span>
                <span class="card-front">${frontContent}</span>
            </div>
        `;
    }).join('');

    memoryState.interval = setInterval(() => {
        memoryState.timer++;
        document.getElementById('memory-timer').textContent = 'Tempo: ' + memoryState.timer + 's';
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

        // Confronta per src
        const cardA = memoryState.cards[a];
        const cardB = memoryState.cards[b];
        const isMatch = cardA.type === cardB.type && cardA.src === cardB.src;

        if (isMatch) {
            document.getElementById('mc-' + a).classList.add('matched');
            document.getElementById('mc-' + b).classList.add('matched');
            memoryState.matched++;
            memoryState.flipped = [];
            memoryState.locked = false;

            const messages = [
                "Good girl! 💋", "Brava! I tuoi occhi sono attenti 👀",
                "Perfetto! Stai imparando bene 💕", "Ottimo match! 🎀",
                "I tuoi occhi sanno dove guardare 😍", "Non ti sfugge niente! 👅",
                "Li riconosci tutti ormai... 🥵", "Memoria perfetta! 🧠"
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
    document.getElementById('memory-moves').textContent = 'Mosse: ' + memoryState.moves;
    document.getElementById('memory-pairs').textContent = 'Coppie: ' + memoryState.matched + '/' + memoryState.total;
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
        memoryState.moves + ' mosse in ' + memoryState.timer + ' secondi. Efficienza: ' + efficiency + '%';
    document.getElementById('memory-result-xp').textContent = '+' + xp + ' XP';

    const titleEl = document.getElementById('memory-result-title');
    if (efficiency >= 80) titleEl.textContent = 'Perfetto! Li riconosci tutti! 💋';
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

// ============ GAME 2: REFLEX KNEEL (CON IMMAGINI) ============
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
        
        // Mostra immagine casuale
        const goScreen = document.getElementById('reaction-go');
        const randomImg = IMAGES.reaction[Math.floor(Math.random() * IMAGES.reaction.length)];
        goScreen.innerHTML = `
            <img src="${randomImg}" style="max-width:300px;max-height:300px;border-radius:16px;border:3px solid #ff69b4;margin-bottom:20px;" onerror="this.style.display='none'">
            <h1>👑 KNEEL! 👑</h1>
            <p>CLICCA ORA!</p>
        `;
        goScreen.style.display = 'flex';
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

    document.getElementById('reaction-time-text').textContent = time + ' ms';
    document.getElementById('reaction-comment').textContent = comment;
    document.getElementById('reaction-xp').textContent = '+' + xpAmount + ' XP';

    const historyHTML = reactionState.history.slice(-5).map((t, i) =>
        'Tentativo ' + (i + 1) + ': ' + t + 'ms'
    ).join(' | ');
    document.getElementById('reaction-history').textContent = historyHTML;

    profile.gamesPlayed++;
    addDNA('obedience', time < 350 ? 5 : 2);
    addDNA('submission', 2);
    addXP(xpAmount, 'Reflex Kneel');
}

// ============ GAME 3: COCK CATCHER (CON IMMAGINI) ============
let catcherState = { running: false, score: 0, combo: 0, items: [], playerX: 200, animFrame: null, timeLeft: 60, timerInterval: null, loadedImages: {} };

// Pre-carica immagini per il catcher
function preloadCatcherImages() {
    const allImgs = [...IMAGES.catcher.good, ...IMAGES.catcher.bad];
    allImgs.forEach(src => {
        const img = new Image();
        img.src = src;
        catcherState.loadedImages[src] = img;
    });
}

function startCatcher() {
    const canvas = document.getElementById('catcher-canvas');
    const ctx = canvas.getContext('2d');
    canvas.style.display = 'block';
    document.getElementById('catcher-start').style.display = 'none';
    document.getElementById('catcher-result').style.display = 'none';

    catcherState = { running: true, score: 0, combo: 0, items: [], playerX: canvas.width / 2, animFrame: null, timeLeft: 60, timerInterval: null, loadedImages: catcherState.loadedImages };

    preloadCatcherImages();

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
        document.getElementById('catcher-timer').textContent = 'Tempo: ' + catcherState.timeLeft + 's';
        if (catcherState.timeLeft <= 0) endCatcher();
    }, 1000);

    const goodImgs = IMAGES.catcher.good;
    const badImgs = IMAGES.catcher.bad;
    const goodEmojis = ['🍆', '🍌', '🌶️', '🥒', '🍄'];
    const badEmojis = ['❌', '💀', '🚫'];

    function spawnItem() {
        if (!catcherState.running) return;
        const good = Math.random() > 0.25;
        
        let emoji, imgSrc = null;
        if (good) {
            imgSrc = goodImgs[Math.floor(Math.random() * goodImgs.length)];
            emoji = goodEmojis[Math.floor(Math.random() * goodEmojis.length)];
        } else {
            imgSrc = badImgs[Math.floor(Math.random() * badImgs.length)];
            emoji = badEmojis[Math.floor(Math.random() * badEmojis.length)];
        }

        catcherState.items.push({
            x: Math.random() * (canvas.width - 40),
            y: -40,
            good: good,
            emoji: emoji,
            imgSrc: imgSrc,
            speed: 2 + Math.random() * 3,
            size: 40
        });
        setTimeout(spawnItem, 400 + Math.random() * 800);
    }

    function gameLoop() {
        if (!catcherState.running) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Disegna player (bocca)
        ctx.font = '35px serif';
        ctx.textAlign = 'center';
        ctx.fillText('👄', catcherState.playerX, canvas.height - 20);

        // Update & draw items
        for (let i = catcherState.items.length - 1; i >= 0; i--) {
            const item = catcherState.items[i];
            item.y += item.speed;
            
            // Prova a disegnare immagine, fallback a emoji
            const img = catcherState.loadedImages[item.imgSrc];
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, item.x, item.y, item.size, item.size);
            } else {
                ctx.font = '28px serif';
                ctx.fillText(item.emoji, item.x + item.size/2, item.y + item.size - 5);
            }

            // Catch check
            if (item.y + item.size >= canvas.height - 40 && Math.abs(item.x + item.size/2 - catcherState.playerX) < 35) {
                if (item.good) {
                    catcherState.score += 10 + catcherState.combo * 2;
                    catcherState.combo++;
                } else {
                    catcherState.score = Math.max(0, catcherState.score - 20);
                    catcherState.combo = 0;
                }
                catcherState.items.splice(i, 1);
                document.getElementById('catcher-score').textContent = 'Score: ' + catcherState.score;
                document.getElementById('catcher-combo').textContent = 'Combo: ' + catcherState.combo;
                continue;
            }

            // Off screen
            if (item.y > canvas.height + 40) {
                if (item.good) catcherState.combo = 0;
                catcherState.items.splice(i, 1);
            }
        }

        // Combo messages
        if (catcherState.combo >= 10) {
            ctx.fillStyle = 'rgba(255,105,180,0.8)';
            ctx.font = 'bold 18px Quicksand, sans-serif';
            ctx.fillText('🔥 INSATIABLE! 🔥', canvas.width / 2, 30);
            ctx.fillStyle = '#fff';
        } else if (catcherState.combo >= 5) {
            ctx.fillStyle = 'rgba(255,105,180,0.6)';
            ctx.font = 'bold 16px Quicksand, sans-serif';
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
        'Score finale: ' + catcherState.score + ' — Combo massimo: ' + catcherState.combo;
    document.getElementById('catcher-xp').textContent = '+' + xp + ' XP';

    profile.gamesPlayed++;
    addDNA('devotion', Math.min(10, Math.floor(catcherState.score / 50)));
    addDNA('addiction', 2);
    addXP(xp, 'Cock Catcher');
}

// ============ GAME 4: SIZE SORTER (CON IMMAGINI) ============
let sorterState = { items: [], selected: [], correct: [] };

function startSorter() {
    document.getElementById('sorter-intro').style.display = 'none';
    document.getElementById('sorter-result').style.display = 'none';
    document.getElementById('sorter-game').style.display = 'block';
    document.getElementById('sorter-check').style.display = 'none';

    // Crea items con dimensioni e immagini
    const categories = [
        { label: 'small', size: 10 + Math.floor(Math.random() * 3), imgs: IMAGES.sorter.small },
        { label: 'small', size: 11 + Math.floor(Math.random() * 2), imgs: IMAGES.sorter.small },
        { label: 'medium', size: 15 + Math.floor(Math.random() * 3), imgs: IMAGES.sorter.medium },
        { label: 'medium', size: 16 + Math.floor(Math.random() * 2), imgs: IMAGES.sorter.medium },
        { label: 'big', size: 19 + Math.floor(Math.random() * 3), imgs: IMAGES.sorter.big },
        { label: 'big', size: 20 + Math.floor(Math.random() * 2), imgs: IMAGES.sorter.big },
        { label: 'huge', size: 23 + Math.floor(Math.random() * 3), imgs: IMAGES.sorter.huge },
    ];

    // Prendi 5-7 items random
    const count = 5 + Math.floor(Math.random() * 3);
    const shuffled = [...categories].sort(() => Math.random() - 0.5).slice(0, count);
    
    // Assicurati che le dimensioni siano uniche
    const usedSizes = new Set();
    const items = [];
    shuffled.forEach(cat => {
        let s = cat.size;
        while (usedSizes.has(s)) s++;
        usedSizes.add(s);
        const img = cat.imgs[Math.floor(Math.random() * cat.imgs.length)];
        items.push({ size: s, img: img, label: cat.label });
    });

    const displayOrder = [...items].sort(() => Math.random() - 0.5);
    const correct = [...items].sort((a, b) => a.size - b.size);

    sorterState = { items: displayOrder, selected: [], correct };

    const container = document.getElementById('sorter-items');
    container.innerHTML = displayOrder.map((item, i) => `
        <div class="sorter-item" onclick="selectSorterItem(${i})" id="si-${i}" style="padding:10px;text-align:center;">
            <img src="${item.img}" style="width:100px;height:100px;object-fit:cover;border-radius:8px;display:block;margin:0 auto 8px;" onerror="this.style.display='none'">
            <div>${item.size} cm</div>
        </div>
    `).join('');

    document.getElementById('sorter-order').innerHTML = '';
}

function selectSorterItem(i) {
    const el = document.getElementById('si-' + i);
    if (el.classList.contains('selected')) return;
    el.classList.add('selected');
    sorterState.selected.push(sorterState.items[i]);

    const orderContainer = document.getElementById('sorter-order');
    orderContainer.innerHTML = sorterState.selected.map(s => `<span class="sorted-tag">${s.size} cm</span>`).join('');

    if (sorterState.selected.length === sorterState.items.length) {
        document.getElementById('sorter-check').style.display = 'inline-block';
    }
}

function checkSorter() {
    const selectedSizes = sorterState.selected.map(s => s.size);
    const correctSizes = sorterState.correct.map(s => s.size);
    const isCorrect = JSON.stringify(selectedSizes) === JSON.stringify(correctSizes);
    
    document.getElementById('sorter-game').style.display = 'none';
    document.getElementById('sorter-result').style.display = 'block';

    const xp = isCorrect ? 80 : 20;
    document.getElementById('sorter-result-title').textContent = isCorrect
        ? 'Perfetto! Conosci le dimensioni a perfezione! 💋'
        : 'Non esattamente... L\'ordine corretto era: ' + correctSizes.map(s => s + 'cm').join(' → ');
    document.getElementById('sorter-result-text').textContent = isCorrect
        ? 'I tuoi occhi sanno valutare perfettamente. Sei un\'esperta.'
        : 'Hai bisogno di più pratica. Continua a studiare! 👀';
    document.getElementById('sorter-xp').textContent = '+' + xp + ' XP';

    profile.gamesPlayed++;
    addDNA('devotion', isCorrect ? 5 : 1);
    addXP(xp, 'Size Sorter');
}

// ============ GAME 5: MANTRA TYPER (CON SFONDO) ============
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

    // Sfondo casuale
    const bgImg = IMAGES.mantra[Math.floor(Math.random() * IMAGES.mantra.length)];
    const gameArea = document.getElementById('mantra-game');
    gameArea.style.backgroundImage = 'url(' + bgImg + ')';
    gameArea.style.backgroundSize = 'cover';
    gameArea.style.backgroundPosition = 'center';
    gameArea.style.borderRadius = '16px';
    gameArea.style.padding = '30px';

    mantraState = { timer: null, timeLeft: 60, score: 0, completed: 0, currentMantra: '' };
    nextMantra();

    const input = document.getElementById('mantra-input');
    input.value = '';
    input.focus();
    input.oninput = checkMantraInput;

    mantraState.timer = setInterval(() => {
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
    const input = document.getElementById('mantra-input').value;
    const target = mantraState.currentMantra;

    if (input.toLowerCase().trim() === target.toLowerCase()) {
        mantraState.completed++;
        mantraState.score += 100;
        document.getElementById('mantra-completed').textContent = mantraState.completed;
        document.getElementById('mantra-score').textContent = 'Score: ' + mantraState.score;

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
    document.getElementById('mantra-game').style.backgroundImage = 'none';
    document.getElementById('mantra-result').style.display = 'block';

    const xp = mantraState.completed * 25;
    document.getElementById('mantra-result-text').textContent =
        'Hai scritto ' + mantraState.completed + ' mantra in 60 secondi. Score: ' + mantraState.score;
    document.getElementById('mantra-xp').textContent = '+' + xp + ' XP';

    profile.gamesPlayed++;
    addDNA('submission', mantraState.completed);
    addDNA('femininity', Math.floor(mantraState.completed / 2));
    addDNA('addiction', 2);
    addXP(xp, 'Mantra Typer');
}

// ============ GAME 6: GAZE LOCK (CON IMMAGINI) ============
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

    // Mostra immagine casuale nel centro
    const randomImg = IMAGES.gaze[Math.floor(Math.random() * IMAGES.gaze.length)];
    const gazeCenter = document.getElementById('gaze-center');
    gazeCenter.innerHTML = `
        <img src="${randomImg}" style="width:250px;height:250px;object-fit:cover;border-radius:50%;border:3px solid #ff69b4;animation:gazePulse 3s ease-in-out infinite;" onerror="this.outerHTML='<div class=\\'gaze-symbol\\'>👑</div>'">
        <div class="gaze-text" id="gaze-affirmation"></div>
    `;

    // Cambia immagine ogni 20 secondi
    let imgChangeCounter = 0;

    gazeState.interval = setInterval(() => {
        gazeState.timer++;
        const min = Math.floor(gazeState.timer / 60);
        const sec = gazeState.timer % 60;
        document.getElementById('gaze-timer').textContent = min + ':' + sec.toString().padStart(2, '0');

        // Cambia affirmation ogni 5 secondi
        if (gazeState.timer % 5 === 0) {
            const aff = GAZE_AFFIRMATIONS[Math.floor(Math.random() * GAZE_AFFIRMATIONS.length)];
            const el = document.getElementById('gaze-affirmation');
            if (el) {
                el.style.opacity = 0;
                setTimeout(() => { el.textContent = aff; el.style.opacity = 0.7; }, 500);
            }
        }

        // Cambia immagine ogni 20 secondi
        if (gazeState.timer % 20 === 0) {
            const newImg = IMAGES.gaze[Math.floor(Math.random() * IMAGES.gaze.length)];
            const imgEl = gazeCenter.querySelector('img');
            if (imgEl) {
                imgEl.style.opacity = 0;
                setTimeout(() => { imgEl.src = newImg; imgEl.style.opacity = 1; }, 500);
            }
        }

        // Mostra confirm button ogni 15-30 secondi
        if (gazeState.timer > 0 && gazeState.timer % (15 + Math.floor(Math.random() * 15)) === 0) {
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
    document.getElementById('gaze-xp').textContent = '+' + xp + ' XP';

    profile.gamesPlayed++;
    addDNA('devotion', Math.floor(gazeState.timer / 10));
    addDNA('submission', Math.floor(gazeState.timer / 20));
    addDNA('obedience', gazeState.failed ? 0 : 3);
    addXP(xp, 'Gaze Lock');
}

// ============ BEHAVIORAL SESSIONS (CON IMMAGINI) ============
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

    // Sfondo immagine della sessione
    const bg = document.getElementById('session-bg');
    const bgImg = IMAGES.sessions[id];
    if (bgImg) {
        bg.style.backgroundImage = 'url(' + bgImg + ')';
        bg.style.backgroundSize = 'cover';
        bg.style.backgroundPosition = 'center';
        bg.style.filter = 'blur(3px) brightness(0.3)';
    } else {
        bg.style.backgroundImage = 'none';
    }

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

    setInterval(() => {
        profile.totalTime++;
        if (profile.totalTime % 60 === 0) DB.set('profile', profile);
    }, 1000);
}

init();
