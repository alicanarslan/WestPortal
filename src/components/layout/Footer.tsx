interface FooterProps {
  gamesCount: number;
}

export default function Footer({ gamesCount }: FooterProps) {
  return (
    <footer className="w-full bg-[#05060a] border-t border-slate-900/60 py-8 px-4 flex flex-col items-center justify-between gap-6 z-10 text-xs font-mono">
      <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>© 2026 WestPortal Gamer Hub • Arkadaş Ağ Arşivi</span>
        </div>

        <div className="flex flex-wrap gap-4 items-center justify-center">
          <span className="text-slate-600">Teknoloji: React 19 + Tailwind v4 + Motion</span>
          <span className="hidden md:inline text-slate-700">|</span>
          <span className="text-slate-500">
            Oyun Veritabanı: <strong>{gamesCount} Seçkin Co-op & Hayatta Kalma Sınıfı</strong>
          </span>
        </div>
      </div>

      <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 max-w-2xl text-center leading-relaxed text-[11px] text-slate-500 font-sans">
        <strong>YASAL UYARI & METODOLOJİ:</strong> Bu portal arkadaş gruplarının oyun gecelerini programlaması ve çevrimiçi çok oyunculu (co-op) oyunları hızlıca bulması için tasarlanmış bağımsız bir hayran projesidir. İndirme butonları sizi doğrudan ilgili oyunun çok oyunculu indirme sayfasına yönlendirir.
      </div>
    </footer>
  );
}
