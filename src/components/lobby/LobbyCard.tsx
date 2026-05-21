import * as React from "react";
import { useState } from "react";
import { Game } from "../../gamesData";
import { GameNightEvent } from "../../types";
import { GamerProfile } from "../profile/LoginModal";
import { 
  Clock, Trash2, UserPlus, Copy, CheckCheck, Plus, HelpCircle, Award 
} from "lucide-react";
import LobbyStrategyChat from "./LobbyStrategyChat";

const getAvatarGradient = (name: string) => {
  const codes = name.split("").map(c => c.charCodeAt(0));
  const sum = codes.reduce((acc, curr) => acc + curr, 0);
  const colors = [
    "from-pink-500 to-rose-600 bg-rose-500",
    "from-purple-600 to-indigo-600 bg-indigo-500",
    "from-violet-600 to-fuchsia-600 bg-purple-500",
    "from-cyan-500 to-blue-600 bg-cyan-500",
    "from-emerald-500 to-teal-600 bg-emerald-500",
    "from-amber-500 to-orange-600 bg-amber-500"
  ];
  return colors[sum % colors.length];
};

const getEventTimeStatus = (eventDateStr: string) => {
  const eventTime = new Date(eventDateStr).getTime();
  const now = new Date().getTime();
  const diffMs = eventTime - now;

  if (diffMs < 0) {
    const hoursAgo = Math.abs(diffMs) / (1000 * 60 * 60);
    if (hoursAgo < 4) {
      return { label: "🎮 ŞU AN CANLI / AKTİF", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
    }
    return { label: "⌛ GEÇMİŞ / TAMAMLANDI", color: "bg-slate-900 text-slate-500 border-slate-800" };
  }

  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return { label: `⚡ YAKLAŞIYOR (${diffMins} dk kaldı)`, color: "bg-amber-500/20 text-amber-400 animate-pulse border-amber-500/30" };
  }
  if (diffHrs < 24) {
    return { label: `⚡ BUGÜN (${diffHrs} saat kaldı)`, color: "bg-cyan-500/25 text-cyan-400 border-cyan-500/30" };
  }
  const diffDays = Math.floor(diffHrs / 24);
  return { label: `📅 ${diffDays} gün kaldı`, color: "bg-purple-950/30 text-purple-400 border-purple-500/20" };
};

export interface LobbyCardProps {
  key?: React.Key;
  event: GameNightEvent;
  games: Game[];
  gamerProfile: GamerProfile | null;
  onJoinEvent: (eventId: string, joinerName: string) => void;
  onDeleteEvent: (eventId: string) => void;
  onAddComment: (eventId: string, author: string, text: string) => void;
  isDarkMode?: boolean;
}

