import * as React from "react";
import { motion } from "motion/react";
import { MessageSquare, Trash2, Gamepad2 } from "lucide-react";
import { GamerProfile } from "../profile/LoginModal";

function formatText(text: string): React.ReactNode[] {
  if (!text) return [];
  
  const regex = /(~~[\s\S]+?~~|\*\*[\s\S]+?\*\*|\*[\s\S]+?\*|_[\s\S]+?_)/g;
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    if (part.startsWith("~~") && part.endsWith("~~")) {
      return (
        <span key={index} className="line-through opacity-70">
          {formatText(part.slice(2, -2))}
        </span>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-extrabold text-white">
          {formatText(part.slice(2, -2))}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={index} className="italic text-slate-200">
          {formatText(part.slice(1, -1))}
        </em>
      );
    }
    if (part.startsWith("_") && part.endsWith("_")) {
      return (
        <em key={index} className="italic text-slate-200">
          {formatText(part.slice(1, -1))}
        </em>
      );
    }
    return part;
  });
}

function parseMarkdown(text: string): React.ReactNode {
  if (!text) return "";
  
  // Split by triple backtick code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const codeContent = part.slice(3, -3);
      return (
        <pre 
          key={index} 
          className="bg-slate-950/80 border border-slate-800/60 p-3 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre my-2 select-text text-left"
        >
          <code>{codeContent}</code>
        </pre>
      );
    } else {
      return <React.Fragment key={index}>{formatText(part)}</React.Fragment>;
    }
  });
}

interface Message {
  id: string;
  channel: string;
  author: string;
  avatarId: string;
  avatarBg: string;
  text: string;
  date: string;
  isAi?: boolean;
  role?: "ADMIN" | "PRO" | "GUIDE" | "MEMBER" | "BOT";
  imageUrl?: string;
  lfgData?: {
    gameId: number;
    gameTitle: string;
    playersNeeded: number;
    slotsJoined: string[];
    maxSlots: number;
  };
}

interface MessageStreamProps {
  messages: Message[];
  activeChannel: string;
  gamerProfile: GamerProfile | null;
  isDarkMode: boolean;
  handleJoinLfgSlot: (msgId: string) => void;
  activeDms: any[];
  onClearHistory: () => void;
}

