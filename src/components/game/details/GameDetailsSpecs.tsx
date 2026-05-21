import * as React from "react";
import { Game } from "../../../gamesData";
import { UserSystemSpecs } from "../../../types";
import { Cpu } from "lucide-react";

interface GameDetailsSpecsProps {
  game: Game;
  userSpecs: UserSystemSpecs;
}

function classifyCpu(cpuStr: string): number {
  const s = (cpuStr || "").toLowerCase();
  if (s.includes("i9") || s.includes("ryzen 9") || s.includes("ryzen 7") || s.includes("threadripper")) {
    return 3;
  }
  if (s.includes("i7")) {
    const match = s.match(/i7-(\d{3,4})/);
    if (match) {
      const genNum = parseInt(match[1]);
      if (genNum < 6000) return 2;
    }
    return 3;
  }
  if (s.includes("i5") || s.includes("ryzen 5") || s.includes("ryzen 3")) {
    return 2;
  }
  if (s.includes("i3") || s.includes("fx-") || s.includes("pentium") || s.includes("celeron") || s.includes("athlon")) {
    return 1;
  }
  return 2;
}

function classifyGpu(gpuStr: string): number {
  const s = (gpuStr || "").toLowerCase();
  if (s.includes("rtx") || s.includes("xt") || s.includes("vega 56") || s.includes("vega 64") || s.includes("gtx 1080") || s.includes("gtx 1080ti") || s.includes("titan")) {
    return 3;
  }
  const rxMatch = s.match(/rx\s*(\d{3,4})/);
  if (rxMatch) {
    const rxModel = parseInt(rxMatch[1]);
    if (rxModel >= 5500 || rxModel >= 6600) return 3;
    if (rxModel >= 470 && rxModel <= 590) return 2;
    return 1;
  }
  const gtxMatch = s.match(/gtx\s*(\d{3,4})/);
  if (gtxMatch) {
    const gtxModel = parseInt(gtxMatch[1]);
    if (gtxModel >= 1080) return 3;
    if (gtxModel >= 970 || gtxModel === 1060 || gtxModel === 1070 || gtxModel >= 1650) return 2;
    return 1;
  }
  if (s.includes("intel hd") || s.includes("intel iris") || s.includes("amd radeon r") || s.includes("gt ") || s.includes("gtx 750") || s.includes("gtx 660")) {
    return 1;
  }
  return 2;
}

function parseRamGB(ramStr: string): number {
  const match = (ramStr || "").match(/(\d+)\s*(?:gb|mb)/i);
  if (match) {
    let val = parseInt(match[1]);
    if ((ramStr || "").toLowerCase().includes("mb")) {
      val = Math.ceil(val / 1024);
    }
    return val;
  }
  return 8;
}

