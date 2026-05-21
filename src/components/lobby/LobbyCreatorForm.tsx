import * as React from "react";
import { useState, useEffect } from "react";
import { Game } from "../../gamesData";
import { GameNightEvent } from "../../types";
import { GamerProfile } from "../profile/LoginModal";
import { Calendar, Plus, AlertCircle } from "lucide-react";

// Helper to get local date-time formatted as YYYY-MM-DDTHH:MM
const getLocalDateTimeString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
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

export interface LobbyCreatorFormProps {
  games: Game[];
  gamerProfile: GamerProfile | null;
  onAddEvent: (event: Omit<GameNightEvent, "id">) => void;
}

export default function LobbyCreatorForm({
  games,
  gamerProfile,
  onAddEvent
}: LobbyCreatorFormProps) {
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventOrganizer, setEventOrganizer] = useState(gamerProfile?.username || "");
  const [eventGameId, setEventGameId] = useState<number>(games[0]?.id || 1);
  const [eventDate, setEventDate] = useState(getLocalDateTimeString());
  const [eventMaxPlayers, setEventMaxPlayers] = useState(4);
  const [eventDescription, setEventDescription] = useState("");
  const [eventGameMode, setEventGameMode] = useState("Eşli Oyun / Co-op");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchronize dynamic profile nick if user logged in
  useEffect(() => {
    if (gamerProfile?.username) {
      setEventOrganizer(gamerProfile.username);
    }
  }, [gamerProfile]);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventOrganizer.trim() || !eventDate) return;

    if (eventTitle.trim().length < 3) {
      setErrorMsg("Lobi başlığı en az 3 karakter uzunluğunda olmalıdır!");
      return;
    }

    setErrorMsg(null);

    onAddEvent({
      gameId: Number(eventGameId),
      title: eventTitle.trim(),
      organizer: eventOrganizer.trim(),
      date: eventDate,
      maxPlayers: eventMaxPlayers,
      players: [eventOrganizer.trim()], // Creator is joined by default
      description: eventDescription.trim(),
      gameMode: eventGameMode,
      discordChannel: ""
    });

    setEventTitle("");
    setEventDescription("");
    setEventDate(getLocalDateTimeString()); // Reset to fresh local time
    setShowEventForm(false);
  };

  // Matched Game object for Form preview
  const formSelectedGame = games.find(g => g.id === Number(eventGameId));

  return (
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

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/20 text-rose-400 font-bold font-sans text-[11px] flex items-center gap-1.5 animate-pulse">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

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
  );
}
