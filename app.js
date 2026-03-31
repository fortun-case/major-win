// --- FIREBASE SETUP ---
const firebaseConfig = {
    apiKey: "AIzaSyA-8Htang_pmMugvnekBa2s4akqHD7fGYU",
    authDomain: "major-win-b2255.firebaseapp.com",
    databaseURL: "https://major-win-b2255-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "major-win-b2255",
    storageBucket: "major-win-b2255.firebasestorage.app",
    messagingSenderId: "1088188197034",
    appId: "1:1088188197034:web:57e71de855ec78b32c88d3"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// --- STATE ---
let state = {
    user: null,
    balance: 100.00,
    inventory: [],
    name: "Новый игрок",
    isSpinning: false,
    currentCase: null
};

// --- ДАННЫЕ ПРЕДМЕТОВ ---
const RARITIES = {
    MIL_SPEC: { name: 'Армейское', color: '#4b69ff', chance: 75 },
    RESTRICTED: { name: 'Запрещенное', color: '#8847ff', chance: 15 },
    CLASSIFIED: { name: 'Засекреченное', color: '#d32ce6', chance: 7 },
    COVERT: { name: 'Тайное', color: '#eb4b4b', chance: 2.5 },
    GOLD: { name: '★ Редкое', color: '#ffd700', chance: 0.5 },
};

const ITEMS = {
    ak47: { name: "AK-47 | Ледяной уголь", price: 15.5, rarity: "CLASSIFIED" },
    m4a4: { name: "M4A4 | Тени", price: 5.2, rarity: "RESTRICTED" },
    awp: { name: "AWP | Градиент", price: 1400.0, rarity: "COVERT" },
    usp: { name: "USP-S | Сайрекс", price: 3.1, rarity: "MIL_SPEC" },
    knife: { name: "★ Нож-бабочка | Допплер", price: 2800.0, rarity: "GOLD" },
    deagle: { name: "Desert Eagle | Пламя", price: 550.0, rarity: "COVERT" },
    glock: { name: "Glock-18 | Дух воды", price: 8.4, rarity: "RESTRICTED" }
};

const CASES = [
    { id: 'kilowatt', name: 'Кейс «Киловатт»', price: 2.5, color: 'from-yellow-600', items: ['usp', 'm4a4', 'glock', 'ak47'] },
    { id: 'dreams', name: 'Кейс «Грёзы»', price: 1.8, color: 'from-purple-600', items: ['usp', 'glock', 'm4a4'] },
    { id: 'revolution', name: 'Кейс «Революция»', price: 3.0, color: 'from-red-600', items: ['glock', 'ak47', 'deagle', 'awp'] },
    { id: 'knife_case', name: 'КЕЙС С НОЖОМ', price: 250.0, color: 'from-amber-500', items: ['ak47', 'awp', 'knife'] }
];

// --- CORE FUNCTIONS ---

function showSection(id) {
    if (state.isSpinning) return;
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`sec-${id}`).classList.remove('hidden');
    
    if (id === 'home') renderHome();
    if (id === 'profile') renderProfile();
    window.scrollTo(0, 0);
}

function updateUI() {
    document.getElementById('balance-display').innerText = `$${state.balance.toFixed(2)}`;
    const headerInv = document.getElementById('header-inventory-count');
    if(headerInv) headerInv.innerText = state.inventory.length;
}

// --- DATABASE SYNC ---
function saveToDB() {
    if (!state.user) return;
    db.ref('users/' + state.user.uid).set({
        name: state.name,
        balance: state.balance,
        inventory: state.inventory
    });
}

// --- HOME RENDER ---
function renderHome() {
    const grid = document.getElementById('cases-grid');
    grid.innerHTML = CASES.map(c => `
        <div onclick="openCaseDetail('${c.id}')" class="group bg-zinc-900 border border-white/5 rounded-[32px] p-10 cursor-pointer hover:border-red-600/40 transition-all text-center relative overflow-hidden active:scale-95">
            <div class="absolute top-6 right-8 font-mono font-black text-emerald-400 text-lg">$${c.price.toFixed(2)}</div>
            <div class="w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br ${c.color} to-black mb-8 flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                <i class="fa-solid fa-box-open text-5xl text-white/30"></i>
            </div>
            <h3 class="text-2xl font-black italic uppercase tracking-tighter group-hover:text-red-500 transition-colors">${c.name}</h3>
        </div>
    `).join('');
}

