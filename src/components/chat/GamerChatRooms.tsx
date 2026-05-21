import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, Send, Hash, Users, Bot, Sparkles, Plus, 
  Trash2, Flame, Laptop, PartyPopper, Heart, Zap, Check, CheckCircle2, ShieldAlert,
  Gamepad2, ChevronRight, Eye, RefreshCw, Smile, Pin, ArrowRight, Star,
  Volume2, Mic, Image, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Game } from "../../gamesData";
import { GamerProfile } from "../profile/LoginModal";
import { collection, onSnapshot, query, orderBy, setDoc, doc, deleteDoc, serverTimestamp, getDocs, writeBatch, limit } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";
import GamerVoiceChat, { PRESET_VOICE_CHANNELS } from "../layout/GamerVoiceChat";

interface Message {
  id: string;
  channel: string;
  author: string;
  avatarId: string;
  avatarBg: string; // for rendering preset styles
  text: string;
  date: string;
  isAi?: boolean;
  role?: "ADMIN" | "PRO" | "GUIDE" | "MEMBER" | "BOT";
  lfgData?: {
    gameId: number;
    gameTitle: string;
    playersNeeded: number;
    slotsJoined: string[];
    maxSlots: number;
  };
}

interface GamerChatRoomsProps {
  gamerProfile: GamerProfile | null;
  games: Game[];
  isDarkMode?: boolean;
  activeVoiceChannelId: string | null;
  onJoinVoiceChannel: (channelId: string | null) => void;
  onlinePlayersProp: any[];
}

// Preset avatars from LoginModal to match the active gamer profile perfectly
const AVATAR_STYLING = [
  { id: "swords", bg: "from-rose-600 to-red-900" },
  { id: "shield", bg: "from-emerald-600 to-teal-900" },
  { id: "crown", bg: "from-amber-500 to-yellow-905" },
  { id: "flame", bg: "from-[#6366f1] to-[#d946ef]" },
  { id: "hero", bg: "from-cyan-500 to-blue-500" },
  { id: "ninja", bg: "from-rose-500 to-red-600" },
  { id: "mage", bg: "from-purple-600 to-violet-700" },
  { id: "mech", bg: "from-amber-500 to-orange-600" },
  { id: "hacker", bg: "from-emerald-500 to-teal-600" }
];

const PRE_SEEDED_BANTER: Message[] = [
  {
    id: "seed_1",
    channel: "genel-lobi",
    author: "Mert_Lord",
    avatarId: "ninja",
    avatarBg: "from-rose-500 to-red-600",
    text: "Beyler akşam V Rising ekibi tam mı? Şatoda kan havuzunu yükselteceğiz, bol miktarda bakır cevheri lazım.",
    date: "Bugün 21:04",
    role: "PRO"
  },
  {
    id: "seed_2",
    channel: "genel-lobi",
    author: "Batu_Vamp",
    avatarId: "mage",
    avatarBg: "from-purple-600 to-violet-700",
    text: "Mert bakır diyon da geçen günkü PvP'de bütün envanterini kaptırmışsın heriflere dsfjksda. Akşama gelirim ben.",
    date: "Bugün 21:10",
    role: "MEMBER"
  },
  {
    id: "seed_3",
    channel: "genel-lobi",
    author: "Selin_Medic",
    avatarId: "hacker",
    avatarBg: "from-emerald-500 to-teal-600",
    text: "Aramızda Barotrauma oynamak isteyen var mı? Yeni denizaltı aldık, nükleer reaktörü yönetecek deli fedailer aranıyor.",
    date: "Bugün 21:15",
    role: "GUIDE"
  },
  {
    id: "seed_4",
    channel: "online-fix-rehberi",
    author: "Can_Undersea",
    avatarId: "hero",
    avatarBg: "from-cyan-500 to-blue-500",
    text: "📢 Online-fix ile steam_api64.dll hatası alan varsa: Antivirüs programınızı geçici olarak devre dışı bırakın veya o dosyayı hariç tutulanlara ekleyin. Crack dosyasını Steam overlay engellediği için sanal Steam başlatıcıyı devreden çıkartabiliyor.",
    date: "Bugün 18:02",
    role: "GUIDE"
  },
  {
    id: "seed_5",
    channel: "online-fix-rehberi",
    author: "RootAdmin",
    avatarId: "hacker",
    avatarBg: "from-[#111827] to-[#1f2937]",
    text: "Steam App ID'leri kütüphaneye yüklerken eklediğiniz Online-Fix linkini oyuna yerleştirdiğinizde, arkadaşlarınız doğrudan 'İNDİR & OYNA' butonuna basarak rehbere hızlıca erişebilir. Süreci çok basitleştirdik.",
    date: "Dün 22:50",
    role: "ADMIN"
  },
  {
    id: "seed_lfg_1",
    channel: "grup-bulma",
    author: "Oğuz_Stacker",
    avatarId: "mech",
    avatarBg: "from-amber-500 to-orange-600",
    text: "Gençler Risk of Rain 2 Monsoon koşusu için ekibe stack kasacak 2 kişi lazım! 5 dakikaya lobiyi açıyorum.",
    date: "Bugün 20:30",
    role: "PRO",
    lfgData: {
      gameId: 632360,
      gameTitle: "Risk of Rain 2",
      playersNeeded: 2,
      slotsJoined: ["Can_Undersea"],
      maxSlots: 4
    }
  }
];

