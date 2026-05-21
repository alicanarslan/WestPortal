import * as React from "react";
import { Game } from "../../../gamesData";
import { Gamepad2, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface GameEditModalProps {
  editingGame: Game | null;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  editTitle: string;
  setEditTitle: (v: string) => void;
  editTagline: string;
  setEditTagline: (v: string) => void;
  editDescription: string;
  setEditDescription: (v: string) => void;
  editSize: string;
  setEditSize: (v: string) => void;
  editPlayers: string;
  setEditPlayers: (v: string) => void;
  editSteamripUrl: string;
  setEditSteamripUrl: (v: string) => void;
  editImageUrl: string;
  setEditImageUrl: (v: string) => void;
  editGlowColor: string;
  setEditGlowColor: (v: string) => void;
  editTags: string;
  setEditTags: (v: string) => void;
  GLOW_COLORS: { value: string; name: string }[];
}

export default function GameEditModal({
  editingGame,
  onClose,
  onSave,
  editTitle,
  setEditTitle,
  editTagline,
  setEditTagline,
  editDescription,
  setEditDescription,
  editSize,
  setEditSize,
  editPlayers,
  setEditPlayers,
  editSteamripUrl,
  setEditSteamripUrl,
  editImageUrl,
  setEditImageUrl,
  editGlowColor,
  setEditGlowColor,
  editTags,
  setEditTags,
  GLOW_COLORS
}: GameEditModalProps) {
  return (
    <AnimatePresence>
      {editingGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 text-left space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold animate-pulse">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                    Oyunu Düzenle
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Seçilen oyunun tüm kütüphane bilgilerini ve parametrelerini özelleştirin.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 px-2 text-[10px] font-bold uppercase rounded bg-slate-900 hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                Kapat
              </button>
            </div>

            {/* Form */}
            <form onSubmit={onSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* App ID (Disabled) */}
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1 font-mono">
                    Steam App ID (Değiştirilemez)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingGame.id}
                    className="w-full bg-slate-900/40 border border-slate-900 rounded-lg p-2.5 text-xs text-slate-500 font-mono"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-slate-305 text-[10px] font-bold uppercase mb-1 font-mono">
                    Oyun Adı <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
                  />
                </div>

                {/* Tagline */}
                <div className="md:col-span-2">
                  <label className="block text-slate-305 text-[10px] font-bold uppercase mb-1 font-mono">
                    Özet Spot / Tagline
                  </label>
                  <input
                    type="text"
                    value={editTagline}
                    onChange={(e) => setEditTagline(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
                    placeholder="Oyun için kısa, çekici bir tanıtıcı ifade"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-slate-305 text-[10px] font-bold uppercase mb-1 font-mono">
                    Detaylı Açıklama
                  </label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 resize-none font-sans"
                    placeholder="Oyunun hikayesi veya oynanış detayları..."
                  />
                </div>

                {/* Size */}
                <div>
                  <label className="block text-slate-305 text-[10px] font-bold uppercase mb-1 font-mono">
                    Dosya Boyutu
                  </label>
                  <input
                    type="text"
                    value={editSize}
                    onChange={(e) => setEditSize(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
                    placeholder="Örn: 45 GB veya 120 GB"
                  />
                </div>

                {/* Players Count info */}
                <div>
                  <label className="block text-slate-305 text-[10px] font-bold uppercase mb-1 font-mono">
                    Oyuncu Ölçeği
                  </label>
                  <input
                    type="text"
                    value={editPlayers}
                    onChange={(e) => setEditPlayers(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
                    placeholder="Örn: 1-4 Oyuncu, Tek Oyunculu"
                  />
                </div>

                {/* SteamRIP URL */}
                <div className="md:col-span-2">
                  <label className="block text-slate-305 text-[10px] font-bold uppercase mb-1 font-mono">
                    SteamRIP / İndirme Adresi
                  </label>
                  <input
                    type="text"
                    value={editSteamripUrl}
                    onChange={(e) => setEditSteamripUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-emerald-400 font-mono"
                    placeholder="https://online-fix.me/games/..."
                  />
                </div>

                {/* Image URL */}
                <div className="md:col-span-2">
                  <label className="block text-slate-305 text-[10px] font-bold uppercase mb-1 font-mono">
                    Görsel Adresi (ImageUrl)
                  </label>
                  <input
                    type="text"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 font-mono"
                  />
                </div>

                {/* Glow Colors preset selection */}
                <div>
                  <label className="block text-slate-305 text-[10px] font-bold uppercase mb-1 font-mono">
                    Aura & Neon Rengi
                  </label>
                  <select
                    value={editGlowColor}
                    onChange={(e) => setEditGlowColor(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-sans"
                  >
                    {GLOW_COLORS.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-slate-305 text-[10px] font-bold uppercase mb-1 font-mono">
                    Kategoriler / Etiketler (Virgülle Ayırın)
                  </label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
                    placeholder="Örn: Aksiyon, Hayatta Kalma, Co-op"
                  />
                </div>
              </div>

              {/* Actions buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900 font-mono">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-[11px] font-bold uppercase transition-all cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-[11px] font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/10"
                >
                  <Check className="w-3.5 h-3.5" /> Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