// --- CASE LOGIC ---
function openCaseDetail(id) {
    state.currentCase = CASES.find(c => c.id === id);
    document.getElementById('case-title').innerText = state.currentCase.name;
    document.getElementById('case-price').innerText = `$${state.currentCase.price.toFixed(2)}`;
    
    const lootGrid = document.getElementById('case-loot-grid');
    lootGrid.innerHTML = state.currentCase.items.map(itemId => {
        const item = ITEMS[itemId];
        return `
            <div class="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl text-center group">
                <div class="h-16 flex items-center justify-center mb-3"><i class="fa-solid fa-gun text-zinc-800 text-xl"></i></div>
                <div class="text-[9px] font-black uppercase mb-1" style="color: ${RARITIES[item.rarity].color}">${RARITIES[item.rarity].name}</div>
                <div class="text-[11px] font-bold leading-tight h-8 line-clamp-2">${item.name}</div>
            </div>
        `;
    }).join('');
    
    // Очистка рулетки
    document.getElementById('roulette-track').innerHTML = '';
    document.getElementById('roulette-track').style.transform = 'translateX(0px)';
    
    showSection('case-detail');
}

function startSpin() {
    if (state.isSpinning || state.balance < state.currentCase.price) return;

    state.balance -= state.currentCase.price;
    state.isSpinning = true;
    updateUI();
    saveToDB();

    const btn = document.getElementById('btn-spin');
    btn.disabled = true;
    btn.classList.add('opacity-50');
    document.getElementById('spin-label').innerText = "Ожидание...";

    const track = document.getElementById('roulette-track');
    const winningIndex = 45; // Предмет, который выиграет
    const pool = [];

    // Генерируем 60 предметов для ленты
    for (let i = 0; i < 65; i++) {
        const rand = Math.random() * 100;
        let cumulative = 0;
        let chosenRarity = 'MIL_SPEC';
        for (const [key, r] of Object.entries(RARITIES)) {
            cumulative += r.chance;
            if (rand <= cumulative) { chosenRarity = key; break; }
        }
        
        // Фильтруем предметы кейса по редкости или берем любой из кейса если такой редкости нет
        const possibleItems = state.currentCase.items
            .map(id => ITEMS[id])
            .filter(item => item.rarity === chosenRarity);
        
        const item = possibleItems.length > 0 
            ? possibleItems[Math.floor(Math.random() * possibleItems.length)]
            : ITEMS[state.currentCase.items[0]];
            
        pool.push(item);
    }

    const wonItem = pool[winningIndex];

    track.innerHTML = pool.map(item => `
        <div class="w-[160px] h-32 md:h-40 bg-zinc-900 border-b-4 mx-1 rounded-2xl flex flex-col items-center justify-center p-4 shrink-0 shadow-xl" style="border-bottom-color: ${RARITIES[item.rarity].color}">
            <i class="fa-solid fa-gun text-zinc-800 text-3xl mb-2"></i>
            <p class="text-[10px] text-center font-black uppercase line-clamp-2">${item.name}</p>
        </div>
    `).join('');

    track.style.transition = 'none';
    track.style.transform = 'translateX(0px)';

    setTimeout(() => {
        const cardWidth = 168; // 160 + 8 (margin)
        const containerWidth = document.getElementById('roulette-container').offsetWidth;
        const centerOffset = containerWidth / 2;
        const randomInnerOffset = Math.floor(Math.random() * 100) - 50; // Чтобы не ровно в центр
        const finalPosition = (winningIndex * cardWidth) - centerOffset + (cardWidth / 2) + randomInnerOffset;
        
        track.style.transition = 'transform 8s cubic-bezier(0.1, 0.85, 0.1, 1)';
        track.style.transform = `translateX(-${finalPosition}px)`;
    }, 50);

    setTimeout(() => {
        state.isSpinning = false;
        state.inventory.unshift({ ...wonItem, id: Date.now() });
        
        btn.disabled = false;
        btn.classList.remove('opacity-50');
        document.getElementById('spin-label').innerHTML = `Открыть за <span>$${state.currentCase.price.toFixed(2)}</span>`;
        
        showWinModal(wonItem);
        saveToDB();
        updateUI();
    }, 8200);
}

