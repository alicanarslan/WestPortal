import React, { useState } from "react";
import { Swords, Shield, Crown, Flame, Check } from "lucide-react";
import { motion } from "motion/react";
import { auth, googleProvider, db } from "../lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface GamerProfile {
  uid: string;
  username: string;
  avatarId: "swords" | "shield" | "crown" | "flame";
  avatarBg: string;
}

interface LoginModalProps {
  onComplete: (profile: GamerProfile) => void;
}

export const AVATAR_PRESETS = [
  {
    id: "swords" as const,
    name: "Savaşçı / Warrior",
    Icon: Swords,
    bg: "from-rose-600 to-red-900",
    shadow: "shadow-red-500/20 shadow-lg",
    border: "border-red-500/40",
    color: "text-red-300",
    glow: "bg-red-500"
  },
  {
    id: "shield" as const,
    name: "Muhafız / Guardian",
    Icon: Shield,
    bg: "from-emerald-600 to-teal-900",
    shadow: "shadow-emerald-500/20 shadow-lg",
    border: "border-emerald-500/40",
    color: "text-emerald-300",
    glow: "bg-emerald-500"
  },
  {
    id: "crown" as const,
    name: "Lider / Emperor",
    Icon: Crown,
    bg: "from-amber-500 to-yellow-905",
    shadow: "shadow-amber-500/20 shadow-lg",
    border: "border-amber-500/40",
    color: "text-amber-300",
    glow: "bg-amber-500"
  },
  {
    id: "flame" as const,
    name: "Phoenix / Fire",
    Icon: Flame,
    bg: "from-purple-600 to-violet-700",
    shadow: "shadow-violet-500/20 shadow-lg",
    border: "border-violet-500/40",
    color: "text-violet-300",
    glow: "bg-violet-500"
  }
];

