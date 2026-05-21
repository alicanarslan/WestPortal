import * as React from "react";
import { useState } from "react";
import { Game } from "../../gamesData";
import { Review, UserSystemSpecs } from "../../types";
import { X, Info, Cpu, MessageSquare, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import GameDetailsAbout from "./details/GameDetailsAbout";
import GameDetailsSpecs from "./details/GameDetailsSpecs";
import GameDetailsReviews from "./details/GameDetailsReviews";

interface GameDetailsModalProps {
  game: Game;
  onClose: () => void;
  reviews: Review[];
  onAddReview: (review: { author: string; rating: number; comment: string; recommend: boolean }) => void;
  userSpecs: UserSystemSpecs;
}

export default function GameDetailsModal({
  game,
  onClose,
  reviews,
  onAddReview,
  userSpecs
}: GameDetailsModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<"about" | "specs" | "reviews">("about");
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [game.id]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 md:p-6 overflow-y-auto cursor-pointer"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-slate-950/95 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] cursor-default"
      >
        {/* Banner image with gradient and overlays */}
        <div className="relative h-56 md:h-64 shrink-0 flex items-end">
          {game.imageUrl && !imageError ? (
            <img 
              src={game.imageUrl} 
              alt={game.title}
              onError={() => setImageError(true)}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-45"
            />
          ) : (
            <div 
              className="absolute inset-0 transition-all duration-300"
              style={{ background: game.bannerGradient, opacity: 0.7 }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
          <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />

          {/* Quick exit button */}
          <button
            id="modal_close_btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer z-20"
            aria-label="Modal kapat"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title Area */}
          <div className="relative p-6 md:p-8 z-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-200 font-semibold font-mono">
                  {game.players} • {game.size}
                </span>
              </div>
              <h2 className="text-2xl md:text-3.5xl font-black text-white tracking-tight drop-shadow-md font-sans">
                {game.title}
              </h2>
            </div>

            {/* Main store URLs redirects */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <a
                id="steam_store_btn"
                href={game.steamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-slate-400 hover:bg-slate-850 text-slate-100 font-bold text-xs tracking-wide transition-all duration-300 decoration-none"
              >
                <span>Steam Sayfası</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <a
                id="spec_steamrip_btn"
                href={game.steamripUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-extrabold text-xs tracking-wide transition-all duration-300 shadow-md shadow-cyan-500/10 decoration-none"
              >
                <span>Oyunu İndir</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="flex border-b border-slate-900 bg-slate-950/90 px-6 md:px-8 py-1.5 shrink-0 gap-2 overflow-x-auto scrollbar-none">
          <button
            id="sub_tab_about"
            onClick={() => setActiveSubTab("about")}
            className={`flex items-center gap-1.5 py-3 px-3.5 text-xs font-bold tracking-wide transition-colors border-b-2 relative uppercase bg-transparent cursor-pointer border-0 ${
              activeSubTab === "about" ? "text-cyan-400 border-cyan-400" : "text-slate-400 border-transparent hover:text-white"
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            Genel Bilgi
          </button>
          
          <button
            id="sub_tab_specs"
            onClick={() => setActiveSubTab("specs")}
            className={`flex items-center gap-1.5 py-3 px-3.5 text-xs font-bold tracking-wide transition-colors border-b-2 relative uppercase bg-transparent cursor-pointer border-0 ${
              activeSubTab === "specs" ? "text-cyan-400 border-cyan-400" : "text-slate-400 border-transparent hover:text-white"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Sistem Gereksinimleri
          </button>
          
          <button
            id="sub_tab_reviews"
            onClick={() => setActiveSubTab("reviews")}
            className={`flex items-center gap-1.5 py-3 px-3.5 text-xs font-bold tracking-wide transition-colors border-b-2 relative uppercase bg-transparent cursor-pointer border-0 ${
              activeSubTab === "reviews" ? "text-cyan-400 border-cyan-400" : "text-slate-400 border-transparent hover:text-white"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            İncelemeler ({reviews.length})
          </button>
        </div>

        {/* Modal Scrollable Content Section */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-slate-950/40">
          {activeSubTab === "about" && (
            <GameDetailsAbout game={game} />
          )}

          {activeSubTab === "specs" && (
            <GameDetailsSpecs game={game} userSpecs={userSpecs} />
          )}

          {activeSubTab === "reviews" && (
            <GameDetailsReviews reviews={reviews} onAddReview={onAddReview} />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
