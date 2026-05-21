import * as React from "react";
import { useState } from "react";
import { Game } from "../../../gamesData";
import { Check, ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { getModernTagStyles } from "../../../lib/tagStyles";

interface GameDetailsAboutProps {
  game: Game;
}

export default function GameDetailsAbout({ game }: GameDetailsAboutProps) {
  const [imageError, setImageError] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // Collect all images/screenshots in an array to cycle inside the lightbox explorer
  const allImages = game.screenshots && game.screenshots.length > 0 
    ? game.screenshots 
    : (game.imageUrl ? [game.imageUrl] : []);

  const handlePrev = () => {
    setLightboxIdx(prev => {
      if (prev === null) return null;
      return prev === 0 ? allImages.length - 1 : prev - 1;
    });
  };

  const handleNext = () => {
    setLightboxIdx(prev => {
      if (prev === null) return null;
      return prev === allImages.length - 1 ? 0 : prev + 1;
    });
  };

  React.useEffect(() => {
    if (lightboxIdx === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") setLightboxIdx(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIdx, allImages.length]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
      {/* Left Column (Main Info): 3 columns */}
      <div className="lg:col-span-3 space-y-6">

        {/* Long description Card */}
        <div className="relative bg-gradient-to-b from-[#0e1625]/90 to-[#080d16]/90 p-5 rounded-2xl border border-slate-900 overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-[4px] h-full bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
          
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)]" />
              Oyun İnceleme Detayları
            </span>
            <p className="text-sm text-slate-300 leading-relaxed font-sans font-medium pl-1">
              {game.description}
            </p>
          </div>
        </div>

        {/* Game Features & Modern Dynamic Colorful Tags */}
        <div className="relative bg-gradient-to-b from-[#0e1625]/90 to-[#080d16]/90 p-5 rounded-2xl border border-slate-900 overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-[4px] h-full bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.6)]" />
          
          <div className="space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-violet-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,1)]" />
              Öne Çıkan Özellikler & Klasman Etiketleri
            </span>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-1 pt-1">
              {(() => {
                const ft = game.forbiddenTags || [];
                const visibleTags = game.tags.filter(t => !ft.some(f => f.toLowerCase().trim() === t.toLowerCase().trim()));
                return visibleTags.map((feat, i) => {
                  const sty = getModernTagStyles(feat);
                  return (
                    <div 
                      key={i}
                      className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${sty.bg} ${sty.border}`}
                    >
                      <div className="flex items-center gap-x-2.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${sty.dot}`} />
                        <span className="text-xs font-bold font-sans text-slate-100">
                          {feat}
                        </span>
                      </div>
                      <Check className={`w-4 h-4 shrink-0 opacity-80 ${sty.text}`} />
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Fast Tags metadata lists */}
        <div className="relative bg-gradient-to-b from-[#0e1625]/90 to-[#080d16]/90 p-5 rounded-2xl border border-slate-900 overflow-hidden shadow-2xl space-y-3">
          <div className="absolute top-0 left-0 w-[4px] h-full bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.6)]" />
          
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-pink-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(236,72,153,1)]" />
            Dosya ve Kategori Bilgileri
          </span>
          <div className="flex flex-wrap gap-2.5 pl-1.5">
            <span className="px-3 py-1.5 bg-[#0e1625] rounded-lg border border-slate-800 text-slate-300 text-xs font-mono">
              Kurulum Boyutu: <strong className="text-cyan-400 font-sans ml-1">{game.size}</strong>
            </span>
            <span className="px-3 py-1.5 bg-[#0e1625] rounded-lg border border-slate-800 text-slate-300 text-xs font-mono">
              Oyun modu: <strong className="text-cyan-400 font-sans ml-1">{game.players}</strong>
            </span>
          </div>
        </div>

        {/* Dil Desteği (Language Support Panel) */}
        {game.turkishSupport && (
          <div className="relative bg-gradient-to-b from-[#0e1625]/90 to-[#080d16]/90 p-5 rounded-2xl border border-slate-900 overflow-hidden shadow-2xl space-y-4">
            <div className="absolute top-0 left-0 w-[4px] h-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
            
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 pl-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,1)] animate-pulse" />
              Dil Destekleri & Türkçe Uyumluluk
            </span>
            
            <div className="space-y-3.5 pl-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-200 font-sans font-semibold flex items-center gap-2">
                  🇹🇷 Türkçe Dil Desteği:
                </span>
                {game.turkishSupport.supported ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-3 py-1 rounded-full font-mono">
                    EVET
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-red-400 bg-red-950/40 border border-red-500/20 px-3 py-1 rounded-full font-mono">
                    YOK
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className={`p-3 rounded-xl border text-center font-mono space-y-1.5 transition-all duration-300 ${
                  game.turkishSupport.interface 
                    ? "bg-emerald-950/30 border-emerald-500/20 text-emerald-400" 
                    : "bg-red-950/10 border-red-500/10 text-red-500 opacity-60"
                }`}>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Arayüz</p>
                  <p className="text-xs font-black font-sans">
                    {game.turkishSupport.interface ? "✓ VAR" : "✗ YOK"}
                  </p>
                </div>
                
                <div className={`p-3 rounded-xl border text-center font-mono space-y-1.5 transition-all duration-300 ${
                  game.turkishSupport.audio 
                    ? "bg-emerald-950/30 border-emerald-500/20 text-emerald-400" 
                    : "bg-red-950/10 border-red-500/10 text-red-500 opacity-60"
                }`}>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Ses</p>
                  <p className="text-xs font-black font-sans">
                    {game.turkishSupport.audio ? "✓ VAR" : "✗ YOK"}
                  </p>
                </div>
                
                <div className={`p-3 rounded-xl border text-center font-mono space-y-1.5 transition-all duration-300 ${
                  game.turkishSupport.subtitles 
                    ? "bg-emerald-950/30 border-emerald-500/20 text-emerald-400" 
                    : "bg-red-950/10 border-red-500/10 text-red-500 opacity-60"
                }`}>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Altyazı</p>
                  <p className="text-xs font-black font-sans">
                    {game.turkishSupport.subtitles ? "✓ VAR" : "✗ YOK"}
                  </p>
                </div>
              </div>
              
              {game.turkishSupport.rawLanguages && (
                <div className="pt-2 border-t border-slate-900">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block mb-1 font-bold">Tüm Desteklenen Diller:</span>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed line-clamp-2" title={game.turkishSupport.rawLanguages}>
                    {game.turkishSupport.rawLanguages}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Column (Visual Media): 2 columns */}
      <div className="lg:col-span-2 space-y-5">
        {/* Embedded Video Trailer */}
        {game.trailerUrl ? (
          <div className="space-y-3">
            <span className="text-xs font-mono uppercase text-slate-500 tracking-wider flex items-center justify-between">
              <span>🎮 Resmi Oyun Fragmanı (mp4)</span>
              <a 
                href={game.trailerUrl}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline font-sans text-[11px] normal-case tracking-normal flex items-center gap-1"
              >
                İndir / Yeni Sekmede Aç <ArrowUpRight className="w-3" />
              </a>
            </span>
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-800 shadow-md bg-slate-950">
              <video
                src={game.trailerUrl}
                controls
                muted
                playsInline
                className="w-full h-full object-contain"
                poster={game.imageUrl}
              />
            </div>
          </div>
        ) : game.youtubeId ? (
          <div className="space-y-3">
            <span className="text-xs font-mono uppercase text-slate-500 tracking-wider flex items-center justify-between">
              <span>🎬 Resmi Oyun Fragmanı</span>
              <a 
                href={`https://www.youtube.com/watch?v=${game.youtubeId}`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline font-sans text-[11px] normal-case tracking-normal flex items-center gap-1"
              >
                Web'de Aç <ArrowUpRight className="w-3 h-3" />
              </a>
            </span>
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-800 shadow-md bg-slate-950">
              <iframe
                src={`https://www.youtube.com/embed/${game.youtubeId}?autoplay=0&mute=1`}
                title={`${game.title} Official Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
            {/* YouTube embed safety helper guidance */}
            <div className="p-3.5 bg-red-950/20 rounded-xl border border-red-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
              <div className="flex gap-2.5">
                <span className="text-red-500 shrink-0 font-bold text-xs select-none flex items-center justify-center w-5.5 h-5.5 rounded-full bg-red-500/10">▶</span>
                <div>
                  <p className="text-[11px] font-bold text-slate-200">Video Yüklenmiyor veya Kullanılamıyor mu?</p>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    YouTube yayıncılarının telif hakkı / yerleşik oynatıcı kısıtlamaları veya iframe engellemeleri nedeniyle video yüklenmeyebilir.
                  </p>
                </div>
              </div>
              <a 
                href={`https://www.youtube.com/watch?v=${game.youtubeId}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-4 py-2 shrink-0 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[10.5px] text-center flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-red-600/15"
              >
                YouTube'da İzle <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ) : null}

        {/* Custom Screenshots Gallery */}
        {game.screenshots && game.screenshots.length > 0 ? (
          <div className="relative bg-gradient-to-b from-[#0e1625]/90 to-[#080d16]/90 p-5 rounded-2xl border border-slate-900 overflow-hidden shadow-2xl space-y-4">
            <div className="absolute top-0 left-0 w-[4px] h-full bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
            
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 pl-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)]" />
              🖼️ Oyun İçi Ekran Görüntüleri ({game.screenshots.length})
            </span>
            
            <div className="grid grid-cols-1 gap-3.5 pl-1.5 pt-1">
              {game.screenshots.map((sUrl, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setLightboxIdx(idx)}
                  className="relative aspect-video rounded-xl overflow-hidden border border-slate-900 bg-slate-950 shadow-inner group cursor-zoom-in"
                >
                  <img
                    src={sUrl}
                    alt={`${game.title} Screenshot ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-85 hover:opacity-100 transition-all duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 text-[10px] text-slate-400 font-mono border border-slate-800">
                    Görüntü #{idx + 1}
                  </div>
                  <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 flex items-center justify-center transition-colors">
                    <span className="opacity-0 group-hover:opacity-100 font-bold text-xs text-cyan-400 bg-slate-950/90 py-1.5 px-3 rounded-lg border border-cyan-500/30 font-mono tracking-wider transition-opacity shadow-lg">BÜYÜTMEK İÇİN TIKLA</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : game.imageUrl && !imageError ? (
          <div className="relative bg-gradient-to-b from-[#0e1625]/90 to-[#080d16]/90 p-5 rounded-2xl border border-slate-900 overflow-hidden shadow-2xl space-y-4">
            <div className="absolute top-0 left-0 w-[4px] h-full bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
            
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 pl-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)]" />
              🖼️ Oyun Ekran Alıntısı
            </span>
            
            <div 
              onClick={() => setLightboxIdx(0)}
              className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-900 shadow-lg bg-slate-950 group cursor-zoom-in"
            >
              <img 
                src={game.imageUrl} 
                alt={game.title}
                onError={() => setImageError(true)}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-85 transition-all duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-3">
                <p className="text-[11px] text-slate-300 font-bold font-sans truncate">{game.title} - Görsel Sanatlar</p>
              </div>
              <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 flex items-center justify-center transition-colors">
                <span className="opacity-0 group-hover:opacity-100 font-bold text-xs text-cyan-400 bg-slate-950/90 py-1.5 px-3 rounded-lg border border-cyan-500/30 font-mono tracking-wider transition-opacity shadow-lg">BÜYÜTMEK İÇİN TIKLA</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Dynamic Fullscreen Lightbox Modal Overlay */}
        {lightboxIdx !== null && allImages.length > 0 && (
          <div 
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[90] flex flex-col justify-center items-center p-4 transition-all duration-300"
            onClick={() => setLightboxIdx(null)}
          >
            {/* Top Close button and Guidance info */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-[100] font-mono text-xs text-slate-400">
              <div className="flex items-center gap-2.5">
                <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] font-bold text-sm bg-cyan-950/40 p-1 px-2.5 rounded border border-cyan-500/20">
                  {game.title}
                </span>
                <span className="hidden sm:inline">|</span>
                <span className="hidden sm:inline">Görsel {lightboxIdx + 1} / {allImages.length}</span>
              </div>
              <button
                onClick={() => setLightboxIdx(null)}
                className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-white transition-colors cursor-pointer"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Centered Large Image with Hoverable Previous/Next Click Sides */}
            <div 
              className="relative max-w-5xl w-full max-h-[80vh] flex items-center justify-center select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={allImages[lightboxIdx]}
                alt={`${game.title} - Büyütülmüş Görsel`}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[80vh] object-contain rounded-xl border border-slate-900 shadow-2xl animate-fade-in"
              />

              {allImages.length > 1 && (
                <>
                  {/* Left Side: Click to Previous */}
                  <div 
                    onClick={handlePrev}
                    className="absolute left-0 top-0 bottom-0 w-1/2 cursor-w-resize group flex items-center justify-start p-4 hover:bg-gradient-to-r hover:from-black/50 hover:to-transparent transition-all rounded-l-xl"
                    title="Önceki Görsel (Sol yön tuşu veya sol tık)"
                  >
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 group-hover:text-white group-hover:scale-115 transition-all opacity-0 group-hover:opacity-100 shadow-2xl ml-2">
                      <ChevronLeft className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Right Side: Click to Next */}
                  <div 
                    onClick={handleNext}
                    className="absolute right-0 top-0 bottom-0 w-1/2 cursor-e-resize group flex items-center justify-end p-4 hover:bg-gradient-to-l hover:from-black/50 hover:to-transparent transition-all rounded-r-xl"
                    title="Sonraki Görsel (Sağ yön tuşu veya sağ tık)"
                  >
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 group-hover:text-white group-hover:scale-115 transition-all opacity-0 group-hover:opacity-100 shadow-2xl mr-2">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Caption & Instructions */}
            <div className="mt-5 flex flex-col items-center gap-1.5 font-mono text-center select-none">
              <span className="font-bold text-slate-200 text-sm">
                Görsel {lightboxIdx + 1} / {allImages.length}
              </span>
              <span className="text-[10.5px] text-slate-400 max-w-md">
                {allImages.length > 1 
                  ? "Sola veya sağa tıklayarak geçiş yapabilirsiniz. Klavye yön tuşları da aktiftir." 
                  : "Kapatmak için görselin dışına tıklayabilir veya ESC tuşuna basabilirsiniz."
                }
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
