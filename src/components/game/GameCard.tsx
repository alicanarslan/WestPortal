import * as React from "react";
import { Game } from "../../gamesData";
import { Star, Download, Eye, Users, HardDrive } from "lucide-react";
import { motion } from "motion/react";
import { getModernTagStyles } from "../../lib/tagStyles";

interface GameCardProps {
  key?: number | string;
  game: Game;
  onSelectGame: (game: Game) => void;
  reviewCount: number;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
  isLoggedIn?: boolean;
}

export default function GameCard({ 
  game, 
  onSelectGame, 
  reviewCount,
  isFavorite = false,
  onToggleFavorite,
  isLoggedIn = false
}: GameCardProps) {
  // Extract tag colors for customized pill accents
  const ft = game.forbiddenTags || [];
  const visibleTags = game.tags.filter(t => !ft.some(f => f.toLowerCase().trim() === t.toLowerCase().trim()));
  const isCoop = visibleTags.some(t => ["Co-op", "Eşli Oyun", "Büyük Eşli Oyun"].includes(t));
  const [imageError, setImageError] = React.useState(false);

  return (
    <motion.div
      layout
      id={`game_card_${game.id}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -6 }}
      className="relative flex flex-col justify-between bg-slate-950 rounded-2xl border border-slate-900 overflow-hidden shadow-xl transition-all duration-300 hover:border-violet-500/40 hover:shadow-cyan-500/5 group animate-none"
    >
      {/* Dynamic background lighting flare */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br ${game.glowColor} opacity-[0.03] blur-2xl pointer-events-none transition-opacity duration-300 group-hover:opacity-[0.08]`} />

      {/* Card Header visual representing game backdrop */}
      <div className="relative h-36 w-full overflow-hidden flex items-center justify-center bg-slate-900 border-b border-slate-900">
        {game.imageUrl && !imageError ? (
          <img 
            src={game.imageUrl} 
            alt={game.title}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-80 transition-transform duration-700 ease-out group-hover:scale-110 group-hover:opacity-100"
          />
        ) : (
          <div 
            className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110"
            style={{ background: game.bannerGradient, opacity: 0.75 }}
          />
        )}
        
        {/* Darkening shade effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />

        {/* Favorite Heart Button inside top left overlay */}
        {isLoggedIn && onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(game.id);
            }}
            className={`absolute top-2.5 left-2.5 z-10 p-1.5 rounded-lg border backdrop-blur-md transition-all duration-300 cursor-pointer ${
              isFavorite 
                ? "bg-rose-500/20 text-rose-500 border-rose-500/50 scale-105 shadow-md shadow-rose-500/10" 
                : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-rose-400 hover:border-rose-500/30"
            }`}
            title={isFavorite ? "Favorilerimden Kaldır" : "Favorilerime Ekle"}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill={isFavorite ? "currentColor" : "none"} 
              stroke="currentColor" 
              strokeWidth="2.5" 
              className="w-3.5 h-3.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        )}

        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
          {isCoop && (
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 bg-cyan-950/80 text-cyan-400 border border-cyan-500/25 rounded-md backdrop-blur-md flex items-center gap-1">
              <Users className="w-3" /> CO-OP
            </span>
          )}
          <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 bg-slate-950/80 text-slate-400 border border-slate-800 rounded-md backdrop-blur-md font-mono">
            {game.size}
          </span>
        </div>

        {/* Centered stylized game tag circle */}
        <div className="absolute bottom-3 left-4 flex flex-col gap-0.5 align-bottom">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-slate-400">
              {game.players}
            </span>
          </div>
          <h4 className="text-lg font-black text-white leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-sans group-hover:text-cyan-400 transition-colors">
            {game.title}
          </h4>
        </div>
      </div>

      {/* Main Card Content */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-4">
        <div className="space-y-2">
          {/* Custom rating details */}
          <div className="flex items-center text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/10">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{game.rating.toFixed(1)} / 5.0</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans line-clamp-2">
            {game.tagline || game.description}
          </p>

          {/* Sliced tags list */}
          <div className="flex flex-wrap gap-1.5 pt-1.5">
            {visibleTags.slice(0, 3).map(tag => {
              const sty = getModernTagStyles(tag);
              return (
                <span 
                  key={tag}
                  className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-sm transition-all duration-300 flex items-center gap-1.5 ${sty.bg} ${sty.text} ${sty.border}`}
                >
                  <span className={`w-1 h-1 rounded-full ${sty.dot}`} />
                  {tag}
                </span>
              );
            })}
          </div>
        </div>

        {/* Actions - Review detail page overlay trigger AND SteamRip download redirect */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
          <button
            id={`inspect_btn_${game.id}`}
            onClick={() => onSelectGame(game)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-violet-400" />
            Detaylar
          </button>

          <a
            id={`download_btn_${game.id}`}
            href={game.steamripUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/20 text-cyan-400 hover:text-cyan-300 text-xs font-bold transition-all duration-300"
            title="Online-Fix Çok Oyunculu İndirme"
          >
            <HardDrive className="w-3.5 h-3.5" />
            Online-Fix
          </a>
        </div>
      </div>
    </motion.div>
  );
}
