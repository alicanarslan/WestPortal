export type { Game } from "./gamesData";

export interface Review {
  id: string;
  gameId: number;
  author: string;
  rating: number; // 1-5
  comment: string;
  recommend: boolean;
  date: string;
}

export interface UserSystemSpecs {
  cpuRank: number; // 1 (Min), 2 (Mid), 3 (High)
  gpuRank: number; // 1 (Min), 2 (Mid), 3 (High)
  ramGB: number; // e.g., 8, 16, 32
  storageSSD: boolean;
}

export interface GameNightEvent {
  id: string;
  gameId: number;
  date: string;
  title: string;
  organizer: string;
  players: string[];
  maxPlayers: number;
  description?: string; // custom instructions/lobby details
  gameMode?: string; // e.g., Co-op, PvP, Rank Kasmak, Chill, Speedrun
  discordChannel?: string; // custom Discord server reference
  comments?: { id: string; author: string; text: string; date: string }[];
}