export default function GameDetailsSpecs({ game, userSpecs }: GameDetailsSpecsProps) {
  const compareCpu = () => {
    const minCpuRank = classifyCpu(game.sysMin.cpu);
    const recCpuRank = classifyCpu(game.sysRec.cpu);
    const userRank = userSpecs.cpuRank || 2;

    if (userRank >= recCpuRank) return { text: "Yüksek Performans (Önerilen)", level: "green" };
    if (userRank >= minCpuRank) return { text: "Minimum Uyumlu (Sınırda)", level: "amber" };
    return { text: "Yetersiz Kalabilir", level: "red" };
  };

  const compareGpu = () => {
    const minGpuRank = classifyGpu(game.sysMin.gpu);
    const recGpuRank = classifyGpu(game.sysRec.gpu);
    const userRank = userSpecs.gpuRank || 2;

    if (userRank >= recGpuRank) return { text: "Yüksek Performans (Önerilen)", level: "green" };
    if (userRank >= minGpuRank) return { text: "Minimum Uyumlu (Sınırda)", level: "amber" };
    return { text: "Yetersiz Kalabilir", level: "red" };
  };

  const compareRam = () => {
    const minRamNeeded = parseRamGB(game.sysMin.ram);
    const recRamNeeded = parseRamGB(game.sysRec.ram);
    const userRam = userSpecs.ramGB || 16;

    if (userRam >= recRamNeeded) return { text: "Fazlasıyla Yeterli (Önerilen)", level: "green" };
    if (userRam >= minRamNeeded) return { text: "Minimum Uyumlu (Sınırda)", level: "amber" };
    return { text: "Yetersiz Bellek (RAM)", level: "red" };
  };

  const cpuStat = compareCpu();
  const gpuStat = compareGpu();
  const ramStat = compareRam();

  const minStorage = (game.sysMin.storage || "").toLowerCase();
  const recStorage = (game.sysRec.storage || "").toLowerCase();
  const ssdRequired = minStorage.includes("ssd") || recStorage.includes("ssd");
  const showSsdWarning = ssdRequired && !userSpecs.storageSSD;

  return (
    <div className="space-y-6">
      {/* PC Comparator banner */}
      <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wide">
              Anlık Sistem Uyumluluk Testiniz
            </h4>
            <p className="text-xs text-slate-400 font-mono">
              Bilgisayar bilgilerinize göre oyun değerlendirmesi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-950 p-2 rounded-lg border border-slate-900">
          <span className="text-slate-500">Kayıtlı RAM:</span>
          <span className="text-cyan-400 font-bold font-sans">{userSpecs.ramGB} GB</span>
        </div>
      </div>

      {showSsdWarning && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-mono flex items-center gap-2">
          <span className="text-sm">⚠️</span>
          <span><strong>DİSK UYARISI:</strong> Bu oyun için SSD gereksinimi veya önerisi var, ancak profilinizde HDD seçili. Uzun yükleme süreleriyle karşılaşabilirsiniz.</span>
        </div>
      )}

      {/* Dynamic compatibility results grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CPU */}
        <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-900 flex flex-col justify-between h-28">
          <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">
            İşlemci (CPU) Testi
          </span>
          <div className="font-bold text-sm text-slate-100 mt-2 font-mono">
            {cpuStat.text}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              cpuStat.level === "green" ? "bg-emerald-500" : cpuStat.level === "amber" ? "bg-amber-500" : "bg-red-500"
            }`} />
            <span className="text-[10px] text-slate-400 uppercase font-bold font-mono">
              {cpuStat.level === "green" ? "Üst Düzey" : cpuStat.level === "amber" ? "Sınırda" : "Yetersiz"}
            </span>
          </div>
        </div>

        {/* GPU */}
        <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-900 flex flex-col justify-between h-28">
          <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">
            Ekran Kartı (GPU) Testi
          </span>
          <div className="font-bold text-sm text-slate-100 mt-2 font-mono">
            {gpuStat.text}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              gpuStat.level === "green" ? "bg-emerald-500" : gpuStat.level === "amber" ? "bg-amber-500" : "bg-red-500"
            }`} />
            <span className="text-[10px] text-slate-400 uppercase font-bold font-mono">
              {gpuStat.level === "green" ? "Üst Düzey" : gpuStat.level === "amber" ? "Sınırda" : "Yetersiz"}
            </span>
          </div>
        </div>

        {/* RAM */}
        <div className="p-4 bg-slate-900/30 rounded-xl border border-slate-900 flex flex-col justify-between h-28">
          <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">
            Bellek (RAM) Testi
          </span>
          <div className="font-bold text-sm text-slate-100 mt-2 font-mono">
            {ramStat.text}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              ramStat.level === "green" ? "bg-emerald-500" : ramStat.level === "amber" ? "bg-amber-500" : "bg-red-500"
            }`} />
            <span className="text-[10px] text-slate-400 uppercase font-bold font-mono">
              {ramStat.level === "green" ? "Uyumlu" : ramStat.level === "amber" ? "Ucu Ucuna" : "Gerekli"}
            </span>
          </div>
        </div>
      </div>

      {/* Minimum vs Recommended Side sheets details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 pt-2 font-mono">
        {/* Min */}
        <div className="p-5 bg-slate-900/20 rounded-xl border border-slate-900 space-y-3">
          <h4 className="font-bold text-xs text-white pb-2 border-b border-slate-900 tracking-wider uppercase">
            Minimum Sistem Gereksinimleri
          </h4>
          <div className="space-y-2">
            <div><span className="text-slate-500">İşlemci:</span> <span className="text-slate-300 font-sans">{game.sysMin.cpu}</span></div>
            <div><span className="text-slate-500">Ekran Kartı:</span> <span className="text-slate-300 font-sans">{game.sysMin.gpu}</span></div>
            <div><span className="text-slate-500">RAM Bellek:</span> <span className="text-slate-300 font-sans">{game.sysMin.ram}</span></div>
            <div><span className="text-slate-500">Depolama:</span> <span className="text-slate-300 font-sans">{game.sysMin.storage}</span></div>
          </div>
        </div>

        {/* Rec */}
        <div className="p-5 bg-slate-900/20 rounded-xl border border-slate-900 space-y-3">
          <h4 className="font-bold text-xs text-white pb-2 border-b border-slate-900 tracking-wider uppercase">
            Önerilen Sistem Gereksinimleri
          </h4>
          <div className="space-y-2">
            <div><span className="text-slate-500">İşlemci:</span> <span className="text-slate-300 font-sans">{game.sysRec.cpu}</span></div>
            <div><span className="text-slate-500">Ekran Kartı:</span> <span className="text-slate-300 font-sans">{game.sysRec.gpu}</span></div>
            <div><span className="text-slate-500">RAM Bellek:</span> <span className="text-slate-300 font-sans">{game.sysRec.ram}</span></div>
            <div><span className="text-slate-500">Depolama:</span> <span className="text-slate-300 font-sans">{game.sysRec.storage}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
