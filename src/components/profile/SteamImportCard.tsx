import * as React from "react";
import { useState, useEffect } from "react";
import { Game, SystemRequirements } from "../../gamesData";
import { 
  Sparkles, Loader2, ArrowRight, Trash2, Gamepad2, Settings, CheckCircle, AlertCircle, Search
} from "lucide-react";
import { collection, query, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";

import SteamPreviewEditor from "./details/SteamPreviewEditor";
import TagsManagementDashboard from "./details/TagsManagementDashboard";
import GamesListTable from "./details/GamesListTable";
import UserAccountsTable from "./details/UserAccountsTable";
import GameEditModal from "./details/GameEditModal";

interface SteamImportCardProps {
  onImported: (newGame: Game) => void;
  onClearCustomGames: () => void;
  onLoadDefaults: () => void;
  games: Game[];
  onDeleteGame: (id: number) => void;
  deactivatedTags: string[];
  onToggleDeactivateTag: (tag: string) => void;
  onUpdateGame: (updatedGame: Game) => Promise<void> | void;
}

const GLOW_COLORS = [
  { value: "from-cyan-500 to-blue-400", name: "Neon Cyber (Cyan/Mavi)" },
  { value: "from-purple-700 to-indigo-600", name: "Gotik Royal (Mor/Lacivert)" },
  { value: "from-orange-500 to-yellow-500", name: "Volkanik Kaos (Turuncu/Sarı)" },
  { value: "from-emerald-500 to-teal-400", name: "Rune Ormanı (Yeşil/Mavi)" },
  { value: "from-amber-600 to-red-600", name: "Yıkım Alarımı (Kehribar/Kırmızı)" },
  { value: "from-pink-500 to-rose-500", name: "Piksel Melodi (Pembe/Gül)" }
];

interface BulkImportItem {
  onlineFixUrl: string;
  steamAppId: string;
}

const parseBulkInput = (text: string): BulkImportItem[] => {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const items: BulkImportItem[] = [];

  for (const line of lines) {
    if (line.includes("|")) {
      const parts = line.split("|").map(p => p.trim());
      let onlineFixUrl = "";
      let steamAppId = "";

      for (const part of parts) {
        if (part.includes("online-fix.me")) {
          onlineFixUrl = part;
        }
        if (part.includes("store.steampowered.com/app/")) {
          const match = part.match(/\/app\/(\d+)/);
          if (match) {
            steamAppId = match[1];
          }
        } else {
          const match = part.match(/\b\d{4,8}\b/);
          if (match) {
            steamAppId = match[0];
          }
        }
      }

      if (steamAppId) {
        items.push({ onlineFixUrl, steamAppId });
      }
    } else {
      const urlMatch = line.match(/\/app\/(\d+)/);
      const idMatch = line.match(/\b\d{4,8}\b/);
      const steamAppId = urlMatch ? urlMatch[1] : (idMatch ? idMatch[0] : "");
      
      if (steamAppId) {
        items.push({ onlineFixUrl: "", steamAppId });
      }
    }
  }

  return items;
};

export default function SteamImportCard({
  onImported,
  onClearCustomGames,
  onLoadDefaults,
  games,
  onDeleteGame,
  deactivatedTags,
  onToggleDeactivateTag,
  onUpdateGame
}: SteamImportCardProps) {
  // Game editing states
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTagline, setEditTagline] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSize, setEditSize] = useState("");
  const [editPlayers, setEditPlayers] = useState("");
  const [editSteamripUrl, setEditSteamripUrl] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editGlowColor, setEditGlowColor] = useState("");
  const [editTags, setEditTags] = useState("");

  const handleStartEditGame = (g: Game) => {
    setEditingGame(g);
    setEditTitle(g.title);
    setEditTagline(g.tagline || "");
    setEditDescription(g.description || "");
    setEditSize(g.size || "");
    setEditPlayers(g.players || "");
    setEditSteamripUrl(g.steamripUrl || "");
    setEditImageUrl(g.imageUrl || "");
    setEditGlowColor(g.glowColor || "from-cyan-500 to-blue-400");
    setEditTags(g.tags ? g.tags.join(", ") : "");
  };

  const handleSaveEditedGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame || !onUpdateGame) return;

    const parsedTags = editTags.split(",").map(t => t.trim()).filter(Boolean);
    const updated: Game = {
      ...editingGame,
      title: editTitle.trim(),
      tagline: editTagline.trim(),
      description: editDescription.trim(),
      size: editSize.trim(),
      players: editPlayers.trim(),
      steamripUrl: editSteamripUrl.trim(),
      imageUrl: editImageUrl.trim(),
      glowColor: editGlowColor,
      tags: parsedTags
    };

    try {
      await onUpdateGame(updated);
      setEditingGame(null);
      setResults([{ type: "success", text: `[Yönetim] "${updated.title}" oyunu başarıyla güncellendi!` }]);
    } catch (err: any) {
      setResults([{ type: "error", text: `Oyun güncellenemedi: ${err.message || String(err)}` }]);
    }
  };

  // Parsing states
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Custom alert messages
  const [results, setResults] = useState<{ type: "success" | "error"; text: string }[]>([]);

  // Enriched interactive item configuration state
  const [previewGame, setPreviewGame] = useState<Omit<Game, "id"> & { id: number; forbiddenTags?: string[] } | null>(null);

  // Steam Autocomplete Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ id: number; name: string; tiny_image: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/steam-search?term=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.items)) {
            setSuggestions(data.items);
          }
        }
      } catch (err) {
        console.error("Steam search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".autocomplete-container")) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // User Management Admin Panel State
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [confirmDeleteUid, setConfirmDeleteUid] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList: any[] = [];
      snapshot.forEach((docSnap) => {
        const u = docSnap.data();
        usersList.push({
          uid: u.uid || docSnap.id,
          name: u.username || "GamerPlayer",
          isOnline: u.isOnline ?? false,
          avatarId: u.avatarId || "swords",
          avatarBg: u.avatarBg || "from-rose-600 to-red-900",
          badge: u.badge || "OYUNCU",
          createdAt: u.createdAt,
        });
      });
      // Sort: Offline/passive first, then online, alphabetically
      usersList.sort((a, b) => {
        if (a.isOnline && !b.isOnline) return 1;
        if (!a.isOnline && b.isOnline) return -1;
        return a.name.localeCompare(b.name);
      });
      setUsers(usersList);
      setUsersLoading(false);
    }, (error) => {
      console.error("Firebase users fetch failed in Admin Panel:", error);
      setUsersLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDeleteUser = async (uid: string) => {
    try {
      await deleteDoc(doc(db, "users", uid));
      setResults([{ type: "success", text: `[Yönetim] Kullanıcı hesabı başarıyla silindi.` }]);
      setConfirmDeleteUid(null);
    } catch (err: any) {
      setResults([{ type: "error", text: `Kullanıcı silinemedi: ${err.message}` }]);
    }
  };

  // Parse HTML tags out of strings safely
  const washHTML = (html: string): string => {
    if (!html) return "";
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Helper to extract system requirements details from Steam's wild raw HTML block
  const parseRequirements = (reqHtml: string, fallbackType: "min" | "rec"): SystemRequirements => {
    const washed = washHTML(reqHtml || "");
    const getSpec = (regex: RegExp, fallback: string): string => {
      const match = washed.match(regex);
      return match ? match[1].trim() : fallback;
    };

    if (fallbackType === "min") {
      return {
        cpu: getSpec(/(?:Processor|İşlemci):\s*([^,\.\n]+)/i, "Intel Core i5 / AMD Ryzen 3"),
        gpu: getSpec(/(?:Graphics|Ekran Kartı):\s*([^,\.\n]+)/i, "NVIDIA GTX 960 / AMD R9"),
        ram: getSpec(/(?:Memory|Bellek):\s*([^,\.\n]+)/i, "8 GB RAM"),
        storage: getSpec(/(?:Storage|Depolama):\s*([^,\.\n]+)/i, "15 GB kullanılabilir alan")
      };
    } else {
      return {
        cpu: getSpec(/(?:Processor|İşlemci):\s*([^,\.\n]+)/i, "Intel Core i7 / AMD Ryzen 5"),
        gpu: getSpec(/(?:Graphics|Ekran Kartı):\s*([^,\.\n]+)/i, "NVIDIA GTX 1070 / AMD RX 580"),
        ram: getSpec(/(?:Memory|Bellek):\s*([^,\.\n]+)/i, "16 GB RAM"),
        storage: getSpec(/(?:Storage|Depolama):\s*([^,\.\n]+)/i, "15 GB SSD önerilir")
      };
    }
  };

  const handleFetchSteamDetails = async (appId: string, onlineFixUrl: string = "") => {
    setLoading(true);
    setResults([]);
    try {
      const response = await fetch(`/api/steam-proxy?appid=${appId}`);
      if (!response.ok) {
        throw new Error(`Steam API Proxy Sunucusu Hata Döndürdü: ${response.status}`);
      }
      
      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        const d = resJson.data;

        // Clean descriptions or use server-provided translations if they exist
        const originalDesc = washHTML(d.description);
        const slicedDesc = originalDesc.length > 290 ? originalDesc.slice(0, 290) + "..." : originalDesc;

        // Prepare some nice co-op features from pulled tags/genres
        const fetchedGenres: string[] = d.genres || [];
        const finalTags = d.tags && d.tags.length > 0 ? d.tags : (fetchedGenres.length > 0 ? [...fetchedGenres.slice(0, 3), "Steam Oyunu"] : ["Steam", "Multiplayer", "Co-op"]);

        // Format system requirements parsed from HTML payload or server-provided pre-parsed requirements
        const sysMin = d.sysMin || parseRequirements(d.pc_requirements?.minimum || "", "min");
        const sysRec = d.sysRec || parseRequirements(d.pc_requirements?.recommended || "", "rec");

        // Set state to trigger the rich Interactive Editor
        setPreviewGame({
          id: Number(appId),
          title: d.name || "",
          tagline: undefined,
          description: d.description || slicedDesc || "Arkadaşlarınızla oynayabileceğiniz yüksek tempolu Steam tabanlı oyun deneyimi.",
          features: [
            "Resmi Steam Sunucu Altyapısı",
            fetchedGenres[0] ? `${fetchedGenres[0]} Türünde Oynanış` : "Zorlu Co-Op Görevleri",
            "Gelişmiş Takım Sinerjisi Mekanikleri"
          ],
          tags: finalTags,
          rating: Number(d.rating) || 4.7,
          steamripUrl: onlineFixUrl || "", // Automatically associate!
          glowColor: "from-cyan-500 to-blue-400",
          players: d.players || "1-4 Oyuncu",
          size: d.size || "20 GB",
          sysMin,
          sysRec,
          bannerGradient: "linear-gradient(135deg, #0f172a, #1e293b)",
          imageUrl: d.header_image || "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/105600/header.jpg",
          trailerUrl: d.trailer_url || "",
          screenshots: d.screenshots || [],
          steamUrl: `https://store.steampowered.com/app/${appId}`,
          turkishSupport: d.turkishSupport,
          steamReviews: d.steamReviews
        });

        setResults([{ type: "success", text: `[Steam API Başarılı] "${d.name}" (AppID: ${appId}) verileri başarıyla çekildi. Aşağıdaki panelden bilgileri düzenleyebilir ve yayınlayabilirsiniz!` }]);
      } else {
        setResults([{ type: "error", text: `Steam API bu AppID için veri döndüremedi: ${resJson.error || "Uyuşmayan kimlik."} AppID'nin doğruluğunu Steam Store üzerinden kontrol edin.` }]);
      }
    } catch (err: any) {
      setResults([{ type: "error", text: `Veri çekme hatası: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const executeExtraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const parsedItems = parseBulkInput(inputText);

    if (parsedItems.length === 0) {
      setResults([{ type: "error", text: "Geçerli bir Steam oyun bilgisi veya 'Online-Fix Linki | Steam Linki' formatı bulunamadı." }]);
      return;
    }

    if (parsedItems.length === 1) {
      const item = parsedItems[0];
      setResults([{ type: "success", text: `Oyun bilgileri taranıyor... ID: ${item.steamAppId}` }]);
      await handleFetchSteamDetails(item.steamAppId, item.onlineFixUrl);
    } else {
      setLoading(true);
      setResults([{ type: "success", text: `🚀 Toplu ekleme başladı! Toplam ${parsedItems.length} oyun işlenecek.` }]);
      
      let successCount = 0;
      let failureCount = 0;
      const finalLogs: { type: "success" | "error"; text: string }[] = [];

      for (let i = 0; i < parsedItems.length; i++) {
        const item = parsedItems[i];
        const currentProgressText = `[${i + 1}/${parsedItems.length}] AppID ${item.steamAppId} sorgulanıyor...`;
        
        // Show scanning log
        setResults(prev => [...prev, { type: "success", text: currentProgressText }]);

        try {
          if (games.some(g => g.id === Number(item.steamAppId))) {
            const dupErr = `⚠️ AppID ${item.steamAppId} zaten kütüphanede kayıtlı olduğu için atlandı.`;
            finalLogs.push({ type: "error", text: dupErr });
            setResults(prev => [...prev.filter(l => l.text !== currentProgressText), { type: "error", text: dupErr }]);
            failureCount++;
            continue;
          }

          const response = await fetch(`/api/steam-proxy?appid=${item.steamAppId}`);
          if (!response.ok) {
            throw new Error(`Proxy sunucusu hatası: ${response.status}`);
          }

          const resJson = await response.json();
          if (resJson.success && resJson.data) {
            const d = resJson.data;
            const originalDesc = washHTML(d.description);
            const slicedDesc = originalDesc.length > 290 ? originalDesc.slice(0, 290) + "..." : originalDesc;
            const fetchedGenres: string[] = d.genres || [];
            const finalTags = d.tags && d.tags.length > 0 ? d.tags : (fetchedGenres.length > 0 ? [...fetchedGenres.slice(0, 3), "Steam Oyunu"] : ["Steam", "Multiplayer", "Co-op"]);

            const sysMin = d.sysMin || parseRequirements(d.pc_requirements?.minimum || "", "min");
            const sysRec = d.sysRec || parseRequirements(d.pc_requirements?.recommended || "", "rec");

            const constructedGame: Game = {
              id: Number(item.steamAppId),
              title: d.name || "",
              description: d.description || slicedDesc || "Arkadaşlarınızla oynayabileceğiniz yüksek tempolu Steam tabanlı oyun deneyimi.",
              features: [
                "Resmi Steam Sunucu Altyapısı",
                fetchedGenres[0] ? `${fetchedGenres[0]} Türünde Oynanış` : "Zorlu Co-Op Görevleri",
                "Gelişmiş Takım Sinerjisi Mekanikleri"
              ],
              tags: finalTags,
              rating: Number(d.rating) || 4.7,
              steamripUrl: item.onlineFixUrl || "", // Automatically associate!
              glowColor: "from-cyan-500 to-blue-400",
              players: d.players || "1-4 Oyuncu",
              size: d.size || "20 GB",
              sysMin,
              sysRec,
              bannerGradient: "linear-gradient(135deg, #0f172a, #1e293b)",
              imageUrl: d.header_image || "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/105600/header.jpg",
              trailerUrl: d.trailer_url || "",
              screenshots: d.screenshots || [],
              steamUrl: `https://store.steampowered.com/app/${item.steamAppId}`,
              turkishSupport: d.turkishSupport,
              steamReviews: d.steamReviews
            };

            onImported(constructedGame);
            
            const successMsg = `✅ "${d.name}" (AppID: ${item.steamAppId}) başarıyla kütüphaneye eklendi ve online-fix linki bağlandı!`;
            finalLogs.push({ type: "success", text: successMsg });
            setResults(prev => [...prev.filter(l => l.text !== currentProgressText), { type: "success", text: successMsg }]);
            successCount++;
          } else {
            const errText = `❌ AppID ${item.steamAppId} için veri çekilemedi: ${resJson.error || "Steam API hatası"}`;
            finalLogs.push({ type: "error", text: errText });
            setResults(prev => [...prev.filter(l => l.text !== currentProgressText), { type: "error", text: errText }]);
            failureCount++;
          }
        } catch (err: any) {
          const catchErr = `❌ AppID ${item.steamAppId} işlem hatası: ${err.message}`;
          finalLogs.push({ type: "error", text: catchErr });
          setResults(prev => [...prev.filter(l => l.text !== currentProgressText), { type: "error", text: catchErr }]);
          failureCount++;
        }

        // Short timeout to play nice with rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setLoading(false);
      setInputText("");
      setResults([
        { type: "success", text: `🎉 TOPLU EKLEME TAMAMLANDI! Başarılı: ${successCount}, Başarısız/Mevcut: ${failureCount}` },
        ...finalLogs
      ]);
    }
  };

  const savePreviewToLibrary = () => {
    if (!previewGame) return;
    
    // Check duplication
    if (games.some(g => g.id === previewGame.id)) {
      setResults([{ type: "error", text: `Girdiğiniz oyuna ait AppID (${previewGame.id}) kütüphanede zaten kayıtlı! Sadece bir kere ekleyebilirsiniz.` }]);
      return;
    }

    onImported(previewGame as Game);
    setResults([{ type: "success", text: `✨ "${previewGame.title}" oyunu başarıyla Kütüphaneye ve Ana Sayfaya yayınlandı!` }]);
    setPreviewGame(null);
    setInputText("");
  };

  const changePreviewField = (field: string, val: any) => {
    if (!previewGame) return;
    setPreviewGame(prev => {
      if (!prev) return null;
      return { ...prev, [field]: val };
    });
  };

  const changePreviewSysMinField = (field: keyof SystemRequirements, val: string) => {
    if (!previewGame) return;
    setPreviewGame(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sysMin: {
          ...prev.sysMin,
          [field]: val
        }
      };
    });
  };

  const changePreviewSysRecField = (field: keyof SystemRequirements, val: string) => {
    if (!previewGame) return;
    setPreviewGame(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sysRec: {
          ...prev.sysRec,
          [field]: val
        }
      };
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8 py-4">
      
      {/* Upper Information Banner */}
      <div className="relative bg-[#07090e] border border-slate-800/80 p-6 rounded-2xl overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Settings className="w-48 h-48 text-indigo-500 animate-[spin_40s_linear_infinite]" />
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Gelişmiş Yönetim İstasyonu
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight font-mono">
              YÖNETİCİ KONTROL PANELİ & ENTEGRATÖR
            </h2>
            <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-3xl">
              Grup arkadaşlarınız için portalı özelleştirin. Ana sayfadan tüm varsayılan oyunları sildik; artık kütüphaneyi 
              resmi Steam API üzerinden canlı bilgi çekerek, dilediğiniz <strong>online-fix.me</strong> çok oyunculu yamalarını 
              ekleyerek tamamen kendiniz inşa edebilirsiniz.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {games.length > 0 && (
              <button
                type="button"
                onClick={onClearCustomGames}
                className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-red-950/20 hover:bg-red-950/30 border border-red-500/30 text-red-400 hover:text-red-300 font-bold font-mono text-xs uppercase tracking-wide transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                TÜMÜNÜ SİL
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Fetcher (12 columns) */}
        <div className="lg:col-span-12 space-y-6">
          
          {/* Query section */}
          <div className="bg-[#090e18]/80 rounded-2xl p-6 border-2 border-cyan-500/20 shadow-2xl relative">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl" />
            
            <h3 className="text-sm font-black text-white uppercase tracking-widest font-mono flex items-center gap-2 mb-4">
              <Gamepad2 className="w-4 h-4 text-cyan-400" />
              1. ADIM: STEAM CO-OP VERİTABANINDAN SORGULAYIN VE EKLEYİN
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="autocomplete-container relative">
                <label className="block text-xs font-mono text-cyan-400 uppercase mb-2">
                  HIZLI STEAM OYUNU ARA (OTOMATİK TAMAMLAMA)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Oyun adını yazın (örn: Portal, Left 4 Dead)..."
                    className="w-full bg-slate-950/95 text-xs text-slate-100 placeholder-slate-600 pl-10 pr-4 py-3.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20 font-mono transition-all"
                  />
                  <div className="absolute left-3 top-3.5 text-slate-500">
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    ) : (
                      <Search className="w-4 h-4 text-cyan-500" />
                    )}
                  </div>
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-[#090d16] border border-slate-800 rounded-xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-800/60 backdrop-blur-xl">
                    {suggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setInputText(`https://store.steampowered.com/app/${item.id}`);
                          setSearchQuery(item.name);
                          setShowSuggestions(false);
                          handleFetchSteamDetails(item.id.toString());
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-cyan-950/30 transition-colors group cursor-pointer"
                      >
                        {item.tiny_image && (
                          <img
                            src={item.tiny_image}
                            alt={item.name}
                            className="w-12 h-6 object-cover rounded border border-slate-800 shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400 truncate font-mono">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            AppID: {item.id}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono text-cyan-400 uppercase mb-2">
                  BİLGİ
                </label>
                <div className="bg-slate-950/50 border border-slate-800/80 p-3 rounded-xl text-[11px] text-slate-400 font-sans leading-relaxed">
                  💡 <strong>Nasıl Çalışır?</strong> Arama kutusuna oyunun adını yazmaya başlayın. Çıkan sonuçlardan birine tıkladığınızda oyunun tüm bilgileri ve görselleri otomatik olarak Steam API'den çekilerek aşağıdaki düzenleme ekranına yüklenecektir.
                </div>
              </div>
            </div>

            <form onSubmit={executeExtraction} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-cyan-400 uppercase mb-2">
                  VEYA MANUEL TEKLİ/TOPLU EKLEME (BULK IMPORT)
                </label>
                <div className="relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Format: Online-Fix Linki | Steam Linki (Her satıra bir adet gelecek şekilde yazın)

Örnek satır:
https://online-fix.me/games/adventures/18075-far-far-west-po-seti.html | https://store.steampowered.com/app/3124540/Far_Far_West/"
                    rows={4}
                    className="w-full bg-slate-950/95 text-xs text-slate-100 placeholder-slate-600 p-4 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20 font-mono transition-all resize-y"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={loading || !inputText.trim()}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-lg font-mono"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Aramalar Üretiliyor...
                        </>
                      ) : (
                        <>
                          SORGULA & KÜTÜPHANEYE KAYDET
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                💡 <strong>Yepyeni Akıllı Ayrıştırıcı:</strong> Yapıştırdığınız satırdaki boru <code>|</code> karakterine göre Online-Fix linkini ve Steam App ID'sini otomatik eşleştirir. Tek bir satır girerseniz düzenleme panelini açar. Birden fazla satır girerek <strong>anında toplu ekleme</strong> yapabilirsiniz!
              </p>
            </form>

            {/* General Log Output */}
            {results.length > 0 && (
              <div className="mt-4 p-4 bg-slate-950/70 border border-slate-900 rounded-xl space-y-2 max-h-60 overflow-y-auto">
                {results.map((res, index) => (
                  <div key={index} className="flex items-start gap-2.5 text-xs font-mono">
                    {res.type === "success" ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <span className={res.type === "success" ? "text-slate-300" : "text-rose-400"}>
                      {res.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic preview / interactive editing stage */}
        {previewGame && (
          <SteamPreviewEditor
            previewGame={previewGame}
            changePreviewField={changePreviewField}
            changePreviewSysMinField={changePreviewSysMinField}
            changePreviewSysRecField={changePreviewSysRecField}
            savePreviewToLibrary={savePreviewToLibrary}
            onCancel={() => setPreviewGame(null)}
            GLOW_COLORS={GLOW_COLORS}
          />
        )}

        {/* Global Tag Management & Deactivation Area */}
        <TagsManagementDashboard
          games={games}
          deactivatedTags={deactivatedTags}
          onToggleDeactivateTag={onToggleDeactivateTag}
        />

        {/* Dynamic Games Management list inside Admin Panel */}
        <GamesListTable
          games={games}
          onLoadDefaults={onLoadDefaults}
          onStartEdit={handleStartEditGame}
          onDeleteGame={onDeleteGame}
        />

        {/* Dynamic Users Accounts Management panel inside Admin Panel */}
        <UserAccountsTable
          users={users}
          usersLoading={usersLoading}
          confirmDeleteUid={confirmDeleteUid}
          setConfirmDeleteUid={setConfirmDeleteUid}
          onDeleteUser={handleDeleteUser}
        />

        {/* Modal for editing a specific game details */}
        <GameEditModal
          editingGame={editingGame}
          onClose={() => setEditingGame(null)}
          onSave={handleSaveEditedGame}
          editTitle={editTitle}
          setEditTitle={setEditTitle}
          editTagline={editTagline}
          setEditTagline={setEditTagline}
          editDescription={editDescription}
          setEditDescription={setEditDescription}
          editSize={editSize}
          setEditSize={setEditSize}
          editPlayers={editPlayers}
          setEditPlayers={setEditPlayers}
          editSteamripUrl={editSteamripUrl}
          setEditSteamripUrl={setEditSteamripUrl}
          editImageUrl={editImageUrl}
          setEditImageUrl={setEditImageUrl}
          editGlowColor={editGlowColor}
          setEditGlowColor={setEditGlowColor}
          editTags={editTags}
          setEditTags={setEditTags}
          GLOW_COLORS={GLOW_COLORS}
        />

      </div>
    </div>
  );
}
