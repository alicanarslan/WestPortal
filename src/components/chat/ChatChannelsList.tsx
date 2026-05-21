import * as React from "react";
import { Hash, Sparkles, Mic, Volume2, MessageSquare } from "lucide-react";
import { PRESET_VOICE_CHANNELS } from "../layout/GamerVoiceChat";

interface ChatChannelsListProps {
  activeChannel: string;
  setActiveChannel: (ch: string) => void;
  activeVoiceChannelId: string | null;
  handleJoinVoiceChannel: (channelId: string | null) => void;
  activeDms: any[];
  onlinePlayers: any[];
  isDarkMode: boolean;
  isVoiceMuted: boolean;
  onToggleVoiceMute: () => void;
}

export default function ChatChannelsList({
  activeChannel,
  setActiveChannel,
  activeVoiceChannelId,
  handleJoinVoiceChannel,
  activeDms,
  onlinePlayers,
  isDarkMode,
  isVoiceMuted,
  onToggleVoiceMute
}: ChatChannelsListProps) {
  return (
    <div className={`lg:col-span-3 border-r p-4 space-y-5 transition-all duration-300 ${
      isDarkMode ? "bg-slate-950/90 border-slate-900" : "bg-slate-50/50 border-slate-200"
    }`}>
      <div>
        <span className={`text-[10px] uppercase font-black font-mono tracking-widest block mb-2 ${
          isDarkMode ? "text-slate-500" : "text-slate-400"
        }`}>KANALLAR</span>
        <div className="space-y-1.5 font-mono">
          {[
            { id: "genel-lobi", name: "Genel Lobi", icon: Hash, desc: "Grup muhabbeti ve dedikodular" },
            { id: "grup-bulma", name: "Grup Bulma (LFG)", icon: Sparkles, desc: "Takım arkadaşı bulma ilanları" }
          ].map((channel) => {
            const isSelected = activeChannel === channel.id;
            const IconComp = channel.id === "grup-bulma" ? Sparkles : Hash;
            
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => setActiveChannel(channel.id)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 cursor-pointer group relative overflow-hidden ${
                  isSelected 
                    ? isDarkMode 
                      ? "bg-slate-900 text-white border-l-4 border-cyan-400"
                      : "bg-slate-200 text-slate-900 border-l-4 border-cyan-500 font-bold"
                    : isDarkMode
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/50"
                }`}
              >
                <IconComp className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isSelected ? "text-cyan-400" : "text-slate-505"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold leading-none truncate flex items-center gap-1.5">
                    {channel.name}
                  </div>
                  <span className={`text-[10px] font-sans mt-0.5 block truncate group-hover:text-slate-300 transition-colors ${
                    isDarkMode ? "text-slate-500" : "text-slate-500"
                  }`}>
                    {channel.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice Channels list */}
      <div className="pt-2 border-t border-slate-900 font-mono">
        <span className="text-[10px] uppercase font-black text-slate-505 font-mono tracking-widest block mb-2 flex items-center gap-1.5 leading-none">
          <Mic className="w-3.5 h-3.5 text-cyan-400" strokeWidth={2.5} /> SES ODALARI (LIVE)
        </span>
        <div className="space-y-2">
          {PRESET_VOICE_CHANNELS.map((channel) => {
            const isSelected = activeVoiceChannelId === channel.id;
            const occupantsList = onlinePlayers.filter(p => p.activeVoiceChannel === channel.id);
            const occupantsCount = occupantsList.length;
            
            if (isSelected || occupantsCount > 0) {
              return (
                <div
                  key={channel.id}
                  className={`p-3.5 rounded-xl border transition-all duration-300 space-y-3 relative overflow-hidden ${
                    isSelected
                      ? isDarkMode
                        ? "bg-cyan-500/10 border-cyan-400/80 text-cyan-400"
                        : "bg-cyan-50 border-cyan-500 text-cyan-900 font-medium"
                      : isDarkMode
                      ? "bg-slate-900/60 border-slate-800/80 text-slate-300"
                      : "bg-slate-100 border-slate-200 text-slate-800 shadow-sm"
                  }`}
                >
                  {/* Channel Header (clickable to Join if not selected) */}
                  <div 
                    onClick={() => {
                      if (!isSelected) {
                        handleJoinVoiceChannel(channel.id);
                      }
                    }}
                    className={`flex items-center justify-between ${!isSelected ? "cursor-pointer hover:opacity-80" : ""}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Volume2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-cyan-400 animate-pulse" : "text-slate-500"}`} />
                      <span className="text-xs font-black truncate">{channel.name}</span>
                    </div>
                    {isSelected ? (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-black animate-pulse uppercase tracking-wider">
                        BAĞLI
                      </span>
                    ) : (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold uppercase tracking-wider">
                        KATIL
                      </span>
                    )}
                  </div>

                  {/* Occupants list */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-500 block uppercase">
                      ODADAKİLER ({occupantsCount})
                    </span>
                    <div className="space-y-1">
                      {occupantsList.map((occ, occIdx) => {
                        const isOccupantMuted = occ.isMuted ?? false;
                        return (
                          <div 
                            key={occIdx}
                            className={`flex items-center justify-between p-1.5 rounded-lg border text-[10px] ${
                              isDarkMode 
                                ? "bg-slate-950/70 border-slate-900/60 text-slate-300" 
                                : "bg-white border-slate-200 text-slate-700 shadow-sm"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-4 h-4 rounded text-white font-bold bg-gradient-to-br ${occ.bg || "from-slate-700 to-slate-800"} flex items-center justify-center text-[8px] shrink-0 uppercase`}>
                                {occ.name.substring(0, 1)}
                              </div>
                              <span className="truncate font-semibold">{occ.name}</span>
                            </div>
                            
                            {isOccupantMuted ? (
                              <span className="text-[8px] font-bold text-rose-400 bg-rose-500/10 px-1 py-0.25 rounded border border-rose-500/20 scale-90">
                                Sessiz
                              </span>
                            ) : (
                              <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.25 rounded border border-emerald-500/20 scale-90">
                                Konuşuyor
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions inside card for selected room */}
                  {isSelected && (
                    <div className="flex gap-2 pt-2 border-t border-slate-800/40">
                      <button
                        type="button"
                        onClick={onToggleVoiceMute}
                        className={`flex-1 py-1 px-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                          isVoiceMuted
                            ? "bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/25"
                            : isDarkMode
                            ? "bg-slate-950 border-slate-850 text-slate-400 hover:text-white"
                            : "bg-white border-slate-200 text-slate-750 hover:bg-slate-100"
                        }`}
                      >
                        {isVoiceMuted ? "Sesi Aç" : "Sessiz"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleJoinVoiceChannel(null)}
                        className={`flex-1 py-1 px-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                          isDarkMode
                            ? "bg-slate-950 border-slate-850 hover:bg-rose-500/15 hover:border-rose-500/30 text-slate-500 hover:text-rose-400"
                            : "bg-white border-slate-200 hover:bg-rose-500/10 text-slate-750 hover:text-rose-600"
                        }`}
                      >
                        Ayrıl
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => handleJoinVoiceChannel(channel.id)}
                className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer group relative overflow-hidden ${
                  isDarkMode
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                    : "text-slate-650 hover:text-slate-800 hover:bg-slate-200/50"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 font-sans">
                  <Volume2 className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span className="text-xs font-bold truncate">{channel.name}</span>
                </div>
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-600">
                  BOŞ
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DMs list */}
      <div className={`pt-2 border-t ${
        isDarkMode ? "border-slate-900" : "border-slate-200"
      }`}>
        <span className={`text-[10px] uppercase font-black font-mono tracking-widest block mb-2 flex items-center gap-1.5 leading-none ${
          isDarkMode ? "text-slate-500" : "text-slate-400"
        }`}>
          <MessageSquare className="w-3.5 h-3.5 text-pink-500" /> ÖZEL SOHBETLER (DM)
        </span>
        {activeDms.length === 0 ? (
          <span className={`text-[10px] block px-2 py-1.5 italic font-sans leading-normal ${
            isDarkMode ? "text-slate-600" : "text-slate-400"
          }`}>
            Bir oyuncuyla özel konuşmak için sağdaki listeden ismine tıklayarak DM başlatabilirsiniz.
          </span>
        ) : (
          <div className="space-y-1.5 font-mono">
            {activeDms.map((dm) => {
              const isSelected = activeChannel === dm.channelId;
              return (
                <button
                  key={dm.channelId}
                  type="button"
                  onClick={() => setActiveChannel(dm.channelId)}
                  className={`w-full text-left p-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer group relative ${
                    isSelected 
                      ? isDarkMode
                        ? "bg-pink-500/10 text-white border-l-4 border-pink-500 font-bold"
                        : "bg-pink-500/10 text-pink-900 border-l-4 border-pink-500 font-bold"
                      : isDarkMode
                      ? "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${dm.user.isOnline ? "bg-emerald-400" : "bg-slate-400"}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold truncate flex items-center justify-between ${
                      isDarkMode ? "text-slate-300" : "text-slate-800"
                    }`}>
                      <span className="truncate pr-1">{dm.user.name}</span>
                      <span className={`text-[8px] px-1 rounded transform scale-90 shrink-0 ${
                        dm.user.isOnline 
                          ? "bg-emerald-500/10 text-emerald-400" 
                          : isDarkMode 
                          ? "bg-slate-900 text-slate-500" 
                          : "bg-slate-100 text-slate-400"
                      }`}>
                        {dm.user.isOnline ? "ON" : "OFF"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
