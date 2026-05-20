export interface TagStyle {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

export function getModernTagStyles(tag: string): TagStyle {
  const normalized = tag.toLowerCase().trim();
  
  if (normalized.includes("co-op") || normalized.includes("eşli") || normalized.includes("multiplayer") || normalized.includes("esli") || normalized.includes("çok oyunculu") || normalized.includes("cok oyunculu")) {
    return {
      bg: "bg-cyan-950/40 hover:bg-cyan-900/50",
      text: "text-cyan-400",
      border: "border-cyan-500/25 shadow-cyan-500/5",
      dot: "bg-cyan-400"
    };
  }
  if (normalized.includes("hayatta kalma") || normalized.includes("survival") || normalized.includes("macera") || normalized.includes("adventure")) {
    return {
      bg: "bg-emerald-950/40 hover:bg-emerald-900/50",
      text: "text-emerald-400",
      border: "border-emerald-500/25 shadow-emerald-500/5",
      dot: "bg-emerald-400"
    };
  }
  if (normalized.includes("aksiyon") || normalized.includes("action") || normalized.includes("shooter") || normalized.includes("nişancı") || normalized.includes("nisanci") || normalized.includes("savaş") || normalized.includes("savas")) {
    return {
      bg: "bg-rose-950/40 hover:bg-rose-900/50",
      text: "text-rose-400",
      border: "border-rose-500/25 shadow-rose-500/5",
      dot: "bg-rose-400"
    };
  }
  if (normalized.includes("roguelike") || normalized.includes("rogue-lite") || normalized.includes("rpg") || normalized.includes("rol yapma") || normalized.includes("rogue")) {
    return {
      bg: "bg-amber-950/40 hover:bg-amber-900/50",
      text: "text-amber-400",
      border: "border-amber-500/25 shadow-amber-500/5",
      dot: "bg-amber-400"
    };
  }
  if (normalized.includes("strateji") || normalized.includes("strategy") || normalized.includes("taktik")) {
    return {
      bg: "bg-yellow-950/40 hover:bg-yellow-900/50",
      text: "text-yellow-400",
      border: "border-yellow-500/25 shadow-yellow-500/5",
      dot: "bg-yellow-400"
    };
  }
  if (normalized.includes("açık dünya") || normalized.includes("acik dunya") || normalized.includes("open world") || normalized.includes("keşif") || normalized.includes("kesif")) {
    return {
      bg: "bg-sky-950/40 hover:bg-sky-900/50",
      text: "text-sky-400",
      border: "border-sky-500/25 shadow-sky-500/5",
      dot: "bg-sky-400"
    };
  }
  if (normalized.includes("bilim kurgu") || normalized.includes("sci-fi") || normalized.includes("uzay") || normalized.includes("space")) {
    return {
      bg: "bg-fuchsia-950/40 hover:bg-fuchsia-900/50",
      text: "text-fuchsia-400",
      border: "border-fuchsia-500/25 shadow-fuchsia-500/5",
      dot: "bg-fuchsia-400"
    };
  }
  if (normalized.includes("simülasyon") || normalized.includes("simulasyon") || normalized.includes("simulation")) {
    return {
      bg: "bg-purple-950/40 hover:bg-purple-900/50",
      text: "text-purple-400",
      border: "border-purple-500/25 shadow-purple-500/5",
      dot: "bg-purple-400"
    };
  }
  if (normalized.includes("platformcu") || normalized.includes("platformer")) {
    return {
      bg: "bg-indigo-950/40 hover:bg-indigo-900/50",
      text: "text-indigo-400",
      border: "border-indigo-500/25 shadow-indigo-500/5",
      dot: "bg-indigo-400"
    };
  }
  
  // Dynamic fallback style based on character hash for nice alternating look
  const hash = tag.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const styles: TagStyle[] = [
    { bg: "bg-violet-950/40 hover:bg-violet-900/50", text: "text-violet-400", border: "border-violet-500/25 shadow-violet-500/5", dot: "bg-violet-400" },
    { bg: "bg-teal-950/40 hover:bg-teal-900/50", text: "text-teal-400", border: "border-teal-500/25 shadow-teal-500/5", dot: "bg-teal-400" },
    { bg: "bg-pink-950/40 hover:bg-pink-900/50", text: "text-pink-400", border: "border-pink-500/25 shadow-pink-500/5", dot: "bg-pink-400" },
    { bg: "bg-blue-950/40 hover:bg-blue-900/50", text: "text-blue-400", border: "border-blue-500/25 shadow-blue-500/5", dot: "bg-blue-400" }
  ];
  return styles[hash % styles.length];
}
