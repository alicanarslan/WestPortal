import * as React from "react";
import { Game } from "../../../gamesData";
import { Gamepad2, ShieldAlert, RefreshCw, Link2 } from "lucide-react";

interface GamesListTableProps {
  games: Game[];
  onLoadDefaults: () => void;
  onStartEdit: (g: Game) => void;
  onDeleteGame: (id: number) => void;
}

export default function GamesListTable({
  games,
  onLoadDefaults,
  onStartEdit,
  onDeleteGame
}: GamesListTableProps) {
  return (
    <div className="lg:col-span-12 border-t border-slate-800/60 pt-6">
      <div className="bg-[#090e18]/80 rounded-2xl p-6 border border-slate-800/80 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-indigo-400" />
            <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono">
              Şu Anda Kütüphanede Kayıtlı Tüm Oyunlar ({games.length})
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            // Düzenlemek için yanlarındaki kontrolleri kullanın
          </span>
        </div>

        {games.length === 0 ? (
          <div className="text-center py-12 p-4 bg-slate-950/40 rounded-xl border border-slate-900/40">
            <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-bold">Kütüphanede kayıtlı hiç oyun bulunmuyor!</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
              Ana sayfa tertemiz durumda. Yukarıdaki sorgu alanına bir AppID girip bilgileri çekerek ilk oyunu siz ekleyin ya da "Hazır Şablonu Yükle" diyerek örnek küreyi anında geri getirin.
            </p>
            <button
              type="button"
              onClick={onLoadDefaults}
              className="mt-4 inline-flex items-center gap-1.5 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-sans text-xs uppercase cursor-pointer transition-all shadow-md shadow-indigo-500/15 border border-indigo-400/20 hover:scale-102 hover:brightness-110 active:scale-98"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Hazır Şablonu Yükle
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-500 text-[10px] uppercase">
                  <th className="py-2.5 px-2">Kapak</th>
                  <th className="py-2.5 px-2">AppID / Tanım</th>
                  <th className="py-2.5 px-2">Oyun Adı</th>
                  <th className="py-2.5 px-2">Boyut</th>
                  <th className="py-2.5 px-2">Online-Fix Linki</th>
                  <th className="py-2.5 px-2 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-300">
                {games.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-3 px-2">
                      <img
                        src={g.imageUrl}
                        alt=""
                        className="w-12 h-6 object-cover rounded bg-slate-900 border border-slate-800"
                        referrerPolicy="no-referrer"
                      />
                    </td>
                    <td className="py-3 px-2 text-slate-505 text-[10px]">
                      {g.id}
                    </td>
                    <td className="py-3 px-2 font-bold text-white max-w-[150px] truncate">
                      {g.title}
                    </td>
                    <td className="py-3 px-2 text-[11px]">
                      {g.size}
                    </td>
                    <td className="py-3 px-2 max-w-[200px] truncate font-mono text-[10px] text-emerald-400">
                      {g.steamripUrl ? (
                        <a
                          href={g.steamripUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-1.5"
                        >
                          <Link2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          {g.steamripUrl.slice(0, 32)}...
                        </a>
                      ) : (
                        <span className="text-slate-500 italic">Link yok</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onStartEdit(g)}
                          className="p-1 px-2.5 rounded bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 hover:text-cyan-300 transition-all font-bold text-[10px] uppercase cursor-pointer"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteGame(g.id)}
                          className="p-1 px-2.5 rounded bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 hover:text-red-300 transition-all font-bold text-[10px] uppercase cursor-pointer"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
