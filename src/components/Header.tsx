import { Search, Gamepad2, Users, HardDrive, Calendar, Cpu, Award, Settings, LogOut, MessageSquare } from "lucide-react";
import { motion } from "motion/react";
import { GamerProfile, AVATAR_PRESETS } from "./LoginModal";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTag: string;
  setSelectedTag: (tag: string) => void;
  activeTab: "library" | "planner" | "admin" | "chat";
  setActiveTab: (tab: "library" | "planner" | "admin" | "chat") => void;
  availableTags: string[];
  totalGamesCount: number;
  gamerProfile: GamerProfile | null;
  onResetProfile: () => void;
}

export default function Header({
  searchQuery,
  setSearchQuery,
  selectedTag,
  setSelectedTag,
  activeTab,
  setActiveTab,
  availableTags,
  totalGamesCount,
  gamerProfile,
  onResetProfile
}: HeaderProps) {
  return (
    <header className="relative w-full border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl pb-4 pt-6 px-4 md:px-8 z-30">
      {/* Decorative Top Highlight Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 shadow-lg shadow-cyan-500/50" />

      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Upper Brand Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div 
              className="p-2.5 bg-gradient-to-br from-violet-600 to-pink-500 rounded-xl shadow-lg ring-2 ring-purple-400/20"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <Gamepad2 className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 font-sans">
                  WEST<span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">PORTAL</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest text-cyan-400 border border-cyan-400/30 rounded bg-cyan-950/40">
                  FRIENDS ONLY
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                // ÇEVRİMİÇİ OYNA VE CO-OP DESTEKLİ DİNAMİK ARŞİV PORTALI
              </p>
            </div>
          </div>

          {/* Right Header Corner: Game Stats + Welcome Card */}
          <div className="flex flex-col items-center md:items-end gap-2.5 shrink-0 w-full md:w-auto">
            {/* Quick Realtime Stats Summary Panel */}
            <div className="flex items-center gap-4 bg-slate-900/40 border border-slate-900 px-3 py-1.5 rounded-xl font-mono text-[11px] text-slate-300 w-full md:w-auto justify-center md:justify-end">
              <div className="flex items-center gap-1.5 pr-4 border-r border-slate-800/80">
                <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400 font-bold">Toplam Oyun: <strong className="text-white font-sans">{totalGamesCount}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-slate-400 font-bold">Co-op Destekli: <strong className="text-white font-sans">{Math.max(1, totalGamesCount)}</strong></span>
              </div>
            </div>

            {/* Gamer Profile Welcome row */}
            {gamerProfile && (
              <div className="flex items-center gap-3 bg-gradient-to-r from-[#0d1527] to-[#0c111e] border border-slate-800/80 pl-4 pr-3 py-2 rounded-2xl shadow-2xl hover:border-cyan-500/40 transition-all duration-300 group">
                <div className="text-right">
                  <div className="text-[9px] uppercase font-mono tracking-widest text-slate-500 font-black">// SISTEM GİRİŞİ</div>
                  <div className="text-xs font-bold text-slate-200 flex items-center justify-end gap-1">
                    Hoş geldin, <span className="text-cyan-400 font-black drop-shadow-[0_0_8px_rgba(34,211,238,0.25)]">{gamerProfile.username}</span>
                  </div>
                </div>
                
                {/* Dynamic Avatar Render */}
                {(() => {
                  const avatar = AVATAR_PRESETS.find(p => p.id === gamerProfile.avatarId) || AVATAR_PRESETS[0];
                  const Icon = avatar.Icon;
                  return (
                    <button 
                      onClick={onResetProfile}
                      title="Profili Sıfırla & Değiştir" 
                      className={`p-2.5 rounded-xl bg-gradient-to-br ${avatar.bg} cursor-pointer hover:scale-105 active:scale-95 transition-all text-white relative flex items-center justify-center border border-white/20`}
                    >
                      <Icon className="w-4 h-4" />
                      <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-rose-600 border border-rose-400 text-white rounded-full p-0.5 transition-all duration-300">
                        <LogOut className="w-2.5 h-2.5 stroke-[2.5px]" />
                      </div>
                    </button>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Global Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800/30 pb-2">
          <button
            id="tab_library_btn"
            onClick={() => setActiveTab("library")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 relative ${
              activeTab === "library"
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900/50"
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            Oyun Mağazası & Kütüphane
            {activeTab === "library" && (
              <motion.div
                layoutId="activeTabGlow"
                className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-cyan-400"
              />
            )}
          </button>
          
          <button
            id="tab_planner_btn"
            onClick={() => setActiveTab("planner")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 relative ${
              activeTab === "planner"
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900/50"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Oyun Gecesi Planlayıcı
            {activeTab === "planner" && (
              <motion.div
                layoutId="activeTabGlow"
                className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-cyan-400"
              />
            )}
          </button>

          <button
            id="tab_chat_btn"
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 relative ${
              activeTab === "chat"
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900/50"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-pink-400 animate-pulse" />
            Lobi Sohbet Odası
            {activeTab === "chat" && (
              <motion.div
                layoutId="activeTabGlow"
                className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-pink-400"
              />
            )}
          </button>

          <button
            id="tab_admin_btn"
            onClick={() => setActiveTab("admin")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 relative ${
              activeTab === "admin"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            <Settings className="w-4 h-4 text-emerald-400" />
            Yönetici Paneli
            {activeTab === "admin" && (
              <motion.div
                layoutId="activeTabGlow"
                className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-emerald-400"
              />
            )}
          </button>
        </div>

        {/* Filter Bar Controls - Shows only in main Library tab */}
        {activeTab === "library" && (
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/40">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="game_search_input"
                type="text"
                placeholder={`${totalGamesCount} muhteşem oyun arasından ara...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/70 text-slate-100 placeholder-slate-500 pl-10 pr-4 py-2 rounded-xl text-sm border border-slate-800/80 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 transition-all font-sans font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
                >
                  Temizle
                </button>
              )}
            </div>

            {/* Quick Filter Categories scrolling tags */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1 shrink-0">
                <Award className="w-3.5 h-3.5 text-purple-400" /> Kategori:
              </span>
              <button
                id="filter_all"
                onClick={() => setSelectedTag("All")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  selectedTag === "All"
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/5"
                    : "bg-slate-950/40 text-slate-400 border border-slate-800/40 hover:text-white"
                }`}
              >
                Tümü
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  id={`filter_${tag.replace(/\s+/g, '_')}`}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    selectedTag === tag
                      ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-sm shadow-cyan-500/10"
                      : "bg-slate-950/40 text-slate-400 border border-slate-800/40 hover:text-white hover:border-slate-700/60"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
