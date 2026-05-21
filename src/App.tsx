import { useState, useEffect } from "react";
import { GAMES_DATA, Game } from "./gamesData";
import { Review, UserSystemSpecs, GameNightEvent } from "./types";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import GameHero from "./components/game/GameHero";
import GameCard from "./components/game/GameCard";
import GameDetailsModal from "./components/game/GameDetailsModal";
import LibraryEmptyState from "./components/game/LibraryEmptyState";
import LibraryFilters from "./components/game/LibraryFilters";
import GamingCompanion from "./components/lobby/GamingCompanion";
import SteamImportCard from "./components/profile/SteamImportCard";
import GamerChatRooms from "./components/chat/GamerChatRooms";
import LoginModal, { GamerProfile } from "./components/profile/LoginModal";
import GamerProfileModal from "./components/profile/GamerProfileModal";
import GamerVoiceChat from "./components/layout/GamerVoiceChat";
import { 
  Gamepad2, AlertCircle, RefreshCw, Search, SlidersHorizontal
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
  const [selectedPlayersFilter, setSelectedPlayersFilter] = useState("All");
  const [selectedSizeFilter, setSelectedSizeFilter] = useState("All");
  const [showFilterSection, setShowFilterSection] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const [gamerProfile, setGamerProfile] = useState<GamerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("theme");
    return saved !== "light"; // default to dark mode as requested
  });

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newVal = !prev;
      localStorage.setItem("theme", newVal ? "dark" : "light");
      return newVal;
    });
  };

  // Sync with auth status & maintain real-time user profile + online indicators
  useEffect(() => {
    let unsubscribeUserSnap: (() => void) | null = null;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          
          // Clear any active subscriber
          if (unsubscribeUserSnap) {
            unsubscribeUserSnap();
          }

          // Real-time listen to user metadata (enables seamless tag favoritings / slogan updates)
          unsubscribeUserSnap = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              const uData = docSnap.data();
              if (uData.specs) {
                setUserSpecs(uData.specs);
              }
              setGamerProfile({
                uid: firebaseUser.uid,
                username: uData.username || firebaseUser.displayName || "GamerPlayer",
                avatarId: uData.avatarId || "swords",
                avatarBg: uData.avatarBg || "from-rose-600 to-red-900",
                isOnline: uData.isOnline ?? true,
                statusMessage: uData.statusMessage || "",
                favorites: uData.favorites || []
              });
            }
          }, (err) => {
            console.error("Profil esleme hatasi:", err);
          });

          // Register online status & record last active timestamp
          await setDoc(userRef, { 
            isOnline: true, 
            lastActive: serverTimestamp() 
          }, { merge: true });

        } catch (err) {
          console.error("Profile fetch error:", err);
          setGamerProfile(null);
        }
      } else {
        if (unsubscribeUserSnap) {
          unsubscribeUserSnap();
          unsubscribeUserSnap = null;
        }
        setGamerProfile(null);
        setUserSpecs({
          cpuRank: 2,
          gpuRank: 2,
          ramGB: 16,
          storageSSD: true
        });
      }
      setLoadingProfile(false);
    });

    // Unload visibility and window tab close heartbeat sync
    const handleUnloadStatus = () => {
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        // Fire-and-forget offline tag and voice session reset
        setDoc(userRef, { isOnline: false, activeVoiceChannel: null, lastActive: serverTimestamp() }, { merge: true });
      }
    };
    window.addEventListener("beforeunload", handleUnloadStatus);

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserSnap) {
        unsubscribeUserSnap();
      }
      window.removeEventListener("beforeunload", handleUnloadStatus);
    };
  }, []);

  // Automatic migration of pre-existing localStorage games & reviews to Firestore when logged in
  useEffect(() => {
    if (gamerProfile) {
      try {
        const localSaved = localStorage.getItem("westportal_games");
        if (localSaved) {
          const localGames: Game[] = JSON.parse(localSaved);
          if (Array.isArray(localGames) && localGames.length > 0) {
            const syncLocal = async () => {
              const batch = writeBatch(db);
              let hasItems = false;
              for (const g of localGames) {
                if (g && g.id && g.title) {
                  batch.set(doc(db, "games", String(g.id)), g);
                  hasItems = true;
                }
              }
              if (hasItems) {
                await batch.commit();
                console.log("Migrated local games to Firestore:", localGames.length);
                localStorage.removeItem("westportal_games");
              }
            };
            syncLocal().catch(err => {
              console.warn("Local games migration failed:", err);
            });
          }
        }

        const localReviewsSaved = localStorage.getItem("westportal_reviews");
        if (localReviewsSaved) {
          const localReviews: Review[] = JSON.parse(localReviewsSaved);
          if (Array.isArray(localReviews) && localReviews.length > 0) {
            const syncReviews = async () => {
              const batch = writeBatch(db);
              let hasRev = false;
              for (const r of localReviews) {
                if (r && r.id && r.gameId) {
                  batch.set(doc(db, "reviews", r.id), {
                    ...r,
                    createdAt: serverTimestamp()
                  });
                  hasRev = true;
                }
              }
              if (hasRev) {
                await batch.commit();
                console.log("Migrated local reviews to Firestore:", localReviews.length);
                localStorage.removeItem("westportal_reviews");
              }
            };
            syncReviews().catch(err => console.warn("Local reviews migration failed:", err));
          }
        }
      } catch (e) {
        console.error("Local storage migration error:", e);
      }
    }
  }, [gamerProfile]);

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

  const [activeVoiceChannelId, setActiveVoiceChannelId] = useState<string | null>(null);
  const [onlinePlayers, setOnlinePlayers] = useState<any[]>([]);

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
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Game[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push(docSnap.data() as Game);
      });
      
      // Keep library clean when database is empty
      if (fetched.length === 0) {
        setGames([]);
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
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Review[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as Review);
      });

      // Keep reviews clean when database is empty
      if (fetched.length === 0) {
        setReviews([]);
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
    if (!gamerProfile) {
      setPlannerEvents([]);
      return;
    }
    const q = query(collection(db, "events"), orderBy("date", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: GameNightEvent[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as GameNightEvent);
      });

      // Keep events clean when database is empty
      if (fetched.length === 0) {
        setPlannerEvents([]);
      } else {
        setPlannerEvents(fetched);
      }
    }, (error) => {
      console.error("Firestore events sync failed:", error);
    });
    return () => unsubscribe();
  }, [gamerProfile]);

  // Real-time synchronizer for registered portal users (determines online state and active voice channel dynamically)
  useEffect(() => {
    if (!gamerProfile) {
      setOnlinePlayers([]);
      return;
    }
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList: any[] = [];
      snapshot.forEach((docSnap) => {
        const u = docSnap.data();
        const isMe = u.uid === gamerProfile.uid;
        const isOnline = isMe ? true : (u.isOnline ?? false);
        
        usersList.push({
          uid: u.uid || docSnap.id,
          name: u.username || "GamerPlayer",
          isOnline: isOnline,
          state: isMe 
            ? "Siz buradasınız" 
            : (isOnline 
               ? (u.statusMessage ? `💬 ${u.statusMessage}` : "Lobi odasında çevrimiçi")
               : "Çevrimdışı"),
          avatar: u.avatarId || "swords",
          bg: u.avatarBg || "from-rose-600 to-red-900",
          badge: isMe ? "SİZ" : "OYUNCU",
          statusMessage: u.statusMessage || "",
          activeVoiceChannel: u.activeVoiceChannel || null,
          isMuted: u.isMuted ?? false
        });
      });

      // Sort: Me first, then online players, then offline players
      usersList.sort((a, b) => {
        if (a.uid === gamerProfile.uid) return -1;
        if (b.uid === gamerProfile.uid) return 1;
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return a.name.localeCompare(b.name);
      });

      setOnlinePlayers(usersList);
    }, (error) => {
      console.error("Firestore users list sync failed:", error);
    });
    return () => unsubscribe();
  }, [gamerProfile]);

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

  const handleUpdateGame = async (updatedGame: Game) => {
    try {
      await setDoc(doc(db, "games", String(updatedGame.id)), updatedGame);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `games/${updatedGame.id}`);
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
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await setDoc(userRef, { isOnline: false, activeVoiceChannel: null, lastActive: serverTimestamp() }, { merge: true });
      }
      setActiveVoiceChannelId(null);
      await signOut(auth);
      setGamerProfile(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Toggle favorite co-op game list for logged in user in Firestore
  const handleToggleFavorite = async (gameId: number) => {
    if (!gamerProfile) return;
    const currentFavorites = gamerProfile.favorites || [];
    const isFav = currentFavorites.includes(gameId);
    const updatedFavorites = isFav
      ? currentFavorites.filter((id) => id !== gameId)
      : [...currentFavorites, gameId];

    try {
      const userRef = doc(db, "users", gamerProfile.uid);
      await setDoc(userRef, { favorites: updatedFavorites }, { merge: true });
    } catch (err) {
      console.error("Error toggling favorite game association:", err);
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

  // Filter games based on search text, selected category tag, player count, and size
  const filteredGames = activeTagsGames.filter(game => {
    // 1. Search filter
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (game.tagline || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (game.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    // 2. Tag filter
    if (selectedTag !== "All") {
      const matchesTag = game.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase());
      if (!matchesTag) return false;
    }

    // 3. Player Filter
    if (selectedPlayersFilter !== "All") {
      const playsLower = (game.players || "").toLowerCase();
      const isSingle = playsLower.includes("tek") || playsLower.includes("single") || playsLower === "1 oyuncu";
      if (selectedPlayersFilter === "single" && !isSingle) return false;
      if (selectedPlayersFilter === "multi" && isSingle) return false;
    }

    // 4. Size Filter
    if (selectedSizeFilter !== "All") {
      const parseGBSize = (sizeStr: string): number => {
        if (!sizeStr) return 0;
        const match = sizeStr.match(/(\d+(?:\.\d+)?)\s*(?:GB|mb|g|m)/i);
        if (match) {
          const val = parseFloat(match[1]);
          if (sizeStr.toLowerCase().includes("mb")) {
            return val / 1024;
          }
          return val;
        }
        return 0;
      };
      const parsed = parseGBSize(game.size || "");
      if (selectedSizeFilter === "small" && parsed >= 10) return false;
      if (selectedSizeFilter === "medium" && (parsed < 10 || parsed > 45)) return false;
      if (selectedSizeFilter === "large" && parsed <= 45) return false;
    }

    return true;
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
    <div className={`min-h-screen transition-all duration-300 flex flex-col font-sans antialiased overflow-x-hidden selection:bg-cyan-500 selection:text-slate-900 ${
      isDarkMode ? "bg-[#07090e] text-slate-100" : "bg-slate-50 text-slate-800"
    }`}>
      
      {/* Profil oluşturma / Üyelik sistemi Modal katmanı */}
      <AnimatePresence>
        {!gamerProfile && (
          <LoginModal onComplete={(profile) => setGamerProfile(profile)} />
        )}
      </AnimatePresence>

      {/* Dynamic Header Component */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalGamesCount={games.length}
        gamerProfile={gamerProfile}
        onResetProfile={handleSignOut}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
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
                <LibraryEmptyState
                  setActiveTab={setActiveTab}
                  onLoadDefaults={handleLoadDefaults}
                />
              ) : (
                <>
                  {/* Highlight Slideshow */}
                  <GameHero 
                    games={activeTagsGames} 
                    onSelectGame={(game) => setSelectedGame(game)} 
                  />

                  {/* Main Store Card Grids */}
                  <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-3">
                      <div className="flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-cyan-400 animate-pulse" />
                        <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-white">
                          {selectedTag === "All" && selectedPlayersFilter === "All" && selectedSizeFilter === "All"
                            ? "Seçkin Oyun Kütüphanesi"
                            : "Filtrelenmiş Oyunlar"}
                        </h3>
                        <span className="text-[10px] md:text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800/40">
                          {filteredGames.length} Sonuç
                        </span>
                      </div>

                      {/* Right-aligned Search & Filters Controls */}
                      <div className="flex items-center gap-2.5 w-full md:w-auto md:justify-end">
                        <div className="relative flex-1 md:flex-initial md:w-56">
                          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Kütüphanede ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 pl-9 pr-3 py-2 rounded-xl text-xs text-white placeholder-slate-600 border border-slate-900 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 transition-all font-sans"
                          />
                        </div>

                        <button
                          onClick={() => setShowFilterSection(!showFilterSection)}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold font-sans text-xs transition-all cursor-pointer border shrink-0 ${
                            showFilterSection || selectedTag !== "All" || selectedPlayersFilter !== "All" || selectedSizeFilter !== "All"
                              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-extrabold"
                              : "bg-slate-950 hover:bg-slate-900 border-slate-900 text-slate-400"
                          }`}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                          <span>Filtrele</span>
                          {(selectedTag !== "All" || selectedPlayersFilter !== "All" || selectedSizeFilter !== "All") && (
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          )}
                        </button>
                      </div>
                    </div>

                    <LibraryFilters
                      showFilterSection={showFilterSection}
                      selectedTag={selectedTag}
                      setSelectedTag={setSelectedTag}
                      selectedPlayersFilter={selectedPlayersFilter}
                      setSelectedPlayersFilter={setSelectedPlayersFilter}
                      selectedSizeFilter={selectedSizeFilter}
                      setSelectedSizeFilter={setSelectedSizeFilter}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      availableTags={availableTags}
                    />

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
                            isFavorite={gamerProfile ? (gamerProfile.favorites || []).includes(game.id) : false}
                            onToggleFavorite={handleToggleFavorite}
                            isLoggedIn={!!gamerProfile}
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
                onUpdateGame={handleUpdateGame}
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
              isDarkMode={isDarkMode}
              activeVoiceChannelId={activeVoiceChannelId}
              onJoinVoiceChannel={setActiveVoiceChannelId}
              onlinePlayersProp={onlinePlayers}
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
                isDarkMode={isDarkMode}
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

      {/* Dynamic Gamer Profile Station Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <GamerProfileModal
            gamerProfile={gamerProfile}
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            onSignOut={() => {
              setIsProfileModalOpen(false);
              handleSignOut();
            }}
            games={games}
            reviews={reviews}
            plannerEvents={plannerEvents}
            onToggleFavorite={handleToggleFavorite}
            userSpecs={userSpecs}
            onUpdateSpecs={setUserSpecs}
          />
        )}
      </AnimatePresence>

      {/* Global persistent floating active voice card across all screens */}
      <AnimatePresence>
        {activeVoiceChannelId && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full md:w-[340px]"
          >
            <div className={`p-4 rounded-2xl shadow-2xl border transition-all duration-300 ${
              isDarkMode 
                ? "bg-[#090e18]/95 backdrop-blur-xl border-slate-800/80 shadow-cyan-950/20 text-white" 
                : "bg-white/95 backdrop-blur-xl border-slate-200 shadow-xl text-slate-800"
            }`}>
              <div className={`flex items-center justify-between border-b pb-2 mb-3 ${
                isDarkMode ? "border-slate-800" : "border-slate-100"
              }`}>
                <span className="text-[10px] font-black uppercase tracking-widest font-mono text-cyan-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  AKTİF SES BAĞLANTISI
                </span>
                <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                  isDarkMode ? "bg-slate-900 text-slate-400" : "bg-slate-100 text-slate-600"
                }`}>
                  CANLI
                </span>
              </div>
              
              <GamerVoiceChat 
                gamerProfile={gamerProfile}
                onlinePlayers={onlinePlayers}
                activeVoiceChannelId={activeVoiceChannelId}
                onJoinChannel={setActiveVoiceChannelId}
                isDarkMode={isDarkMode}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Retro/Cyber Punk Styled Turkish Footer */}
      <Footer gamesCount={games.length} />
    </div>
  );
}
