import { useState, useEffect } from "react";
import { GAMES_DATA, Game } from "./gamesData";
import { Review, UserSystemSpecs, GameNightEvent } from "./types";
import Header from "./components/Header";
import GameHero from "./components/GameHero";
import GameCard from "./components/GameCard";
import GameDetailsModal from "./components/GameDetailsModal";
import GamingCompanion from "./components/GamingCompanion";
import SteamImportCard from "./components/SteamImportCard";
import GamerChatRooms from "./components/GamerChatRooms";
import LoginModal, { GamerProfile } from "./components/LoginModal";
import { 
  Gamepad2, AlertCircle, Settings, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db, handleFirestoreError, OperationType } from "./lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, collection, onSnapshot, query, orderBy, serverTimestamp, writeBatch } from "firebase/firestore";

// Pre-seeded friends reviews in Turkish for some of the games to make it feel immediately active
const DEFAULT_REVIEWS: Review[] = [
  {
    id: "101",
    gameId: 848450, // Subnautica: Below Zero
    author: "Can_Undersea",
    rating: 5,
    comment: "Kutup biyomu inanılmaz iyi tasarlanmış! Hayatta kalmak için üssünüzü ısıtmalı odalarla donatın yoksa donarak ölürsünüz. Kesinlikle kütüphanenizde olmalı.",
    recommend: true,
    date: "12.05.2026, 18:40"
  },
  {
    id: "102",
    gameId: 1604030, // V Rising
    author: "Mert_Lord",
    rating: 5,
    comment: "Batuhan klan şatosunu yine pembe tüllerle dekore etmiş şaka gibi... Ama onun dışında drakula modunda oynamak çok keyifli, co-op akar!",
    recommend: true,
    date: "14.05.2026, 21:15"
  },
  {
    id: "103",
    gameId: 1604030, // V Rising
    author: "Batu_Vamp",
    rating: 4,
    comment: "Mert_Lord şatonun pembe renklerine laf ediyor ama her gece gelip benim yatağımda uyuyor. PvP'de fena tokatladım bu arada.",
    recommend: true,
    date: "14.05.2026, 22:50"
  },
  {
    id: "104",
    gameId: 632360, // Risk of Rain 2
    author: "Oğuz_Stacker",
    rating: 5,
    comment: "Onlarca eşyayı üst üste bindirdikten sonra ekran patlama efektlerinden görünmüyor ve oyun 10 FPS oluyor. İşte gerçek aksiyon budur!",
    recommend: true,
    date: "15.05.2026, 10:30"
  },
  {
    id: "105",
    gameId: 602960, // Barotrauma
    author: "Selin_Medic",
    rating: 4,
    comment: "Reaktör sızıntısını tamir etmek yerine içimizdeki hain telsizi sabote etti ve hepimizi sular yuttu. Sinir krizi garantili muazzam oyun.",
    recommend: false,
    date: "18.05.2026, 16:12"
  }
];

// Pre-seeded multiplayers events schedulers
const DEFAULT_EVENTS: GameNightEvent[] = [
  {
    id: "event_1",
    gameId: 1604030, // V Rising
    title: "V Rising Klan Kalesi İnşası & PvP Akşamı",
    organizer: "Mert_Lord",
    date: "2026-05-22T21:00",
    maxPlayers: 10,
    players: ["Mert_Lord", "Batu_Vamp", "Selin_Medic"]
  },
  {
    id: "event_2",
    gameId: 632360, // Risk of Rain 2
    title: "Risk of Rain 2 Monsoon Seviyesi Koşu Denemesi",
    organizer: "Oğuz_Stacker",
    date: "2026-05-24T20:30",
    maxPlayers: 4,
    players: ["Oğuz_Stacker", "Can_Undersea"]
  }
];

// Dynamically extract tags inside the App component instead of defining static array here

