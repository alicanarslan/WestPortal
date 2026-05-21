import React, { useRef } from "react";
import { Search, Gamepad2, Users, HardDrive, Calendar, Cpu, Award, Settings, LogOut, MessageSquare, ChevronLeft, ChevronRight, Sun, Moon } from "lucide-react";
import { motion } from "motion/react";
import { GamerProfile, AVATAR_PRESETS } from "../profile/LoginModal";

interface HeaderProps {
  activeTab: "library" | "planner" | "admin" | "chat";
  setActiveTab: (tab: "library" | "planner" | "admin" | "chat") => void;
  totalGamesCount: number;
  gamerProfile: GamerProfile | null;
  onResetProfile: () => void;
  onOpenProfile: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  unreadCount?: number;
}

export default function Header({
  activeTab,
  setActiveTab,
  totalGamesCount,
  gamerProfile,
  onResetProfile,
  onOpenProfile,
  isDarkMode = true,
  onToggleDarkMode,
  unreadCount = 0
}: HeaderProps) {

  return (
    <header className={`relative w-full border-b transition-all duration-300 pb-4 pt-6 px-4 md:px-8 z-30 ${
      isDarkMode 
        ? "border-slate-800/80 bg-slate-950/60 text-slate-100 backdrop-blur-xl" 
        : "border-slate-200 bg-white/90 text-slate-900 shadow-sm backdrop-blur-xl"
    }`}>
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
                <span className={`text-2xl font-black tracking-wider font-sans bg-clip-text ${
                  isDarkMode 
                    ? "text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400" 
                    : "text-slate-900"
                }`}>
                  WEST<span className="text-cyan-500 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">PORTAL</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest text-cyan-500 border border-cyan-500/30 rounded bg-cyan-500/10">
                  FRIENDS ONLY
                </span>
              </div>
              <p className={`text-xs font-mono mt-0.5 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                ÇEVRİMİÇİ OYNA VE CO-OP DESTEKLİ DİNAMİK ARŞİV PORTALI
              </p>
            </div>
          </div>

          {/* Right Header Corner: Game Stats + Welcome Card + Theme Toggle */}
          <div className="flex flex-col sm:flex-row md:flex-col items-center sm:items-stretch md:items-end gap-3 shrink-0 w-full md:w-auto">
            
            <div className="flex items-center gap-2 w-full sm:w-auto md:justify-end">
              {/* Theme Toggle Button */}
              {onToggleDarkMode && (
                <button
                  onClick={onToggleDarkMode}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                    isDarkMode 
                      ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800"
                      : "bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200 shadow-sm"
                  }`}
                  title={isDarkMode ? "Açık Tema" : "Koyu Tema"}
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}

              {/* Quick Realtime Stats Summary Panel */}
              <div className={`flex items-center gap-4 border px-3 py-2 rounded-xl font-mono text-[11px] flex-1 sm:flex-initial justify-center sm:justify-end ${
                isDarkMode 
                  ? "bg-slate-900/40 border-slate-900 text-slate-300" 
                  : "bg-slate-100 border-slate-200 text-slate-705 shadow-sm"
              }`}>
                <div className={`flex items-center gap-1.5 pr-4 border-r ${isDarkMode ? "border-slate-800/80" : "border-slate-250"}`}>
                  <Gamepad2 className="w-3.5 h-3.5 text-cyan-500" />
                  <span className={`${isDarkMode ? "text-slate-400" : "text-slate-600"} font-bold`}>Toplam Oyun: <strong className={isDarkMode ? "text-white" : "text-slate-900"}>{totalGamesCount}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-500" />
                  <span className={`${isDarkMode ? "text-slate-400" : "text-slate-600"} font-bold`}>Co-op: <strong className={isDarkMode ? "text-white" : "text-slate-900"}>{Math.max(1, totalGamesCount)}</strong></span>
                </div>
              </div>
            </div>

            {/* Gamer Profile Welcome row */}
            {gamerProfile && (
              <div 
                onClick={onOpenProfile}
                title="Oyuncu Profil İstasyonunu Aç"
                className={`flex items-center gap-3 border pl-4 pr-3 py-1.5 rounded-2xl shadow-xl cursor-pointer transition-all duration-300 group w-full sm:w-auto ${
                  isDarkMode 
                    ? "from-[#0d1527] to-[#0c111e] bg-gradient-to-r border-slate-800/80 hover:border-cyan-500/45 text-white" 
                    : "bg-white border-slate-200 hover:border-cyan-400 shadow-sm text-slate-800"
                }`}
              >
                <div className="text-right flex-1 sm:flex-initial">
                  <div className="text-[9px] uppercase font-mono tracking-widest text-slate-500 font-black flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ÇEVRİMİÇİ
                  </div>
                  <div className="text-xs font-bold flex items-center justify-end gap-1">
                    Hoş geldin, <span className="text-cyan-500 font-black group-hover:text-cyan-600 transition-colors">{gamerProfile.username}</span>
                  </div>
                  {gamerProfile.statusMessage && (
                    <div className={`text-[10px] max-w-[120px] truncate italic font-sans ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      "{gamerProfile.statusMessage}"
                    </div>
                  )}
                </div>
                
                {/* Dynamic Avatar Render */}
                {(() => {
                  const avatar = AVATAR_PRESETS.find(p => p.id === gamerProfile.avatarId) || AVATAR_PRESETS[0];
                  const Icon = avatar.Icon;
                  return (
                    <div 
                      className={`p-2 rounded-xl bg-gradient-to-br ${avatar.bg} transition-all duration-300 text-white relative flex items-center justify-center border border-white/10 group-hover:scale-105 group-hover:border-cyan-400/40`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Global Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-850/40 pb-2">
          <button
            id="tab_library_btn"
            onClick={() => setActiveTab("library")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 relative ${
              activeTab === "library"
                ? "bg-gradient-to-r from-violet-650 to-indigo-600 text-white shadow-md shadow-violet-600/20"
                : isDarkMode 
                ? "text-slate-400 hover:text-white hover:bg-slate-900/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            Oyun Mağazası & Kütüphane
            {activeTab === "library" && (
              <motion.div
                layoutId="activeTabGlow"
                className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-cyan-500"
              />
            )}
          </button>
          
          <button
            id="tab_planner_btn"
            onClick={() => setActiveTab("planner")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 relative ${
              activeTab === "planner"
                ? "bg-gradient-to-r from-violet-600 to-indigo-650 text-white shadow-md shadow-violet-600/20"
                : isDarkMode 
                ? "text-slate-400 hover:text-white hover:bg-slate-900/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
                : isDarkMode 
                ? "text-slate-400 hover:text-white hover:bg-slate-900/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <div className="relative flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-pink-500 animate-pulse" />
              {unreadCount > 0 && (
                <span className="absolute -top-2.5 -right-2 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg border border-slate-950 animate-bounce">
                  {unreadCount}
                </span>
              )}
            </div>
            <span>Lobi Sohbet Odası</span>
            {activeTab === "chat" && (
              <motion.div
                layoutId="activeTabGlow"
                className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-pink-500"
              />
            )}
          </button>

          <button
            id="tab_admin_btn"
            onClick={() => setActiveTab("admin")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300 relative ${
              activeTab === "admin"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20"
                : isDarkMode 
                ? "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Settings className="w-4 h-4 text-emerald-500" />
            Yönetici Paneli
            {activeTab === "admin" && (
              <motion.div
                layoutId="activeTabGlow"
                className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-emerald-500"
              />
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
