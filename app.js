const { useState, useEffect } = React;

// Твои данные из Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAZxG500x9pmjg1sy6iJXMKrUMhZ2TFFCk",
  authDomain: "major-win.firebaseapp.com",
  projectId: "major-win",
  storageBucket: "major-win.firebasestorage.app",
  messagingSenderId: "253408264315",
  appId: "1:253408264315:web:1246e65a3c2ed70c4362de"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

const ITEMS_DB = [
    { id: 1, name: "Karambit | Lore", rarity: "Gold", icon: "🔪" },
    { id: 2, name: "AWP | Dragon Lore", rarity: "Gold", icon: "🔫" },
    { id: 3, name: "AK-47 | Fire Serpent", rarity: "Red", icon: "🔫" },
    { id: 4, name: "USP-S | Printstream", rarity: "Pink", icon: "🔫" },
    { id: 5, name: "Glock | Neo-Noir", rarity: "Purple", icon: "🔫" },
    { id: 6, name: "P250 | Sand Dune", rarity: "Blue", icon: "🔫" }
];

const CASES = [
    { id: 'c1', name: 'Дункан Высокий', price: 29, items: [5, 6] },
    { id: 'c2', name: 'Лионель Баратеон', price: 249, items: [4, 5] },
    { id: 'c3', name: 'Эйгон Таргариен', price: 1499, items: [1, 2, 3] }
];

function App() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState({ balance: 0, inventory: [], exp: 0, level: 1 });
    const [showModal, setShowModal] = useState(false);
    const [spinning, setSpinning] = useState(false);
    const [tape, setTape] = useState([]);
    const [offset, setOffset] = useState(0);
    const [wonItem, setWonItem] = useState(null);

    useEffect(() => {
        return auth.onAuthStateChanged(u => {
            if (u) {
                setUser(u);
                // Подписка на Firestore: раздел users
                db.collection("users").doc(u.uid).onSnapshot(snap => {
                    if (snap.exists) {
                        setProfile(snap.data());
                    } else {
                        // Если юзера нет в базе, создаем его
                        db.collection("users").doc(u.uid).set({
                            balance: 10000, 
                            inventory: [], 
                            exp: 0, 
                            level: 1,
                            nickname: u.displayName 
                        });
                    }
                });
            } else setUser(null);
        });
    }, []);

    const openCase = async (c) => {
        if (profile.balance < c.price || spinning) return;

        // Списываем баланс в Firebase сразу
        await db.collection("users").doc(user.uid).update({
            balance: profile.balance - c.price
        });

        const newTape = [];
        for(let i=0; i<60; i++) {
            const rId = c.items[Math.floor(Math.random() * c.items.length)];
            newTape.push({...ITEMS_DB.find(x => x.id === rId), tempId: i});
        }
        
        setTape(newTape);
        setWonItem(null);
        setShowModal(true);
        setSpinning(true);
        setOffset(0);

        setTimeout(() => {
            const winIndex = 54; // 55-й предмет
            const itemWidth = 150;
            const centerShift = window.innerWidth < 900 ? 150 : 380; // Сдвиг для центра
            setOffset((winIndex * itemWidth) - centerShift);

            setTimeout(async () => {
                const win = newTape[winIndex];
                setWonItem(win);
                setSpinning(false);

                // Добавляем предмет в инвентарь и опыт
                await db.collection("users").doc(user.uid).update({
                    inventory: firebase.firestore.FieldValue.arrayUnion({...win, instId: Date.now()}),
                    exp: (profile.exp + 15) % 100,
                    level: profile.exp + 15 >= 100 ? profile.level + 1 : profile.level
                });
            }, 5200);
        }, 100);
    };

    if (!user) return (
        <div className="h-screen flex items-center justify-center bg-[#0b1019]">
            <button onClick={() => auth.signInWithPopup(provider)} className="bg-yellow-500 text-black px-10 py-4 rounded-xl font-bold uppercase">
                Войти через Google
            </button>
        </div>
    );

    return (
        <div className="flex">
            <aside className="cb-sidebar flex flex-col items-center py-10 gap-8">
                <div className="text-yellow-500 font-black text-3xl">M</div>
                <div className="text-gray-500 text-2xl cursor-pointer hover:text-white">🏠</div>
                <div className="text-gray-500 text-2xl cursor-pointer hover:text-white">🏆</div>
            </aside>

            <main className="main-content flex-1 bg-[#0b1019]">
                <header className="flex justify-between items-center p-6 bg-[#0d121d] border-b border-[#1c2435]">
                    <div className="flex gap-8 font-bold uppercase text-[10px] tracking-[0.2em] text-gray-400">
                        <span className="text-white border-b-2 border-yellow-500 pb-1">Кейсы</span>
                        <span className="hover:text-white transition cursor-pointer">Апгрейды</span>
                        <span className="hover:text-white transition cursor-pointer">Контракты</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-green-400 font-black text-xl leading-none">{profile.balance.toFixed(2)} $</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Ур. {profile.level}</span>
                                <div className="xp-bar-bg"><div className="xp-bar-fill" style={{width: `${profile.exp}%`}}></div></div>
                            </div>
                        </div>
                        <img src={user.photoURL} className="w-10 h-10 rounded-full border border-yellow-500/30" />
                    </div>
                </header>

                <div className="p-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {CASES.map(c => (
                            <div key={c.id} onClick={() => openCase(c)} className="case-card text-center group">
                                <div className="text-7xl mb-6 group-hover:scale-110 transition duration-500">📦</div>
                                <h3 className="font-bold text-gray-200">{c.name}</h3>
                                <div className="mt-4 bg-[#1c2435] py-2 rounded-lg text-yellow-500 font-bold group-hover:bg-yellow-500 group-hover:text-black transition">
                                    {c.price} $
                                </div>
                            </div>
                        ))}
                    </div>

                    <h2 className="mt-20 text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 mb-6">Инвентарь</h2>
                    <div className="flex flex-wrap gap-3">
                        {profile.inventory?.slice().reverse().map(item => (
                            <div key={item.instId} className={`w-24 h-24 bg-[#121926] rounded-xl border-b-2 rarity-${item.rarity} flex items-center justify-center text-3xl`}>
                                {item.icon}
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {showModal && (
                <div className="modal-overlay">
                    <div className="roulette-box">
                        <div className="roulette-container">
                            <div className="roulette-line"></div>
                            <div className="roulette-tape" style={{ transform: `translateX(-${offset}px)` }}>
                                {tape.map(item => (
                                    <div key={item.tempId} className={`roulette-item rarity-${item.rarity}`}>
                                        {item.icon}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {wonItem && (
                            <div className="mt-4">
                                <p className="text-gray-400 uppercase text-xs">Выпало:</p>
                                <p className={`text-2xl font-black rarity-${wonItem.rarity}`}>{wonItem.name}</p>
                                <button onClick={() => setShowModal(false)} className="mt-6 bg-yellow-500 text-black px-12 py-3 rounded-xl font-bold uppercase">
                                    Продолжить
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
