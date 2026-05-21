import * as React from "react";
import { useState, useEffect } from "react";
import { Game, SystemRequirements } from "../../gamesData";
import { 
  Sparkles, Plus, AlertCircle, CheckCircle, Loader2, ArrowRight, Trash2, 
  Gamepad2, Layers, Settings, Globe, ShieldAlert, Cpu, HardDrive, Info, 
  RefreshCw, Check, Link2, Eye, HelpCircle, FileText, Users, UserMinus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { collection, query, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase";

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
  const [activeTestingId, setActiveTestingId] = useState<string | null>(null);
  
  // Custom alert messages
  const [results, setResults] = useState<{ type: "success" | "error"; text: string }[]>([]);

  // Enriched interactive item configuration state
  const [previewGame, setPreviewGame] = useState<Omit<Game, "id"> & { id: number } | null>(null);

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

        // Set state to trigger the rich Interactive Editor (Slogan tagline is removed as requested by user)
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
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
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

            <form onSubmit={executeExtraction} className="space-y-4">
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
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-lg"
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
        <AnimatePresence>
          {previewGame && (
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
                  <FileText className="w-4 h-4 text-cyan-400" />
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
                    onClick={() => setPreviewGame(null)}
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
          )}
        </AnimatePresence>

        {/* Global Tag Management & Deactivation Area */}
        <div className="lg:col-span-12 border-t border-slate-800/60 pt-6">
          <div className="bg-[#090e18]/85 rounded-2xl p-6 border border-slate-800/80 shadow-2xl space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-cyan-400" />
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    KÜRESEL ETİKET YÖNETİMİ & DEAKTİVASYON MASASI
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                    Kütüphanedeki oyunlarda bulunan her etiketi kutu kutu düzenleyin. Pasif etiketler ana sayfadaki aramalardan, listelerden ve oyun kartlarından tamamen gizlenir.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400">
                  {deactivatedTags.length} Deaktif
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  {Math.max(0, Array.from(new Set(games.flatMap(g => g.tags || []))).filter(t => !deactivatedTags.some(d => d.toLowerCase().trim() === t.toLowerCase().trim())).length)} Aktif
                </span>
              </div>
            </div>

            {/* Tags Grid of pills */}
            {(() => {
              const allUniqueTagsAcrossGames = Array.from(
                new Set(games.flatMap(g => g.tags || []))
              ).filter((t): t is string => !!t);

              const fallbackTags = [
                "Eşli Oyun", 
                "Hayatta Kalma", 
                "Roguelike", 
                "Aksiyon", 
                "Strateji", 
                "Açık Dünya", 
                "Bilim Kurgu", 
                "Simülasyon", 
                "Platformcu"
              ];

              const tagsToShow = allUniqueTagsAcrossGames.length > 0 ? allUniqueTagsAcrossGames : fallbackTags;

              return (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2.5">
                    {tagsToShow.map((tag) => {
                      const isDeactivated = deactivatedTags.some(
                        (d) => d.toLowerCase().trim() === tag.toLowerCase().trim()
                      );
                      
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => onToggleDeactivateTag(tag)}
                          className={`relative px-4 py-2.5 rounded-xl border text-xs font-bold font-sans tracking-wide transition-all duration-300 flex items-center gap-2.5 cursor-pointer group shadow-sm ${
                            isDeactivated
                              // Deactivated state style: red look
                              ? "bg-red-950/20 border-red-500/30 text-red-400 hover:bg-slate-900/40 hover:border-slate-800"
                              // Active state style: emerald/cyan/slate glow
                              : "bg-slate-900/60 border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:border-emerald-500/40 hover:shadow-emerald-500/5 hover:-translate-y-0.5"
                          }`}
                          title={isDeactivated ? `${tag} etiketini aktif etmek için tıklayın` : `${tag} etiketini deaktif etmek için tıklayın`}
                        >
                          {isDeactivated ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-red-500 ring-4 ring-red-500/20 shrink-0" />
                              <span className="opacity-60">{tag}</span>
                              <span className="text-[9px] font-mono font-black text-red-500/80 uppercase ml-1 px-1 py-0.25 bg-red-500/10 rounded border border-red-500/20">
                                DEAKTİF
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 shrink-0 animate-pulse" />
                              <span>{tag}</span>
                              <span className="text-[9px] font-mono font-medium text-emerald-400/80 uppercase ml-1 px-1 py-0.25 bg-emerald-500/10 rounded">
                                AKTİF
                              </span>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  {tagsToShow.length === 0 && (
                    <p className="text-xs text-slate-500 font-mono italic">
                      Yüklü oyun veya etiket bulunamadı.
                    </p>
                  )}
                  
                  <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-900 text-slate-400 text-[11px] leading-relaxed font-sans">
                    💡 <strong>Seçim Tavsiyesi & Bilgilendirme:</strong> Yukarıdaki kutulardan herhangi birine <strong>tıklayarak</strong> durumunu anında değiştirebilirsiniz. Bir etiketi deaktif ettiğinizde, o etiket kütüphanedeki oyun kartlarından tamamen gizlenir, ana sayfa kategori filtrelerinden çıkartılır ve arama motorlarında bu anahtar kelimeye göre arama yapılması engellenir.
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Dynamic Games Management list inside Admin Panel */}
        <div className="lg:col-span-12 border-t border-slate-800/60 pt-6">
          <div className="bg-[#090e18]/80 rounded-2xl p-6 border border-slate-800/80 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-indigo-400" />
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Şu Anda Kütüphanede Kayıtlı Tüm Oyunlar ({games.length})
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                // Düzenlemek için yanlarındaki kontrolleri kullanın
              </span>
            </div>

            {games.length === 0 ? (
              <div className="text-center py-12 p-4 bg-slate-950/40 rounded-xl border border-slate-900/40">
                <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-bold">Kütüphanede kayıtlı hiç oyun bulunmuyor!</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                  Ana sayfa tertemiz durumda. Yukarıdaki sorgu alanına bir AppID girip bilgileri çekerek ilk oyunu siz ekleyin ya da "Hazır Şablonu Yükle" diyerek örnek küreyi anında geri getirin.
                </p>
                <button
                  onClick={onLoadDefaults}
                  className="mt-4 inline-flex items-center gap-1.5 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white font-bold font-sans text-xs uppercase cursor-pointer transition-all shadow-md shadow-indigo-500/15 border border-indigo-400/20 hover:scale-102 hover:brightness-110 active:scale-98"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Hazır Şablonu Yükle
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-slate-500 text-[10px] uppercase">
                      <th className="py-2.5 px-2">Kapak</th>
                      <th className="py-2.5 px-2">AppID / Tanım</th>
                      <th className="py-2.5 px-2">Oyun Adı</th>
                      <th className="py-2.5 px-2">Boyut</th>
                      <th className="py-2.5 px-2">Online-Fix Linki</th>
                      <th className="py-2.5 px-2 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {games.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-3 px-2">
                          <img
                            src={g.imageUrl}
                            alt=""
                            className="w-12 h-6 object-cover rounded bg-slate-900 border border-slate-800"
                            referrerPolicy="no-referrer"
                          />
                        </td>
                        <td className="py-3 px-2 text-slate-500 text-[10px]">
                          {g.id}
                        </td>
                        <td className="py-3 px-2 font-bold text-white max-w-[150px] truncate">
                          {g.title}
                        </td>
                        <td className="py-3 px-2 text-[11px]">
                          {g.size}
                        </td>
                        <td className="py-3 px-2 max-w-[200px] truncate font-mono text-[10px] text-emerald-400">
                          <a
                            href={g.steamripUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-1.5"
                          >
                            <Link2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            {g.steamripUrl.slice(0, 32)}...
                          </a>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleStartEditGame(g)}
                              className="p-1 px-2.5 rounded bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 hover:text-cyan-300 transition-all font-bold text-[10px] uppercase cursor-pointer"
                            >
                              Düzenle
                            </button>
                            <button
                              onClick={() => onDeleteGame(g.id)}
                              className="p-1 px-2.5 rounded bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 hover:text-red-300 transition-all font-bold text-[10px] uppercase cursor-pointer"
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Users Accounts Management panel inside Admin Panel */}
        <div className="lg:col-span-12 border-t border-slate-800/60 pt-6">
          <div className="bg-[#090e18]/80 rounded-2xl p-6 border border-slate-800/80 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-400" />
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Sistemdeki Oyuncu / Gamers Hesapları ({users.length})
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                // Pasif veya gereksiz hesapları temizleyin
              </span>
            </div>

            {usersLoading ? (
              <div className="text-center py-6">
                <Loader2 className="w-6 h-6 text-pink-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-mono">Hesap havuzu okunuyor...</p>
              </div>
            ) : users.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-3 font-sans">Kayıtlı hiçbir kullanıcı hesabı bulunamadı.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-slate-500 text-[10px] uppercase">
                      <th className="py-2.5 px-2">Karakter</th>
                      <th className="py-2.5 px-2">Durum</th>
                      <th className="py-2.5 px-2">Gamer Nick / Adı</th>
                      <th className="py-2.5 px-2">UID Anahtarı</th>
                      <th className="py-2.5 px-2 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {users.map((u) => {
                      const isConfirming = confirmDeleteUid === u.uid;
                      return (
                        <tr key={u.uid} className="hover:bg-slate-950/40 transition-colors">
                          <td className="py-2.5 px-2">
                            <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${u.avatarBg || "from-slate-700 to-slate-900"} text-white font-bold flex items-center justify-center text-[10px] border border-white/10 shrink-0`}>
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                          </td>
                          <td className="py-2.5 px-2">
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              u.isOnline 
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/10" 
                                : "bg-slate-900 text-slate-500 border border-slate-800/60"
                            }`}>
                              {u.isOnline ? "AKTİF" : "DEAKTİF / PASİF"}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 font-bold text-slate-200">
                            {u.name}
                          </td>
                          <td className="py-2.5 px-2 text-slate-500 text-[10px] font-mono select-all">
                            {u.uid}
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            {isConfirming ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <span className="text-[10px] text-rose-400 font-bold font-sans animate-pulse">SİLİNSİN Mİ?</span>
                                <button
                                  onClick={() => handleDeleteUser(u.uid)}
                                  className="p-1 px-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[9px] uppercase cursor-pointer transition-colors"
                                >
                                  Evet, SİL
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteUid(null)}
                                  className="p-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-[9px] uppercase cursor-pointer"
                                >
                                  İptal
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteUid(u.uid)}
                                className="p-1 px-2 rounded bg-rose-950/20 hover:bg-rose-950/50 border border-rose-500/20 text-rose-400 hover:text-rose-300 transition-all font-bold text-[9px] uppercase cursor-pointer"
                                title="Gamer hesabını sistemden sil"
                              >
                                Hesabı Sil
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {editingGame && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingGame(null)}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              />

              {/* Modal Container */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 text-left space-y-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold">
                      <Gamepad2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        Oyunu Düzenle
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        Seçilen oyunun tüm kütüphane bilgilerini ve parametrelerini özelleştirin.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingGame(null)}
                    type="button"
                    className="p-1 px-2 text-[10px] font-bold uppercase rounded bg-slate-900 hover:bg-slate-800 text-slate-400 cursor-pointer"
                  >
                    Kapat
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSaveEditedGame} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* App ID (Disabled) */}
                    <div>
                      <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                        Steam App ID (Değiştirilemez)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={editingGame.id}
                        className="w-full bg-slate-900/40 border border-slate-900 rounded-lg p-2.5 text-xs text-slate-500 font-mono"
                      />
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">
                        Oyun Adı <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
                      />
                    </div>

                    {/* Tagline */}
                    <div className="md:col-span-2">
                      <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">
                        Özet Spot / Tagline
                      </label>
                      <input
                        type="text"
                        value={editTagline}
                        onChange={(e) => setEditTagline(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
                        placeholder="Oyun için kısa, çekici bir tanıtıcı ifade"
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">
                        Detaylı Açıklama
                      </label>
                      <textarea
                        rows={3}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 resize-none"
                        placeholder="Oyunun hikayesi veya oynanış detayları..."
                      />
                    </div>

                    {/* Size */}
                    <div>
                      <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">
                        Dosya Boyutu
                      </label>
                      <input
                        type="text"
                        value={editSize}
                        onChange={(e) => setEditSize(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
                        placeholder="Örn: 45 GB veya 120 GB"
                      />
                    </div>

                    {/* Players Count info */}
                    <div>
                      <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">
                        Oyuncu Ölçeği
                      </label>
                      <input
                        type="text"
                        value={editPlayers}
                        onChange={(e) => setEditPlayers(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
                        placeholder="Örn: 1-4 Oyuncu, Tek Oyunculu"
                      />
                    </div>

                    {/* SteamRIP URL */}
                    <div className="md:col-span-2">
                      <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">
                        SteamRIP / İndirme Adresi
                      </label>
                      <input
                        type="text"
                        value={editSteamripUrl}
                        onChange={(e) => setEditSteamripUrl(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-emerald-400 font-mono"
                        placeholder="https://online-fix.me/games/..."
                      />
                    </div>

                    {/* Image URL */}
                    <div className="md:col-span-2">
                      <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">
                        Görsel Adresi (ImageUrl)
                      </label>
                      <input
                        type="text"
                        value={editImageUrl}
                        onChange={(e) => setEditImageUrl(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 font-mono"
                      />
                    </div>

                    {/* Glow Colors preset selection */}
                    <div>
                      <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">
                        Aura & Neon Rengi
                      </label>
                      <select
                        value={editGlowColor}
                        onChange={(e) => setEditGlowColor(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
                      >
                        {GLOW_COLORS.map((color) => (
                          <option key={color.value} value={color.value}>
                            {color.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-slate-300 text-[10px] font-bold uppercase mb-1">
                        Kategoriler / Etiketler (Virgülle Ayırın)
                      </label>
                      <input
                        type="text"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
                        placeholder="Örn: Aksiyon, Hayatta Kalma, Co-op"
                      />
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900">
                    <button
                      type="button"
                      onClick={() => setEditingGame(null)}
                      className="px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-[11px] font-bold uppercase transition-all"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-[11px] font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/10"
                    >
                      <Check className="w-3.5 h-3.5" /> Değişiklikleri Kaydet
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
