// CONFIG (Убедись, что твои ключи верны)
const firebaseConfig = {
    apiKey: "AIzaSyAZxG500x9pmjg1sy6iJXMKrUMhZ2TFFCk",
    authDomain: "major-win.firebaseapp.com",
    projectId: "major-win",
    databaseURL: "https://major-win-default-rtdb.europe-west1.firebasedatabase.app",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

const itemsDB = [
    { name: "P250 | Sand Dune", price: 10, color: "#b0c3d9" },
    { name: "AK-47 | Safari Mesh", price: 40, color: "#b0c3d9" },
    { name: "M4A4 | Evil Daimyo", price: 150, color: "#4b69ff" },
    { name: "AWP | Atheris", price: 600, color: "#d32ce6" },
    { name: "★ Karambit | Doppler", price: 15000, color: "#eb4b4b" }
];

let userData = { balance: 0, inventory: [], nickname: "Player" };
let upgradeSource = null;
let upgradeTarget = null;

// ТАБ-СИСТЕМА
window.switchTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active-tab'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabId + '-section').classList.add('active-tab');
    const navBtn = document.getElementById('btn-nav-' + tabId);
    if(navBtn) navBtn.classList.add('active');

    if(tabId === 'profile') renderProfile();
};

// АВТОРИЗАЦИЯ И ДАННЫЕ
auth.onAuthStateChanged(user => {
    if(user) {
        document.getElementById('auth-btn').style.display = 'none';
        document.getElementById('user-panel').style.display = 'flex';
        db.ref('users/' + user.uid).on('value', snap => {
            if(snap.exists()) {
                userData = snap.val();
                if(!userData.inventory) userData.inventory = [];
                updateUI();
            } else {
                db.ref('users/' + user.uid).set({ balance: 500, nickname: "New User", inventory: [] });
            }
        });
    }
});

document.getElementById('auth-btn').onclick = () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());

function save() { if(auth.currentUser) db.ref('users/' + auth.currentUser.uid).set(userData); }

function updateUI() {
    document.getElementById('balance-amount').innerText = userData.balance;
    if(document.getElementById('profile-section').classList.contains('active-tab')) renderProfile();
}

// ПРОФИЛЬ: НИК И ИНВЕНТАРЬ
window.updateNickname = () => {
    const input = document.getElementById('input-nickname');
    const val = input.value.trim();
    if(!val) return alert("Никнейм не может быть пустым!");
    userData.nickname = val;
    save();
    alert("Ник изменен!");
};

function renderProfile() {
    document.getElementById('p-balance').innerText = userData.balance;
    document.getElementById('input-nickname').value = userData.nickname;
    const list = document.getElementById('profile-inventory-list');
    list.innerHTML = userData.inventory.map((it, i) => `
        <div class="inv-item" style="border-bottom: 3px solid ${it.color}">
            <div style="font-size:30px">🔫</div>
            <b>${it.name}</b>
            <div class="inv-item-price">${it.price} ₽</div>
            <div class="inv-btn-group">
                <button style="background:#ef4444;color:#fff" onclick="sellItem(${i})">ПРОДАТЬ</button>
                <button style="background:#7b61ff;color:#fff" onclick="goToUpgrade(${i})">В АПГРЕЙД</button>
            </div>
        </div>
    `).join('');
}

window.sellItem = (i) => {
    userData.balance += userData.inventory[i].price;
    userData.inventory.splice(i, 1);
    save();
};

// АПГРЕЙД: КРУГ И СТРЕЛКА
window.goToUpgrade = (i) => {
    upgradeSource = userData.inventory[i];
    switchTab('upgrades');
    document.getElementById('slot-source').innerHTML = `<b>${upgradeSource.name}</b><br>${upgradeSource.price} ₽`;
    
    // Показываем доступные цели (дороже)
    const targets = itemsDB.filter(it => it.price > upgradeSource.price);
    document.getElementById('upgrade-targets').innerHTML = targets.map(t => `
        <div class="case-card" style="padding:10px; font-size:12px" onclick='setUpgradeTarget(${JSON.stringify(t)})'>
            ${t.name}<br><b>${t.price} ₽</b>
        </div>
    `).join('');
};

window.setUpgradeTarget = (t) => {
    upgradeTarget = t;
    const chance = Math.min(95, (upgradeSource.price / upgradeTarget.price) * 100).toFixed(2);
    document.getElementById('current-chance').innerText = chance + "%";
    document.getElementById('slot-target').innerHTML = `<b>${t.name}</b><br>${t.price} ₽`;
    
    // Рисуем круг
    const circle = document.getElementById('upg-progress');
    const offset = 628.3 - (chance / 100 * 628.3);
    circle.style.strokeDashoffset = offset;
    document.getElementById('start-upgrade-btn').disabled = false;
};

document.getElementById('start-upgrade-btn').onclick = function() {
    this.disabled = true;
    const arrow = document.getElementById('upg-arrow');
    const chance = (upgradeSource.price / upgradeTarget.price) * 100;
    const randomSpin = 1800 + Math.random() * 1800;
    
    arrow.style.transition = 'transform 4s cubic-bezier(0.15, 0, 0.15, 1)';
    arrow.style.transform = `translate(-50%, -100%) rotate(${randomSpin}deg)`;

    setTimeout(() => {
        const finalAngle = randomSpin % 360;
        const winRange = (chance / 100) * 360;
        const isWin = finalAngle <= winRange;

        const idx = userData.inventory.indexOf(upgradeSource);
        userData.inventory.splice(idx, 1);

        if(isWin) {
            userData.inventory.unshift(upgradeTarget);
            alert("Успех!");
        } else {
            alert("Неудача!");
        }
        
        save();
        switchTab('profile');
        arrow.style.transition = 'none';
        arrow.style.transform = `translate(-50%, -100%) rotate(0deg)`;
        this.disabled = false;
    }, 4500);
};

// ЛЕНТА
function addLiveDrop(it) {
    const feed = document.getElementById('live-feed');
    const div = document.createElement('div');
    div.className = 'feed-item';
    div.innerHTML = `<div style="color:${it.color}">●</div><div>${it.name}</div>`;
    feed.prepend(div);
    if(feed.children.length > 10) feed.lastChild.remove();
}
