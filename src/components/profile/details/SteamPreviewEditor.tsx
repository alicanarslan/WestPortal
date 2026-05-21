import * as React from "react";
import { Game, SystemRequirements } from "../../../gamesData";
import { motion } from "motion/react";
import { 
  Globe, HardDrive, Check, Info, ShieldAlert
} from "lucide-react";

interface SteamPreviewEditorProps {
  previewGame: Omit<Game, "id"> & { id: number; forbiddenTags?: string[] };
  changePreviewField: (field: string, val: any) => void;
  changePreviewSysMinField: (field: keyof SystemRequirements, val: string) => void;
  changePreviewSysRecField: (field: keyof SystemRequirements, val: string) => void;
  savePreviewToLibrary: () => void;
  onCancel: () => void;
  GLOW_COLORS: { value: string; name: string }[];
}

export default function SteamPreviewEditor({
  previewGame,
  changePreviewField,
  changePreviewSysMinField,
  changePreviewSysRecField,
  savePreviewToLibrary,
  onCancel,
  GLOW_COLORS
}: SteamPreviewEditorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6"
    >
      <div className="lg:col-span-12 border-b border-dashed border-slate-800 pb-2">
        <span className="text-xs uppercase tracking-widest font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded">
          2. ADIM: VERİ DOĞRULAMA VE ENHANCED EDİTÖR PANELİ (CANLI ÖNİZLEME DETAYLARI)
        </span>
      </div>

      {/* CARD SIMULATION COLUMN (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-slate-900/20 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 block">
            ⚡ KART MOCKUP SİMÜLATÖRÜ (ANA SAYFA DETAY GÖRÜNÜMÜ):
          </span>
          
          {/* Styled Card Block */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-2xl group transition-all duration-300">
            {/* Glow tag hover */}
            <div className={`absolute -inset-1 bg-gradient-to-r ${previewGame.glowColor} rounded-2xl opacity-10 blur-xl group-hover:opacity-25 transition-all duration-500`} />
            
            {/* Header Game image with custom neon drop-shadow */}
            <div className="relative h-44 overflow-hidden bg-slate-900 border-b border-slate-900">
              <img
                src={previewGame.imageUrl}
                alt="Kapak"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 right-2 bg-slate-950/80 border border-slate-800 rounded px-1.5 py-0.5 text-[9px] font-mono text-cyan-400">
                AppID: {previewGame.id}
              </div>
              
              {/* Rating badges */}
              <div className="absolute bottom-2 left-2 bg-slate-950/90 border border-slate-800/80 rounded px-2 py-0.5 text-[10px] font-mono text-amber-400 font-bold">
                ★ {previewGame.rating.toFixed(1)}
              </div>
            </div>

            {/* Card Content body */}
            <div className="p-5 space-y-4">
              <div>
                <h4 className="text-base font-black text-white group-hover:text-cyan-400 transition-colors uppercase truncate">
                  {previewGame.title || "Lütfen Başlık Girin"}
                </h4>
              </div>

              {/* Display custom multiplayer specs inside the mock card */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300 bg-slate-900/40 p-2 rounded-lg border border-slate-800/50">
                <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-cyan-400" />
                  <span>{previewGame.players}</span>
                </div>
                <div className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-pink-400" />
                  <span>Boyut: {previewGame.size}</span>
                </div>
              </div>

              {/* Overriding link representation */}
              <div className="border-t border-slate-900 pt-3 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" /> ONLINE-FIX CO-OP LİNKİ:
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-emerald-500/20 text-slate-300 font-mono text-[9px] break-all max-h-16 overflow-y-auto leading-relaxed">
                  {previewGame.steamripUrl || "Belirtilmedi (online-fix aranacak)"}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 font-sans line-clamp-2 leading-relaxed">
                {previewGame.description}
              </p>

              <div className="flex flex-wrap gap-1">
                {previewGame.tags.map((tg, i) => (
                  <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400">
                    {tg}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info alert display */}
        <div className="p-4 bg-slate-950/80 border border-yellow-500/20 text-amber-200 rounded-xl flex gap-3 text-xs leading-relaxed font-sans">
          <Info className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <strong className="text-white block mb-0.5">UYUMLULUK NOTU</strong>
            Bu oyun sisteme kaydedildiğinde, kullanıcılar ana ekranda oyuna tıkladıklarında, tanımladığınız <strong>online-fix linkine</strong> yönlendirilirler. Sistem, oyuncuların bilgisayar donanım testlerini otomatik yapar ve bu oyunu kaldırıp kaldıramayacağını söyler.
          </div>
        </div>
      </div>

      {/* ENRICHED FIELDS EDITOR COLUMN (7 cols) */}
      <div className="lg:col-span-7 bg-[#090e18]/80 rounded-2xl p-6 border border-slate-800/80 shadow-2xl relative space-y-5">
        <div className="border-b border-slate-900 pb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-black text-white uppercase tracking-wider">
            ÖZELLEŞTİREBİLİR ÖZNİTELİK EDİTÖRÜ
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Title field */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
              Oyun Başlığı (Title)
            </label>
            <input
              type="text"
              value={previewGame.title}
              onChange={(e) => changePreviewField("title", e.target.value)}
              className="w-full bg-slate-950 text-xs text-slate-100 p-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Glow Style template select */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
              Glow Neon Renği (Glow Highlight Style)
            </label>
            <select
              value={previewGame.glowColor}
              onChange={(e) => changePreviewField("glowColor", e.target.value)}
              className="w-full bg-slate-950 text-xs text-slate-300 p-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 font-mono"
            >
              {GLOW_COLORS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CRITICAL FEATURE requested: Online-Fix direct link override fields */}
        <div className="p-4 bg-emerald-950/20 border-2 border-emerald-500/20 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-emerald-400 font-black uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <Globe className="w-4 h-4 text-emerald-400" />
              ONLINE-FIX / ÇOK OYUNCULU DOSYA YAMA LİNKİ
            </label>
            <span className="text-[9px] font-mono text-slate-500">
              Önemli Alan
            </span>
          </div>
          <input
            type="text"
            value={previewGame.steamripUrl}
            onChange={(e) => changePreviewField("steamripUrl", e.target.value)}
            placeholder="Örn: https://online-fix.me/games/survival/..."
            className="w-full bg-slate-950 text-xs text-emerald-300 p-3 rounded-lg border border-emerald-500/35 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 font-mono leading-relaxed"
          />
          <p className="text-[9px] text-slate-400 font-sans leading-normal">
            💡 <strong>Not:</strong> Steam API'den gelen veriler doğrultusunda otomatik bir arama aracı linki atanmıştır fakat doğrudan çok oyunculu yama sayfasına yönlendirmesi için yukarıdaki alana gerçek <u>online-fix.me</u> sayfa linkini koyabilirsiniz!
          </p>
        </div>

        {/* Slogan & Size / Players Info row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-[10px] text-slate-400 font-mono uppercase block">
              Dosya Boyutu
            </label>
            <input
              type="text"
              value={previewGame.size}
              onChange={(e) => changePreviewField("size", e.target.value)}
              placeholder="Örn: 25 GB"
              className="w-full bg-slate-950 text-xs text-slate-100 p-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <label className="text-[10px] text-slate-400 font-mono uppercase block">
              Oyuncu Sayısı
            </label>
            <input
              type="text"
              value={previewGame.players}
              onChange={(e) => changePreviewField("players", e.target.value)}
              className="w-full bg-slate-950 text-xs text-slate-100 p-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <label className="text-[10px] text-slate-400 font-mono uppercase block">
              Puan (1.0 - 5.0)
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={previewGame.rating}
              onChange={(e) => changePreviewField("rating", Number(e.target.value))}
              className="w-full bg-slate-950 text-xs text-slate-100 p-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>

        {/* Description Textarea */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 font-mono uppercase block">
            Ana Açıklama (Description)
          </label>
          <textarea
            rows={3}
            value={previewGame.description}
            onChange={(e) => changePreviewField("description", e.target.value)}
            className="w-full bg-slate-950 text-xs text-slate-100 p-2.5 rounded-lg border border-slate-800 focus:outline-none"
          />
        </div>

        {/* Category tags */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
            Arama Etiketleri (Tags) - Virgülle Ayırın
          </label>
          <input
            type="text"
            value={previewGame.tags.join(", ")}
            onChange={(e) => changePreviewField("tags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
            className="w-full bg-slate-950 text-xs text-slate-100 p-2.5 rounded-lg border border-slate-800 focus:outline-none"
          />
        </div>

        {/* Forbidden tags (Yasaklı Etiketler) */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-red-400 font-mono uppercase tracking-wider flex items-center gap-1.5 block">
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
            Yasaklı Etiketler (Forbidden Tags) - Virgülle Ayırın
          </label>
          <input
            type="text"
            value={previewGame.forbiddenTags ? previewGame.forbiddenTags.join(", ") : ""}
            onChange={(e) => changePreviewField("forbiddenTags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
            placeholder="Örn: Tek Oyunculu, Korku, Anime"
            className="w-full bg-slate-950 text-xs text-red-200 border border-red-950 p-2.5 rounded-lg focus:outline-none focus:border-red-500 placeholder-red-950/40"
          />
          <p className="text-[9.5px] text-slate-400 font-sans">
            Buraya eklediğiniz etiketler ana sayfadaki arama filtrelerinden ve oyun kartı alanlarından otomatik gizlenecektir.
          </p>
        </div>

        {/* Systems specs forms layout */}
        <div className="border-t border-slate-900 pt-3 space-y-3">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
            🖥️ SİSTEM DONANIM SORGUSU (GEREKSİNİMLER):
          </span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Minimum requirements */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
              <span className="text-[9px] font-mono text-cyan-400 block border-b border-slate-900 pb-1">
                MINIMUM GEREKSİNİMLER
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <label className="text-slate-500 block mb-0.5">CPU</label>
                  <input type="text" value={previewGame.sysMin.cpu} onChange={(e) => changePreviewSysMinField("cpu", e.target.value)} className="w-full bg-slate-900 text-[10px] text-slate-200 p-1.5 rounded border border-slate-800" />
                </div>
                <div>
                  <label className="text-slate-500 block mb-0.5">GPU</label>
                  <input type="text" value={previewGame.sysMin.gpu} onChange={(e) => changePreviewSysMinField("gpu", e.target.value)} className="w-full bg-slate-900 text-[10px] text-slate-200 p-1.5 rounded border border-slate-800" />
                </div>
                <div>
                  <label className="text-slate-500 block mb-0.5">Bellek (RAM)</label>
                  <input type="text" value={previewGame.sysMin.ram} onChange={(e) => changePreviewSysMinField("ram", e.target.value)} className="w-full bg-slate-900 text-[10px] text-slate-200 p-1.5 rounded border border-slate-800" />
                </div>
                <div>
                  <label className="text-slate-500 block mb-0.5">Depolama</label>
                  <input type="text" value={previewGame.sysMin.storage} onChange={(e) => changePreviewSysMinField("storage", e.target.value)} className="w-full bg-slate-900 text-[10px] text-slate-200 p-1.5 rounded border border-slate-800" />
                </div>
              </div>
            </div>

            {/* Recommended requirements */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
              <span className="text-[9px] font-mono text-indigo-400 block border-b border-slate-900 pb-1">
                ÖNERİLEN GEREKSİNİMLER
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <label className="text-slate-500 block mb-0.5">CPU</label>
                  <input type="text" value={previewGame.sysRec.cpu} onChange={(e) => changePreviewSysRecField("cpu", e.target.value)} className="w-full bg-slate-900 text-[10px] text-slate-200 p-1.5 rounded border border-slate-800" />
                </div>
                <div>
                  <label className="text-slate-500 block mb-0.5">GPU</label>
                  <input type="text" value={previewGame.sysRec.gpu} onChange={(e) => changePreviewSysRecField("gpu", e.target.value)} className="w-full bg-slate-900 text-[10px] text-slate-200 p-1.5 rounded border border-slate-800" />
                </div>
                <div>
                  <label className="text-slate-500 block mb-0.5">Bellek (RAM)</label>
                  <input type="text" value={previewGame.sysRec.ram} onChange={(e) => changePreviewSysRecField("ram", e.target.value)} className="w-full bg-slate-900 text-[10px] text-slate-200 p-1.5 rounded border border-slate-800" />
                </div>
                <div>
                  <label className="text-slate-500 block mb-0.5">Depolama</label>
                  <input type="text" value={previewGame.sysRec.storage} onChange={(e) => changePreviewSysRecField("storage", e.target.value)} className="w-full bg-slate-900 text-[10px] text-slate-200 p-1.5 rounded border border-slate-800" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cover and header details */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-400 font-mono uppercase block">
            Mağaza Resmi (Image URL)
          </label>
          <input
            type="text"
            value={previewGame.imageUrl}
            onChange={(e) => changePreviewField("imageUrl", e.target.value)}
            className="w-full bg-slate-950 text-xs text-slate-300 p-2.5 rounded-lg border border-slate-800 focus:outline-none"
          />
        </div>

        {/* Action CTA Button */}
        <div className="flex gap-2 justify-end border-t border-slate-900 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold text-xs uppercase cursor-pointer"
          >
            iptal et
          </button>
          <button
            type="button"
            onClick={savePreviewToLibrary}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-500 hover:from-emerald-400 hover:to-indigo-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow shadow-emerald-500/15 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            KÜTÜPHANEYE KAYDET VE YAYINLA
          </button>
        </div>
      </div>
    </motion.div>
  );
}