export default function LoginModal({ onComplete }: LoginModalProps) {
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<"swords" | "shield" | "crown" | "flame">("swords");
  const [errorStatus, setErrorStatus] = useState("");
  const [isNewUser, setIsNewUser] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus("");

    // If they want to register a new user, validate details first
    if (isNewUser) {
      const trimmed = username.trim();
      if (!trimmed) {
        setErrorStatus("Lütfen geçerli bir oyuncu adı girin!");
        return;
      }
      if (trimmed.length < 2) {
        setErrorStatus("Oyuncu adı en az 2 karakter olmalıdır!");
        return;
      }
      if (trimmed.length > 25) {
        setErrorStatus("Oyuncu adı en fazla 25 karakter olmalıdır!");
        return;
      }
    }

    setLoading(true);
    try {
      // Trigger google pop-up authentication
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user) {
        throw new Error("Giriş iptal edildi.");
      }

      // Check if user profile already exists
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // Existing profile matched!
        const existingData = userSnap.data();
        onComplete({
          uid: user.uid,
          username: existingData.username,
          avatarId: existingData.avatarId,
          avatarBg: existingData.avatarBg || "from-slate-600 to-slate-700"
        });
      } else {
        // First-time sign up!
        const trimmed = username.trim() || user.displayName || `Gamer_${user.uid.slice(0, 5)}`;
        const avatarBgPreset = AVATAR_PRESETS.find(p => p.id === selectedAvatar)?.bg || "from-rose-600 to-red-900";
        
        const newProfile: GamerProfile = {
          uid: user.uid,
          username: trimmed,
          avatarId: selectedAvatar,
          avatarBg: avatarBgPreset
        };

        // Save profile under users in Firestore
        await setDoc(userRef, newProfile);
        onComplete(newProfile);
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Giriş işlemi sırasında hata oluştu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 scanlines opacity-5 pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="relative bg-gradient-to-b from-[#0f172a] to-[#090d16] border border-slate-800 p-6 md:p-8 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl" />
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500" />

        <div className="text-center space-y-2 mb-6">
          <h2 className="text-2xl font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 font-sans">
            Gamer Profil Girişi
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            // SİSTEME GİRİŞ YAPMAK İÇİN GOOGLE KİMLİĞİ KULLANIN
          </p>
        </div>

        {/* Tab Toggle between Sign Up and Quick Sign In */}
        <div className="flex gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-6 text-xs">
          <button
            type="button"
            onClick={() => {
              setIsNewUser(true);
              setErrorStatus("");
            }}
            className={`flex-1 py-2 rounded-lg font-bold font-sans transition-all cursor-pointer ${
              isNewUser 
                ? "bg-slate-900 text-cyan-400 border border-slate-800" 
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Yeni Oyuncu Kaydı
          </button>
          <button
            type="button"
            onClick={() => {
              setIsNewUser(false);
              setErrorStatus("");
            }}
            className={`flex-1 py-2 rounded-lg font-bold font-sans transition-all cursor-pointer ${
              !isNewUser 
                ? "bg-slate-900 text-cyan-400 border border-slate-800" 
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Hızlı Giriş Yap
          </button>
        </div>

        <form onSubmit={handleGoogleLogin} className="space-y-6">
          {isNewUser ? (
            <>
              {/* Username area */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase text-slate-400 block tracking-wider">
                  Oyuncu Adı (Username)
                </label>
                <input
                  type="text"
                  placeholder="Örn: BatuhanGamer, Selin_Medic..."
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorStatus) setErrorStatus("");
                  }}
                  autoFocus
                  required
                  className="w-full bg-slate-950/85 text-white placeholder-slate-600 px-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 transition-all font-sans font-bold text-center text-sm"
                />
              </div>

              {/* Avatar Radio selection */}
              <div className="space-y-3">
                <label className="text-xs font-mono font-bold uppercase text-slate-400 block tracking-wider text-center">
                  Avatar Simgesi Seçin ({AVATAR_PRESETS.length} Çeşit)
                </label>
                
                <div className="grid grid-cols-4 gap-3">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = selectedAvatar === preset.id;
                    const IconComponent = preset.Icon;
                    
                    return (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => setSelectedAvatar(preset.id)}
                        className={`relative aspect-square rounded-2xl bg-slate-950 flex flex-col items-center justify-center border-2 transition-all duration-300 cursor-pointer ${
                          isSelected 
                            ? `border-cyan-400 bg-slate-900 shadow-xl shadow-cyan-900/10` 
                            : "border-slate-800 hover:border-slate-700/80 bg-slate-950"
                        }`}
                      >
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${preset.bg} ${preset.shadow} transition-transform duration-300 ${isSelected ? "scale-105" : "opacity-80"}`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        {isSelected && (
                          <span className="absolute -top-1.5 -right-1.5 bg-cyan-400 text-slate-950 p-0.5 rounded-full z-10 border border-slate-950">
                            <Check className="w-2.5 h-2.5 stroke-[3px]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                <p className="text-center font-mono text-[10px] text-zinc-400">
                  Şu anki Seçim: <span className="font-bold text-cyan-400">{AVATAR_PRESETS.find(p => p.id === selectedAvatar)?.name}</span>
                </p>
              </div>
            </>
          ) : (
            <div className="p-4 bg-slate-950/65 rounded-2xl border border-slate-900 text-center text-xs text-slate-400 font-sans leading-relaxed">
              Google hesabınızla önceden kayıt olduysanız directly giriş yapabilirsiniz. Profiliniz otomatik olarak yüklenecektir.
            </div>
          )}

          {errorStatus && (
            <motion.p
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-rose-400 text-xs font-bold font-sans"
            >
              ⚠️ {errorStatus}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer shadow-lg shadow-indigo-500/20 border border-indigo-400/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">BAĞLANILIYOR...</span>
            ) : isNewUser ? (
              <>KAYDOL VE GOOGLE ILE GIRIŞ YAP</>
            ) : (
              <>GOOGLE ILE GIRIŞ YAP</>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
