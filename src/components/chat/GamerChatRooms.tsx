import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Plus } from "lucide-react";
import { Game } from "../../gamesData";
import { GamerProfile } from "../profile/LoginModal";
import { collection, onSnapshot, query, orderBy, setDoc, doc, serverTimestamp, writeBatch, limit } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";

import ChatChannelsList from "./ChatChannelsList";
import MessageStream from "./MessageStream";
import ChatInput from "./ChatInput";
import ChatOnlinePlayers from "./ChatOnlinePlayers";
import LfgCreatorModal from "./LfgCreatorModal";

interface Message {
  id: string;
  channel: string;
  author: string;
  avatarId: string;
  avatarBg: string;
  text: string;
  date: string;
  isAi?: boolean;
  role?: "ADMIN" | "PRO" | "GUIDE" | "MEMBER" | "BOT";
  imageUrl?: string;
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
            <MessageSquare className="w-5 h-5 text-cyan-505" />
            <h2 className={`text-base font-black uppercase tracking-wider font-mono ${isDarkMode ? "text-white" : "text-slate-900"}`}>PORTAL GAYRİRESMİ LOUNGE & SOHBET MERKEZİ</h2>
          </div>
          <p className={`text-xs font-sans leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
            Burada arkadaşlarınızla sohbet edin, lobi kurup LFG (grup bulma) ilanları yayınlayın ve oyun oynamak için toplulukla koordine olun.
          </p>
        </div>

        {activeChannel === "grup-bulma" && (
          <button
            type="button"
            onClick={() => setShowLfgCreator(true)}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-cyan-550 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-250 cursor-pointer shadow-md font-mono"
          >
            <Plus className="w-4 h-4" />
            GRUP İLANI OLUŞTUR
          </button>
        )}
      </div>

      {/* Main chat UI Box container */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 rounded-2xl border overflow-hidden shadow-2xl transition-all duration-300 ${
        isDarkMode 
          ? "bg-[#090e18]/95 border-slate-800/80 text-slate-105 shadow-cyan-950/10" 
          : "bg-white border-slate-200 text-slate-900 shadow-md"
      }`}>
        
        <ChatChannelsList
          activeChannel={activeChannel}
          setActiveChannel={setActiveChannel}
          activeVoiceChannelId={activeVoiceChannelId}
          handleJoinVoiceChannel={handleJoinVoiceChannel}
          activeDms={activeDms}
          onlinePlayers={onlinePlayers}
          isDarkMode={isDarkMode}
        />

        <div className="lg:col-span-6 flex flex-col h-[550px] relative">
          <MessageStream
            messages={messages}
            activeChannel={activeChannel}
            gamerProfile={gamerProfile}
            isDarkMode={isDarkMode}
            handleJoinLfgSlot={handleJoinLfgSlot}
            activeDms={activeDms}
            onClearHistory={clearChannelHistory}
          />

          <ChatInput
            textInput={textInput}
            setTextInput={setTextInput}
            attachedImage={attachedImage}
            setAttachedImage={setAttachedImage}
            showEmojiPicker={showEmojiPicker}
            setShowEmojiPicker={setShowEmojiPicker}
            handleSendMessage={handleSendMessage}
            handleImageChange={handleImageChange}
            activeChannel={activeChannel}
            activeDms={activeDms}
            isDarkMode={isDarkMode}
          />
        </div>

        <ChatOnlinePlayers
          onlinePlayers={onlinePlayers}
          gamerProfile={gamerProfile}
          handleOpenPrivateDm={handleOpenPrivateDm}
        />

      </div>

      <LfgCreatorModal
        showLfgCreator={showLfgCreator}
        setShowLfgCreator={setShowLfgCreator}
        lfgGameId={lfgGameId}
        setLfgGameId={setLfgGameId}
        lfgPlayersNeeded={lfgPlayersNeeded}
        setLfgPlayersNeeded={setLfgPlayersNeeded}
        games={games}
        handlePostLfg={handlePostLfg}
      />

    </div>
  );
}
