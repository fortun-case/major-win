// --- FIREBASE ИНИЦИАЛИЗАЦИЯ ---
const firebaseConfig = {
    apiKey: "AIzaSyA-8Htang_pmMugvnekBa2s4akqHD7fGYU",
    authDomain: "major-win-b2255.firebaseapp.com",
    databaseURL: "https://major-win-b2255-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "major-win-b2255",
    storageBucket: "major-win-b2255.firebasestorage.app",
    messagingSenderId: "1088188197034",
    appId: "1:1088188197034:web:57e71de855ec78b32c88d3"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// --- СОСТОЯНИЕ ИГРЫ ---
let state = {
    user: null,
    balance: 100.00,
    inventory: [],
    name: "Новый игрок",
    isSpinning: false,
    upgradeSource: null,
    upgradeTarget: null,
    contractItems: []
};

// --- КОНСТАНТЫ ---
const RARITIES = {
    MIL_SPEC: { name: 'Армейское', color: '#4b69ff' },
    RESTRICTED: { name: 'Запрещенное', color: '#8847ff' },
    CLASSIFIED: { name: 'Засекреченное', color: '#d32ce6' },
    COVERT: { name: 'Тайное', color: '#eb4b4b' },
    GOLD: { name: '★ Редкое', color: '#ffd700' },
};

const ITEMS = {
    ak47: { id: 'ak47', name: "AK-47 | Ледяной уголь", price: 15.5, rarity: "CLASSIFIED" },
    m4a4: { id: 'm4a4', name: "M4A4 | Тени", price: 5.2, rarity: "RESTRICTED" },
    awp: { id: 'awp', name: "AWP | Градиент", price: 1400.0, rarity: "COVERT" },
    usp: { id: 'usp', name: "USP-S | Сайрекс", price: 3.1, rarity: "MIL_SPEC" },
    knife: { id: 'knife', name: "★ Нож-бабочка | Допплер", price: 2800.0, rarity: "GOLD" },
    deagle: { id: 'deagle', name: "Desert Eagle | Пламя", price: 550.0, rarity: "COVERT" },
    glock: { id: 'glock', name: "Glock-18 | Дух воды", price: 8.4, rarity: "RESTRICTED" }
};

const CASES = [
    { id: 'kilowatt', name: 'Кейс «Киловатт»', price: 2.5, color: 'from-yellow-600', items: ['usp', 'm4a4', 'glock', 'ak47'] },
    { id: 'revolution', name: 'Кейс «Революция»', price: 3.0, color: 'from-red-600', items: ['glock', 'ak47', 'deagle', 'awp'] },
    { id: 'knife_case', name: 'КЕЙС С НОЖОМ', price: 250.0, color: 'from-amber-500', items: ['ak47', 'awp', 'knife'] }
];

// --- ЭКСПОРТ ФУНКЦИЙ В WINDOW (ЧТОБЫ HTML ВИДЕЛ ИХ) ---

window.showSection = (id) => {
    if (state.isSpinning) return;
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    const sec = document.getElementById(`sec-${id}`);
    if (sec) sec.classList.remove('hidden');
    
    if (id === 'home') renderHome();
    if (id === 'profile') renderProfile();
    if (id === 'upgrades') renderUpgrades();
    if (id === 'contracts') renderContracts();
};

window.loginGoogle = () => {
    auth.signInWithPopup(googleProvider).catch(e => console.error("Auth error:", e));
};

window.logout = () => {
    auth.signOut().then(() => {
        state.user = null;
        location.reload();
    });
};

window.saveNick = () => {
    const val = document.getElementById('profile-name-input').value.trim();
    if (!val) return;
    state.name = val;
    saveToDB();
};

// --- БАЗОВАЯ ЛОГИКА ---

function updateUI() {
    document.getElementById('balance-display').innerText = `$${state.balance.toFixed(2)}`;
}

function saveToDB() {
    if (!state.user || state.user.isAnonymous) return;
    db.ref('users/' + state.user.uid).set({
        name: state.name,
        balance: state.balance,
        inventory: state.inventory
    });
}

// --- АВТОРИЗАЦИЯ ---
auth.onAuthStateChanged(user => {
    state.user = user;
    if (user && !user.isAnonymous) {
        document.getElementById('user-logged-out').classList.add('hidden');
        document.getElementById('user-logged-in').classList.remove('hidden');
        document.getElementById('user-email').innerText = user.email;
        if (user.photoURL) {
            document.getElementById('user-avatar').src = user.photoURL;
            document.getElementById('user-avatar').classList.remove('hidden');
            document.getElementById('user-icon').classList.add('hidden');
        }

        db.ref('users/' + user.uid).on('value', snap => {
            const data = snap.val();
            if (data) {
                state.balance = data.balance ?? 100;
                state.inventory = data.inventory || [];
                state.name = data.name || "Major Player";
                updateUI();
                renderHome();
            } else {
                saveToDB();
            }
        });
    } else {
        // Анонимный вход по умолчанию
        if (!user) auth.signInAnonymously();
        document.getElementById('user-logged-out').classList.remove('hidden');
        document.getElementById('user-logged-in').classList.add('hidden');
        updateUI();
        renderHome();
    }
});

// --- РЕНДЕРИНГ ---

function renderHome() {
    const grid = document.getElementById('cases-grid');
    if (!grid) return;
    grid.innerHTML = CASES.map(c => `
        <div onclick="window.openCaseDetail('${c.id}')" class="group bg-zinc-900 border border-white/5 rounded-[32px] p-8 cursor-pointer hover:border-red-600 transition-all text-center">
            <div class="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br ${c.color} to-black mb-6 flex items-center justify-center">
                <i class="fa-solid fa-box-open text-3xl text-white/20"></i>
            </div>
            <h3 class="text-xl font-black italic uppercase italic tracking-tighter">${c.name}</h3>
            <p class="text-emerald-400 font-mono font-bold mt-4">$${c.price.toFixed(2)}</p>
        </div>
    `).join('');
}

window.openCaseDetail = (id) => {
    state.currentCase = CASES.find(c => c.id === id);
    document.getElementById('case-title').innerText = state.currentCase.name;
    document.getElementById('case-price').innerText = `$${state.currentCase.price.toFixed(2)}`;
    
    const lootGrid = document.getElementById('case-loot-grid');
    lootGrid.innerHTML = state.currentCase.items.map(itemId => {
        const item = ITEMS[itemId];
        return `<div class="bg-zinc-900 border-b-2 p-3 rounded-xl text-center" style="border-bottom-color: ${RARITIES[item.rarity].color}">
            <div class="text-[8px] font-black uppercase" style="color: ${RARITIES[item.rarity].color}">${RARITIES[item.rarity].name}</div>
            <div class="text-[10px] font-bold truncate">${item.name}</div>
        </div>`;
    }).join('');
    
    window.showSection('case-detail');
};

// --- РУЛЕТКА ---

window.startSpin = () => {
    if (state.isSpinning || state.balance < state.currentCase.price) return;
    state.balance -= state.currentCase.price;
    state.isSpinning = true;
    updateUI();

    const track = document.getElementById('roulette-track');
    const winningIndex = 40;
    const pool = Array.from({length: 50}, () => ITEMS[state.currentCase.items[Math.floor(Math.random()*state.currentCase.items.length)]]);
    const wonItem = pool[winningIndex];

    track.innerHTML = pool.map(item => `
        <div class="w-[150px] h-32 bg-zinc-900 border-b-4 mx-1 rounded-2xl flex flex-col items-center justify-center p-4 shrink-0" style="border-bottom-color: ${RARITIES[item.rarity].color}">
            <i class="fa-solid fa-gun text-zinc-800 text-xl"></i>
            <p class="text-[9px] text-center font-black uppercase mt-2">${item.name}</p>
        </div>
    `).join('');

    track.style.transition = 'none';
    track.style.transform = 'translateX(0px)';
    
    setTimeout(() => {
        const offset = (winningIndex * 158) - (track.parentElement.offsetWidth / 2) + 79;
        track.style.transition = 'transform 6s cubic-bezier(0.1, 0.8, 0.1, 1)';
        track.style.transform = `translateX(-${offset}px)`;
    }, 50);

    setTimeout(() => {
        state.isSpinning = false;
        state.inventory.unshift({ ...wonItem, dbId: Date.now() });
        showWinModal(wonItem);
        saveToDB();
    }, 6200);
};

function showWinModal(item) {
    document.getElementById('win-name').innerText = item.name;
    document.getElementById('win-price').innerText = `$${item.price.toFixed(2)}`;
    document.getElementById('btn-win-sell').onclick = () => {
        state.balance += item.price;
        state.inventory.shift();
        saveToDB();
        window.closeWinModal();
        updateUI();
    };
    document.getElementById('modal-win').classList.remove('hidden');
    document.getElementById('modal-win').classList.add('flex');
}

window.closeWinModal = () => document.getElementById('modal-win').classList.add('hidden');

// --- ИНВЕНТАРЬ ---

function renderProfile() {
    const grid = document.getElementById('profile-inventory-grid');
    document.getElementById('profile-inv-count').innerText = state.inventory.length;
    document.getElementById('profile-name-input').value = state.name;
    
    grid.innerHTML = state.inventory.map((item, idx) => `
        <div class="bg-zinc-900 border border-white/5 p-4 rounded-3xl text-center">
            <div class="text-[8px] font-black uppercase" style="color: ${RARITIES[item.rarity].color}">${RARITIES[item.rarity].name}</div>
            <div class="text-[10px] font-bold my-4 h-8 line-clamp-2">${item.name}</div>
            <button onclick="window.sellItem(${idx})" class="w-full py-2 bg-zinc-800 rounded-xl text-[9px] font-black uppercase hover:bg-red-600 transition-all">$${item.price}</button>
        </div>
    `).join('');
}

window.sellItem = (idx) => {
    state.balance += state.inventory[idx].price;
    state.inventory.splice(idx, 1);
    saveToDB();
    renderProfile();
    updateUI();
};

// --- АПГРЕЙДЫ (UPGRADES) ---

function renderUpgrades() {
    const inv = document.getElementById('upgrade-inv-list');
    const shop = document.getElementById('upgrade-shop-list');
    
    inv.innerHTML = state.inventory.map((item, idx) => `
        <div onclick="window.setUpgradeSource(${idx})" class="bg-black/40 p-2 rounded-xl border border-white/5 text-center cursor-pointer hover:border-red-600 text-[9px]">
            <div class="font-bold h-6 overflow-hidden">${item.name}</div>
            <div class="text-emerald-400">$${item.price}</div>
        </div>
    `).join('');

    shop.innerHTML = Object.values(ITEMS).map(item => `
        <div onclick="window.setUpgradeTarget('${item.id}')" class="bg-black/40 p-2 rounded-xl border border-white/5 text-center cursor-pointer hover:border-emerald-600 text-[9px]">
            <div class="font-bold h-6 overflow-hidden">${item.name}</div>
            <div class="text-emerald-400">$${item.price}</div>
        </div>
    `).join('');
    
    updateUpgradeUI();
}

window.setUpgradeSource = (idx) => {
    state.upgradeSource = { ...state.inventory[idx], index: idx };
    document.getElementById('upgrade-source-box').innerHTML = `<p class="font-black">${state.upgradeSource.name}<br><span class="text-emerald-400">$${state.upgradeSource.price}</span></p>`;
    updateUpgradeUI();
};

window.setUpgradeTarget = (id) => {
    state.upgradeTarget = ITEMS[id];
    document.getElementById('upgrade-target-box').innerHTML = `<p class="font-black">${state.upgradeTarget.name}<br><span class="text-emerald-400">$${state.upgradeTarget.price}</span></p>`;
    updateUpgradeUI();
};

function updateUpgradeUI() {
    if (!state.upgradeSource || !state.upgradeTarget) return;
    const chance = Math.min((state.upgradeSource.price / state.upgradeTarget.price) * 95, 95);
    document.getElementById('upgrade-chance-val').innerText = chance.toFixed(1) + '%';
    document.getElementById('upgrade-chance-bar').style.strokeDashoffset = 440 - (440 * chance) / 100;
}

window.executeUpgrade = () => {
    if (!state.upgradeSource || !state.upgradeTarget || state.isSpinning) return;
    state.isSpinning = true;
    const chance = Math.min((state.upgradeSource.price / state.upgradeTarget.price) * 95, 95);
    
    setTimeout(() => {
        if (Math.random() * 100 <= chance) {
            state.inventory.splice(state.upgradeSource.index, 1);
            state.inventory.unshift({ ...state.upgradeTarget, dbId: Date.now() });
            alert("УСПЕХ!");
        } else {
            state.inventory.splice(state.upgradeSource.index, 1);
            alert("НЕУДАЧА!");
        }
        state.isSpinning = false;
        state.upgradeSource = null;
        state.upgradeTarget = null;
        saveToDB();
        window.showSection('upgrades');
    }, 2000);
};

// --- КОНТРАКТЫ ---

function renderContracts() {
    document.getElementById('contract-inv-list').innerHTML = state.inventory.map((item, idx) => {
        const isSelected = state.contractItems.includes(idx);
        return `<div onclick="window.toggleContractItem(${idx})" class="p-2 bg-zinc-900 border ${isSelected ? 'border-red-600' : 'border-white/5'} rounded-xl cursor-pointer text-[9px] text-center">$${item.price}</div>`;
    }).join('');

    document.getElementById('contract-slots').innerHTML = state.contractItems.map(idx => `<div class="bg-red-600/20 p-2 rounded-xl text-[8px] text-center">$${state.inventory[idx].price}</div>`).join('');
    
    const total = state.contractItems.reduce((acc, idx) => acc + state.inventory[idx].price, 0);
    document.getElementById('contract-total-value').innerText = `$${total.toFixed(2)}`;
}

window.toggleContractItem = (idx) => {
    const pos = state.contractItems.indexOf(idx);
    if (pos > -1) state.contractItems.splice(pos, 1);
    else if (state.contractItems.length < 10) state.contractItems.push(idx);
    renderContracts();
};

window.executeContract = () => {
    if (state.contractItems.length < 3 || state.isSpinning) return;
    state.isSpinning = true;
    const total = state.contractItems.reduce((acc, idx) => acc + state.inventory[idx].price, 0);
    
    setTimeout(() => {
        const rewardValue = total * (0.8 + Math.random() * 1.2);
        const rewardItem = Object.values(ITEMS).reduce((prev, curr) => Math.abs(curr.price - rewardValue) < Math.abs(prev.price - rewardValue) ? curr : prev);
        
        const sortedIndices = [...state.contractItems].sort((a,b) => b-a);
        sortedIndices.forEach(i => state.inventory.splice(i, 1));
        
        state.inventory.unshift({ ...rewardItem, dbId: Date.now() });
        state.contractItems = [];
        state.isSpinning = false;
        saveToDB();
        showWinModal(rewardItem);
        window.showSection('contracts');
    }, 1500);
};

// --- ИНИЦИАЛИЗАЦИЯ ---
window.onload = () => window.showSection('home');
