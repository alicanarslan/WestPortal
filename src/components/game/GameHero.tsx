import { useState, useEffect } from "react";
import { Game } from "../../gamesData";
import { Play, ChevronLeft, ChevronRight, Share2, Info, Star, HardDrive } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getModernTagStyles } from "../../lib/tagStyles";

interface GameHeroProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
}

export default function GameHero({ games, onSelectGame }: GameHeroProps) {
  // Feature the top 5 games dynamically from the current collection
  const featuredGames = games.slice(0, 5);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [activeIndex]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featuredGames.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [featuredGames.length]);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % featuredGames.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + featuredGames.length) % featuredGames.length);
  };

  if (featuredGames.length === 0) return null;
  const game = featuredGames[activeIndex];

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-2">
      {/* Background Frame Outer Container */}
      <div 
        className="relative h-[380px] md:h-[450px] w-full rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950 shadow-2xl group transition-all duration-500 hover:border-violet-500/30"
      >
        {/* Animated grid overlay background */}
        <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none z-10" />

        {/* Dynamic Theme Color Atmosphere Overlay */}
        <div className={`absolute -right-20 -top-20 w-96 h-96 rounded-full bg-gradient-to-br ${game.glowColor} opacity-10 blur-3xl transition-all duration-1000 group-hover:opacity-15 pointer-events-none`} />

        <AnimatePresence mode="wait">
          <motion.div
            key={game.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full flex flex-col md:flex-row"
          >
            {/* Left side: Game Visual Atmosphere with Ambient Backdrop and Container-Contained Foreground */}
            <div className="relative flex-1 h-3/5 md:h-full overflow-hidden bg-slate-950 flex items-center justify-center">
              {/* Back ambient blur layer to fill the canvas beautifully */}
              {game.imageUrl && !imageError ? (
                <img 
                  src={game.imageUrl} 
                  alt=""
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-30 blur-xl scale-125 select-none pointer-events-none"
                />
              ) : (
                <div 
                  className="absolute inset-0 scale-125 select-none pointer-events-none opacity-30 blur-xl"
                  style={{ background: game.bannerGradient }}
                />
              )}

              {/* Centered crisp image that fits completely without any cropping */}
              {game.imageUrl && !imageError ? (
                <img 
                  src={game.imageUrl} 
                  alt={game.title}
                  onError={() => setImageError(true)}
                  referrerPolicy="no-referrer"
                  className="relative w-full h-full object-contain z-10 transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                />
              ) : (
                <div 
                  className="relative w-full h-full z-10 transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  style={{ 
                    background: game.bannerGradient
                  }}
                />
              )}

              {/* High precision shadow overlays so the image blends smoothly with information right column */}
              <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none md:hidden block z-20" />
              <div className="absolute inset-y-0 right-0 w-1/5 bg-gradient-to-l from-slate-950/80 to-transparent pointer-events-none md:block hidden z-20" />
              <div className="absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-slate-950/80 to-transparent pointer-events-none md:block hidden z-20" />
              
              {/* Scanlines layer for authentic CRT gaming terminal feel */}
              <div className="absolute inset-0 scanlines opacity-10 pointer-events-none md:block hidden z-20" />

              {/* Glowing Ambient Halo */}
              <div className="absolute w-72 h-72 rounded-full bg-white/5 blur-3xl animate-pulse z-10" />

              {/* Centered Large Game Logo Tag over the contained cover image */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-20 select-none pointer-events-none">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <span className="px-3.5 py-1 text-[11px] font-bold tracking-widest uppercase bg-slate-950/90 text-cyan-400 border border-cyan-500/30 rounded-full inline-block backdrop-blur-lg mb-3">
                    HAFTANIN ÖNE ÇIKAN OYUNU
                  </span>
                </motion.div>
                <div className="bg-slate-950/40 p-4 rounded-2xl backdrop-blur-xs border border-white/5 shadow-2xl flex flex-col items-center max-w-sm sm:max-w-md">
                  <motion.h1 
                    className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tighter drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] font-sans"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    {game.title}
                  </motion.h1>
                  <motion.p
                    className="text-[11px] sm:text-xs text-slate-200 font-medium hidden sm:block mt-2 line-clamp-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {game.tagline || (game.description && game.description.length > 120 ? game.description.slice(0, 117) + "..." : game.description)}
                  </motion.p>
                </div>
              </div>

              {/* Outer Shadow Gradient Overlay */}
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent md:hidden z-10" />
              <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-950 to-transparent hidden md:block z-10" />
            </div>

            {/* Right side: Information block */}
            <div className="w-full md:w-[420px] lg:w-[480px] bg-slate-950/95 p-6 md:p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800/60 z-10 relative">
              <div className="flex flex-col gap-3">
                {/* Meta details */}
                <div className="flex items-center justify-end text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{game.rating} / 5.0</span>
                  </div>
                </div>

                <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-snug mt-1">
                  {game.title}
                </h3>

                <p className="text-sm text-slate-400 leading-relaxed line-clamp-4">
                  {game.description}
                </p>

                {/* Tags lists */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {game.tags.slice(0, 4).map((tag, i) => {
                    const sty = getModernTagStyles(tag);
                    return (
                      <span 
                        key={tag}
                        className={`text-[11px] font-bold px-3 py-1 rounded-md border backdrop-blur-sm transition-all duration-300 flex items-center gap-1.5 ${sty.bg} ${sty.text} ${sty.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${sty.dot}`} />
                        {tag}
                      </span>
                    );
                  })}
                </div>

                {/* Sub features */}
                <div className="mt-3 bg-slate-900/40 p-3 rounded-lg border border-slate-900 text-xs text-slate-400 space-y-1 font-mono">
                  <div><span className="text-slate-500">Boyut:</span> <span className="text-slate-200 font-sans font-bold">{game.size}</span></div>
                  <div><span className="text-slate-500">Oyuncu:</span> <span className="text-slate-200 font-sans font-bold">{game.players}</span></div>
                </div>
              </div>

              {/* Actions panel */}
              <div className="flex items-center gap-3 mt-6">
                <button
                  id={`hero_inspect_${game.id}`}
                  onClick={() => onSelectGame(game)}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold tracking-wide transition-all duration-300 shadow-md shadow-violet-600/15 hover:shadow-violet-600/30 cursor-pointer"
                >
                  <Info className="w-4 h-4" />
                  İncele & Yorum Yap
                </button>

                <a
                  id={`hero_download_${game.id}`}
                  href={game.steamripUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/70 border border-cyan-500/20 text-cyan-400 text-sm font-bold transition-all duration-300"
                  title="Online-Fix Çok Oyunculu İndirme"
                >
                  <HardDrive className="w-4 h-4" />
                  <span className="hidden sm:inline">Online-Fix</span>
                </a>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel buttons */}
        <div className="absolute bottom-6 left-6 flex items-center gap-1.5 z-20 md:block hidden">
          {featuredGames.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`w-6 h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? "bg-cyan-400 w-10 shadow-sm shadow-cyan-400/50" : "bg-white/20 hover:bg-white/45"
              }`}
            />
          ))}
        </div>

        {/* Slide controls */}
        <button
          onClick={handlePrev}
          className="absolute left-3 top-[30%] md:top-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80 transition-all duration-200 z-20 shadow-lg cursor-pointer opacity-0 group-hover:opacity-100"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-3 top-[30%] md:top-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80 transition-all duration-200 z-20 shadow-lg cursor-pointer opacity-0 group-hover:opacity-100"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
