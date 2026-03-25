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

const items = [
    { name: "P250 | Песчаные дюны", chance: 70, color: "#b0c3d9", rarity: "Ширпотреб" },
    { name: "AK-47 | Сланцы", chance: 20, color: "#4b69ff", rarity: "Засекреченное" },
    { name: "M4A4 | Вой", chance: 9, color: "#eb4b4b", rarity: "Тайное" },
    { name: "★ Керамбит | Золото", chance: 1, color: "#ffca2d", rarity: "Нож!" }
];

let balance = 0;
let inventory = [];
let currentUser = null;

// Слушатель входа
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('user-info').style.display = 'block';
        document.getElementById('user-email').innerText = user.email;

        // Загрузка данных из Firebase
        db.ref('users/' + user.uid).on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                balance = data.balance;
                inventory = data.inventory || [];
            } else {
                balance = 1000; // Бонус новичку
                inventory = [];
                saveToDB();
            }
            updateUI();
        });
    }
});

function saveToDB() {
    if (currentUser) {
        db.ref('users/' + currentUser.uid).set({
            balance: balance,
            inventory: inventory,
            email: currentUser.email
        });
    }
}

document.getElementById('open-btn').onclick = () => {
    if (!currentUser) return alert("Войди в аккаунт!");
    if (balance < 50) return alert("Нужно больше золота!");

    balance -= 50;

    // Рандом
    let rand = Math.random() * 100;
    let cumulative = 0;
    let drop = items[0];

    for (let item of items) {
        cumulative += item.chance;
        if (rand < cumulative) {
            drop = item;
            break;
        }
    }

    // Добавляем в инвентарь (в начало списка)
    inventory.unshift(drop);
    
    // Эффекты
    document.getElementById('item-name').innerText = drop.name;
    document.getElementById('item-name').style.color = drop.color;
    document.getElementById('item-rarity-text').innerText = drop.rarity;
    document.getElementById('rarity-glow').style.background = drop.color;
    
    saveToDB();
};

function updateUI() {
    document.getElementById('balance-amount').innerText = balance;
    const invList = document.getElementById('inventory-list');
    invList.innerHTML = '';

    inventory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'inv-item';
        div.style.borderBottomColor = item.color;
        div.innerHTML = `<strong>${item.name}</strong><br><small>${item.rarity}</small>`;
        invList.appendChild(div);
    });
}

document.getElementById('login-btn').onclick = () => {
    auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
};