export default function MessageStream({
  messages,
  activeChannel,
  gamerProfile,
  isDarkMode,
  handleJoinLfgSlot,
  activeDms,
  onClearHistory
}: MessageStreamProps) {
  const isDm = activeChannel.includes("_dm_") || activeChannel.startsWith("dm_");
  let channelTitle = `#${activeChannel}`;
  let displayDesc = "LİVE STREAM";
  
  if (isDm) {
    const matchedDm = activeDms.find(d => d.channelId === activeChannel);
    channelTitle = matchedDm ? `💬 ÖZEL SOHBET: ${matchedDm.user.name}` : "💬 ÖZEL SOHBET";
    displayDesc = matchedDm?.user.isOnline ? "ÇEVRİMİÇİ" : "ÇEVRİMDIŞI";
  }

  const filteredMessages = messages.filter(m => m.channel === activeChannel);

  const streamContainerRef = React.useRef<HTMLDivElement | null>(null);
  const prevChannelRef = React.useRef<string>(activeChannel);
  const isFirstLoadRef = React.useRef<boolean>(true);

  React.useEffect(() => {
    const container = streamContainerRef.current;
    if (container) {
      if (prevChannelRef.current !== activeChannel || isFirstLoadRef.current) {
        container.scrollTop = container.scrollHeight;
        prevChannelRef.current = activeChannel;
        if (filteredMessages.length > 0) {
          isFirstLoadRef.current = false;
        }
      } else {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth"
        });
      }
    }
  }, [filteredMessages.length, activeChannel]);

  return (
    <div className={`lg:col-span-6 flex flex-col h-[550px] relative transition-all duration-300 ${
      isDarkMode ? "bg-slate-950/40" : "bg-slate-50/40 border-l border-r border-slate-200/80"
    }`}>
      
      {/* Active channel sub header */}
      <div className={`p-3.5 border-b flex items-center justify-between transition-all duration-300 ${
        isDarkMode ? "bg-slate-950/80 border-slate-900/60" : "bg-white border-slate-200"
      }`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${isDm ? "text-pink-400 font-extrabold tracking-wider" : isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
            {channelTitle}
          </span>
          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${isDm ? "bg-pink-500/15 text-pink-400" : isDarkMode ? "bg-slate-900 text-slate-400" : "bg-slate-100 text-slate-600"}`}>
            {displayDesc}
          </span>
        </div>

        <button
          type="button"
          onClick={onClearHistory}
          title="Bu kanal geçmişini temizle"
          className="text-[10px] font-mono text-slate-600 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" /> Tekil Temizle
        </button>
      </div>

      {/* Messages list bucket */}
      <div ref={streamContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-700 animate-bounce" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 font-sans">Burada hiç ileti bulunmuyor.</p>
              <p className="text-[10px] text-slate-600 font-sans max-w-xs">Aşağıdan ilk iletiyi yazarak portal sohbetini canlandırın ya da yeni bir görsel paylaşın!</p>
            </div>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isUser = msg.author === (gamerProfile?.username || "Guest_Gamer");
            
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 items-start ${isUser ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div className={`p-2.5 rounded-xl text-white font-bold bg-gradient-to-br ${msg.avatarBg || "from-slate-700 to-slate-800"} shadow-md relative shrink-0`}>
                  <Gamepad2 className="w-4 h-4" />
                  
                  {/* Status dot */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
                </div>

                {/* Content block */}
                <div className={`space-y-1 max-w-[85%] ${isUser ? "text-right items-end" : "text-left items-start"}`}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[11px] font-extrabold hover:text-cyan-400 transition-colors cursor-pointer ${
                      isDarkMode ? "text-slate-200" : "text-slate-800"
                    }`}>
                      {msg.author}
                    </span>
                    
                    {msg.role && (
                      <span className={`text-[8px] font-black font-mono px-1 py-0.25 rounded tracking-wider ${
                        msg.role === "ADMIN" 
                          ? "bg-red-500/10 border border-red-500/30 text-red-400" 
                          : msg.role === "PRO" 
                          ? "bg-indigo-500/15 border border-indigo-400/20 text-indigo-300" 
                          : msg.role === "GUIDE" 
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                          : msg.role === "BOT"
                          ? "bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold"
                          : "bg-slate-900 border border-slate-800 text-slate-500"
                      }`}>
                        {msg.role}
                      </span>
                    )}

                    <span className="text-[9px] text-slate-500 font-mono">
                      {msg.date}
                    </span>
                  </div>

                  {/* Rendering main bubble text */}
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed font-sans relative ${
                    isUser
                      ? isDarkMode
                        ? "bg-gradient-to-br from-indigo-900/60 to-slate-900 text-slate-100 rounded-tr-none border border-indigo-800/20"
                        : "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-tr-none border border-indigo-400/20 shadow-md"
                      : msg.isAi
                      ? isDarkMode
                        ? "bg-slate-900 border border-purple-500/20 shadow-lg shadow-purple-950/20 rounded-tl-none text-purple-200"
                        : "bg-purple-50 border border-purple-200 text-purple-950 rounded-tl-none"
                      : isDarkMode
                      ? "bg-slate-900/90 text-slate-300 rounded-tl-none border border-slate-800"
                      : "bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-sm"
                  }`}>
                    
                    <div className="whitespace-pre-wrap select-text space-y-1">
                      {parseMarkdown(msg.text)}
                    </div>

                    {/* Render inline image url previews */}
                    {(() => {
                      const imageRegex = /(https?:\/\/[^\s]+?\.(?:png|jpg|jpeg|gif|webp)(?:\?[^\s]*)?)/gi;
                      const imageMatches = msg.text.match(imageRegex);
                      if (!imageMatches) return null;
                      return (
                        <div className="mt-2.5 flex flex-wrap gap-2 justify-start">
                          {imageMatches.map((url, idx) => (
                            <a 
                              key={idx} 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-block outline-none overflow-hidden rounded-xl border border-slate-800/40 bg-slate-950/20 hover:border-cyan-500/30 transition-colors max-w-sm"
                            >
                              <img 
                                src={url} 
                                alt="Shared image preview" 
                                referrerPolicy="no-referrer"
                                className="max-w-full max-h-[220px] object-cover rounded-xl hover:opacity-95 transition-opacity"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            </a>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Render custom base64 user image payload if present */}
                    {msg.imageUrl && (
                      <div className="mt-2 outline-none overflow-hidden rounded-lg">
                        <img 
                          src={msg.imageUrl} 
                          alt="Shared portal asset" 
                          referrerPolicy="no-referrer"
                          className={`max-w-full max-h-[300px] object-cover rounded-lg border cursor-pointer hover:opacity-95 transition-opacity ${
                            isDarkMode ? "border-slate-800" : "border-slate-200"
                          }`}
                        />
                      </div>
                    )}

                    {/* Render LFG group Card nested if present */}
                    {msg.lfgData && (
                      <div className={`mt-3 border rounded-xl p-3 space-y-3 shadow-inner ${
                        isDarkMode ? "bg-slate-950/90 border-slate-800" : "bg-slate-50 border-slate-200"
                      }`}>
                        <div className={`flex items-center justify-between border-b pb-2 ${
                          isDarkMode ? "border-slate-900" : "border-slate-200"
                        }`}>
                          <div className="flex items-center gap-1.5">
                            <Gamepad2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
                            <span className={`text-[10px] font-black uppercase tracking-wider ${
                              isDarkMode ? "text-white" : "text-slate-800"
                            }`}>
                              {msg.lfgData.gameTitle} Lobisi
                            </span>
                          </div>
                          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            msg.lfgData.slotsJoined.length >= msg.lfgData.playersNeeded
                              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                              : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                          }`}>
                            {msg.lfgData.slotsJoined.length >= msg.lfgData.playersNeeded ? "DOLDU" : "AKTİF SIRADA"}
                          </span>
                        </div>

                        {/* Slots row indicators */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-mono text-slate-500 block uppercase">KATILAN FEDAİLER:</span>
                          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                            {/* Host slot (always occupies slot 0) */}
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded border ${
                              isDarkMode 
                                ? "bg-indigo-950/30 border-indigo-900/30 text-indigo-300"
                                : "bg-indigo-50 border-indigo-100 text-indigo-700"
                            }`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                              <span className="truncate font-semibold">{msg.author} (Ev Sahibi)</span>
                            </div>
                            
                            {/* Dynamic occupied slots */}
                            {msg.lfgData.slotsJoined.map((name, sIdx) => (
                              <div key={sIdx} className={`flex items-center gap-1.5 px-2 py-1 rounded border ${
                                isDarkMode 
                                  ? "bg-slate-900 border-slate-850 text-slate-200" 
                                  : "bg-white border-slate-200 text-slate-700 shadow-sm"
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span className="truncate">{name}</span>
                              </div>
                            ))}

                            {/* Clean empty slots list */}
                            {Array.from({ length: msg.lfgData.playersNeeded - msg.lfgData.slotsJoined.length }).map((_, emptyIdx) => (
                              <div key={emptyIdx} className={`flex items-center gap-1.5 px-2 py-1 border rounded border-dashed ${
                                isDarkMode 
                                  ? "bg-slate-950 border-slate-900/80 text-slate-650" 
                                  : "bg-slate-100/50 border-slate-200 text-slate-400"
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400/30" />
                                <span className="italic">Slot Bekliyor...</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action join button */}
                        {msg.author !== (gamerProfile?.username || "Guest_Gamer") && (
                          <button
                            type="button"
                            onClick={() => handleJoinLfgSlot(msg.id)}
                            className={`w-full py-1.5 px-2 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              msg.lfgData.slotsJoined.includes(gamerProfile?.username || "Guest_Gamer")
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                                : "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                            }`}
                          >
                            {msg.lfgData.slotsJoined.includes(gamerProfile?.username || "Guest_Gamer") ? (
                              <>LOBİDEN AYRIL</>
                            ) : (
                              <>LOBİYE DAHiL OL</>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
