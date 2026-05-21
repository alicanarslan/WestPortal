import * as React from "react";
import { Game } from "../../gamesData";
import { GameNightEvent } from "../../types";
import { GamerProfile } from "../profile/LoginModal";
import { Radio } from "lucide-react";
import LobbyCreatorForm from "./LobbyCreatorForm";
import LobbyCard from "./LobbyCard";

interface GameNightPlannerProps {
  games: Game[];
  plannerEvents: GameNightEvent[];
  onAddEvent: (event: Omit<GameNightEvent, "id">) => void;
  onJoinEvent: (eventId: string, joinerName: string) => void;
  onDeleteEvent: (eventId: string) => void;
  gamerProfile: GamerProfile | null;
  onAddComment: (eventId: string, author: string, text: string) => void;
  isDarkMode?: boolean;
}

export default function GameNightPlanner({
  games,
  plannerEvents,
  onAddEvent,
  onJoinEvent,
  onDeleteEvent,
  gamerProfile,
  onAddComment,
  isDarkMode = true
}: GameNightPlannerProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Create new game night */}
      <LobbyCreatorForm
        games={games}
        gamerProfile={gamerProfile}
        onAddEvent={onAddEvent}
      />

      {/* Right Column (span 2): Beautiful lobbies feed with Slots and strategy board chat */}
      <div className="lg:col-span-2 space-y-6">
        <h3 className={`text-base font-bold tracking-wide pb-2.5 flex items-center gap-2 font-sans border-b ${
          isDarkMode ? "text-white border-slate-900/60" : "text-slate-800 border-slate-200"
        }`}>
          <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
          Aktif Oyun Gecesi Odaları & Lobiler ({plannerEvents.length})
        </h3>

        {plannerEvents.length === 0 ? (
          <div className={`p-12 border border-dashed rounded-3xl text-center font-medium font-sans text-xs flex flex-col justify-center items-center gap-3 ${
            isDarkMode ? "border-slate-900 bg-slate-950/20 text-slate-500" : "border-slate-200 bg-slate-50 text-slate-600"
          }`}>
            <span className="text-2xl">⚡</span>
            Şu an hiçbir oyun gecesi lobisi açılmamış. Arkadaşlarınla beraber şato kurmak veya akınlara katılmak için ilk takımı sen başlat!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {plannerEvents.map(event => (
              <LobbyCard
                key={event.id}
                event={event}
                games={games}
                gamerProfile={gamerProfile}
                onJoinEvent={onJoinEvent}
                onDeleteEvent={onDeleteEvent}
                onAddComment={onAddComment}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
