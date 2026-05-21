import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, Send, Hash, Users, Bot, Sparkles, Plus, 
  Trash2, Flame, Laptop, PartyPopper, Heart, Zap, Check, CheckCircle2, ShieldAlert,
  Gamepad2, ChevronRight, Eye, RefreshCw, Smile, Pin, ArrowRight, Star
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Game } from "../gamesData";
import { GamerProfile } from "./LoginModal";
import { collection, onSnapshot, query, orderBy, setDoc, doc, deleteDoc, serverTimestamp, getDocs, writeBatch, limit } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

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


const QUICK_EMOJIS = ["🎮", "🔥", "👑", "🚀", "💀", "😂", "👍", "😮", "🛡️", "👽", "💩", "GG"];
const QUICK_SAYINGS = [
  "Akşam co-op akan var mı?",
  "Online-fix linkini kontrol ettiniz mi?",
  "Steam AppID çalışıyor mu?",
  "Hangi oyunu indirelim?",
  "Sistemim oyunu kaldırır mı?",
  "Lobiye anında katıldım!"
];

export default function GamerChatRooms({ gamerProfile, games }: GamerChatRoomsProps) {
  const [activeChannel, setActiveChannel] = useState<string>("genel-lobi");
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlinePlayers, setOnlinePlayers] = useState<any[]>([]);
  
  const [textInput, setTextInput] = useState("");
  const [chatTheme, setChatTheme] = useState<"neon" | "cosmic" | "terminal">("neon");
  
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

  // Real-time synchronizer for registered players/users on the portal
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
        usersList.push({
          name: u.username || "GamerPlayer",
          state: u.uid === gamerProfile.uid ? "Siz buradasınız" : "Lobi odasında çevrimiçi",
          avatar: u.avatarId || "swords",
          bg: u.avatarBg || "from-rose-600 to-red-900",
          badge: u.uid === gamerProfile.uid ? "SİZ" : "OYUNCU"
        });
      });
      setOnlinePlayers(usersList);
    }, (error) => {
      console.error("Firestore users list sync failed:", error);
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
    if (!textToSend.trim()) return;
    
    const currentGamer = gamerProfile || {
      username: "Guest_Gamer",
      avatarId: "swords"
    };

    const userAvatarBg = AVATAR_STYLING.find(s => s.id === currentGamer.avatarId)?.bg || "from-slate-600 to-slate-700";
    const msgId = "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 5);
    
    const newUserMsg = {
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

    try {
      await setDoc(doc(db, "messages", msgId), newUserMsg);
      setTextInput("");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `messages/${msgId}`);
    }
  };

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
      console.error("Grup mesaj silme başarısız:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 space-y-6">
      
      {/* Header Info Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#090e18]/80 border border-slate-800/80 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-black uppercase tracking-wider text-white">PORTAL GAYRİRESMİ LOUNGE & SOHBET MERKEZİ</h2>
          </div>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Burada arkadaşlarınızla sohbet edin, lobi kurup LFG (grup bulma) ilanları yayınlayın ve oyun oynamak için toplulukla koordine olun.
          </p>
        </div>

        {/* Change theme widgets */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-[10px] font-mono text-slate-500 font-bold uppercase mr-1">TEMA SEÇİCİ:</span>
          {(["neon", "cosmic", "terminal"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setChatTheme(t)}
              className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold font-mono border transition-all cursor-pointer ${
                chatTheme === t 
                  ? "bg-cyan-500/15 border-cyan-400 text-cyan-400" 
                  : "bg-slate-900/60 border-slate-800/80 text-slate-500 hover:text-slate-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main chat UI Box container */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 rounded-2xl border overflow-hidden shadow-2xl transition-all duration-300 ${
        chatTheme === "neon" 
          ? "bg-[#090e18]/95 border-slate-800/80 shadow-cyan-950/20" 
          : chatTheme === "cosmic" 
          ? "bg-[#070514]/95 border-purple-900/40 shadow-purple-950/20" 
          : "bg-[#020202] border-emerald-950 text-emerald-300 shadow-emerald-950/20 font-mono"
      }`}>
        
        {/* COL 1: Channels list (3 Columns) */}
        <div className="lg:col-span-3 bg-slate-950/90 border-r border-slate-900 p-4 space-y-5">
          <div>
            <span className="text-[10px] uppercase font-black text-slate-500 font-mono tracking-widest block mb-2">// KANALLAR</span>
            <div className="space-y-1.5">
              {[
                { id: "genel-lobi", name: "Genel Lobi", icon: Hash, desc: "Grup muhabbeti ve dedikodular" },
                { id: "grup-bulma", name: "Grup Bulma (LFG)", icon: StarsIcon, desc: "Takım arkadaşı bulma ilanları" },
                { id: "online-fix-rehberi", name: "Online-Fix Bilgi", icon: ShieldAlert, desc: "Ücretsiz multiplayer kılavuzu" }
              ].map((channel) => {
                const isSelected = activeChannel === channel.id;
                const IconComp = channel.id === "grup-bulma" ? Sparkles : (channel.id === "online-fix-rehberi" ? ShieldAlert : Hash);
                
                return (
                  <button
                    key={channel.id}
                    onClick={() => setActiveChannel(channel.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 cursor-pointer group relative overflow-hidden ${
                      isSelected 
                        ? "bg-slate-900 text-white border-l-4 border-cyan-400"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                    }`}
                  >
                    <IconComp className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isSelected ? "text-cyan-400" : "text-slate-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-none truncate flex items-center gap-1.5">
                        {channel.name}
                      </div>
                      <span className="text-[10px] text-slate-500 font-sans mt-0.5 block truncate group-hover:text-slate-300 transition-colors">
                        {channel.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick LFG Launcher button */}
          <div className="pt-2">
            <button
              onClick={() => setShowLfgCreator(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <Plus className="w-4 h-4 shrink-0" />
              GRUP ILANI OLUŞTUR
            </button>
          </div>

          {/* Status info */}
          <div className="bg-slate-900/30 rounded-xl p-3 border border-slate-900 space-y-2 mt-4">
            <h5 className="text-[10px] font-black uppercase text-slate-500 font-mono tracking-wider">// LOBİ GÜCÜ</h5>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 bg-slate-950/60 rounded border border-slate-900 text-center">
                <span className="text-slate-500 block">Kanal</span>
                <strong className="text-slate-300 font-sans capitalize">{activeChannel.replace("-", " ")}</strong>
              </div>
              <div className="p-2 bg-slate-950/60 rounded border border-slate-900 text-center">
                <span className="text-slate-500 block">Aktif İleti</span>
                <strong className="text-slate-300 font-sans">{messages.filter(m => m.channel === activeChannel).length}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* COL 2: Message Stream area (6 Columns) */}
        <div className="lg:col-span-6 flex flex-col h-[550px] bg-slate-950/40 relative">
          
          {/* Active channel sub header */}
          <div className="p-3.5 bg-slate-950/80 border-b border-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                #{activeChannel}
              </span>
              <span className="text-[9px] font-mono font-bold bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">
                LİVE STREAM
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

          {/* Messages list bucket */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.filter(m => m.channel === activeChannel).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <MessageSquare className="w-10 h-10 text-slate-700 animate-bounce" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 font-sans">Burada hiç ileti bulunmuyor.</p>
                  <p className="text-[10px] text-slate-600 font-sans max-w-xs">Aşağıdan ilk iletiyi yazarak portal sohbetini canlandırın ya da hazır kalıpları kullanın!</p>
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
                          <span className="text-[11px] font-extrabold text-slate-200 hover:text-cyan-400 transition-colors cursor-pointer">
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

                          <span className="text-[9px] text-slate-600 font-mono">
                            {msg.date}
                          </span>
                        </div>

                        {/* Rendering main bubble text */}
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed font-sans relative ${
                          isUser
                            ? "bg-gradient-to-br from-indigo-900/60 to-slate-900 text-slate-100 rounded-tr-none border border-indigo-800/20"
                            : msg.isAi
                            ? "bg-slate-900 border border-purple-500/20 shadow-lg shadow-purple-950/20 rounded-tl-none text-purple-200"
                            : "bg-slate-900/90 text-slate-300 rounded-tl-none border border-slate-800"
                        }`}>
                          
                          <p className="whitespace-pre-wrap select-text">{msg.text}</p>

                          {/* Render LFG group Card nested if present */}
                          {msg.lfgData && (
                            <div className="mt-3 bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-3 shadow-inner">
                              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                                <div className="flex items-center gap-1.5">
                                  <Gamepad2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
                                  <span className="text-[10px] font-black text-white uppercase tracking-wider">
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
                                  <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-950/30 rounded border border-indigo-900/30">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                    <span className="truncate text-indigo-300 font-semibold">{msg.author} (Ev Sahibi)</span>
                                  </div>
                                  
                                  {/* Dynamic occupied slots */}
                                  {msg.lfgData.slotsJoined.map((name, sIdx) => (
                                    <div key={sIdx} className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 rounded border border-slate-850">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                      <span className="truncate text-slate-200">{name}</span>
                                    </div>
                                  ))}

                                  {/* Clean empty slots list */}
                                  {Array.from({ length: msg.lfgData.playersNeeded - msg.lfgData.slotsJoined.length }).map((_, emptyIdx) => (
                                    <div key={emptyIdx} className="flex items-center gap-1.5 px-2 py-1 bg-slate-950 border border-slate-900 rounded border-dashed text-slate-600">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
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
                                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
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

          {/* Quick preset Gamer Sayings bar */}
          <div className="p-2 bg-slate-950/80 border-t border-slate-900/60 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-2">
            <span className="text-[9px] font-mono text-slate-600 uppercase font-bold pl-1">KALIPLAR:</span>
            {QUICK_SAYINGS.map((say) => (
              <button
                key={say}
                type="button"
                onClick={() => handleSendMessage(say)}
                className="px-2.5 py-1 rounded-md text-[10px] bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-400 border border-slate-800/80 cursor-pointer shrink-0 transition-colors"
              >
                {say}
              </button>
            ))}
          </div>

          {/* Bottom input editor box */}
          <div className="p-3 bg-slate-950 border-t border-slate-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(textInput);
              }}
              className="flex items-center gap-2"
            >
              {/* Add Emoji picker helper */}
              <div className="flex gap-1">
                {QUICK_EMOJIS.slice(0, 5).map((emo) => (
                  <button
                    key={emo}
                    type="button"
                    onClick={() => setTextInput(prev => prev + emo)}
                    className="p-1 hover:bg-slate-900 rounded text-xs transition-colors cursor-pointer"
                  >
                    {emo}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={`Sohbet odasına yazın (#${activeChannel})...`}
                className="flex-1 bg-slate-900/90 text-xs text-slate-100 placeholder-slate-600 p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/25 transition-all font-sans"
              />

              <button
                type="submit"
                disabled={!textInput.trim()}
                className="p-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-lg shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* COL 3: Online Friends and Activity (3 Columns) */}
        <div className="lg:col-span-3 bg-slate-950/60 p-4 border-l border-slate-900 space-y-5 flex flex-col justify-between">
          
          {/* List of active online teammates */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <span className="text-[10px] uppercase font-black text-slate-500 font-mono tracking-widest block font-bold">
                AKTİF LOBİ (%{100})
              </span>
              <span className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2s rounded">
                {onlinePlayers.length} ÇEVRİMİÇİ
              </span>
            </div>

            <div className="space-y-3">
              {onlinePlayers.map((pla, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    // Instantly trigger DM whisper in chat input
                    setTextInput(`@${pla.name} `);
                  }}
                  className="w-full text-left p-2 rounded-xl bg-slate-900/35 hover:bg-slate-900/90 transition-all border border-slate-900/40 flex items-center justify-between group cursor-pointer"
                  title={`Fısıldamak için tıklayın`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Character avatar */}
                    <div className={`p-1.5 rounded-lg text-white font-bold bg-gradient-to-br ${pla.bg} shrink-0 relative text-[10px]`}>
                      <Gamepad2 className="w-3.5 h-3.5" />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
                    </div>
                    
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-300 group-hover:text-cyan-400 transition-colors truncate">
                        {pla.name}
                      </div>
                      <span className="text-[9px] text-slate-500 font-sans block truncate italic leading-none mt-0.5">
                        {pla.state}
                      </span>
                    </div>
                  </div>

                  <span className="text-[8px] font-mono text-slate-600 bg-slate-950 p-1 border border-slate-900 rounded scale-90 opacity-80 shrink-0">
                    {pla.badge}
                  </span>
                </button>
              ))}
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
