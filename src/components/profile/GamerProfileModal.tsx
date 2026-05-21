import React, { useState, useEffect } from "react";
import { 
  Shield, Swords, Crown, Flame, Check, Loader2, Award, 
  Gamepad2, Calendar, Star, MessageSquare, LogOut, CheckCircle2, User, FileText, Heart, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { GamerProfile, AVATAR_PRESETS } from "./LoginModal";
import { Game, Review, GameNightEvent } from "../../types";

interface GamerProfileModalProps {
  gamerProfile: GamerProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
  games: Game[];
  reviews: Review[];
  plannerEvents: GameNightEvent[];
  onToggleFavorite: (gameId: number) => void;
}

export default function GamerProfileModal({
  gamerProfile,
  isOpen,
  onClose,
  onSignOut,
  games,
  reviews,
  plannerEvents,
  onToggleFavorite
}: GamerProfileModalProps) {
  const [username, setUsername] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<"swords" | "shield" | "crown" | "flame">("swords");
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorText, setErrorText] = useState("");

  // Populate state on load
  useEffect(() => {
    if (gamerProfile) {
      setUsername(gamerProfile.username);
      setStatusMessage(gamerProfile.statusMessage || "");
      setSelectedAvatar(gamerProfile.avatarId || "swords");
    }
  }, [gamerProfile, isOpen]);

  if (!isOpen || !gamerProfile) return null;

  // 1. Calculate stats and levels
  const userReviews = reviews.filter(
    (r) => r.author === gamerProfile.username || r.author === gamerProfile.uid
  );
  const userEvents = plannerEvents.filter(
    (e) => (e.players || []).includes(gamerProfile.username) || e.organizer === gamerProfile.username || e.organizer === gamerProfile.uid
  );
  const userCreatedEvents = plannerEvents.filter(
    (e) => e.organizer === gamerProfile.username || e.organizer === gamerProfile.uid
  );

  const reviewsCount = userReviews.length;
  const eventsCount = userEvents.length;
  const createdEventsCount = userCreatedEvents.length;

  // Let's create an elegant XP calculator (reviews = 30xp, joined event = 50xp, created event = 80xp)
  const totalXp = reviewsCount * 30 + eventsCount * 50 + createdEventsCount * 30;
  const currentLevel = 1 + Math.floor(totalXp / 100);
  const currentLevelXp = totalXp % 100;

  // Level Title generator
  const getLevelTitle = (lvl: number) => {
    if (lvl === 1) return "Çaylak Portalcı / Rookie";
    if (lvl === 2) return "Klan Savaşçısı / Soldier";
    if (lvl === 3) return "Lobi Sorumlusu / Lobby Warden";
    if (lvl === 4) return "Gece Hakimi / Night Overlord";
    if (lvl >= 5) return "Kadim Vampir / Elder Legend";
    return "Portal Efsanesi / Portal Legend";
  };

  // Badges system
  const BADGES = [
    {
      id: "first_event",
      name: "İlk Katılım",
      desc: "Bir oyun gecesine katıldınız",
      unlocked: eventsCount > 0,
      icon: Calendar,
      color: "from-cyan-500 to-blue-600",
      glowColor: "rgba(6, 182, 212, 0.4)"
    },
    {
      id: "crithic",
      name: "Sert Eleştirmen",
      desc: "Portalda bir inceleme yazdınız",
      unlocked: reviewsCount > 0,
      icon: Star,
      color: "from-amber-400 to-yellow-600",
      glowColor: "rgba(245, 158, 11, 0.4)"
    },
    {
      id: "commander",
      name: "Lobi Lideri",
      desc: "Grup için bir etkinlik kurdunuz",
      unlocked: createdEventsCount > 0,
      icon: Crown,
      color: "from-green-500 to-emerald-600",
      glowColor: "rgba(16, 185, 129, 0.4)"
    },
    {
      id: "veteran",
      name: "Kadim Kadro",
      desc: "Level 4 ve üzeri seviyeye eriştiniz",
      unlocked: currentLevel >= 4,
      icon: Flame,
      color: "from-purple-500 to-indigo-600",
      glowColor: "rgba(139, 92, 246, 0.4)"
    }
  ];

  // Save profile edits to Firestore
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorText("");
    setSuccess(false);

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setErrorText("Oyuncu ismi boş bırakılamaz!");
      setSaving(false);
      return;
    }

    try {
      const userRef = doc(db, "users", gamerProfile.uid);
      const selectedBg = AVATAR_PRESETS.find(p => p.id === selectedAvatar)?.bg || "from-rose-600 to-red-900";
      
      await setDoc(userRef, {
        uid: gamerProfile.uid,
        username: trimmedUser,
        statusMessage: statusMessage.trim(),
        avatarId: selectedAvatar,
        avatarBg: selectedBg,
        lastActive: serverTimestamp()
      }, { merge: true });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorText("Profil güncellenemedi: " + (err?.message || String(err)));
    } finally {
      setSaving(false);
    }
  };

  // Get favorite list games information
  const userFavorites = gamerProfile.favorites || [];
  const favoriteGames = games.filter(g => userFavorites.includes(g.id));

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 scanlines opacity-5 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-gradient-to-b from-[#0e1628] to-[#080d15] border border-slate-800/80 p-5 md:p-7 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-8"
      >
        {/* Glow Effects */}
        <div className="absolute -top-12 -left-12 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-44 h-44 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500" />

        {/* Header Block */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-black text-white uppercase tracking-wider font-sans">
              OYUNCU PROFİL İSTASYONU
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-950 hover:text-white text-slate-400 transition-all cursor-pointer border border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Stats & Dynamic Gamified Cards (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* 1. LEVEL & PROGRESS CARD */}
            <div className="bg-slate-950/70 border border-slate-800/60 rounded-2xl p-4 space-y-3.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                <Crown className="w-20 h-20 text-yellow-500" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-700 flex items-center justify-center font-mono font-black text-xl text-slate-950 shadow-lg shadow-yellow-500/15">
                  L{currentLevel}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-amber-400 font-bold tracking-wider">// DURUM MERTEBESİ</span>
                  <h3 className="text-sm font-black text-white">{getLevelTitle(currentLevel)}</h3>
                </div>
              </div>

              {/* Progress bar info */}
              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-slate-500">SEVİYE İLERLEMESİ</span>
                  <span className="text-slate-300 font-bold">{currentLevelXp} / 100 XP</span>
                </div>
                <div className="h-2 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 rounded-full transition-all duration-1000"
                    style={{ width: `${currentLevelXp}%` }}
                  />
                </div>
                <p className="text-[9.5px] text-slate-400 leading-relaxed font-sans mt-1">
                  💡 Incelemeler yazarak <strong>30 XP</strong> temin edin; etkinliklere join olarak <strong>50 XP</strong> kazanın ve lobi lideri mertebesine tırmanın!
                </p>
              </div>
            </div>

            {/* 2. STATS OVERVIEW */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950/40 border border-slate-900 p-3 rounded-xl text-center">
                <Star className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <span className="text-[9px] uppercase font-mono text-slate-500 block">Yazdığın İnceleme</span>
                <span className="text-sm font-black text-white">{reviewsCount}</span>
              </div>
              <div className="bg-slate-950/40 border border-slate-900 p-3 rounded-xl text-center">
                <Calendar className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <span className="text-[9px] uppercase font-mono text-slate-500 block">Katılınan Gece</span>
                <span className="text-sm font-black text-white">{eventsCount}</span>
              </div>
              <div className="bg-slate-950/40 border border-slate-900 p-3 rounded-xl text-center">
                <Crown className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <span className="text-[9px] uppercase font-mono text-slate-500 block">Kurduğun Lobi</span>
                <span className="text-sm font-black text-white">{createdEventsCount}</span>
              </div>
            </div>

            {/* 3. ACHIEVEMENT BADGES */}
            <div className="bg-[#090e18]/60 border border-slate-800/40 rounded-2xl p-4 space-y-3">
              <span className="text-[10px] uppercase font-mono font-black text-slate-400 block tracking-widest border-b border-slate-900 pb-1.5 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-pink-400" /> Portal Başarı Nişanları
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {BADGES.map((badge) => {
                  const IconComponent = badge.icon;
                  return (
                    <div 
                      key={badge.id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                        badge.unlocked 
                          ? "bg-slate-950 border-pink-500/20 text-white" 
                          : "bg-slate-950/10 border-slate-900/60 opacity-30 text-slate-500 select-none"
                      }`}
                      style={badge.unlocked ? { boxShadow: `inset 0 0 12px ${badge.glowColor}` } : {}}
                    >
                      <div className={`p-2 rounded-lg ${badge.unlocked ? `bg-gradient-to-br ${badge.color} text-slate-950` : "bg-slate-900 text-slate-600"}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-bold">{badge.name}</h4>
                        <p className="text-[9.5px] text-slate-400">{badge.desc}</p>
                      </div>
                      {badge.unlocked && (
                        <span className="ml-auto text-[9.5px] font-mono font-bold uppercase text-pink-400 bg-pink-500/10 border border-pink-500/20 px-1.5 py-0.25 rounded">
                          kazanıldı
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Customization Forms & Favorites List (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* PROFILE CUSTOMIZER PANEL */}
            <form onSubmit={handleSaveProfile} className="bg-slate-950/70 border border-slate-800/60 rounded-2xl p-5 space-y-4">
              <span className="text-[10px] uppercase font-mono font-black text-slate-400 block tracking-widest border-b border-slate-900 pb-1.5">
                📟 KİMLİK & AVATAR AYARLARI
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div className="space-y-1">
                  <label className="text-3xs font-mono text-slate-400 block tracking-wider uppercase">Oyuncu Adı (Nickname)</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-white p-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 font-bold"
                  />
                </div>

                {/* Avatar Type Selector */}
                <div className="space-y-1">
                  <label className="text-3xs font-mono text-slate-400 block tracking-wider uppercase">Simge Stili</label>
                  <select
                    value={selectedAvatar}
                    onChange={(e) => setSelectedAvatar(e.target.value as any)}
                    className="w-full bg-slate-950 text-xs text-slate-300 p-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="swords">⚔️ Savaşçı / Warrior</option>
                    <option value="shield">🛡️ Muhafız / Guardian</option>
                    <option value="crown">👑 Lider / Emperor</option>
                    <option value="flame">🔥 Phoenix / Fire</option>
                  </select>
                </div>
              </div>

              {/* Status Message */}
              <div className="space-y-1">
                <label className="text-3xs font-mono text-slate-400 block tracking-wider uppercase">Gaming Durum Sloganı (Lobi de Görünür)</label>
                <input 
                  type="text" 
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  placeholder="örn: Şuan V Rising oynamaya hazır, Monsoon delisi..."
                  className="w-full bg-slate-950 text-xs text-slate-300 placeholder-slate-700 p-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Error & Success Feedback displays */}
              {errorText && (
                <div className="p-2 border border-red-500/20 bg-red-500/5 text-red-400 rounded-lg text-xs font-bold font-mono text-center">
                  ⚠️ {errorText}
                </div>
              )}

              {success && (
                <div className="p-2 border border-emerald-500/25 bg-emerald-500/5 text-emerald-400 rounded-lg text-xs font-bold font-mono flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Profil başarıyla veri bulutuna kaydedildi!
                </div>
              )}

              {/* Save profile CTAs */}
              <div className="flex gap-2 justify-end border-t border-slate-900 pt-3">
                <button
                  type="button"
                  onClick={onSignOut}
                  className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-950/15 hover:bg-red-950/35 text-red-400 hover:text-red-300 font-bold font-mono text-xs uppercase cursor-pointer transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Oturumu Kapat
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-cyan-900/10"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Yükleniyor...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Profil Değişikliklerini Kaydet
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* MY FAVORITE GAMES LIST */}
            <div className="bg-slate-950/70 border border-slate-800/60 rounded-2xl p-5 space-y-3">
              <span className="text-[10px] uppercase font-mono font-black text-slate-400 block tracking-widest border-b border-slate-900 pb-1.5 flex items-center justify-between">
                <span>❤️ FAVORİ CO-OP OYUNLARIM ({userFavorites.length})</span>
                <span className="text-[9px] text-slate-500">// KALDIRMAK İÇİN KALBE TIKLAYIN</span>
              </span>

              {favoriteGames.length === 0 ? (
                <div className="text-center py-6 p-4 bg-slate-950/20 rounded-xl border border-slate-905">
                  <Heart className="w-6 h-6 text-slate-700 mx-auto mb-1 animate-pulse" />
                  <p className="text-[11px] text-slate-500 font-bold uppercase font-mono">Boş Favori Kümesi</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 max-w-sm mx-auto font-sans leading-normal">
                    Kütüphanedeki oyun kartlarının sağ altındaki kalp simgelerine dokunarak onları bu alana sabitleyebilir, ana sayfada hızlı favori filtreleme modunu kullanabilirsiniz!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {favoriteGames.map((g) => (
                    <div 
                      key={g.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-900 hover:border-pink-500/20 transition-all font-sans group"
                    >
                      <div className="flex items-center gap-2">
                        <img 
                          src={g.imageUrl} 
                          alt="" 
                          className="w-10 h-6.5 object-cover rounded border border-slate-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="text-left font-semibold truncate max-w-[130px] text-xs text-slate-200">
                          {g.title}
                        </div>
                      </div>
                      <button
                        onClick={() => onToggleFavorite(g.id)}
                        className="p-1 px-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 border border-rose-500/10 cursor-pointer text-xs"
                      >
                        ❤️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </motion.div>
    </div>
  );
}