// --- WIN MODAL ---
function showWinModal(item) {
    const modal = document.getElementById('modal-win');
    document.getElementById('modal-glow').style.backgroundColor = RARITIES[item.rarity].color;
    const rarityLabel = document.getElementById('win-rarity');
    rarityLabel.innerText = RARITIES[item.rarity].name;
    rarityLabel.style.color = RARITIES[item.rarity].color;
    document.getElementById('win-name').innerText = item.name;
    document.getElementById('win-price').innerText = `$${item.price.toFixed(2)}`;
    
    document.getElementById('btn-win-sell').onclick = () => {
        state.balance += item.price;
        state.inventory.shift(); // Убираем последний добавленный
        updateUI();
        saveToDB();
        closeWinModal();
    };
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeWinModal() {
    document.getElementById('modal-win').classList.add('hidden');
    document.getElementById('modal-win').classList.remove('flex');
}

// --- PROFILE ---
function renderProfile() {
    document.getElementById('profile-name-input').value = state.name;
    const grid = document.getElementById('profile-inventory-grid');
    document.getElementById('profile-inv-count').innerText = state.inventory.length;
    
    if (state.inventory.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-20 text-center text-zinc-600 font-bold uppercase tracking-widest">Склад пуст</div>`;
        return;
    }

    grid.innerHTML = state.inventory.map((item, idx) => `
        <div class="skin-card bg-zinc-900 border border-white/5 p-5 rounded-3xl text-center relative overflow-hidden group">
            <div class="h-24 flex items-center justify-center mb-4"><i class="fa-solid fa-gun text-4xl text-zinc-800 group-hover:text-zinc-700 transition-colors"></i></div>
            <div class="text-[10px] font-black uppercase mb-1" style="color: ${RARITIES[item.rarity].color}">${RARITIES[item.rarity].name}</div>
            <div class="text-xs font-bold mb-6 h-10 line-clamp-2 text-zinc-300">${item.name}</div>
            <button onclick="sellItem(${idx})" class="w-full py-3 bg-zinc-800 text-white rounded-xl text-[10px] font-black uppercase hover:bg-red-600 transition-all border border-white/5">Продать за $${item.price}</button>
        </div>
    `).join('');
}

window.sellItem = function(idx) {
    state.balance += state.inventory[idx].price;
    state.inventory.splice(idx, 1);
    updateUI();
    saveToDB();
    renderProfile();
};

window.saveNick = function() {
    const nick = document.getElementById('profile-name-input').value.trim();
    if (!nick) return alert("Никнейм не может быть пустым!");
    state.name = nick;
    saveToDB();
    alert("Никнейм изменен!");
};

window.usePromo = function() {
    const code = document.getElementById('promo-input').value.trim().toUpperCase();
    if (code === 'MAJOR2026') {
        state.balance += 50;
        alert("Бонус $50 начислен!");
        document.getElementById('promo-input').value = '';
        updateUI();
        saveToDB();
    } else {
        alert("Неверный или просроченный код");
    }
};

// --- AUTH & INIT ---
auth.onAuthStateChanged(fbUser => {
    if (fbUser) {
        state.user = fbUser;
        db.ref('users/' + fbUser.uid).on('value', snapshot => {
            const data = snapshot.val();
            if (data) {
                state.name = data.name || "Новый игрок";
                state.balance = data.balance ?? 100.00;
                state.inventory = data.inventory || [];
                updateUI();
                renderHome(); // Рендерим после получения данных
            } else {
                saveToDB();
            }
        });
    } else {
        auth.signInAnonymously().catch(e => console.error("Auth error:", e));
    }
});

// Fallback если Firebase долго грузится
window.onload = () => {
    updateUI();
    renderHome();
};
