import * as React from "react";
import { Gamepad2, Zap } from "lucide-react";
import { GamerProfile } from "../profile/LoginModal";

interface ChatOnlinePlayersProps {
  onlinePlayers: any[];
  gamerProfile: GamerProfile | null;
  handleOpenPrivateDm: (user: any) => void;
}

export default function ChatOnlinePlayers({
  onlinePlayers,
  gamerProfile,
  handleOpenPrivateDm
}: ChatOnlinePlayersProps) {
  const onlineList = onlinePlayers.filter(p => p.isOnline);
  const offlineList = onlinePlayers.filter(p => !p.isOnline);

  return (
    <div className="lg:col-span-3 bg-slate-950/60 p-4 border-l border-slate-900 space-y-5 flex flex-col justify-between">
      
      {/* List of active online teammates */}
      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
        {/* Online section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 pt-1">
            <span className="text-[10px] uppercase font-mono tracking-widest block font-bold text-emerald-400">
              ● AKTİF LOBİ SAKİNLERİ
            </span>
            <span className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              {onlineList.length} AKTİF
            </span>
          </div>

          <div className="space-y-2 font-mono">
            {onlineList.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic pl-1 py-1 font-sans">Şu an aktif sakin bulunmamaktadır.</p>
            ) : (
              onlineList.map((pla, idx) => (
                <button
                  key={`online_${idx}`}
                  type="button"
                  onClick={() => handleOpenPrivateDm(pla)}
                  className="w-full text-left p-2 rounded-xl border bg-slate-900/45 hover:bg-slate-900/95 border-slate-900/40 hover:border-cyan-500/20 flex items-center justify-between group cursor-pointer transition-all duration-300"
                  title={`${pla.name} ile özel sohbet başlat`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Character avatar */}
                    <div className={`p-1.5 rounded-lg text-white font-bold bg-gradient-to-br ${pla.bg || "from-slate-700 to-slate-800"} shrink-0 relative text-[10px]`}>
                      <Gamepad2 className="w-3.5 h-3.5" />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-slate-950 bg-emerald-400" />
                    </div>
                    
                    <div className="min-w-0 font-sans">
                      <div className="text-xs font-bold transition-colors truncate text-slate-300 group-hover:text-cyan-400">
                        {pla.name}
                      </div>
                      <span className="text-[9px] block truncate italic leading-none mt-0.5 text-slate-500">
                        {pla.state || "lobide geziyor"}
                      </span>
                    </div>
                  </div>

                  <span className="text-[8px] p-1 border rounded scale-90 opacity-85 shrink-0 text-slate-400 bg-slate-950 border-slate-900">
                    {pla.badge || "OYUNCU"}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Offline section */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
            <span className="text-[10px] uppercase font-mono tracking-widest block font-bold text-slate-550">
              ○ DEAKTİF LOBİ SAKİNLERİ
            </span>
            <span className="text-[9px] font-mono font-bold bg-slate-900 text-slate-550 border border-slate-800/60 px-1.5 py-0.5 rounded">
              {offlineList.length} DEAKTİF
            </span>
          </div>

          <div className="space-y-2 font-mono">
            {offlineList.length === 0 ? (
              <p className="text-[10px] text-slate-600 italic pl-1 py-1 font-sans">Çevrimdışı sakin bulunmamaktadır.</p>
            ) : (
              offlineList.map((pla, idx) => (
                <button
                  key={`offline_${idx}`}
                  type="button"
                  onClick={() => handleOpenPrivateDm(pla)}
                  className="w-full text-left p-2 rounded-xl border bg-slate-950/20 hover:bg-slate-900/30 border-slate-900/15 hover:border-slate-800 flex items-center justify-between group cursor-pointer transition-all duration-300 opacity-60 hover:opacity-100"
                  title={`${pla.name} ile özel sohbet başlat`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg text-white font-bold bg-gradient-to-br from-slate-800 to-slate-900 grayscale opacity-60 shrink-0 relative text-[10px]">
                      <Gamepad2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ring-2 ring-slate-950 bg-slate-700" />
                    </div>
                    
                    <div className="min-w-0 font-sans">
                      <div className="text-xs font-bold transition-colors truncate text-slate-500 group-hover:text-slate-305">
                        {pla.name}
                      </div>
                      <span className="text-[9px] block truncate italic leading-none mt-0.5 text-slate-600">
                        çevrimdışı / deaktif
                      </span>
                    </div>
                  </div>

                  <span className="text-[8px] p-1 border rounded scale-90 opacity-40 shrink-0 text-slate-600 bg-slate-950/40 border-slate-950">
                    OFFLINE
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Interactive gaming guideline */}
      <div className="p-4 bg-gradient-to-br from-indigo-950/20 to-slate-950 border border-indigo-900/30 rounded-2xl space-y-3 font-sans">
        <div className="flex items-center gap-1.5 text-indigo-400">
          <Zap className="w-4 h-4 shrink-0 animate-pulse" />
          <span className="text-[10px] uppercase font-mono tracking-wider font-bold">HIZLI LOUNGE REHBERİ</span>
        </div>
        
        <p className="text-[10px] text-slate-400 italic leading-relaxed">
          "Bir oyun odası kurarak ekibe arkadaşlarını davet etmek istiyorsan, her zaman sol taraftaki <strong>GRUP İLANI OLUŞTUR</strong> seçeneğini kullanabilirsiniz. İlanınız anında 'Grup Bulma' kanalında yayınlanacaktır!"
        </p>
      </div>
    </div>
  );
}