export default function App() {
  const [activeTab, setActiveTab] = useState<"library" | "planner" | "admin" | "chat">("library");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const [gamerProfile, setGamerProfile] = useState<GamerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Sync with auth status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const uData = userSnap.data();
            setGamerProfile({
              uid: firebaseUser.uid,
              username: uData.username || firebaseUser.displayName || "GamerPlayer",
              avatarId: uData.avatarId || "swords",
              avatarBg: uData.avatarBg || "from-rose-600 to-red-900"
            });
          } else {
            setGamerProfile(null);
          }
        } catch (err) {
          console.error("Profile fetch error:", err);
          setGamerProfile(null);
        }
      } else {
        setGamerProfile(null);
      }
      setLoadingProfile(false);
    });
    return () => unsubscribe();
  }, []);

  // Load global deactivated/forbidden tags
  const [deactivatedTags, setDeactivatedTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("westportal_deactivated_tags");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("westportal_deactivated_tags", JSON.stringify(deactivatedTags));
  }, [deactivatedTags]);

  const handleToggleDeactivateTag = (tag: string) => {
    setDeactivatedTags(prev => {
      const cleaned = tag.trim();
      const exists = prev.some(t => t.toLowerCase().trim() === cleaned.toLowerCase());
      if (exists) {
        return prev.filter(t => t.toLowerCase().trim() !== cleaned.toLowerCase());
      } else {
        return [...prev, cleaned];
      }
    });
  };

  const [games, setGames] = useState<Game[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userSpecs, setUserSpecs] = useState<UserSystemSpecs>(() => {
    try {
      const saved = localStorage.getItem("westportal_specs");
      return saved ? JSON.parse(saved) : {
        cpuRank: 2, // Mid
        gpuRank: 2, // Mid
        ramGB: 16,
        storageSSD: true
      };
    } catch {
      return {
        cpuRank: 2,
        gpuRank: 2,
        ramGB: 16,
        storageSSD: true
      };
    }
  });

  const [plannerEvents, setPlannerEvents] = useState<GameNightEvent[]>([]);

  // 1. Real-time synchronizer for catalog Games
  useEffect(() => {
    const q = query(collection(db, "games"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetched: Game[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push(docSnap.data() as Game);
      });
      
      // Auto-populate default mock catalog if Firestore is empty
      if (fetched.length === 0) {
        try {
          const batch = writeBatch(db);
          for (const g of GAMES_DATA) {
            batch.set(doc(db, "games", String(g.id)), g);
          }
          await batch.commit();
        } catch (err) {
          console.warn("Seeding default games failed:", err);
          setGames(GAMES_DATA);
        }
      } else {
        setGames(fetched);
      }
    }, (error) => {
      console.error("Firestore games sync failed:", error);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time synchronizer for Reviews
  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetched: Review[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as Review);
      });

      if (fetched.length === 0) {
        try {
          const batch = writeBatch(db);
          for (const r of DEFAULT_REVIEWS) {
            batch.set(doc(db, "reviews", r.id), { ...r, createdAt: new Date() });
          }
          await batch.commit();
        } catch (err) {
          console.warn("Seeding reviews failed:", err);
          setReviews(DEFAULT_REVIEWS);
        }
      } else {
        setReviews(fetched);
      }
    }, (error) => {
      console.error("Firestore reviews sync failed:", error);
    });
    return () => unsubscribe();
  }, []);

  // 3. Real-time synchronizer for Planned Events
  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("date", "asc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetched: GameNightEvent[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as GameNightEvent);
      });

      if (fetched.length === 0) {
        try {
          const batch = writeBatch(db);
          for (const ev of DEFAULT_EVENTS) {
            batch.set(doc(db, "events", ev.id), { ...ev, createdAt: new Date() });
          }
          await batch.commit();
        } catch (err) {
          console.warn("Seeding events failed:", err);
          setPlannerEvents(DEFAULT_EVENTS);
        }
      } else {
        setPlannerEvents(fetched);
      }
    }, (error) => {
      console.error("Firestore events sync failed:", error);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem("westportal_specs", JSON.stringify(userSpecs));
  }, [userSpecs]);

  // Handler to add a single game retrieved via Steam API
  const handleImportSingleGame = async (newGame: Game) => {
    try {
      await setDoc(doc(db, "games", String(newGame.id)), newGame);

      if (newGame.steamReviews && Array.isArray(newGame.steamReviews)) {
        const batch = writeBatch(db);
        newGame.steamReviews.forEach((r, index) => {
          const revId = `steam_rev_${newGame.id}_${index}`;
          const reviewObject: Review = {
            id: revId,
            gameId: newGame.id,
            author: r.author || "Steam Oyuncusu",
            rating: r.rating || 5,
            comment: r.comment || "Çok keyifli bir co-op yapım.",
            recommend: true,
            date: new Date().toLocaleDateString("tr-TR") + ", " + new Date().toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })
          };
          batch.set(doc(db, "reviews", revId), {
            ...reviewObject,
            createdAt: new Date()
          });
        });
        await batch.commit();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `games/${newGame.id}`);
    }
  };

  const handleClearCustomGames = async () => {
    try {
      const batch = writeBatch(db);
      for (const g of games) {
        batch.delete(doc(db, "games", String(g.id)));
      }
      await batch.commit();
    } catch (err) {
      console.error("Hata:", err);
    }
  };

  const handleLoadDefaults = async () => {
    try {
      const batch = writeBatch(db);
      for (const g of GAMES_DATA) {
        batch.set(doc(db, "games", String(g.id)), g);
      }
      await batch.commit();
    } catch (err) {
      console.error("Hata:", err);
    }
  };

  const handleDeleteGame = async (id: number) => {
    try {
      await deleteDoc(doc(db, "games", String(id)));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `games/${id}`);
    }
  };

  // Handle adding new reviews in Firestore
  const handleAddReview = async (newRev: { author: string; rating: number; comment: string; recommend: boolean }) => {
    if (!selectedGame) return;
    const reviewId = "rev_" + Date.now();
    const reviewObject: Review = {
      id: reviewId,
      gameId: selectedGame.id,
      author: newRev.author,
      rating: newRev.rating,
      comment: newRev.comment,
      recommend: newRev.recommend,
      date: new Date().toLocaleString("tr-TR")
    };
    
    try {
      await setDoc(doc(db, "reviews", reviewId), {
        ...reviewObject,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `reviews/${reviewId}`);
    }
  };

  // Handle adding gaming night plans
  const handleAddEvent = async (eventInput: Omit<GameNightEvent, "id">) => {
    const eventId = "event_" + Date.now();
    const freshEvent = {
      id: eventId,
      ...eventInput,
      createdAt: serverTimestamp()
    };
    try {
      await setDoc(doc(db, "events", eventId), freshEvent);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `events/${eventId}`);
    }
  };

  // Joint to gaming night lobby lists
  const handleJoinEvent = async (eventId: string, name: string) => {
    const evt = plannerEvents.find(e => e.id === eventId);
    if (!evt) return;
    if (evt.players.includes(name)) return;
    
    try {
      const docRef = doc(db, "events", eventId);
      await setDoc(docRef, {
        players: [...evt.players, name]
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `events/${eventId}`);
    }
  };

  const handleAddComment = async (eventId: string, author: string, text: string) => {
    const evt = plannerEvents.find(e => e.id === eventId);
    if (!evt) return;
    const comments = evt.comments || [];
    const newComment = {
      id: "cmt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 5),
      author,
      text,
      date: new Date().toLocaleDateString("tr-TR") + " " + new Date().toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })
    };

    try {
      const docRef = doc(db, "events", eventId);
      await setDoc(docRef, {
        comments: [...comments, newComment]
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `events/${eventId}`);
    }
  };

  // Delete event planner list
  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteDoc(doc(db, "events", eventId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `events/${eventId}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setGamerProfile(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Filter active tags on all games to create dynamic view-models
  const activeTagsGames = games.map(g => {
    const ft = g.forbiddenTags || [];
    return {
      ...g,
      tags: (g.tags || []).filter(t => 
        !ft.some(f => f.toLowerCase().trim() === t.toLowerCase().trim()) &&
        !deactivatedTags.some(d => d.toLowerCase().trim() === t.toLowerCase().trim())
      )
    };
  });

  // Dynamically extract and unify tags from the current active games list, falling back to clean defaults if empty
  const availableTags: string[] = activeTagsGames.length > 0
    ? Array.from(new Set(activeTagsGames.flatMap(g => g.tags))).filter((t): t is string => !!t)
    : [
        "Eşli Oyun", 
        "Hayatta Kalma", 
        "Roguelike", 
        "Aksiyon", 
        "Strateji", 
        "Açık Dünya", 
        "Bilim Kurgu", 
        "Simülasyon", 
        "Platformcu"
      ].filter(t => !deactivatedTags.some(d => d.toLowerCase().trim() === t.toLowerCase().trim()));

  // Filter games based on search text AND selected category tag
  const filteredGames = activeTagsGames.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (game.tagline || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (game.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedTag === "All") return matchesSearch;
    
    // Check if any of the game's tags matches the selected tag dynamically ignoring case
    const matchesTag = game.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase());

    return matchesSearch && matchesTag;
  });

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest font-mono text-slate-500">
            // SİSTEM ALTYAPISI YÜKLENİYOR...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans antialiased overflow-x-hidden selection:bg-cyan-500 selection:text-slate-900">
      
      {/* Profil oluşturma / Üyelik sistemi Modal katmanı */}
      <AnimatePresence>
        {!gamerProfile && (
          <LoginModal onComplete={(profile) => setGamerProfile(profile)} />
        )}
      </AnimatePresence>

      {/* Dynamic Header Component */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        availableTags={availableTags}
        totalGamesCount={games.length}
        gamerProfile={gamerProfile}
        onResetProfile={handleSignOut}
      />

      <main className="flex-1 pb-16">
        <AnimatePresence mode="wait">
          {activeTab === "library" ? (
            <motion.div
              key="library_tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 animate-none"
            >
              {games.length === 0 ? (
                /* Beautiful empty state for clean homepage requested */
                <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
                  <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-3xl relative inline-block">
                    <Gamepad2 className="w-16 h-16 text-cyan-500/80 animate-pulse mx-auto" />
                    <div className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black text-white uppercase tracking-wider font-sans">KÜTÜPHANE TERTEMİZ & BOŞ DURUMDA!</h3>
                    <p className="text-xs text-slate-400 max-w-xl mx-auto font-sans leading-relaxed">
                      Sistem yöneticisi tüm başlangıç oyunlarını kütüphaneden kaldırdı. Siteniz şu an tamamen hazır ve temiz bir şablon sunuyor. Oyunları yönetmek ve eklemek için <strong>Yönetici Paneli</strong>'ni kullanabilir veya hazır şablonu anında geri getirebilirsiniz!
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                    <button
                      onClick={() => setActiveTab("admin")}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-400/10 cursor-pointer"
                    >
                      <Settings className="w-4 h-4" />
                      YÖNETİCİ PANELİ'NE GİT VE OYUN EKLE
                    </button>
                    <button
                      onClick={handleLoadDefaults}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wide transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4 text-purple-400" />
                      HAZIR ŞABLON OYUNLARINI GERİ YÜKLE
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Highlight Slideshow */}
                  <GameHero 
                    games={activeTagsGames} 
                    onSelectGame={(game) => setSelectedGame(game)} 
                  />

                  {/* Main Store Card Grids */}
                  <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                      <div className="flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-base font-black uppercase tracking-wider text-white">
                          {selectedTag === "All" ? "Seçkin Oyun Kütüphanesi" : `${selectedTag} Oyunları`}
                        </h3>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                          {filteredGames.length} Sonuç
                        </span>
                      </div>
                    </div>

                    {filteredGames.length === 0 ? (
                      <div className="text-center py-20 bg-slate-950/40 rounded-2xl border border-slate-900">
                        <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <h4 className="text-base font-semibold text-slate-200">Aradığın kritere uygun oyun bulunamadı</h4>
                        <p className="text-xs text-slate-500 mt-1">Lütfen farklı bir anahtar kelime veya kategori seçerek tekrar deneyin.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredGames.map(game => (
                          <GameCard
                            key={game.id}
                            game={game}
                            onSelectGame={(g) => setSelectedGame(g)}
                            reviewCount={reviews.filter(r => r.gameId === game.id).length}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          ) : activeTab === "admin" ? (
            /* Dedicated Admin Panel tab which hosts our Steam Integrator */
            <motion.div
              key="admin_tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <SteamImportCard
                onImported={handleImportSingleGame}
                onClearCustomGames={handleClearCustomGames}
                onLoadDefaults={handleLoadDefaults}
                games={games}
                onDeleteGame={handleDeleteGame}
                deactivatedTags={deactivatedTags}
                onToggleDeactivateTag={handleToggleDeactivateTag}
              />
            </motion.div>
          ) : activeTab === "chat" ? (
            /* Custom gamer chat system with multiple channels & bots */
            <motion.div
              key="chat_tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <GamerChatRooms
                gamerProfile={gamerProfile}
                games={activeTagsGames}
              />
            </motion.div>
          ) : (
            /* Sub systems or Planner tabs */
            <motion.div
              key="companion_tabs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <GamingCompanion
                games={activeTagsGames}
                activeSubSection="planner"
                plannerEvents={plannerEvents}
                onAddEvent={handleAddEvent}
                onJoinEvent={handleJoinEvent}
                onDeleteEvent={handleDeleteEvent}
                gamerProfile={gamerProfile}
                onAddComment={handleAddComment}
                onSelectGame={(game) => {
                  setSelectedGame(game);
                  setActiveTab("library"); // switch back cleanly
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Interactive Detail modal popover */}
      <AnimatePresence>
        {selectedGame && (
          <GameDetailsModal
            game={activeTagsGames.find(g => g.id === selectedGame.id) || selectedGame}
            onClose={() => setSelectedGame(null)}
            reviews={reviews.filter(r => r.gameId === selectedGame.id)}
            onAddReview={handleAddReview}
            userSpecs={userSpecs}
          />
        )}
      </AnimatePresence>

      {/* Retro/Cyber Punk Styled Turkish Footer */}
      <footer className="w-full bg-[#05060a] border-t border-slate-900/60 py-8 px-4 flex flex-col items-center justify-between gap-6 z-10 text-xs font-mono">
        <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>© 2026 WestPortal Gamer Hub • Arkadaş Ağ Arşivi</span>
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-center">
            <span className="text-slate-600">Teknoloji: React 19 + Tailwind v4 + Motion</span>
            <span className="hidden md:inline text-slate-700">|</span>
            <span className="text-slate-500">Oyun Veritabanı: <strong>{games.length} Seçkin Co-op & Hayatta Kalma Sınıfı</strong></span>
          </div>
        </div>

        <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 max-w-2xl text-center leading-relaxed text-[11px] text-slate-500 font-sans">
          <strong>YASAL UYARI & METODOLOJİ:</strong> Bu portal arkadaş gruplarının oyun gecelerini programlaması ve çevrimiçi çok oyunculu (co-op) oyunları hızlıca bulması için tasarlanmış bağımsız bir hayran projesidir. İndirme butonları sizi doğrudan ilgili oyunun çok oyunculu indirme sayfasına yönlendirir.
        </div>
      </footer>
    </div>
  );
}
