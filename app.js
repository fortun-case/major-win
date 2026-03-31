const RARITIES = {
    MIL_SPEC: { name: 'Армейское качество', color: '#4b69ff', chance: 79.92 },
    RESTRICTED: { name: 'Запрещенное', color: '#8847ff', chance: 15.98 },
    CLASSIFIED: { name: 'Засекреченное', color: '#d32ce6', chance: 3.2 },
    COVERT: { name: 'Тайное', color: '#eb4b4b', chance: 0.64 },
    GOLD: { name: 'Редкий предмет', color: '#ffd700', chance: 0.26 },
};

const generateSkins = (prefix) => [
    { name: `${prefix} | Песчаная дюна`, rarity: 'MIL_SPEC', price: 0.5 },
    { name: `${prefix} | Пиксельный камуфляж`, rarity: 'MIL_SPEC', price: 0.8 },
    { name: `${prefix} | Африканская сетка`, rarity: 'MIL_SPEC', price: 0.3 },
    { name: `${prefix} | Городская опасность`, rarity: 'RESTRICTED', price: 4.5 },
    { name: `${prefix} | Падение Икара`, rarity: 'RESTRICTED', price: 8.0 },
    { name: `${prefix} | Скоростной зверь`, rarity: 'CLASSIFIED', price: 25.0 },
    { name: `${prefix} | Неоновый гонщик`, rarity: 'CLASSIFIED', price: 40.0 },
    { name: `${prefix} | Азимов`, rarity: 'COVERT', price: 120.0 },
    { name: `${prefix} | Вой`, rarity: 'COVERT', price: 350.0 },
    { name: `★ Керамбит | Кровавая паутина`, rarity: 'GOLD', price: 1200.0 },
    { name: `★ Спортивные перчатки | Порок`, rarity: 'GOLD', price: 1500.0 },
];

const CASES = [
    { id: 'kilowatt', name: 'Кейс «Киловатт»', price: 2.50, color: 'from-yellow-500 to-orange-600', icon: 'fa-bolt', items: generateSkins('AK-47') },
    { id: 'dreams', name: 'Кейс «Грёзы и кошмары»', price: 1.80, color: 'from-purple-500 to-blue-600', icon: 'fa-moon', items: generateSkins('M4A1-S') },
    { id: 'revolution', name: 'Кейс «Революция»', price: 3.00, color: 'from-red-500 to-pink-600', icon: 'fa-fist-raised', items: generateSkins('AWP') }
];

let state = {
    balance: 100.00,
    inventory: [],
    currentView: 'home',
    activeCase: null,
    isSpinning: false,
    lastWonItem: null
};

function updateHeader() {
    document.getElementById('header-balance').innerText = `$${state.balance.toFixed(2)}`;
    document.getElementById('header-inventory-count').innerText = state.inventory.length;
}

function switchView(viewId) {
    if (state.isSpinning) return;
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById(`view-${viewId}`).classList.remove('hidden');
    state.currentView = viewId;
    if (viewId === 'inventory') renderInventory();
}

function renderHome() {
    const grid = document.getElementById('cases-grid');
    grid.innerHTML = CASES.map(c => `
        <div onclick="openCase('${c.id}')" class="group bg-slate-900 border border-slate-800 rounded-xl p-6 cursor-pointer hover:border-indigo-500 transition-all text-center">
            <div class="bg-slate-950 inline-block px-3 py-1 rounded-full text-emerald-400 mb-4">$${c.price.toFixed(2)}</div>
            <div class="w-24 h-24 mx-auto rounded-lg bg-gradient-to-br ${c.color} mb-4 flex items-center justify-center">
                <i class="fa-solid ${c.icon} text-4xl text-white/50"></i>
            </div>
            <h3 class="text-xl font-bold">${c.name}</h3>
        </div>
    `).join('');
}

