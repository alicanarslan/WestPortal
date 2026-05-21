import { motion, AnimatePresence } from "motion/react";

interface LibraryFiltersProps {
  showFilterSection: boolean;
  selectedTag: string;
  setSelectedTag: (tag: string) => void;
  selectedPlayersFilter: string;
  setSelectedPlayersFilter: (filter: string) => void;
  selectedSizeFilter: string;
  setSelectedSizeFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  availableTags: string[];
}

export default function LibraryFilters({
  showFilterSection,
  selectedTag,
  setSelectedTag,
  selectedPlayersFilter,
  setSelectedPlayersFilter,
  selectedSizeFilter,
  setSelectedSizeFilter,
  searchQuery,
  setSearchQuery,
  availableTags,
}: LibraryFiltersProps) {
  const isAnyFilterActive =
    selectedTag !== "All" ||
    selectedPlayersFilter !== "All" ||
    selectedSizeFilter !== "All" ||
    searchQuery !== "";

  const handleReset = () => {
    setSelectedTag("All");
    setSelectedPlayersFilter("All");
    setSelectedSizeFilter("All");
    setSearchQuery("");
  };

  return (
    <AnimatePresence>
      {showFilterSection && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden bg-[#090e18]/80 rounded-2xl border border-slate-900 shadow-2xl"
        >
          <div className="p-4 md:p-5 space-y-4 font-sans text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* 1. Category filter (Filtrele / Kategori) */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider block">
                  Kategori / Tür:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => setSelectedTag("All")}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                      selectedTag === "All"
                        ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                        : "bg-slate-950 hover:bg-slate-900 border-slate-900 text-slate-400"
                    }`}
                  >
                    Tümü (All)
                  </button>
                  {availableTags.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                        selectedTag.toLowerCase() === tag.toLowerCase()
                          ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                          : "bg-slate-950 hover:bg-slate-900 border-slate-900 text-slate-400"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Player count Filter */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider block">
                  Oyuncu Sayısı:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { value: "All", label: "Tümü" },
                    { value: "single", label: "Tek Oyuncu" },
                    { value: "multi", label: "Multi / Co-op" },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setSelectedPlayersFilter(opt.value)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer border ${
                        selectedPlayersFilter === opt.value
                          ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                          : "bg-slate-950 hover:bg-slate-900 border-slate-900 text-slate-400"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Game size Filter */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider block">
                  Depolama Boyutu:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { value: "All", label: "Tümü" },
                    { value: "small", label: "< 10 GB" },
                    { value: "medium", label: "10-45 GB" },
                    { value: "large", label: "> 45 GB" },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setSelectedSizeFilter(opt.value)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer border ${
                        selectedSizeFilter === opt.value
                          ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                          : "bg-slate-950 hover:bg-slate-900 border-slate-900 text-slate-400"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reset filters row */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-900/60">
              <span className="text-[10px] text-slate-500 italic">
                Seçenekleri işaretleyerek filtreleme kriterlerini daraltabilirsiniz.
              </span>
              {isAnyFilterActive && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[10px] text-rose-400 hover:underline flex items-center gap-1 cursor-pointer font-bold bg-transparent border-0"
                >
                  Temizle & Sıfırla
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
