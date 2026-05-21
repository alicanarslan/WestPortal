import * as React from "react";
import { useState } from "react";
import { GamerProfile } from "../profile/LoginModal";
import { GameNightEvent } from "../../types";
import { MessageSquare, Send } from "lucide-react";

export interface LobbyStrategyChatProps {
  eventId: string;
  comments?: GameNightEvent["comments"];
  gamerProfile: GamerProfile | null;
  onAddComment: (eventId: string, author: string, text: string) => void;
  isDarkMode?: boolean;
}

export default function LobbyStrategyChat({
  eventId,
  comments = [],
  gamerProfile,
  onAddComment,
  isDarkMode = true
}: LobbyStrategyChatProps) {
  const [commentText, setCommentText] = useState("");

  const handleAddCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const author = gamerProfile?.username || "Ziyaretçi_Oyuncu";
    onAddComment(eventId, author, commentText.trim());
    setCommentText("");
  };

  return (
    <div className={`border-t p-4 space-y-4 font-sans ${
      isDarkMode ? "bg-[#080c14] border-slate-900" : "bg-slate-50/80 border-slate-200"
    }`}>
      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5 block font-bold">
        <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
        LOBİ KOORDİNASYON & STRATEJİ SOHBETİ ({comments.length})
      </span>

      {/* Chat Messages */}
      {comments.length > 0 ? (
        <div className="max-h-44 overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar">
          {comments.map(c => (
            <div key={c.id} className={`p-2.5 rounded-xl border text-xs flex flex-col gap-1 ${
              isDarkMode ? "bg-slate-950/50 border-slate-900 text-slate-300" : "bg-white border-slate-200 text-slate-705 shadow-sm"
            }`}>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="font-bold text-cyan-400">{c.author}</span>
                <span className="text-slate-500">{c.date}</span>
              </div>
              <p className={`font-sans leading-normal whitespace-pre-wrap ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{c.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10.5px] text-slate-500 italic pl-1">
          Henüz lobiye bir mesaj bırakılmadı. DLC gereksinimi veya ekip koordinasyonu hakkında ilk notu yazarak danış!
        </p>
      )}

      {/* Chat Input form */}
      <form onSubmit={handleAddCommentSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder={gamerProfile ? `${gamerProfile.username} olarak mesaj bırak...` : "Mesajınızı yazın..."}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          required
          className={`py-2 px-3.5 rounded-xl border text-xs focus:outline-none flex-1 font-sans font-normal ${
            isDarkMode 
              ? "bg-slate-900 border-slate-800 text-slate-200 focus:border-purple-500" 
              : "bg-white border-slate-250 text-slate-805 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/25"
          }`}
        />
        <button
          type="submit"
          className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center cursor-pointer transition-colors shrink-0 border-0 shadow-md shadow-purple-500/10"
          title="Mesaj Gönder"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
