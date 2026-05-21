import React, { useState } from "react";
import { Swords, Shield, Crown, Flame, Check, Mail, Lock, User, Sparkles, Globe } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, googleProvider, db } from "../../lib/firebase";
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface GamerProfile {
  uid: string;
  username: string;
  avatarId: "swords" | "shield" | "crown" | "flame";
  avatarBg: string;
  isOnline?: boolean;
  statusMessage?: string;
  favorites?: number[]; // list of Steam AppIDs in favorited category
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
    bg: "from-amber-500 to-yellow-950",
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
  
  // Available types: "guest" (No passwords), "email" (traditional), "google" (social setup)
  const [loginMethod, setLoginMethod] = useState<"guest" | "email" | "google">("guest");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus("");

    // Trim username and check only for signup pathways
    const trimmedUser = username.trim();
    if (isNewUser && loginMethod !== "google") {
      if (!trimmedUser) {
        setErrorStatus("Lütfen oyuncu adı girin!");
        return;
      }
      if (trimmedUser.length < 2) {
        setErrorStatus("Oyuncu adı en az 2 karakter olmalıdır!");
        return;
      }
      if (trimmedUser.length > 25) {
        setErrorStatus("Oyuncu adı en fazla 25 karakter olmalıdır!");
        return;
      }
    }

    setLoading(true);
    try {
      if (loginMethod === "guest") {
        // --- 1. GUEST / ANONYMOUS PASSLESS SIGN IN ---
        if (!isNewUser) {
          setErrorStatus("Misafir girişi yalnızca Yeni Profil Kaydı için geçerlidir!");
          setLoading(false);
          return;
        }

        const result = await signInAnonymously(auth);
        const user = result.user;

        const avatarBgPreset = AVATAR_PRESETS.find(p => p.id === selectedAvatar)?.bg || "from-rose-600 to-red-900";
        const newProfile: GamerProfile = {
          uid: user.uid,
          username: trimmedUser,
          avatarId: selectedAvatar,
          avatarBg: avatarBgPreset
        };

        // Save profile
        await setDoc(doc(db, "users", user.uid), newProfile);
        onComplete(newProfile);

      } else if (loginMethod === "email") {
        // --- 2. CLASSIC EMAIL & PASSWORD SIGN-IN/UP ---
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
          setErrorStatus("Lütfen geçerli bir e-posta adresi girin!");
          setLoading(false);
          return;
        }
        if (!password || password.length < 6) {
          setErrorStatus("Şifre en az 6 karakter olmalıdır!");
          setLoading(false);
          return;
        }

        if (isNewUser) {
          // Register account
          const result = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
          const user = result.user;

          const avatarBgPreset = AVATAR_PRESETS.find(p => p.id === selectedAvatar)?.bg || "from-rose-600 to-red-900";
          const newProfile: GamerProfile = {
            uid: user.uid,
            username: trimmedUser,
            avatarId: selectedAvatar,
            avatarBg: avatarBgPreset
          };

          await setDoc(doc(db, "users", user.uid), newProfile);
          onComplete(newProfile);
        } else {
          // Traditional Log In
          const result = await signInWithEmailAndPassword(auth, trimmedEmail, password);
          const user = result.user;

          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const existingData = userSnap.data();
            onComplete({
              uid: user.uid,
              username: existingData.username || user.email?.split("@")[0] || "GamerPlayer",
              avatarId: existingData.avatarId || "swords",
              avatarBg: existingData.avatarBg || "from-rose-600 to-red-900"
            });
          } else {
            // Self-repair if missing profile doc
            const fallbackProfile: GamerProfile = {
              uid: user.uid,
              username: user.email?.split("@")[0] || `Gamer_${user.uid.slice(0, 5)}`,
              avatarId: "swords",
              avatarBg: "from-rose-600 to-red-900"
            };
            await setDoc(userRef, fallbackProfile);
            onComplete(fallbackProfile);
          }
        }

      } else {
        // --- 3. GOOGLE POPUP LOGIN METHOD ---
        const result = await signInWithPopup(auth, googleProvider).catch((popupErr) => {
          if (popupErr.code === "auth/unauthorized-domain") {
            throw new Error(
              "Bu alan adı Firebase projenizde yetkilendirilmemiş! " +
              "Bunu düzeltmek için Firebase Konsolunuzda (Auth > Settings > Authorized Domains) listesine şu adresi ekleyin: " +
              window.location.hostname + "  -- Alternatif olarak yukarıdaki 'ZİYARETÇİ' veya 'E-POSTA' girişlerini kullanarak hemen lobiye bağlanabilirsiniz."
            );
          }
          throw popupErr;
        });

        const user = result.user;
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const existingData = userSnap.data();
          onComplete({
            uid: user.uid,
            username: existingData.username || user.displayName || "GamerPlayer",
            avatarId: existingData.avatarId || "swords",
            avatarBg: existingData.avatarBg || "from-slate-600 to-slate-700"
          });
        } else {
          const avatarBgPreset = AVATAR_PRESETS.find(p => p.id === selectedAvatar)?.bg || "from-rose-600 to-red-900";
          const newProfile: GamerProfile = {
            uid: user.uid,
            username: trimmedUser || user.displayName || `Gamer_${user.uid.slice(0, 5)}`,
            avatarId: selectedAvatar,
            avatarBg: avatarBgPreset
          };
          await setDoc(userRef, newProfile);
          onComplete(newProfile);
        }
      }
    } catch (err: any) {
      console.error(err);
      const errorCode = err?.code || "";
      const errorMessage = err?.message || "";

      if (errorCode === "auth/operation-not-allowed" || errorMessage.includes("auth/operation-not-allowed")) {
        setErrorStatus(
          "Seçtiğiniz giriş yöntemi (E-posta, Google veya Misafir Girişi) Firebase Projenizde henüz aktif edilmemiş!\n\n" +
          "💡 ÇÖZÜM:\n" +
          "1️⃣ Firebase Konsolunuza gidin.\n" +
          "2️⃣ 'Authentication' > 'Sign-in method' sekmesini açın.\n" +
          "3️⃣ Kullandığınız yöntemi (E-posta/Şifre, Anonim/Misafir veya Google) ETKİNLEŞTİRİN (Enable edin) ve kaydedin."
        );
      } else if (errorCode === "auth/admin-restricted-operation" || errorMessage.includes("auth/admin-restricted-operation")) {
        setErrorStatus(
          "Misafir (Anonymous) girişi Firebase tarafında kısıtlanmış görünüyor!\n\n" +
          "💡 ÇÖZÜM:\n" +
          "1️⃣ Firebase Konsolu > Authentication > Sign-in method sekmesine gidin.\n" +
          "2️⃣ 'Anonymous' (Misafir/Anonim) giriş yöntemini etkinleştirin (Enable).\n" +
          "3️⃣ Ayrıca eğer varsa projenizin 'User actions' (Kullanıcı eylemleri) ayarlarından kullanıcı oluşturulmasını serbest bırakın."
        );
      } else if (errorCode === "auth/unauthorized-domain" || errorMessage.includes("auth/unauthorized-domain")) {
        setErrorStatus(
          "Bu adres yetkilendirilmemiş bir alan adıdır (Unauthorized Domain)!\n\n" +
          "💡 ÇÖZÜM:\n" +
          "1️⃣ Firebase Konsolu > Authentication > Settings sekmesini açın.\n" +
          "2️⃣ 'Authorized domains' (Yetkilendirilmiş alan adları) bölümündeki listeye mevcut alan adını (" + window.location.hostname + ") ekleyin."
        );
      } else {
        setErrorStatus(errorMessage || "İşlem sırasında bir hata oluştu!");
      }
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
            // PORTAL SİSTEM ALTYAPI BAĞLANTISI
          </p>
        </div>

        {/* Tab Toggle: Sign Up vs Sign In */}
        <div className="flex gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-6 text-2xs md:text-xs">
          <button
            type="button"
            onClick={() => {
              setIsNewUser(true);
              setErrorStatus("");
              // Reset method if set to login-only invalid states
              if (loginMethod === "guest") {
                // remains guest
              }
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
              if (loginMethod === "guest") {
                setLoginMethod("email"); // login needs credentials
              }
            }}
            className={`flex-1 py-2 rounded-lg font-bold font-sans transition-all cursor-pointer ${
              !isNewUser 
                ? "bg-slate-900 text-cyan-400 border border-slate-800" 
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Kayıtlı Oyuncu Girişi
          </button>
        </div>

        {/* Login Method Selection Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {isNewUser && (
            <button
              type="button"
              onClick={() => {
                setLoginMethod("guest");
                setErrorStatus("");
              }}
              className={`py-2 px-1 rounded-xl text-xs font-bold font-sans flex flex-col items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                loginMethod === "guest"
                  ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400 font-black"
                  : "bg-slate-950/60 border-slate-900 text-slate-400 hover:border-slate-800"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Ziyaretçi</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setLoginMethod("email");
              setErrorStatus("");
            }}
            className={`py-2 px-1 rounded-xl text-xs font-bold font-sans flex flex-col items-center justify-center gap-1.5 transition-all border cursor-pointer ${
              loginMethod === "email"
                ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400 font-black"
                : "bg-slate-950/60 border-slate-900 text-slate-400 hover:border-slate-800"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>E-Posta</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMethod("google");
              setErrorStatus("");
            }}
            className={`py-2 px-1 rounded-xl text-xs font-bold font-sans flex flex-col items-center justify-center gap-1.5 transition-all border cursor-pointer ${
              loginMethod === "google"
                ? "bg-rose-500/10 border-rose-500/50 text-rose-400 font-black"
                : "bg-slate-950/60 border-slate-900 text-slate-400 hover:border-slate-800"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Google</span>
          </button>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          
          {/* USERNAME INPUT field (Needed for sign up methods) */}
          {isNewUser && loginMethod !== "google" && (
            <div className="space-y-1.5">
              <label className="text-3xs font-mono font-bold uppercase text-slate-400 block tracking-wider flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-cyan-500" />
                Oyuncu Nickname (Kullanıcı Adı)
              </label>
              <input
                type="text"
                placeholder="Örn: BatuhanGamer, Selin_Medic..."
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorStatus) setErrorStatus("");
                }}
                required
                className="w-full bg-slate-950/90 text-white placeholder-slate-700 px-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 transition-all font-sans font-bold text-center text-sm"
              />
            </div>
          )}

          {/* EMAIL AND PASSWORD fields */}
          {loginMethod === "email" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-3xs font-mono font-bold uppercase text-slate-400 block tracking-wider flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-500" />
                  E-Posta Adresi
                </label>
                <input
                  type="email"
                  placeholder="oyuncu@portal.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorStatus) setErrorStatus("");
                  }}
                  required
                  className="w-full bg-slate-950/90 text-white placeholder-slate-700 px-4 py-3 rounded-xl border border-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-3xs font-mono font-bold uppercase text-slate-400 block tracking-wider flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-indigo-500" />
                  Secure Şifre (Min 6 Karakter)
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorStatus) setErrorStatus("");
                  }}
                  required
                  className="w-full bg-slate-950/90 text-white placeholder-slate-700 px-4 py-3 rounded-xl border border-slate-800 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* GOOGLE INFORMATIONAL text */}
          {loginMethod === "google" && (
            <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-900 text-center text-xs text-slate-400 leading-relaxed font-sans space-y-1.5">
              <p>Google Auth, yetkilendirilmiş alan adlarında çalışır.</p>
              <p className="text-[10px] text-rose-400 border border-rose-500/20 bg-rose-500/5 p-2 rounded-lg font-mono">
                İpucu: Eğer pop-up hatası alıyorsanız, hemen yukarıdan 
                <span className="text-cyan-400 font-bold"> 'ZİYARETÇİ' </span> veya 
                <span className="text-cyan-400 font-bold"> 'E-POSTA' </span> seçip şifreli/şifresiz tek tıkla bağlanabilirsiniz!
              </p>
            </div>
          )}

          {/* AVATAR SELECTORS (Used for any Sign Up type) */}
          {isNewUser && (
            <div className="space-y-3 pt-2 border-t border-slate-900">
              <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block tracking-wider text-center">
                Oyuncu Simgesi Seçin ({AVATAR_PRESETS.length} Çeşit)
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
                Seçim: <span className="font-bold text-cyan-400">{AVATAR_PRESETS.find(p => p.id === selectedAvatar)?.name}</span>
              </p>
            </div>
          )}

          {errorStatus && (
            <motion.p
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-rose-400 text-xs font-bold font-sans p-2 border border-rose-500/25 bg-rose-500/5 rounded-xl whitespace-pre-line"
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
              <span className="animate-pulse">BAĞLANTI KURULUYOR...</span>
            ) : loginMethod === "google" ? (
              <>{isNewUser ? "KAYDOL & GOOGLE BAĞLAN" : "GOOGLE ILE GIRIŞ YAP"}</>
            ) : loginMethod === "guest" ? (
              <>OYUNA KATIL (ŞİFRESİZ)</>
            ) : (
              <>{isNewUser ? "HESAP OLUŞTUR VE BAĞLAN" : "HESABIMA GIRIŞ YAP"}</>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
