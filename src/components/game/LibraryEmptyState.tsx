import { Gamepad2, Settings, RefreshCw } from "lucide-react";

interface LibraryEmptyStateProps {
  setActiveTab: (tab: "library" | "planner" | "admin" | "chat") => void;
  onLoadDefaults: () => Promise<void> | void;
}

export default function LibraryEmptyState({
  setActiveTab,
  onLoadDefaults,
}: LibraryEmptyStateProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
      <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-3xl relative inline-block">
        <Gamepad2 className="w-16 h-16 text-cyan-500/80 animate-pulse mx-auto" />
        <div className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-2xl font-black text-white uppercase tracking-wider font-sans">
          KÜTÜPHANE TERTEMİZ & BOŞ DURUMDA!
        </h3>
        <p className="text-xs text-slate-400 max-w-xl mx-auto font-sans leading-relaxed">
          Sistem yöneticisi tüm başlangıç oyunlarını kütüphaneden kaldırdı. Siteniz şu an tamamen hazır ve temiz bir şablon sunuyor. Oyunları yönetmek ve eklemek için <strong>Yönetici Paneli</strong>'ni kullanabilir veya hazır şablonu anında geri getirebilirsiniz!
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <button
          onClick={() => setActiveTab("admin")}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-400/10 cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          YÖNETİCİ PANELİ'NE GİT VE OYUN EKLE
        </button>
        <button
          onClick={onLoadDefaults}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wide transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-purple-400" />
          HAZIR ŞABLON OYUNLARINI GERİ YÜKLE
        </button>
      </div>
    </div>
  );
}
