const firebaseConfig = {
    apiKey: "AIzaSyAZxG500x9pmjg1sy6iJXMKrUMhZ2TFFCk",
    authDomain: "major-win.firebaseapp.com",
    projectId: "major-win",
    databaseURL: "https://major-win-default-rtdb.europe-west1.firebasedatabase.app",
    storageBucket: "major-win.firebasestorage.app",
    messagingSenderId: "253408264315",
    appId: "1:253408264315:web:1246e65a3c2ed70c4362de"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

const itemsDB = [
    { name: "P250 | Sand Dune", chance: 70, color: "#b0c3d9", price: 5 },
    { name: "AK-47 | Slate", chance: 20, color: "#4b69ff", price: 150 },
    { name: "M4A1-S | Printstream", chance: 9, color: "#eb4b4b", price: 900 },
    { name: "★ Butterfly Knife", chance: 1, color: "#ffca2d", price: 3500 }
];

let user = { balance: 0, inventory: [], nickname: "Игрок", xp: 0 };
let uid = null;

// Локальные стейты
let contractItems = [];
let upgradeItemIndex = null;

// ИНИЦИАЛИЗАЦИЯ
auth.onAuthStateChanged((u) => {
    if (u) {
        uid = u.uid;
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('user-controls').style.display = 'flex';
        
        db.ref('users/' + uid).on('value', (snap) => {
            const data = snap.val();
            if (data) {
                user = data;
                if (!user.inventory) user.inventory = [];
            } else {
                user = { balance: 1000, inventory: [], nickname: "Новичок", xp: 0 };
                saveDB();
            }
            renderAll();
        });
    }
});

function saveDB() { if (uid) db.ref('users/' + uid).set(user); }

// НАВИГАЦИЯ
window.switchTab = (tab) => {
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active-pane'));
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    document.getElementById(`${tab}-section`).classList.add('active-pane');
    document.getElementById(`tab-${tab}`).classList.add('active');
    
    // Сброс стейтов при переходе
    contractItems = [];
    upgradeItemIndex = null;
    renderAll();
};

// 1. КЕЙСЫ (РУЛЕТКА)
document.getElementById('open-btn').onclick = () => {
    if (user.balance < 50) return alert("Недостаточно средств");
    
    const btn = document.getElementById('open-btn');
    btn.disabled = true;
    user.balance -= 50;
    saveDB();

    const track = document.getElementById('roulette-line');
    track.style.transition = "none";
    track.style.transform = "translateX(0)";
    track.innerHTML = "";

    let pool = [];
    for (let i = 0; i < 60; i++) {
        let rand = Math.random() * 100, cum = 0, drop = itemsDB[0];
        for (let it of itemsDB) { cum += it.chance; if (rand < cum) { drop = it; break; } }
        pool.push(drop);
        const el = document.createElement('div');
        el.className = 'roulette-item';
        el.style.borderBottomColor = drop.color;
        el.innerText = drop.name;
        track.appendChild(el);
    }

    const winItem = pool[55];

    setTimeout(() => {
        track.style.transition = "transform 5s cubic-bezier(0.1, 0, 0, 1)";
        const move = (130 * 55) - (800 / 2) + 65; // 130 ширина + border
        track.style.transform = `translateX(-${move}px)`;
    }, 50);

    setTimeout(() => {
        user.inventory.unshift(winItem);
        user.xp += 20;
        document.getElementById('item-name').innerText = winItem.name;
        document.getElementById('item-name').style.color = winItem.color;
        addLiveFeed(winItem);
        btn.disabled = false;
        saveDB();
    }, 5100);
};

// 2. КОНТРАКТЫ
window.addToContract = (index) => {
    if (contractItems.length >= 3) return;
    contractItems.push({ item: user.inventory[index], originalIndex: index });
    renderAll();
};

document.getElementById('exchange-btn').onclick = () => {
    // Удаляем предметы из инвентаря с конца, чтобы не сбить индексы
    const indices = contractItems.map(c => c.originalIndex).sort((a,b) => b-a);
    indices.forEach(i => user.inventory.splice(i, 1));
    
    // Выдаем случайный предмет дороже 5$
    const betterItems = itemsDB.filter(i => i.price > 5);
    const reward = betterItems[Math.floor(Math.random() * betterItems.length)];
    
    user.inventory.unshift(reward);
    contractItems = [];
    saveDB();
    alert(`Контракт выполнен! Получено: ${reward.name}`);
};

// 3. АПГРЕЙДЫ
window.selectForUpgrade = (index) => {
    upgradeItemIndex = index;
    renderAll();
};

document.getElementById('upgrade-btn').onclick = () => {
    const chance = 50; // Жесткий шанс 50% для простоты
    const item = user.inventory[upgradeItemIndex];
    
    // Ищем предмет в 2 раза дороже
    const possibleTargets = itemsDB.filter(i => i.price >= item.price * 2);
    const target = possibleTargets.length ? possibleTargets[0] : itemsDB[itemsDB.length-1];

    user.inventory.splice(upgradeItemIndex, 1); // Забираем предмет

    if (Math.random() * 100 <= chance) {
        user.inventory.unshift(target);
        alert(`УСПЕХ! Вы получили ${target.name}`);
    } else {
        alert("ПРОВАЛ! Скин сгорел.");
    }
    
    upgradeItemIndex = null;
    saveDB();
};

// ПРОДАЖА
window.sellItem = (index) => {
    user.balance += user.inventory[index].price;
    user.inventory.splice(index, 1);
    saveDB();
};

// РЕНДЕР ИНТЕРФЕЙСА
function renderAll() {
    // Базовые данные
    document.getElementById('balance-amount').innerText = Math.floor(user.balance);
    document.getElementById('display-nickname').innerText = user.nickname;
    document.getElementById('user-level').innerText = Math.floor(user.xp / 100) + 1;
    document.getElementById('xp-bar-fill').style.width = `${user.xp % 100}%`;

    // Инвентарь в Профиле
    const mainInv = document.getElementById('main-inventory');
    mainInv.innerHTML = user.inventory.map((it, i) => `
        <div class="inv-card" style="border-bottom-color: ${it.color}">
            <b>${it.name}</b><span class="price">${it.price}$</span>
            <button class="action-btn sell" onclick="sellItem(${i})">ПРОДАТЬ</button>
        </div>
    `).join('');

    // Инвентарь в Контрактах
    document.getElementById('contract-inventory').innerHTML = user.inventory.map((it, i) => {
        const isSelected = contractItems.find(c => c.originalIndex === i);
        if (isSelected) return '';
        return `<div class="inv-card" style="border-bottom-color: ${it.color}" onclick="addToContract(${i})">
            <b>${it.name}</b><span class="price">${it.price}$</span>
        </div>`;
    }).join('');

    // Слоты контракта
    const cSlots = document.getElementById('contract-slots');
    cSlots.innerHTML = '';
    for(let i=0; i<3; i++) {
        if (contractItems[i]) {
            cSlots.innerHTML += `<div class="slot" style="border-bottom-color: ${contractItems[i].item.color}"><b>${contractItems[i].item.name}</b></div>`;
        } else {
            cSlots.innerHTML += `<div class="slot empty"></div>`;
        }
    }
    document.getElementById('exchange-btn').disabled = contractItems.length !== 3;

    // Инвентарь в Апгрейдах
    document.getElementById('upgrade-inventory').innerHTML = user.inventory.map((it, i) => 
        `<div class="inv-card" style="border-bottom-color: ${it.color}" onclick="selectForUpgrade(${i})">
            <b>${it.name}</b><span class="price">${it.price}$</span>
        </div>`
    ).join('');

    // Слоты апгрейда
    const upgFrom = document.getElementById('upg-slot-from');
    const upgTo = document.getElementById('upg-slot-to');
    const upgBtn = document.getElementById('upgrade-btn');
    
    if (upgradeItemIndex !== null) {
        const item = user.inventory[upgradeItemIndex];
        upgFrom.innerHTML = `<b>${item.name}</b><br>${item.price}$`;
        upgFrom.className = 'slot';
        upgFrom.style.borderBottomColor = item.color;
        
        const possibleTargets = itemsDB.filter(i => i.price >= item.price * 2);
        const target = possibleTargets.length ? possibleTargets[0] : itemsDB[itemsDB.length-1];
        
        upgTo.innerHTML = `<b>${target.name}</b><br>${target.price}$`;
        upgTo.className = 'slot';
        upgTo.style.borderBottomColor = target.color;
        
        upgBtn.disabled = false;
    } else {
        upgFrom.innerHTML = 'ВАШ СКИН'; upgFrom.className = 'slot empty'; upgFrom.style.borderColor = '';
        upgTo.innerHTML = 'ЦЕЛЬ'; upgTo.className = 'slot empty target'; upgTo.style.borderColor = '';
        upgBtn.disabled = true;
    }
}

// ЛЕНТА
function addLiveFeed(item) {
    const feed = document.getElementById('live-drop-line');
    const el = document.createElement('div');
    el.className = 'feed-item';
    el.style.borderBottomColor = item.color;
    el.innerHTML = `<span>${item.name}</span> <span style="color:var(--text-muted)">${item.price}$</span>`;
    feed.prepend(el);
    if (feed.children.length > 8) feed.lastChild.remove();
}

// ПРОФИЛЬ (ОКНО, НИК, ПРОМО)
document.getElementById('profile-open-btn').onclick = () => { document.getElementById('profile-modal').style.display = 'flex'; };
document.getElementById('close-profile').onclick = () => { document.getElementById('profile-modal').style.display = 'none'; };
document.getElementById('login-btn').onclick = () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());

document.getElementById('save-nickname-btn').onclick = () => {
    const val = document.getElementById('nickname-input').value.trim();
    if (val) { user.nickname = val; saveDB(); alert("Ник обновлен"); }
};
document.getElementById('apply-promo-btn').onclick = () => {
    if (document.getElementById('promo-input').value.toUpperCase() === "START") {
        user.balance += 500; saveDB(); alert("+500$");
    }
};
