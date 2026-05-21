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
}

export default function ChatChannelsList({
  activeChannel,
  setActiveChannel,
  activeVoiceChannelId,
  handleJoinVoiceChannel,
  activeDms,
  onlinePlayers,
  isDarkMode
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
        <div className="space-y-1.5">
          {PRESET_VOICE_CHANNELS.map((channel) => {
            const isSelected = activeVoiceChannelId === channel.id;
            const occupantsList = onlinePlayers.filter(p => p.activeVoiceChannel === channel.id);
            const occupantsCount = occupantsList.length;
            
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => handleJoinVoiceChannel(isSelected ? null : channel.id)}
                className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer group relative overflow-hidden ${
                  isSelected 
                    ? "bg-cyan-500/10 border-l-4 border-cyan-400 text-cyan-400 font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 font-sans">
                    <Volume2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-cyan-400 animate-pulse" : "text-slate-500"}`} />
                    <span className="text-xs font-bold truncate">{channel.name}</span>
                  </div>
                  
                  {/* Sub-list of people in this room */}
                  {occupantsCount > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 pl-6 font-mono">
                      {occupantsList.map((occ, occIdx) => (
                        <span 
                          key={occIdx} 
                          className="text-[9px] px-1.5 py-0.5 bg-[#05060a] text-slate-400 rounded-md border border-slate-900 flex items-center gap-1 shrink-0"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {occ.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <span className={`text-[8px] px-1.5 py-0.5 rounded ${
                  occupantsCount > 0 
                    ? "bg-cyan-500/15 text-cyan-400 animate-pulse font-black" 
                    : "bg-slate-900 text-slate-600"
                }`}>
                  {occupantsCount} BAĞLI
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