export default function LobbyCard({
  event,
  games,
  gamerProfile,
  onJoinEvent,
  onDeleteEvent,
  onAddComment,
  isDarkMode = true
}: LobbyCardProps) {
  const [localJoinerName, setLocalJoinerName] = useState("");
  const [copied, setCopied] = useState(false);

  const gameMatch = games.find(g => g.id === event.gameId);
  const isFull = event.players.length >= event.maxPlayers;
  const hasJoined = gamerProfile && event.players.includes(gamerProfile.username);
  const timeStats = getEventTimeStatus(event.date);

  // Construct player slots representation
  const slots = [];
  for (let i = 0; i < event.maxPlayers; i++) {
    if (i < event.players.length) {
      slots.push({ occupied: true, name: event.players[i] });
    } else {
      slots.push({ occupied: false });
    }
  }

  const handleJoin = (forceName?: string) => {
    const name = forceName || localJoinerName;
    if (!name.trim()) return;

    onJoinEvent(event.id, name.trim());
    setLocalJoinerName("");
  };

  const handleCopyDiscord = (discord: string) => {
    navigator.clipboard.writeText(discord);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div
      className={`rounded-2xl border overflow-hidden shadow-xl transition-all duration-300 ${
        isDarkMode ? "bg-[#0b101b] border-slate-900 hover:border-slate-800" : "bg-white border-slate-200 hover:border-slate-300"
      }`}
    >
      {/* Lobby header with game image backdrop overlay */}
      <div className={`relative p-5 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        isDarkMode ? "border-slate-900/80 bg-slate-950/40" : "border-slate-200 bg-slate-50/50"
      }`}>
        
        {/* Background game thumbnail shadow */}
        {gameMatch && (
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none select-none">
            <img 
              src={gameMatch.imageUrl} 
              alt="" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover mask-gradient-side"
            />
            <div className={`absolute inset-0 ${isDarkMode ? "bg-gradient-to-r from-[#0b101b] to-transparent" : "bg-gradient-to-r from-white to-transparent"}`} />
          </div>
        )}

        <div className="z-10 space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-950/60 text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded-md">
              {gameMatch?.title || "Bilinmeyen Oyun"}
            </span>
            
            <span className={`text-[10px] font-mono tracking-wider font-bold border px-2 py-0.5 rounded-md ${timeStats.color}`}>
              {timeStats.label}
            </span>

            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
              isDarkMode ? "text-slate-505 bg-[#07090e] border-slate-900" : "text-slate-600 bg-white border-slate-205"
            }`}>
              <Clock className="w-3.5 h-3.5" />
              {new Date(event.date).toLocaleDateString("tr-TR")} {new Date(event.date).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <h4 className={`text-base font-bold font-sans drop-shadow-sm ${isDarkMode ? "text-white" : "text-slate-805"}`}>
            {event.title}
          </h4>
        </div>

        <div className="flex items-center gap-2 shrink-0 z-10 self-end md:self-center">
          {event.gameMode && (
            <span className={`px-3 py-1 text-[10px] font-mono rounded-lg border font-bold ${
              isDarkMode ? "bg-slate-900 border-slate-800 text-cyan-400" : "bg-white border-slate-200 text-cyan-600 shadow-sm"
            }`}>
              🎯 {event.gameMode}
            </span>
          )}
          
          {/* Trash action for organizer */}
          <button
            onClick={() => onDeleteEvent(event.id)}
            className={`p-1.5 rounded-lg border transition-colors shrink-0 cursor-pointer ${
              isDarkMode 
                ? "bg-slate-900/80 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 border-slate-800" 
                : "bg-white hover:bg-rose-50 hover:text-rose-605 text-slate-400 hover:border-rose-200 border-slate-200 shadow-sm"
            }`}
            title="Lobiyi Kapat ve Planı Kapat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body: description and slots */}
      <div className="p-5 space-y-5">
        
        {event.description && (
          <div className={`p-3.5 rounded-xl border text-xs font-sans leading-relaxed relative ${
            isDarkMode ? "bg-slate-950/60 border-slate-900 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-705"
          }`}>
            <span className="text-[8.5px] font-mono uppercase tracking-wider text-slate-500 block mb-1">📢 Kurucu Notu & Talimatlar:</span>
            {event.description}
          </div>
        )}

        {/* Discord Connection Info */}
        {event.discordChannel && (
          <div className="p-3 bg-indigo-950/15 border border-indigo-500/10 rounded-xl flex items-center justify-between text-xs font-mono text-indigo-300 gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,1)] shrink-0" />
              <span>Ses Kanalı / İletişim: <strong>{event.discordChannel}</strong></span>
            </div>
            <button
              onClick={() => handleCopyDiscord(event.discordChannel || "")}
              className={`px-2.5 py-1 text-[10px] border rounded flex items-center gap-1 cursor-pointer transition-all duration-200 ${
                isDarkMode 
                  ? "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300" 
                  : "bg-white hover:bg-slate-100 border-slate-200 text-slate-600 shadow-sm"
              }`}
            >
              {copied ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Kopyalandı
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Kopyala
                </>
              )}
            </button>
          </div>
        )}

        {/* Slots layout */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
            👥 TAKIM ÜYELERİ & BOŞ YUVALAR ({event.players.length} / {event.maxPlayers})
          </span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {slots.map((sl, idx) => {
              if (sl.occupied && sl.name) {
                const isLobbyLeader = idx === 0;
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-colors ${
                      isDarkMode ? "bg-[#0e1424]" : "bg-slate-50/70"
                    } ${
                      isLobbyLeader 
                        ? isDarkMode
                          ? "border-amber-500/25 ring-1 ring-amber-500/10" 
                          : "border-amber-450 ring-1 ring-amber-500/5 shadow-sm"
                        : isDarkMode 
                        ? "border-slate-800/80" 
                        : "border-slate-200 shadow-sm"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full shrink-0 bg-gradient-to-tr ${getAvatarGradient(sl.name)} flex items-center justify-center text-[10.5px] font-bold text-white shadow-inner`}>
                      {sl.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 font-sans">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-bold truncate block max-w-[100px] ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                          {sl.name}
                        </span>
                        {isLobbyLeader && <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" title="Lobi Lideri" />}
                      </div>
                      <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-wider block">
                        {isLobbyLeader ? "Lobi Lideri" : `Oyuncu #${idx + 1}`}
                      </span>
                    </div>
                  </div>
                );
              } else {
                // Empty slot element
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border border-dashed flex items-center justify-center text-[11px] font-mono h-13 group transition-all select-none ${
                      isDarkMode 
                        ? "border-slate-900 text-slate-500 bg-slate-950/20 hover:bg-slate-950/45 hover:border-slate-800/80" 
                        : "border-slate-200 text-slate-400 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300"
                    }`}
                  >
                    {gamerProfile ? (
                      <button
                        onClick={() => handleJoin(gamerProfile.username)}
                        disabled={hasJoined || isFull}
                        className="w-full h-full flex items-center justify-center gap-1.5 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                        <span className={`font-sans text-[10.5px] font-bold transition-colors ${
                          isDarkMode ? "text-slate-600 group-hover:text-slate-300" : "text-slate-400 group-hover:text-slate-700"
                        }`}>Yuvaya Katıl</span>
                      </button>
                    ) : (
                      <span className="flex items-center gap-1.5 select-none text-slate-400">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Lobi Yuvası</span>
                      </span>
                    )}
                  </div>
                );
              }
            })}
          </div>
        </div>

        {/* Join lobby row if not logged in / using custom name input */}
        {!isFull && !hasJoined && (
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center gap-3 justify-between ${
            isDarkMode ? "bg-slate-950/40 border-slate-900/60" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="text-left">
              <p className={`text-xs font-bold ${isDarkMode ? "text-slate-300" : "text-slate-750"}`}>Bu Lobiye Katılmak İster misin?</p>
              <p className="text-[10px] text-slate-500 font-sans leading-normal">Kendi takma adını yazıp doğrudan takıma kaydol:</p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Ziyaretçi adın..."
                value={localJoinerName}
                onChange={(e) => setLocalJoinerName(e.target.value)}
                className={`py-1.5 px-3 rounded-lg border text-xs focus:outline-none flex-1 sm:w-44 font-sans font-bold ${
                  isDarkMode 
                    ? "bg-slate-900 border-slate-800 text-slate-200 focus:border-cyan-500" 
                    : "bg-white border-slate-250 text-slate-805 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                }`}
              />
              <button
                onClick={() => handleJoin()}
                className="py-1.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer font-sans border-0 shadow-md active:scale-95 transition-all shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                Kaydol
              </button>
            </div>
          </div>
        )}

        {isFull && (
          <div className="p-2.5 rounded-lg bg-red-950/25 border border-red-500/20 text-red-400 font-bold font-mono text-center text-[10.5px]">
            ⛔ BU LOBİ KAPASİTESİ DOLDU ({event.players.length} / {event.maxPlayers})
          </div>
        )}
      </div>

      {/* strategy comment sub-tab messaging board */}
      <LobbyStrategyChat
        eventId={event.id}
        comments={event.comments}
        gamerProfile={gamerProfile}
        onAddComment={onAddComment}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