function openCase(caseId) {
    state.activeCase = CASES.find(c => c.id === caseId);
    document.getElementById('active-case-name').innerText = state.activeCase.name;
    const btnSpin = document.getElementById('btn-spin');
    btnSpin.innerText = `Открыть за $${state.activeCase.price.toFixed(2)}`;
    btnSpin.disabled = state.balance < state.activeCase.price;
    
    document.getElementById('roulette-track').innerHTML = '';
    document.getElementById('roulette-track').style.transform = 'translateX(0px)';
    
    document.getElementById('case-items-grid').innerHTML = state.activeCase.items.map(item => `
        <div class="bg-slate-900 border-b-2 p-4 rounded-lg text-center" style="border-bottom-color: ${RARITIES[item.rarity].color}">
            <div class="text-xs text-slate-500">${RARITIES[item.rarity].name}</div>
            <div class="text-sm font-medium">${item.name}</div>
        </div>
    `).join('');
    switchView('case');
}

function startSpin() {
    if (state.balance < state.activeCase.price || state.isSpinning) return;
    state.balance -= state.activeCase.price;
    updateHeader();
    state.isSpinning = true;

    const track = document.getElementById('roulette-track');
    const items = Array.from({ length: 70 }, () => {
        const rand = Math.random() * 100;
        let cumulative = 0;
        for (const [key, r] of Object.entries(RARITIES)) {
            cumulative += r.chance;
            if (rand <= cumulative) return state.activeCase.items.find(i => i.rarity === key) || state.activeCase.items[0];
        }
    });

    state.lastWonItem = { ...items[55], id: Date.now() };
    track.innerHTML = items.map(item => `
        <div class="w-[150px] mx-[5px] h-36 bg-slate-900 border-b-4 rounded-lg flex flex-col items-center justify-center p-3 shrink-0" style="border-bottom-color: ${RARITIES[item.rarity].color}">
            <i class="fa-solid fa-gun text-slate-800 mb-2"></i>
            <p class="text-xs text-center">${item.name}</p>
        </div>
    `).join('');

    setTimeout(() => {
        const itemWidth = 160;
        const offset = (55 * itemWidth) - (track.parentElement.offsetWidth / 2) + (itemWidth / 2);
        track.style.transform = `translateX(-${offset}px)`;
    }, 50);

    setTimeout(() => {
        state.isSpinning = false;
        state.inventory.unshift(state.lastWonItem);
        updateHeader();
        showWinModal();
    }, 6200);
}

function showWinModal() {
    const item = state.lastWonItem;
    const r = RARITIES[item.rarity];
    document.getElementById('modal-glow').style.backgroundColor = r.color;
    document.getElementById('modal-item-color').style.borderBottomColor = r.color;
    document.getElementById('modal-item-rarity').innerText = r.name;
    document.getElementById('modal-item-rarity').style.color = r.color;
    document.getElementById('modal-item-name').innerText = item.name;
    document.getElementById('modal-item-price').innerText = `$${item.price.toFixed(2)}`;
    document.getElementById('btn-modal-sell').onclick = () => { sellItem(item.id); closeModal(); };
    document.getElementById('modal-win').style.display = 'flex';
}

function closeModal() { document.getElementById('modal-win').style.display = 'none'; }

function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    const empty = document.getElementById('inventory-empty');
    document.getElementById('inventory-total').innerText = state.inventory.length;
    if (state.inventory.length === 0) {
        empty.classList.remove('hidden'); grid.classList.add('hidden');
    } else {
        empty.classList.add('hidden'); grid.classList.remove('hidden');
        grid.innerHTML = state.inventory.map(item => `
            <div class="bg-slate-900 border-b-4 p-4 rounded-xl text-center" style="border-bottom-color: ${RARITIES[item.rarity].color}">
                <div class="text-[10px] font-bold" style="color: ${RARITIES[item.rarity].color}">${RARITIES[item.rarity].name}</div>
                <div class="text-xs mb-4 h-8 flex items-center justify-center">${item.name}</div>
                <button onclick="sellItem(${item.id})" class="w-full py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/20">Продать $${item.price.toFixed(2)}</button>
            </div>
        `).join('');
    }
}

window.sellItem = function(id) {
    const idx = state.inventory.findIndex(i => i.id === id);
    if (idx > -1) {
        state.balance += state.inventory[idx].price;
        state.inventory.splice(idx, 1);
        updateHeader();
        if (state.currentView === 'inventory') renderInventory();
    }
};

window.onload = () => { renderHome(); updateHeader(); };
