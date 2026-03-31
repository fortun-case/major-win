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

// 1. Загрузка всех скинов CS2 через API
async function loadSkins() {
    try {
        const response = await fetch('https://bymykel.github.io/CSGO-API/api/ru/skins.json');
        const data = await response.json();
        allSkins = data.filter(s => s.image && s.name);
        console.log("Скины загружены:", allSkins.length);
        renderInitialList();
    } catch (e) {
        console.error("Ошибка API:", e);
    }
}

// 2. Инициализация баланса из Firebase
async function initBalance() {
    const balanceRef = ref(db, 'user/balance');
    const snapshot = await get(balanceRef);
    if (snapshot.exists()) {
        userBalance = snapshot.val();
    } else {
        userBalance = 10000; // Подарок при первом входе
        await set(balanceRef, userBalance);
    }
    updateBalanceUI();
}

function updateBalanceUI() {
    balanceDisplay.innerText = `Баланс: ${userBalance.toFixed(0)}$`;
}

// 3. Создание ленты рулетки
function renderInitialList() {
    roulette.innerHTML = "";
    roulette.style.transition = "none";
    roulette.style.transform = "translateX(0)";
    
    for (let i = 0; i < 60; i++) {
        const skin = allSkins[Math.floor(Math.random() * allSkins.length)];
        const div = document.createElement('div');
        div.className = "item";
        div.style.borderBottom = `4px solid ${skin.rarity.color || '#fff'}`;
        div.innerHTML = `<img src="${skin.image}"><p>${skin.name}</p>`;
        roulette.appendChild(div);
    }
}

// 4. Логика открытия
openBtn.onclick = async () => {
    if (userBalance < CASE_PRICE) return alert("Нужно больше золота! (Баланс пуст)");

    openBtn.disabled = true;
    userBalance -= CASE_PRICE;
    updateBalanceUI();
    await set(ref(db, 'user/balance'), userBalance);

    renderInitialList();
    
    const winIndex = 45; // Предмет, на котором остановимся
    const winSkin = allSkins[Math.floor(Math.random() * allSkins.length)];
    
    // Заменяем предмет в ленте на наш выигрышный
    const winCard = roulette.children[winIndex];
    winCard.innerHTML = `<img src="${winSkin.image}"><p>${winSkin.name}</p>`;
    winCard.style.borderBottom = `5px solid ${winSkin.rarity.color}`;

    setTimeout(() => {
        roulette.style.transition = "transform 5s cubic-bezier(0.1, 0, 0.1, 1)";
        const itemWidth = 140; // 130px + 10px margin
        const centerOffset = (roulette.parentElement.offsetWidth / 2);
        const targetPos = (winIndex * itemWidth) + (itemWidth / 2) - centerOffset;
        roulette.style.transform = `translateX(-${targetPos}px)`;
    }, 100);

    // Сохранение результата
    setTimeout(async () => {
        await push(ref(db, 'history'), { 
            name: winSkin.name, 
            img: winSkin.image, 
            color: winSkin.rarity.color 
        });
        openBtn.disabled = false;
    }, 5500);
};

// 5. Обновление истории в реальном времени
onValue(query(ref(db, 'history'), limitToLast(12)), (snapshot) => {
    const historyDiv = document.getElementById('history');
    historyDiv.innerHTML = "";
    snapshot.forEach(child => {
        const data = child.val();
        const div = document.createElement('div');
        div.className = "history-item";
        div.style.border = `1px solid ${data.color}`;
        div.innerHTML = `<img src="${data.img}" title="${data.name}">`;
        historyDiv.prepend(div);
    });
});

loadSkins();
initBalance();
