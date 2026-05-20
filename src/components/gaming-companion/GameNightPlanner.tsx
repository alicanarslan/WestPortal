import * as React from "react";
import { useState } from "react";
import { Game } from "../../gamesData";
import { GameNightEvent } from "../../types";
import { GamerProfile } from "../LoginModal";
import { 
  Calendar, Plus, Clock, Trash2, UserPlus, MessageSquare, Swords, Radio, HelpCircle, AlertCircle, Copy, CheckCheck, Send, ShieldAlert, Award
} from "lucide-react";

interface GameNightPlannerProps {
  games: Game[];
  plannerEvents: GameNightEvent[];
  onAddEvent: (event: Omit<GameNightEvent, "id">) => void;
  onJoinEvent: (eventId: string, joinerName: string) => void;
  onDeleteEvent: (eventId: string) => void;
  gamerProfile: GamerProfile | null;
  onAddComment: (eventId: string, author: string, text: string) => void;
}

export default function GameNightPlanner({
  games,
  plannerEvents,
  onAddEvent,
  onJoinEvent,
  onDeleteEvent,
  gamerProfile,
  onAddComment
}: GameNightPlannerProps) {
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventOrganizer, setEventOrganizer] = useState(gamerProfile?.username || "");
  const [eventGameId, setEventGameId] = useState<number>(games[0]?.id || 1);
  const [eventDate, setEventDate] = useState("");
  const [eventMaxPlayers, setEventMaxPlayers] = useState(4);
  const [eventDescription, setEventDescription] = useState("");
  const [eventGameMode, setEventGameMode] = useState("Eşli Oyun / Co-op");
  const [eventDiscordChannel, setEventDiscordChannel] = useState("");
  
  // Custom inputs for quick joining names or comments
  const [joinerName, setJoinerName] = useState<{ [key: string]: string }>({});
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Synchronize dynamic profile nick if user logged in
  React.useEffect(() => {
    if (gamerProfile?.username) {
      setEventOrganizer(gamerProfile.username);
    }
  }, [gamerProfile]);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventOrganizer.trim() || !eventDate) return;

    onAddEvent({
      gameId: Number(eventGameId),
      title: eventTitle.trim(),
      organizer: eventOrganizer.trim(),
      date: eventDate,
      maxPlayers: eventMaxPlayers,
      players: [eventOrganizer.trim()], // Creator is joined by default
      description: eventDescription.trim() || undefined,
      gameMode: eventGameMode,
      discordChannel: eventDiscordChannel.trim() || undefined
    });

    setEventTitle("");
    setEventDescription("");
    setEventDiscordChannel("");
    setShowEventForm(false);
  };

  const handleJoin = (eventId: string, forceName?: string) => {
    const name = forceName || joinerName[eventId] || "";
    if (!name.trim()) return;

    onJoinEvent(eventId, name.trim());
    setJoinerName(prev => ({ ...prev, [eventId]: "" }));
  };

  const handleAddCommentSubmit = (e: React.FormEvent, eventId: string) => {
    e.preventDefault();
    const text = commentText[eventId] || "";
    if (!text.trim()) return;

    const author = gamerProfile?.username || "Ziyaretçi_Oyuncu";
    onAddComment(eventId, author, text.trim());
    setCommentText(prev => ({ ...prev, [eventId]: "" }));
  };

  const handleCopyDiscord = (discord: string, id: string) => {
    navigator.clipboard.writeText(discord);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

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

  // Matched Game object for Form preview
  const formSelectedGame = games.find(g => g.id === Number(eventGameId));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Create new game night */}
      <div className="lg:col-span-1 bg-[#0b101b] p-6 rounded-2xl border border-slate-900/80 shadow-2xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-md font-bold text-white tracking-wide uppercase font-sans">
                Lobi Planlayıcısı
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Arkadaş grubunla akın planla
              </p>
            </div>
          </div>

          {showEventForm ? (
            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs font-mono text-slate-300">
              
              {/* Form Active Game Preview Card Banner */}
              {formSelectedGame && (
                <div className="relative h-20 rounded-xl overflow-hidden border border-slate-900 bg-slate-950 shadow-inner group transition-all duration-300 flex items-center p-3 gap-3">
                  <img
                    src={formSelectedGame.imageUrl}
                    alt={formSelectedGame.title}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-800"
                  />
                  <div className="relative z-10">
                    <span className="text-[9px] text-[#22d3ee] font-mono uppercase bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20">Seçilen Oyun</span>
                    <h4 className="text-xs font-bold font-sans text-slate-200 mt-1">{formSelectedGame.title}</h4>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent opacity-80" />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-500 text-[10px] uppercase block">Seçilecek Oyun:</label>
                <select
                  value={eventGameId}
                  onChange={(e) => setEventGameId(Number(e.target.value))}
                  className="w-full bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {games.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 text-[10px] uppercase block">Lobi Başlığı:</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Cuma Akşamı Boss Kesiyoruz!"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 text-[10px] uppercase block">Lider / Kurucu (Sen):</label>
                <input
                  type="text"
                  required
                  disabled={!!gamerProfile?.username}
                  placeholder="Gamer_Tag"
                  value={eventOrganizer}
                  onChange={(e) => setEventOrganizer(e.target.value)}
                  className="w-full bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-slate-100 text-xs focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 text-[10px] uppercase block">Oyun Tarzı / Modu:</label>
                  <select
                    value={eventGameMode}
                    onChange={(e) => setEventGameMode(e.target.value)}
                    className="w-full bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-slate-100 text-xs focus:outline-none"
                  >
                    <option value="Eşli Oyun / Co-op">Co-op / Eşli</option>
                    <option value="PvP Karşılaşma">PvP</option>
                    <option value="Ranked / Lig Kasmak">Ranked Lig</option>
                    <option value="Chill / Eğlence">Eğlence / Chill</option>
                    <option value="Speedrun">Speedrun</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 text-[10px] uppercase block">Maks. Oyuncu Sınırı:</label>
                  <input
                    type="number"
                    min={2}
                    max={64}
                    value={eventMaxPlayers}
                    onChange={(e) => setEventMaxPlayers(Number(e.target.value))}
                    className="w-full bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-slate-100 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 text-[10px] uppercase block">Discord Ses Oda Kanalı / Linki (Opsiyonel):</label>
                <input
                  type="text"
                  placeholder="Örn: discord.gg/kanalım veya Ses Odası #3"
                  value={eventDiscordChannel}
                  onChange={(e) => setEventDiscordChannel(e.target.value)}
                  className="w-full bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 text-[10px] uppercase block">Tarih ve Saat:</label>
                <input
                  type="datetime-local"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 text-[10px] uppercase block">Kısa Lobi Açıklaması / Talimatlar:</label>
                <textarea
                  placeholder="Grup kuralları, dlc gereksinimleri veya önemli notlar..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-slate-100 text-xs focus:outline-none font-sans resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-lg bg-cyan-400 text-slate-950 font-bold cursor-pointer text-center text-[10.5px] uppercase font-sans border-0 hover:bg-cyan-300 transition-all shadow-md shadow-cyan-400/10 hover:shadow-cyan-400/20 active:scale-95"
                >
                  Lobiyi Canlıya Al
                </button>
                <button
                  type="button"
                  onClick={() => setShowEventForm(false)}
                  className="py-2.5 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 cursor-pointer text-xs"
                >
                  İptal
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 font-sans">
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Grupça V Rising akın gecesi, No Man's Sky galaksi keşfi veya Project Zomboid barınak baskını planla! Soldaki yeşil veya mor butonla kendi lobini oluştur, diğer gamer arkadaşlarını davet et.
              </p>

              {gamerProfile ? (
                <div className="p-3 bg-purple-950/20 rounded-xl border border-purple-500/10 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full shrink-0 bg-gradient-to-tr ${getAvatarGradient(gamerProfile.username)} flex items-center justify-center font-bold text-white shadow-md text-xs`}>
                    {gamerProfile.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-mono text-purple-400 font-bold uppercase tracking-wide">Aktif Kimlik</p>
                    <p className="text-xs font-bold text-slate-200 truncate">{gamerProfile.username}</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-yellow-950/25 rounded-xl border border-yellow-500/15 text-[10.5px] text-yellow-400 flex items-start gap-2.5 font-sans leading-normal">
                  <AlertCircle className="w-4 h-4 shrink-0 text-yellow-400" />
                  <span>
                    Profil oluşturarak tek tıkla oyun gecelerine katılabilirsin. Profil kartını üst panelden açabilirsin.
                  </span>
                </div>
              )}

              <button
                id="planner_add_btn"
                onClick={() => setShowEventForm(true)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 border-0 shadow-lg shadow-purple-500/10"
              >
                <Plus className="w-4 h-4" />
                YENİ CANLI LOBİ OLUŞTUR
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Column (span 2): Beautiful lobbies feed with Slots and strategy board chat */}
      <div className="lg:col-span-2 space-y-6">
        <h3 className="text-base font-bold text-white tracking-wide border-b border-slate-900/60 pb-2.5 flex items-center gap-2 font-sans">
          <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
          Aktif Oyun Gecesi Odaları & Lobiler ({plannerEvents.length})
        </h3>

        {plannerEvents.length === 0 ? (
          <div className="p-12 border border-dashed border-slate-900 rounded-3xl text-center text-slate-500 font-medium font-sans text-xs flex flex-col justify-center items-center gap-3 bg-slate-950/20">
            <span className="text-2xl">⚡</span>
            Şu an hiçbir oyun gecesi lobisi açılmamış. Arkadaşlarınla beraber şato kurmak veya akınlara katılmak için ilk takımı sen başlat!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {plannerEvents.map(event => {
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

              return (
                <div
                  key={event.id}
                  className="bg-[#0b101b] rounded-2xl border border-slate-900 overflow-hidden shadow-xl transition-all duration-300 hover:border-slate-800"
                >
                  
                  {/* Lobby header with game image backdrop overlay */}
                  <div className="relative p-5 border-b border-slate-900/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-950/40">
                    
                    {/* Background game thumbnail shadow */}
                    {gameMatch && (
                      <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none select-none">
                        <img 
                          src={gameMatch.imageUrl} 
                          alt="" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover mask-gradient-side"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0b101b] to-transparent" />
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

                        <span className="text-[10px] font-mono text-slate-500 font-bold bg-[#07090e] px-2 py-0.5 rounded border border-slate-900 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(event.date).toLocaleDateString("tr-TR")} {new Date(event.date).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white font-sans drop-shadow-md">
                        {event.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 z-10 self-end md:self-center">
                      {event.gameMode && (
                        <span className="px-3 py-1 bg-slate-900 text-[10px] font-mono rounded-lg border border-slate-800 font-bold text-cyan-400">
                          🎯 {event.gameMode}
                        </span>
                      )}
                      
                      {/* Trash action for organizer */}
                      <button
                        onClick={() => onDeleteEvent(event.id)}
                        className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 border border-slate-800 transition-colors shrink-0 cursor-pointer"
                        title="Lobiyi Kapat ve Planı Kapat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body: description and slots */}
                  <div className="p-5 space-y-5">
                    
                    {event.description && (
                      <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-900 text-xs text-slate-300 font-sans leading-relaxed relative">
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
                          onClick={() => handleCopyDiscord(event.discordChannel || "", event.id)}
                          className="px-2.5 py-1 text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded flex items-center gap-1 cursor-pointer transition-all duration-200"
                        >
                          {copiedId === event.id ? (
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
                                className={`p-2.5 rounded-xl border flex items-center gap-2.5 bg-[#0e1424] ${
                                  isLobbyLeader ? "border-amber-500/25 ring-1 ring-amber-500/10" : "border-slate-800/80"
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-full shrink-0 bg-gradient-to-tr ${getAvatarGradient(sl.name)} flex items-center justify-center text-[10.5px] font-bold text-white shadow-inner`}>
                                  {sl.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0 font-sans">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-200 truncate block max-w-[100px]">
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
                                className="p-2.5 rounded-xl border border-dashed border-slate-900 flex items-center justify-center text-[11px] font-mono text-slate-500 bg-slate-950/20 hover:bg-slate-950/45 hover:border-slate-800/80 transition-all select-none h-13 group"
                              >
                                {gamerProfile ? (
                                  <button
                                    onClick={() => handleJoin(event.id, gamerProfile.username)}
                                    disabled={hasJoined || isFull}
                                    className="w-full h-full flex items-center justify-center gap-1.5 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-slate-600 group-hover:text-purple-400 transition-colors" />
                                    <span className="font-sans text-[10.5px] font-bold text-slate-600 group-hover:text-slate-300 transition-colors">Yuvaya Katıl</span>
                                  </button>
                                ) : (
                                  <span className="flex items-center gap-1.5 select-none text-slate-600">
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
                      <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900/60 flex flex-col sm:flex-row items-center gap-3 justify-between">
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-300">Bu Lobiye Katılmak İster misin?</p>
                          <p className="text-[10px] text-slate-500 font-sans leading-normal">Kendi takma adını yazıp butona tıklayabilirsin:</p>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                          <input
                            type="text"
                            placeholder="Ziyaretçi adın..."
                            value={joinerName[event.id] || ""}
                            onChange={(e) => setJoinerName({ ...joinerName, [event.id]: e.target.value })}
                            className="bg-slate-900 py-1.5 px-3 rounded-lg border border-slate-800 text-slate-200 text-xs focus:outline-none flex-1 sm:w-44 font-sans focus:border-cyan-500 font-bold"
                          />
                          <button
                            onClick={() => handleJoin(event.id)}
                            className="py-1.5 px-4 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer font-sans border-0 shadow-md shadow-cyan-400/10 active:scale-95 transition-all shrink-0"
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
                  <div className="bg-[#080c14] border-t border-slate-900 p-4 space-y-4 font-sans">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5 block font-bold">
                      <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                      LOBİ KOORDİNASYON & STRATEJİ SOHBETİ ({event.comments?.length || 0})
                    </span>

                    {/* Chat Messages */}
                    {event.comments && event.comments.length > 0 ? (
                      <div className="max-h-44 overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar">
                        {event.comments.map(c => (
                          <div key={c.id} className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-900 text-xs flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="font-bold text-cyan-400">{c.author}</span>
                              <span className="text-slate-500">{c.date}</span>
                            </div>
                            <p className="text-slate-300 font-sans leading-normal whitespace-pre-wrap">{c.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10.5px] text-slate-500 italic pl-1">
                        Henüz lobiye bir mesaj bırakılmadı. DLC gereksinimi veya ekip koordinasyonu hakkında ilk notu yazarak danış!
                      </p>
                    )}

                    {/* Chat Input form */}
                    <form onSubmit={(e) => handleAddCommentSubmit(e, event.id)} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={gamerProfile ? `${gamerProfile.username} olarak mesaj bırak...` : "Mesajınızı yazın..."}
                        value={commentText[event.id] || ""}
                        onChange={(e) => setCommentText({ ...commentText, [event.id]: e.target.value })}
                        required
                        className="bg-slate-900 py-2 px-3.5 rounded-xl border border-slate-800 text-slate-200 text-xs focus:outline-none flex-1 font-sans focus:border-purple-500 font-normal"
                      />
                      <button
                        type="submit"
                        className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center cursor-pointer transition-colors shrink-0 border-0"
                        title="Mesaj Gönder"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
