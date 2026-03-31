import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, query, limitToLast, set, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyA-8Htang_pmMugvnekBa2s4akqHD7fGYU",
    authDomain: "major-win-b2255.firebaseapp.com",
    projectId: "major-win-b2255",
    storageBucket: "major-win-b2255.firebasestorage.app",
    messagingSenderId: "1088188197034",
    appId: "1:1088188197034:web:57e71de855ec78b32c88d3",
    databaseURL: "https://major-win-b2255-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let allSkins = [];
let userBalance = 0;
const CASE_PRICE = 100;

const roulette = document.getElementById('roulette');
const openBtn = document.getElementById('open-btn');
const balanceDisplay = document.getElementById('balance');

// 1. Загрузка всех скинов (Используем другой надежный API)
async function loadSkins() {
    try {
        // Этот API отдает данные в правильном формате HTTPS
        const response = await fetch('https://bymykel.github.io/CSGO-API/api/ru/skins.json');
        const data = await response.json();
        
        // Фильтруем скины, оставляя только те, у которых есть картинка
        allSkins = data.filter(s => s.image && s.name && s.rarity);
        
        console.log("Скинов загружено:", allSkins.length);
        renderInitialList();
    } catch (e) {
        console.error("Ошибка загрузки API:", e);
        balanceDisplay.innerText = "Ошибка загрузки данных!";
    }
}

// 2. Баланс
async function initBalance() {
    const balanceRef = ref(db, 'user/balance');
    const snapshot = await get(balanceRef);
    if (snapshot.exists()) {
        userBalance = snapshot.val();
    } else {
        userBalance = 10000;
        await set(balanceRef, userBalance);
    }
    updateBalanceUI();
}

function updateBalanceUI() {
    balanceDisplay.innerText = `Баланс: ${userBalance.toFixed(0)}$`;
}

// 3. Создание карточки скина
function createSkinCard(skin) {
    const div = document.createElement('div');
    div.className = "item";
    // Используем цвет редкости из API
    const color = skin.rarity.color || '#fff';
    div.style.borderBottom = `4px solid ${color}`;
    
    // Очищаем название от лишних слов
    const shortName = skin.name.replace("Skins | ", "");
    
    div.innerHTML = `
        <img src="${skin.image}" onerror="this.src='https://via.placeholder.com/100?text=No+Image'">
        <p title="${shortName}">${shortName}</p>
    `;
    return div;
}

// 4. Отрисовка ленты
function renderInitialList() {
    roulette.innerHTML = "";
    roulette.style.transition = "none";
    roulette.style.transform = "translateX(0)";
    
    if (allSkins.length === 0) return;

    for (let i = 0; i < 60; i++) {
        const randomSkin = allSkins[Math.floor(Math.random() * allSkins.length)];
        roulette.appendChild(createSkinCard(randomSkin));
    }
}

// 5. Логика кнопки
openBtn.onclick = async () => {
    if (allSkins.length === 0) return alert("Подождите, скины еще загружаются...");
    if (userBalance < CASE_PRICE) return alert("Недостаточно средств!");

    openBtn.disabled = true;
    userBalance -= CASE_PRICE;
    updateBalanceUI();
    await set(ref(db, 'user/balance'), userBalance);

    renderInitialList();
    
    const winIndex = 45; 
    const winSkin = allSkins[Math.floor(Math.random() * allSkins.length)];
    
    // Подменяем выигрышный элемент
    const winCard = roulette.children[winIndex];
    const color = winSkin.rarity.color || '#fff';
    winCard.style.borderBottom = `5px solid ${color}`;
    winCard.innerHTML = `<img src="${winSkin.image}"><p>${winSkin.name}</p>`;

    setTimeout(() => {
        roulette.style.transition = "transform 5s cubic-bezier(0.1, 0, 0.1, 1)";
        const itemWidth = 140; // 130px + 10px margin
        const containerWidth = roulette.parentElement.offsetWidth;
        const targetPos = (winIndex * itemWidth) + (itemWidth / 2) - (containerWidth / 2);
        roulette.style.transform = `translateX(-${targetPos}px)`;
    }, 100);

    setTimeout(async () => {
        await push(ref(db, 'history'), { 
            name: winSkin.name, 
            img: winSkin.image, 
            color: color 
        });
        openBtn.disabled = false;
    }, 5500);
};

// 6. История
onValue(query(ref(db, 'history'), limitToLast(12)), (snapshot) => {
    const historyDiv = document.getElementById('history');
    historyDiv.innerHTML = "";
    snapshot.forEach(child => {
        const data = child.val();
        const div = document.createElement('div');
        div.className = "history-item";
        div.style.borderBottom = `3px solid ${data.color}`;
        div.innerHTML = `<img src="${data.img}" title="${data.name}">`;
        historyDiv.prepend(div);
    });
});

loadSkins();
initBalance();
