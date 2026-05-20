import * as React from "react";
import { Game } from "../gamesData";
import { GameNightEvent } from "../types";
import { GamerProfile } from "./LoginModal";
import GameNightPlanner from "./gaming-companion/GameNightPlanner";

interface GamingCompanionProps {
  games: Game[];
  activeSubSection: "planner";
  plannerEvents: GameNightEvent[];
  onAddEvent: (event: Omit<GameNightEvent, "id">) => void;
  onJoinEvent: (eventId: string, joinerName: string) => void;
  onSelectGame: (game: Game) => void;
  onDeleteEvent: (eventId: string) => void;
  gamerProfile: GamerProfile | null;
  onAddComment: (eventId: string, author: string, text: string) => void;
}

export default function GamingCompanion({
  games,
  plannerEvents,
  onAddEvent,
  onJoinEvent,
  onDeleteEvent,
  gamerProfile,
  onAddComment
}: GamingCompanionProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-8">
      <GameNightPlanner
        games={games}
        plannerEvents={plannerEvents}
        onAddEvent={onAddEvent}
        onJoinEvent={onJoinEvent}
        onDeleteEvent={onDeleteEvent}
        gamerProfile={gamerProfile}
        onAddComment={onAddComment}
      />
    </div>
  );
}
