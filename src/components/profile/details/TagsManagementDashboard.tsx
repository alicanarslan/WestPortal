import * as React from "react";
import { Game } from "../../../gamesData";
import { Layers } from "lucide-react";

interface TagsManagementDashboardProps {
  games: Game[];
  deactivatedTags: string[];
  onToggleDeactivateTag: (tag: string) => void;
}

export default function TagsManagementDashboard({
  games,
  deactivatedTags,
  onToggleDeactivateTag
}: TagsManagementDashboardProps) {
  const allUniqueTagsAcrossGames = Array.from(
    new Set(games.flatMap(g => g.tags || []))
  ).filter((t): t is string => !!t);

  const fallbackTags = [
    "Eşli Oyun", 
    "Hayatta Kalma", 
    "Roguelike", 
    "Aksiyon", 
    "Strateji", 
    "Açık Dünya", 
    "Bilim Kurgu", 
    "Simülasyon", 
    "Platformcu"
  ];

  const tagsToShow = allUniqueTagsAcrossGames.length > 0 ? allUniqueTagsAcrossGames : fallbackTags;

  const activeCount = Math.max(
    0,
    tagsToShow.filter(t => !deactivatedTags.some(d => d.toLowerCase().trim() === t.toLowerCase().trim())).length
  );

  return (
    <div className="lg:col-span-12 border-t border-slate-800/60 pt-6">
      <div className="bg-[#090e18]/85 rounded-2xl p-6 border border-slate-800/80 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-cyan-400" />
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                KÜRESEL ETİKET YÖNETİMİ & DEAKTİVASYON MASASI
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                Kütüphanedeki oyunlarda bulunan her etiketi kutu kutu düzenleyin. Pasif etiketler ana sayfadaki aramalardan, listelerden ve oyun kartlarından tamamen gizlenir.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-bold">
              {deactivatedTags.length} Deaktif
            </span>
            <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
              {activeCount} Aktif
            </span>
          </div>
        </div>

        {/* Tags Grid of pills */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2.5">
            {tagsToShow.map((tag) => {
              const isDeactivated = deactivatedTags.some(
                (d) => d.toLowerCase().trim() === tag.toLowerCase().trim()
              );
              
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggleDeactivateTag(tag)}
                  className={`relative px-4 py-2.5 rounded-xl border text-xs font-bold font-sans tracking-wide transition-all duration-300 flex items-center gap-2.5 cursor-pointer group shadow-sm ${
                    isDeactivated
                      // Deactivated state style: red look
                      ? "bg-red-950/20 border-red-500/30 text-red-400 hover:bg-slate-900/40 hover:border-slate-800"
                      // Active state style: emerald/cyan/slate glow
                      : "bg-slate-900/60 border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:border-emerald-500/40 hover:shadow-emerald-500/5 hover:-translate-y-0.5"
                  }`}
                  title={isDeactivated ? `${tag} etiketini aktif etmek için tıklayın` : `${tag} etiketini deaktif etmek için tıklayın`}
                >
                  {isDeactivated ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-red-500 ring-4 ring-red-500/20 shrink-0" />
                      <span className="opacity-60">{tag}</span>
                      <span className="text-[9px] font-mono font-black text-red-500/80 uppercase ml-1 px-1 py-0.25 bg-red-500/10 rounded border border-red-500/20">
                        DEAKTİF
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 shrink-0 animate-pulse" />
                      <span>{tag}</span>
                      <span className="text-[9px] font-mono font-medium text-emerald-400/80 uppercase ml-1 px-1 py-0.25 bg-emerald-500/10 rounded">
                        AKTİF
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
          
          {tagsToShow.length === 0 && (
            <p className="text-xs text-slate-505 font-mono italic">
              Yüklü oyun veya etiket bulunamadı.
            </p>
          )}
          
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 text-slate-400 text-[11px] leading-relaxed font-sans">
            💡 <strong>Seçim Tavsiyesi & Bilgilendirme:</strong> Yukarıdaki kutulardan herhangi birine <strong>tıklayarak</strong> durumunu anında değiştirebilirsiniz. Bir etiketi deaktif ettiğinizde, o etiket kütüphanedeki oyun kartlarından tamamen gizlenir, ana sayfa kategori filtrelerinden çıkartılır ve arama motorlarında bu anahtar kelimeye göre arama yapılması engellenir.
          </div>
        </div>
      </div>
    </div>
  );
}
