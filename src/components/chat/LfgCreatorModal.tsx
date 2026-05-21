import * as React from "react";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Game } from "../../gamesData";

interface LfgCreatorModalProps {
  showLfgCreator: boolean;
  setShowLfgCreator: (v: boolean) => void;
  lfgGameId: string;
  setLfgGameId: (v: string) => void;
  lfgPlayersNeeded: number;
  setLfgPlayersNeeded: (v: number) => void;
  games: Game[];
  handlePostLfg: (e: React.FormEvent) => void;
}

export default function LfgCreatorModal({
  showLfgCreator,
  setShowLfgCreator,
  lfgGameId,
  setLfgGameId,
  lfgPlayersNeeded,
  setLfgPlayersNeeded,
  games,
  handlePostLfg
}: LfgCreatorModalProps) {
  return (
    <AnimatePresence>
      {showLfgCreator && (
        <div 
          id="lfg_creator_overlay"
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setShowLfgCreator(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#090e18] border border-slate-800 rounded-3xl p-6 max-w-md w-full relative space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans">
                  YENİ LOUNGE GRUP İLANI AÇ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLfgCreator(false)}
                className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer p-1"
              >
                Kapat
              </button>
            </div>

            <form onSubmit={handlePostLfg} className="space-y-4 text-xs">
              
              {/* Select from existing imported games list */}
              <div className="space-y-1.5 font-sans">
                <label className="text-slate-400 block font-bold">1) KÖKLENECEK OYUNU SEÇİN:</label>
                {games.length === 0 ? (
                  <div className="p-3 bg-red-950/25 border border-red-900/30 text-red-400 rounded-xl leading-relaxed text-[11px]">
                    ⚠️ Şu anda kütüphanenizde yüklü oyun yok! Öncelikle yönetici panelinden oyun eklemelisiniz.
                  </div>
                ) : (
                  <select
                    value={lfgGameId}
                    onChange={(e) => setLfgGameId(e.target.value)}
                    required
                    className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800/80 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20"
                  >
                    <option value="">-- Kütüphaneden oyun seçin --</option>
                    {games.map(g => (
                      <option key={g.id} value={g.id}>{g.title} (AppID: {g.id})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Need Slots configuration */}
              <div className="space-y-1.5 font-sans">
                <label className="text-slate-400 block font-bold">2) KAÇ KİŞİYE İHTİYAÇ VAR (MAX SLOT)?</label>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={lfgPlayersNeeded}
                  onChange={(e) => setLfgPlayersNeeded(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block leading-relaxed">
                  Aranan fedailer için lobiye tıklanabilir katılım slotları oluşturulur. Diğer kullanıcılar butona basarak odayı doldurabilir.
                </span>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-900 font-mono">
                <button
                  type="button"
                  onClick={() => setShowLfgCreator(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 cursor-pointer font-bold duration-200"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={games.length === 0 || !lfgGameId}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-black tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-lg uppercase"
                >
                  İlanı Yayınla
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
