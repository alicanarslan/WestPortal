import * as React from "react";
import { Image as ImageIcon, Smile, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ChatInputProps {
  textInput: string;
  setTextInput: (v: string) => void;
  attachedImage: string | null;
  setAttachedImage: (v: string | null) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (v: boolean) => void;
  handleSendMessage: (text: string) => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activeChannel: string;
  activeDms: any[];
  isDarkMode: boolean;
}

const QUICK_EMOJIS = ["🎮", "🔥", "👑", "🚀", "💀", "😂", "👍", "😮", "🛡️", "👽", "💩", "GG"];

export default function ChatInput({
  textInput,
  setTextInput,
  attachedImage,
  setAttachedImage,
  showEmojiPicker,
  setShowEmojiPicker,
  handleSendMessage,
  handleImageChange,
  activeChannel,
  activeDms,
  isDarkMode
}: ChatInputProps) {
  const isDmChannel = activeChannel.includes("_dm_") || activeChannel.startsWith("dm_");
  const matchedDm = isDmChannel ? activeDms.find(d => d.channelId === activeChannel) : null;
  
  const placeholderText = isDmChannel
    ? `${matchedDm ? matchedDm.user.name : "Oyuncu"} ile doğrudan yazış...`
    : `Sohbet odasına yazın (#${activeChannel})...`;

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const MAX_DIM = 800;

            if (width > MAX_DIM || height > MAX_DIM) {
              if (width > height) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              } else {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
              setAttachedImage(dataUrl);
            }
          };
          if (event.target?.result) {
            img.src = event.target.result as string;
          }
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  return (
    <div className="flex flex-col relative w-full">
      {/* Image attachment preview */}
      {attachedImage && (
        <div className={`p-2.5 px-4 border-t flex items-center justify-between gap-4 transition-all duration-300 ${
          isDarkMode ? "bg-slate-950/90 border-slate-900 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <img src={attachedImage} className="w-9 h-9 object-cover rounded border border-slate-805 shrink-0" />
            <span className="text-[10px] font-mono truncate text-cyan-600 font-bold">// gorsel_eklendi.jpg</span>
          </div>
          <button
            type="button"
            onClick={() => setAttachedImage(null)}
            className="p-1 hover:bg-rose-500/10 text-rose-500 rounded-md transition-all cursor-pointer"
            title="Görseli Kaldır"
          >
            <X className="w-4 h-4" strokeWidth={3} />
          </button>
        </div>
      )}

      {/* Bottom input editor box */}
      <div className={`p-3 border-t transition-all duration-300 ${
        isDarkMode ? "bg-[#090e18] border-slate-900" : "bg-white border-slate-200"
      }`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(textInput);
          }}
          className="flex items-center gap-2 relative"
        >
          {/* Image attachment uploader */}
          <div>
            <input
              type="file"
              id="chat-image-file-input"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <button
              type="button"
              onClick={() => document.getElementById("chat-image-file-input")?.click()}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                isDarkMode 
                  ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850" 
                  : "bg-slate-100 border-slate-200 text-slate-650 hover:bg-slate-200 hover:text-slate-900"
              }`}
              title="Resim Ekle"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Toggleable Emoji select */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                isDarkMode 
                  ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800" 
                  : "bg-slate-100 border-slate-200 text-slate-605 hover:bg-slate-200 hover:text-slate-900"
              }`}
              title="Emoji Ekle"
            >
              <Smile className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute bottom-12 left-0 z-30 p-2.5 rounded-xl shadow-xl border w-[205px] grid grid-cols-4 gap-1.5 ${
                    isDarkMode ? "bg-[#05060a] border-slate-800" : "bg-white border-slate-200"
                  }`}
                >
                  {QUICK_EMOJIS.map((emo) => (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => {
                        setTextInput(textInput + emo);
                        setShowEmojiPicker(false);
                      }}
                      className={`p-2 rounded-lg text-sm transition-all text-center cursor-pointer ${
                        isDarkMode ? "hover:bg-slate-900 text-slate-205" : "hover:bg-slate-100 text-slate-800"
                      }`}
                    >
                      {emo}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onPaste={handlePaste}
            placeholder={placeholderText}
            className={`flex-1 text-xs p-3 rounded-xl border focus:outline-none focus:ring-1 transition-all font-sans ${
              isDarkMode 
                ? "bg-slate-900/90 text-slate-100 placeholder-slate-600 border-slate-805 focus:border-cyan-400 focus:ring-cyan-500/25" 
                : "bg-slate-50 text-slate-900 placeholder-slate-400 border-slate-200 focus:border-cyan-500/20"
            }`}
          />

          <button
            type="submit"
            disabled={!textInput.trim() && !attachedImage}
            className="p-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-lg shrink-0 flex items-center justify-center font-mono"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