const QUICK_EMOJIS = ["🎮", "🔥", "👑", "🚀", "💀", "😂", "👍", "😮", "🛡️", "👽", "💩", "GG"];
const QUICK_SAYINGS = [
  "Akşam co-op akan var mı?",
  "Online-fix linkini kontrol ettiniz mi?",
  "Steam AppID çalışıyor mu?",
  "Hangi oyunu indirelim?",
  "Sistemim oyunu kaldırır mı?",
  "Lobiye anında katıldım!"
];

export default function GamerChatRooms({ 
  gamerProfile, 
  games, 
  isDarkMode = true, 
  activeVoiceChannelId,
  onJoinVoiceChannel,
  onlinePlayersProp
}: GamerChatRoomsProps) {
  const [activeChannel, setActiveChannel] = useState<string>("genel-lobi");
  const [messages, setMessages] = useState<Message[]>([]);
  const onlinePlayers = onlinePlayersProp || [];
  const [sessionDms, setSessionDms] = useState<string[]>([]);
  
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleJoinVoiceChannel = (channelId: string | null) => {
    onJoinVoiceChannel(channelId);
  };
  
  const [textInput, setTextInput] = useState("");
  
  // LFG creation modal properties
  const [showLfgCreator, setShowLfgCreator] = useState(false);
  const [lfgGameId, setLfgGameId] = useState<string>("");
  const [lfgPlayersNeeded, setLfgPlayersNeeded] = useState<number>(3);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Firestore subscription for real-time lounge chat messages
  useEffect(() => {
    if (!gamerProfile) {
      setMessages([]);
      return;
    }
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"), limit(200));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Message[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as Message);
      });

      // Show clean empty chat instead of mock simulated banter
      if (fetched.length === 0) {
        setMessages([]);
      } else {
        setMessages(fetched);
      }
    }, (error) => {
      console.error("Firestore message sync failed:", error);
    });

    return () => unsubscribe();
  }, [gamerProfile]);



  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChannel]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() && !attachedImage) return;
    
    const currentGamer = gamerProfile || {
      username: "Guest_Gamer",
      avatarId: "swords"
    };

    const userAvatarBg = AVATAR_STYLING.find(s => s.id === currentGamer.avatarId)?.bg || "from-slate-600 to-slate-700";
    const msgId = "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 5);
    
    const newUserMsg: any = {
      id: msgId,
      channel: activeChannel,
      author: currentGamer.username,
      avatarId: currentGamer.avatarId,
      avatarBg: userAvatarBg,
      text: textToSend.trim(),
      date: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      role: gamerProfile ? "PRO" : "MEMBER",
      createdAt: serverTimestamp()
    };

    if (attachedImage) {
      newUserMsg.imageUrl = attachedImage;
    }

    try {
      await setDoc(doc(db, "messages", msgId), newUserMsg);
      setTextInput("");
      setAttachedImage(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `messages/${msgId}`);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = window.Image ? new window.Image() : document.createElement("img") as any;
      img.onload = () => {
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.7);
          setAttachedImage(compressed);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleOpenPrivateDm = (targetUser: any) => {
    if (!gamerProfile) return;
    if (targetUser.uid === gamerProfile.uid) {
      return;
    }
    if (!sessionDms.includes(targetUser.uid)) {
      setSessionDms(prev => [...prev, targetUser.uid]);
    }
    
    // Generate private DM channel ID
    const sortedDmChannelId = ["dm", gamerProfile.uid, targetUser.uid].sort().join("_");
    setActiveChannel(sortedDmChannelId);
  };

  const activeDms = React.useMemo(() => {
    if (!gamerProfile) return [];
    
    // 1. Gather all uids from messages that are DMs involving us
    const dmsFromMsgKeys: string[] = [];
    messages.forEach(m => {
      if (m.channel && (m.channel.includes("_dm_") || (m.channel.startsWith("dm_") && m.channel.includes(gamerProfile.uid)))) {
        const parts = m.channel.split("_");
        const otherUid = parts.find(p => p !== "dm" && p !== gamerProfile.uid);
        if (otherUid && !dmsFromMsgKeys.includes(otherUid)) {
          dmsFromMsgKeys.push(otherUid);
        }
      }
    });

    // 2. Merge with session-opened DMs
    const allUniqueDmsUids = Array.from(new Set([...dmsFromMsgKeys, ...sessionDms]));

    // 3. Match with onlinePlayers profile information
    return allUniqueDmsUids.map(uid => {
      const matchedUser = onlinePlayers.find(p => p.uid === uid) || {
        uid,
        name: "GamerPlayer",
        isOnline: false,
        avatar: "swords",
        bg: "from-slate-700 to-slate-800",
        badge: "OYUNCU"
      };
      
      const channelId = ["dm", gamerProfile.uid, uid].sort().join("_");
      return {
        user: matchedUser,
        channelId
      };
    }).filter(d => d.user.uid !== gamerProfile.uid);
  }, [messages, onlinePlayers, sessionDms, gamerProfile]);

  const handlePostLfg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lfgGameId) return;

    const gameSelected = games.find(g => g.id === Number(lfgGameId));
    if (!gameSelected) return;

    const currentGamer = gamerProfile || {
      username: "Guest_Gamer",
      avatarId: "swords"
    };
    const userAvatarBg = AVATAR_STYLING.find(s => s.id === currentGamer.avatarId)?.bg || "from-slate-600 to-slate-700";
    const msgId = "msg_lfg_" + Date.now();

    const newLfgMsg = {
      id: msgId,
      channel: "grup-bulma",
      author: currentGamer.username,
      avatarId: currentGamer.avatarId,
      avatarBg: userAvatarBg,
      text: `🕹️ ${gameSelected.title} co-op oynamak için lobi kurdum! Ekibe son fedailer aranıyor.`,
      date: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
      role: "PRO",
      createdAt: serverTimestamp(),
      lfgData: {
        gameId: gameSelected.id,
        gameTitle: gameSelected.title,
        playersNeeded: lfgPlayersNeeded,
        slotsJoined: [],
        maxSlots: lfgPlayersNeeded + 1
      }
    };

    try {
      await setDoc(doc(db, "messages", msgId), newLfgMsg);
      setShowLfgCreator(false);
      setActiveChannel("grup-bulma"); // Switch directly
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `messages/${msgId}`);
    }
  };

  const handleJoinLfgSlot = async (lfgMsgId: string) => {
    const currentGamer = gamerProfile || { username: "Guest_Gamer" };
    const m = messages.find(msg => msg.id === lfgMsgId);
    if (!m || !m.lfgData) return;

    const slots = m.lfgData.slotsJoined || [];
    let updatedSlots = [...slots];

    if (slots.includes(currentGamer.username)) {
      updatedSlots = slots.filter(name => name !== currentGamer.username);
    } else if (slots.length < m.lfgData.playersNeeded) {
      updatedSlots = [...slots, currentGamer.username];
    } else {
      return; // fully packed
    }

    try {
      const docRef = doc(db, "messages", lfgMsgId);
      await setDoc(docRef, {
        ...m,
        lfgData: {
          ...m.lfgData,
          slotsJoined: updatedSlots
        }
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `messages/${lfgMsgId}`);
    }
  };

  const clearChannelHistory = async () => {
    // Delete local-channel filtered items on Firestore for safety (Admins)
    try {
      const dbMessages = messages.filter(m => m.channel === activeChannel);
      const batch = writeBatch(db);
      for (const m of dbMessages) {
        batch.delete(doc(db, "messages", m.id));
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `channels/${activeChannel}/messages`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 space-y-6">
      
      {/* Header Info Area */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border p-5 rounded-2xl shadow-xl transition-all duration-300 ${
        isDarkMode 
          ? "bg-[#090e18]/80 border-slate-800/80 text-white shadow-cyan-950/5" 
          : "bg-white border-slate-200 text-slate-800 shadow-sm"
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-500" />
            <h2 className={`text-base font-black uppercase tracking-wider ${isDarkMode ? "text-white" : "text-slate-900"}`}>PORTAL GAYRİRESMİ LOUNGE & SOHBET MERKEZİ</h2>
          </div>
          <p className={`text-xs font-sans leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
            Burada arkadaşlarınızla sohbet edin, lobi kurup LFG (grup bulma) ilanları yayınlayın ve oyun oynamak için toplulukla koordine olun.
          </p>
        </div>
      </div>

      {/* Main chat UI Box container */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 rounded-2xl border overflow-hidden shadow-2xl transition-all duration-300 ${
        isDarkMode 
          ? "bg-[#090e18]/95 border-slate-800/80 text-slate-100 shadow-cyan-950/10" 
          : "bg-white border-slate-205 text-slate-900 shadow-md"
      }`}>
        
        {/* COL 1: Channels list (3 Columns) */}
        <div className={`lg:col-span-3 border-r p-4 space-y-5 transition-all duration-300 ${
          isDarkMode ? "bg-slate-950/90 border-slate-900" : "bg-slate-50/50 border-slate-200"
        }`}>
          <div>
            <span className={`text-[10px] uppercase font-black font-mono tracking-widest block mb-2 ${
              isDarkMode ? "text-slate-500" : "text-slate-400"
            }`}>KANALLAR</span>
            <div className="space-y-1.5">
              {[
                { id: "genel-lobi", name: "Genel Lobi", icon: Hash, desc: "Grup muhabbeti ve dedikodular" },
                { id: "grup-bulma", name: "Grup Bulma (LFG)", icon: Sparkles, desc: "Takım arkadaşı bulma ilanları" }
              ].map((channel) => {
                const isSelected = activeChannel === channel.id;
                const IconComp = channel.id === "grup-bulma" ? Sparkles : Hash;
                
                return (
                  <button
                    key={channel.id}
                    onClick={() => setActiveChannel(channel.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 cursor-pointer group relative overflow-hidden ${
                      isSelected 
                        ? isDarkMode 
                          ? "bg-slate-900 text-white border-l-4 border-cyan-400"
                          : "bg-slate-200 text-slate-900 border-l-4 border-cyan-500 font-bold"
                        : isDarkMode
                        ? "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                        : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/50"
                    }`}
                  >
                    <IconComp className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isSelected ? "text-cyan-455" : "text-slate-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-none truncate flex items-center gap-1.5">
                        {channel.name}
                      </div>
                      <span className={`text-[10px] font-sans mt-0.5 block truncate group-hover:text-slate-300 transition-colors ${
                        isDarkMode ? "text-slate-500" : "text-slate-500"
                      }`}>
                        {channel.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COL 1 continuation: Voice Channels list */}
          <div className="pt-2 border-t border-slate-900">
            <span className="text-[10px] uppercase font-black text-slate-500 font-mono tracking-widest block mb-2 flex items-center gap-1.5 leading-none">
              <Mic className="w-3.5 h-3.5 text-cyan-400" strokeWidth={2.5} /> SES ODALARI (LIVE)
            </span>
            <div className="space-y-1.5">
              {PRESET_VOICE_CHANNELS.map((channel) => {
                const isSelected = activeVoiceChannelId === channel.id;
                const occupantsList = onlinePlayers.filter(p => p.activeVoiceChannel === channel.id);
                const occupantsCount = occupantsList.length;
                
                return (
                  <button
                    key={channel.id}
                    onClick={() => handleJoinVoiceChannel(isSelected ? null : channel.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer group relative overflow-hidden ${
                      isSelected 
                        ? "bg-cyan-500/10 border-l-4 border-cyan-400 text-cyan-400 font-bold"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <Volume2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-cyan-400 animate-pulse" : "text-slate-500"}`} />
                        <span className="text-xs font-bold truncate">{channel.name}</span>
                      </div>
                      
                      {/* Sub-list of people in this room */}
                      {occupantsCount > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5 pl-6">
                          {occupantsList.map((occ, occIdx) => (
                            <span 
                              key={occIdx} 
                              className="text-[9px] font-mono px-1.5 py-0.5 bg-[#05060a] text-slate-400 rounded-md border border-slate-900 flex items-center gap-1 shrink-0"
                            >
                              <span className="w-1 h-1 rounded-full bg-emerald-400" />
                              {occ.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${
                      occupantsCount > 0 
                        ? "bg-cyan-500/15 text-cyan-400 animate-pulse font-black" 
                        : "bg-slate-900 text-slate-600"
                    }`}>
                      {occupantsCount} BAĞLI
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COL 1 continuation: DMs list */}
          <div className={`pt-2 border-t ${
            isDarkMode ? "border-slate-900" : "border-slate-205"
          }`}>
            <span className={`text-[10px] uppercase font-black font-mono tracking-widest block mb-2 flex items-center gap-1.5 leading-none ${
              isDarkMode ? "text-slate-500" : "text-slate-400"
            }`}>
              <MessageSquare className="w-3.5 h-3.5 text-pink-505" /> ÖZEL SOHBETLER (DM)
            </span>
            {activeDms.length === 0 ? (
              <span className={`text-[10px] block px-2 py-1.5 italic font-sans leading-normal ${
                isDarkMode ? "text-slate-600" : "text-slate-450"
              }`}>
                Bir oyuncuyla özel konuşmak için sağdaki listeden ismine tıklayarak DM başlatabilirsiniz.
              </span>
            ) : (
              <div className="space-y-1.5">
                {activeDms.map((dm) => {
                  const isSelected = activeChannel === dm.channelId;
                  return (
                    <button
                      key={dm.channelId}
                      onClick={() => setActiveChannel(dm.channelId)}
                      className={`w-full text-left p-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer group relative ${
                        isSelected 
                          ? isDarkMode
                            ? "bg-pink-500/10 text-white border-l-4 border-pink-550 font-bold"
                            : "bg-pink-500/10 text-pink-900 border-l-4 border-pink-550 font-bold"
                          : isDarkMode
                          ? "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${dm.user.isOnline ? "bg-emerald-400" : "bg-slate-400"}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold truncate flex items-center justify-between ${
                          isDarkMode ? "text-slate-300" : "text-slate-800"
                        }`}>
                          <span className="truncate pr-1">{dm.user.name}</span>
                          <span className={`text-[8px] font-mono px-1 rounded transform scale-90 shrink-0 ${
                            dm.user.isOnline 
                              ? "bg-emerald-500/10 text-emerald-400" 
                              : isDarkMode 
                              ? "bg-slate-900 text-slate-500" 
                              : "bg-slate-100 text-slate-400"
                          }`}>
                            {dm.user.isOnline ? "ON" : "OFF"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COL 2: Message Stream area (6 Columns) */}
        <div className={`lg:col-span-6 flex flex-col h-[550px] relative transition-all duration-300 ${
          isDarkMode ? "bg-slate-950/40" : "bg-slate-50/40 border-l border-r border-slate-200/80"
        }`}>
          
          {/* Active channel sub header */}
          {(() => {
            const isDm = activeChannel.includes("_dm_") || activeChannel.startsWith("dm_");
            let channelTitle = `#${activeChannel}`;
            let displayDesc = "LİVE STREAM";
            
            if (isDm) {
              const matchedDm = activeDms.find(d => d.channelId === activeChannel);
              channelTitle = matchedDm ? `💬 ÖZEL SOHBET: ${matchedDm.user.name}` : "💬 ÖZEL SOHBET";
              displayDesc = matchedDm?.user.isOnline ? "ÇEVRİMİÇİ" : "ÇEVRİMDIŞI";
            }
            
            return (
              <div className={`p-3.5 border-b flex items-center justify-between transition-all duration-300 ${
                isDarkMode ? "bg-slate-950/80 border-slate-900/60" : "bg-white border-slate-200"
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${isDm ? "text-pink-400 font-extrabold tracking-wider" : isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                    {channelTitle}
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${isDm ? "bg-pink-500/15 text-pink-400" : isDarkMode ? "bg-slate-900 text-slate-400" : "bg-slate-100 text-slate-600"}`}>
                    {displayDesc}
                  </span>
                </div>

                <button
                  onClick={clearChannelHistory}
                  title="Bu kanal geçmişini temizle"
                  className="text-[10px] font-mono text-slate-600 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Tekil Temizle
                </button>
              </div>
            );
          })()}

          {/* Messages list bucket */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.filter(m => m.channel === activeChannel).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <MessageSquare className="w-10 h-10 text-slate-700 animate-bounce" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 font-sans">Burada hiç ileti bulunmuyor.</p>
                  <p className="text-[10px] text-slate-600 font-sans max-w-xs">Aşağıdan ilk iletiyi yazarak portal sohbetini canlandırın ya da yeni bir görsel paylaşın!</p>
                </div>
              </div>
            ) : (
              messages
                .filter(m => m.channel === activeChannel)
                .map((msg) => {
                  const isUser = msg.author === (gamerProfile?.username || "Guest_Gamer");
                  
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 items-start ${isUser ? "flex-row-reverse" : ""}`}
                    >
                      {/* Avatar */}
                      <div className={`p-2.5 rounded-xl text-white font-bold bg-gradient-to-br ${msg.avatarBg || "from-slate-700 to-slate-800"} shadow-md relative shrink-0`}>
                        <Gamepad2 className="w-4 h-4" />
                        
                        {/* Status dot */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
                      </div>

                      {/* Content block */}
                      <div className={`space-y-1 max-w-[85%] ${isUser ? "text-right items-end" : "text-left items-start"}`}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[11px] font-extrabold hover:text-cyan-400 transition-colors cursor-pointer ${
                            isDarkMode ? "text-slate-200" : "text-slate-805"
                          }`}>
                            {msg.author}
                          </span>
                          
                          {msg.role && (
                            <span className={`text-[8px] font-black font-mono px-1 py-0.10 rounded tracking-wider ${
                              msg.role === "ADMIN" 
                                ? "bg-red-500/10 border border-red-500/30 text-red-400" 
                                : msg.role === "PRO" 
                                ? "bg-indigo-500/15 border border-indigo-400/20 text-indigo-300" 
                                : msg.role === "GUIDE" 
                                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                : msg.role === "BOT"
                                ? "bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold"
                                : "bg-slate-900 border border-slate-800 text-slate-500"
                            }`}>
                              {msg.role}
                            </span>
                          )}

                          <span className="text-[9px] text-slate-500 font-mono">
                            {msg.date}
                          </span>
                        </div>

                        {/* Rendering main bubble text */}
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed font-sans relative ${
                          isUser
                            ? isDarkMode
                              ? "bg-gradient-to-br from-indigo-900/60 to-slate-900 text-slate-100 rounded-tr-none border border-indigo-800/20"
                              : "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-tr-none border border-indigo-400/20 shadow-md"
                            : msg.isAi
                            ? isDarkMode
                              ? "bg-slate-900 border border-purple-500/20 shadow-lg shadow-purple-950/20 rounded-tl-none text-purple-200"
                              : "bg-purple-50 border border-purple-200 text-purple-950 rounded-tl-none"
                            : isDarkMode
                            ? "bg-slate-900/90 text-slate-300 rounded-tl-none border border-slate-800"
                            : "bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-sm"
                        }`}>
                          
                          <p className="whitespace-pre-wrap select-text">{msg.text}</p>

                          {/* Render custom base64 user image payload if present */}
                          {msg.imageUrl && (
                            <div className="mt-2 outline-none overflow-hidden rounded-lg">
                              <img 
                                src={msg.imageUrl} 
                                alt="Shared portal asset" 
                                referrerPolicy="no-referrer"
                                className={`max-w-full max-h-[300px] object-cover rounded-lg border cursor-pointer hover:opacity-95 transition-opacity ${
                                  isDarkMode ? "border-slate-800" : "border-slate-205"
                                }`}
                              />
                            </div>
                          )}

                          {/* Render LFG group Card nested if present */}
                          {msg.lfgData && (
                            <div className={`mt-3 border rounded-xl p-3 space-y-3 shadow-inner ${
                              isDarkMode ? "bg-slate-950/90 border-slate-800" : "bg-slate-50 border-slate-200"
                            }`}>
                              <div className={`flex items-center justify-between border-b pb-2 ${
                                isDarkMode ? "border-slate-900" : "border-slate-200"
                              }`}>
                                <div className="flex items-center gap-1.5">
                                  <Gamepad2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
                                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                                    isDarkMode ? "text-white" : "text-slate-805"
                                  }`}>
                                    {msg.lfgData.gameTitle} Lobisi
                                  </span>
                                </div>
                                <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  msg.lfgData.slotsJoined.length >= msg.lfgData.playersNeeded
                                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                                    : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                                }`}>
                                  {msg.lfgData.slotsJoined.length >= msg.lfgData.playersNeeded ? "DOLDU" : "AKTİF SIRADA"}
                                </span>
                              </div>

                              {/* Slots row indicators */}
                              <div className="space-y-1.5">
                                <span className="text-[9px] font-mono text-slate-500 block uppercase">KATILAN FEDAİLER:</span>
                                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                                  {/* Host slot (always occupies slot 0) */}
                                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded border ${
                                    isDarkMode 
                                      ? "bg-indigo-950/30 border-indigo-900/30 text-indigo-300"
                                      : "bg-indigo-50 border-indigo-100 text-indigo-700"
                                  }`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                    <span className="truncate font-semibold">{msg.author} (Ev Sahibi)</span>
                                  </div>
                                  
                                  {/* Dynamic occupied slots */}
                                  {msg.lfgData.slotsJoined.map((name, sIdx) => (
                                    <div key={sIdx} className={`flex items-center gap-1.5 px-2 py-1 rounded border ${
                                      isDarkMode 
                                        ? "bg-slate-900 border-slate-850 text-slate-205" 
                                        : "bg-white border-slate-200 text-slate-700 shadow-sm"
                                    }`}>
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                      <span className="truncate">{name}</span>
                                    </div>
                                  ))}

                                  {/* Clean empty slots list */}
                                  {Array.from({ length: msg.lfgData.playersNeeded - msg.lfgData.slotsJoined.length }).map((_, emptyIdx) => (
                                    <div key={emptyIdx} className={`flex items-center gap-1.5 px-2 py-1 border rounded border-dashed ${
                                      isDarkMode 
                                        ? "bg-slate-950 border-slate-900/80 text-slate-600" 
                                        : "bg-slate-100/50 border-slate-200 text-slate-450"
                                    }`}>
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400/30" />
                                      <span className="italic">Slot Bekliyor...</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Action join button */}
                              {msg.author !== (gamerProfile?.username || "Guest_Gamer") && (
                                <button
                                  onClick={() => handleJoinLfgSlot(msg.id)}
                                  className={`w-full py-1.5 px-2 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                    msg.lfgData.slotsJoined.includes(gamerProfile?.username || "Guest_Gamer")
                                      ? "bg-rose-500/10 text-rose-450 border border-rose-500/20 hover:bg-rose-500/20"
                                      : "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                                  }`}
                                >
                                  {msg.lfgData.slotsJoined.includes(gamerProfile?.username || "Guest_Gamer") ? (
                                    <>LOBİDEN AYRIL</>
                                  ) : (
                                    <>LOBİYE DAHiL OL</>
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
            )}

            {/* AI Response typing effect loader deleted */}

            <div ref={messagesEndRef} />
          </div>

          {/* Render image attachment preview if loaded */}
          {attachedImage && (
            <div className={`p-2.5 px-4 border-t flex items-center justify-between gap-4 transition-all duration-300 ${
              isDarkMode ? "bg-slate-950/90 border-slate-900 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-705"
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <img src={attachedImage} className="w-9 h-9 object-cover rounded border border-slate-800 shrink-0" />
                <span className="text-[10px] font-mono truncate text-cyan-600 font-bold">// gorsel_eklendi.jpg</span>
              </div>
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="p-1 hover:bg-rose-500/10 text-rose-500 rounded-md transition-all cursor-pointer"
                title="Görseli Kaldır"
              >
                <X className="w-4 h-4" strokeWidth={3} />
              </button>
            </div>
          )}

          {/* Bottom input editor box */}
          <div className={`p-3 border-t transition-all duration-300 ${
            isDarkMode ? "bg-[#090e18] border-slate-900" : "bg-white border-slate-200"
          }`}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(textInput);
              }}
              className="flex items-center gap-2 relative"
            >
              {/* Image attachment uploader */}
              <div>
                <input
                  type="file"
                  id="chat-image-file-input"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("chat-image-file-input")?.click()}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                    isDarkMode 
                      ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850" 
                      : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                  title="Resim Ekle"
                >
                  <Image className="w-4 h-4" />
                </button>
              </div>

              {/* Toggleable absolute Emoji select dialog */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                    isDarkMode 
                      ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-805" 
                      : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-905"
                  }`}
                  title="Emoji Ekle"
                >
                  <Smile className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={`absolute bottom-12 left-0 z-30 p-2.5 rounded-xl shadow-xl border w-[205px] grid grid-cols-4 gap-1.5 ${
                        isDarkMode ? "bg-[#05060a] border-slate-800" : "bg-white border-slate-200"
                      }`}
                    >
                      {QUICK_EMOJIS.map((emo) => (
                        <button
                          key={emo}
                          type="button"
                          onClick={() => {
                            setTextInput(prev => prev + emo);
                            setShowEmojiPicker(false);
                          }}
                          className={`p-2 rounded-lg text-sm transition-all text-center cursor-pointer ${
                            isDarkMode ? "hover:bg-slate-900 text-slate-200" : "hover:bg-slate-100 text-slate-805"
                          }`}
                        >
                          {emo}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={(() => {
                  const isDmChannel = activeChannel.includes("_dm_") || activeChannel.startsWith("dm_");
                  const matchedDm = isDmChannel ? activeDms.find(d => d.channelId === activeChannel) : null;
                  return isDmChannel
                    ? `${matchedDm ? matchedDm.user.name : "Oyuncu"} ile doğrudan yazış...`
                    : `Sohbet odasına yazın (#${activeChannel})...`;
                })()}
                className={`flex-1 text-xs p-3 rounded-xl border focus:outline-none focus:ring-1 transition-all font-sans ${
                  isDarkMode 
                    ? "bg-slate-900/90 text-slate-100 placeholder-slate-605 border-slate-800 focus:border-cyan-400 focus:ring-cyan-500/25" 
                    : "bg-slate-50 text-slate-900 placeholder-slate-400 border-slate-200 focus:border-cyan-550 focus:ring-cyan-500/20"
                }`}
              />

              <button
                type="submit"
                disabled={!textInput.trim() && !attachedImage}
                className="p-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-lg shrink-0 flex items-center justify-center animate-none"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* COL 3: Online Friends and Activity (3 Columns) */}
        <div className="lg:col-span-3 bg-slate-950/60 p-4 border-l border-slate-900 space-y-5 flex flex-col justify-between">
          
          {/* List of active online teammates */}
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
            {/* Online section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 pt-1">
                <span className="text-[10px] uppercase font-black text-emerald-400 font-mono tracking-widest block font-bold">
                  ● AKTİF LOBİ SAKİNLERİ
                </span>
                <span className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  {onlinePlayers.filter(p => p.isOnline).length} AKTİF
                </span>
              </div>

              <div className="space-y-2">
                {onlinePlayers.filter(p => p.isOnline).length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic pl-1 py-1">Şu an aktif sakin bulunmamaktadır.</p>
                ) : (
                  onlinePlayers.filter(p => p.isOnline).map((pla, idx) => (
                    <button
                      key={`online_${idx}`}
                      onClick={() => {
                        handleOpenPrivateDm(pla);
                      }}
                      className="w-full text-left p-2 rounded-xl border bg-slate-900/45 hover:bg-slate-900/95 border-slate-900/40 hover:border-cyan-500/20 flex items-center justify-between group cursor-pointer transition-all duration-300"
                      title={`${pla.name} ile özel sohbet başlat`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Character avatar */}
                        <div className={`p-1.5 rounded-lg text-white font-bold bg-gradient-to-br ${pla.bg} shrink-0 relative text-[10px]`}>
                          <Gamepad2 className="w-3.5 h-3.5" />
                          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-slate-950 bg-emerald-400" />
                        </div>
                        
                        <div className="min-w-0">
                          <div className="text-xs font-bold transition-colors truncate text-slate-300 group-hover:text-cyan-400">
                            {pla.name}
                          </div>
                          <span className="text-[9px] font-sans block truncate italic leading-none mt-0.5 text-slate-500">
                            {pla.state}
                          </span>
                        </div>
                      </div>

                      <span className="text-[8px] font-mono p-1 border rounded scale-90 opacity-85 shrink-0 text-slate-400 bg-slate-950 border-slate-900">
                        {pla.badge}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Offline section */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                <span className="text-[10px] uppercase font-black text-slate-500 font-mono tracking-widest block font-bold">
                  ○ DEAKTİF LOBİ SAKİNLERİ
                </span>
                <span className="text-[9px] font-mono font-bold bg-slate-900 text-slate-500 border border-slate-800/60 px-1.5 py-0.5 rounded">
                  {onlinePlayers.filter(p => !p.isOnline).length} DEAKTİF
                </span>
              </div>

              <div className="space-y-2">
                {onlinePlayers.filter(p => !p.isOnline).length === 0 ? (
                  <p className="text-[10px] text-slate-600 italic pl-1 py-1">Çevrimdışı sakin bulunmamaktadır.</p>
                ) : (
                  onlinePlayers.filter(p => !p.isOnline).map((pla, idx) => (
                    <button
                      key={`offline_${idx}`}
                      onClick={() => {
                        handleOpenPrivateDm(pla);
                      }}
                      className="w-full text-left p-2 rounded-xl border bg-slate-950/20 hover:bg-slate-900/30 border-slate-900/15 hover:border-slate-800 flex items-center justify-between group cursor-pointer transition-all duration-300 opacity-60 hover:opacity-100"
                      title={`${pla.name} ile özel sohbet başlat`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg text-white font-bold bg-gradient-to-br from-slate-800 to-slate-900 grayscale opacity-60 shrink-0 relative text-[10px]">
                          <Gamepad2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ring-2 ring-slate-950 bg-slate-700" />
                        </div>
                        
                        <div className="min-w-0">
                          <div className="text-xs font-bold transition-colors truncate text-slate-500 group-hover:text-slate-300">
                            {pla.name}
                          </div>
                          <span className="text-[9px] font-sans block truncate italic leading-none mt-0.5 text-slate-600">
                            çevrimdışı / deaktif
                          </span>
                        </div>
                      </div>

                      <span className="text-[8px] font-mono p-1 border rounded scale-90 opacity-40 shrink-0 text-slate-600 bg-slate-950/40 border-slate-950">
                        OFFLINE
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Interactive gaming guideline / trivia card at bottom of sidebar */}
          <div className="p-4 bg-gradient-to-br from-indigo-950/20 to-slate-950 border border-indigo-900/30 rounded-2xl space-y-3">
            <div className="flex items-center gap-1.5 text-indigo-400">
              <Zap className="w-4 h-4 shrink-0 animate-pulse" />
              <span className="text-[10px] uppercase font-black font-mono tracking-wider">HIZLI LOUNGE REHBERİ</span>
            </div>
            
            <p className="text-[10px] text-slate-400 italic font-sans leading-relaxed">
              "Bir oyun odası kurarak ekibe arkadaşlarını davet etmek istiyorsan, her zaman sol taraftaki <strong>GRUP İLANI OLUŞTUR</strong> seçeneğini kullanabilirsiniz. İlanınız anında 'Grup Bulma' kanalında yayınlanacaktır!"
            </p>
          </div>
        </div>
      </div>

      {/* LFG MODAL POPOVER FOR CREATING SMART MATCHING ROOM CARDS */}
      <AnimatePresence>
        {showLfgCreator && (
          <div 
            id="lfg_creator_overlay"
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#090e18] border border-slate-800 rounded-3xl p-6 max-w-md w-full relative space-y-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans">
                    YENİ LOUNGE GRUP İLANI AÇ
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLfgCreator(false)}
                  className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer p-1"
                >
                  Kapat
                </button>
              </div>

              <form onSubmit={handlePostLfg} className="space-y-4 text-xs">
                
                {/* Select from existing imported games list */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 block font-bold">1) KÖKLENECEK OYUNU SEÇİN:</label>
                  {games.length === 0 ? (
                    <div className="p-3 bg-red-950/25 border border-red-900/30 text-red-400 rounded-xl leading-relaxed text-[11px] font-sans">
                      ⚠️ Şu anda kütüphanenizde yüklü oyun yok! Öncelikle yönetici panelinden oyun eklemelisiniz.
                    </div>
                  ) : (
                    <select
                      value={lfgGameId}
                      onChange={(e) => setLfgGameId(e.target.value)}
                      required
                      className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800/80 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20"
                    >
                      <option value="">-- Kütüphaneden oyun seçin --</option>
                      {games.map(g => (
                        <option key={g.id} value={g.id}>{g.title} (AppID: {g.id})</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Need Slots configuration */}
                <div className="space-y-1.5">
                  <label className="text-slate-400 block font-bold">2) KAÇ KİŞİYE İHTİYAÇ VAR (MAX SLOT)?</label>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={lfgPlayersNeeded}
                    onChange={(e) => setLfgPlayersNeeded(Number(e.target.value))}
                    required
                    className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 font-sans mt-1 block leading-relaxed">
                    Aranan fedailer için lobiye tıklanabilir katılım slotları oluşturulur. Diğer kullanıcılar butona basarak odayı doldurabilir.
                  </span>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowLfgCreator(false)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 cursor-pointer font-bold duration-200"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={games.length === 0 || !lfgGameId}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-black tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-lg uppercase"
                  >
                    İlanı Yayınla
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Simple legacy helper component missing in default builds block
function StarsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.886L5 10.8l5.088 1.914L12 18.6l1.912-5.886L19 10.8l-5.088-1.914Z" />
    </svg>
  );
}
