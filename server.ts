import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Helper to partition system requirements from HTML text cleanly
function parseSystemRequirements(html: string, type: "min" | "rec") {
  const extractSpecFromHtml = (htmlStr: string, keys: string[], fallback: string): string => {
    if (!htmlStr) return fallback;
    
    for (const key of keys) {
      const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const patterns = [
        new RegExp(`(?:${escapedKey})\\s*:\\s*<\\/strong>\\s*([^<\\n]+)`, 'i'),
        new RegExp(`(?:${escapedKey})\\s*<\\/strong>\\s*([^<\\n]+)`, 'i'),
        new RegExp(`(?:${escapedKey})\\s*:\\s*([^<\\n]+)`, 'i')
      ];
      for (const pattern of patterns) {
        const match = htmlStr.match(pattern);
        if (match && match[1]) {
          let val = match[1]
            .replace(/<[^>]*>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&nbsp;/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          if (val.startsWith(":")) val = val.substring(1).trim();
          if (val) return val;
        }
      }
    }
    
    // Plain text extraction fallback if list tags/styling are stripped
    const plainText = htmlStr.replace(/<[^>]*>/g, "\n");
    for (const key of keys) {
      const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const pattern = new RegExp(`(?:${escapedKey})\\s*:?\\s*([^\\n]+)`, 'i');
      const match = plainText.match(pattern);
      if (match && match[1]) {
        let val = match[1].trim();
        if (val.startsWith(":")) val = val.substring(1).trim();
        if (val) return val;
      }
    }
    
    return fallback;
  };

  if (type === "min") {
    return {
      cpu: extractSpecFromHtml(html, ["Processor", "İşlemci", "Islemci"], "Intel Core i5 / AMD Ryzen 3"),
      gpu: extractSpecFromHtml(html, ["Graphics", "Ekran Kartı", "Ekran Karti", "Ekran"], "NVIDIA GTX 960 / AMD R9"),
      ram: extractSpecFromHtml(html, ["Memory", "Bellek", "RAM", "Ram"], "8 GB RAM"),
      storage: extractSpecFromHtml(html, ["Storage", "Depolama", "Sabit Disk", "Kullanılabilir Alan"], "15 GB kullanılabilir alan")
    };
  } else {
    return {
      cpu: extractSpecFromHtml(html, ["Processor", "İşlemci", "Islemci"], "Intel Core i7 / AMD Ryzen 5"),
      gpu: extractSpecFromHtml(html, ["Graphics", "Ekran Kartı", "Ekran Karti", "Ekran"], "NVIDIA GTX 1070 / AMD RX 580"),
      ram: extractSpecFromHtml(html, ["Memory", "Bellek", "RAM", "Ram"], "16 GB RAM"),
      storage: extractSpecFromHtml(html, ["Storage", "Depolama", "Sabit Disk", "Kullanılabilir Alan"], "15 GB SSD önerilir")
    };
  }
}

// Helper to determine Turkish interface, voice, and subtitle support from Steam languages html
function parseSizeFromRequirements(minimumHtml: string, recommendedHtml: string): string {
  const washed = (minimumHtml + " " + recommendedHtml)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ");
  const match = washed.match(/(\d+(?:\.\d+)?\s*(?:GB|MB))/i);
  return match ? match[1].toUpperCase() : "20 GB";
}

function parsePlayersFromCategories(categories: string[]): string {
  const cats = categories.map(c => c.toLowerCase());
  if (cats.some(c => c.includes("online co-op") || c.includes("çevrimiçi co-op") || c.includes("çevrimiçi ortak"))) {
    return "1-4 Oyuncu (Co-op)";
  }
  if (cats.some(c => c.includes("co-op") || c.includes("ortak"))) {
    return "1-4 Oyuncu (Co-op)";
  }
  if (cats.some(c => c.includes("multi-player") || c.includes("çok oyunculu") || c.includes("multiplayer"))) {
    return "1-8 Oyuncu (Çevrimiçi)";
  }
  return "1-4 Oyuncu";
}

function parseLanguageSupport(supportedLanguagesHtml: string) {
  const cleanHtmlStr = (supportedLanguagesHtml || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  const hasTurkish = /Turk|Türk/i.test(cleanHtmlStr);
  
  let interfaceSupported = false;
  let audioSupported = false;
  let subtitlesSupported = false;

  if (hasTurkish) {
    interfaceSupported = true; 
    subtitlesSupported = true; 
    
    // Check if Turkish language has asterisk (*) denoting voice/audio support
    const audioRegex = /Turk[^,]*(?:<strong>)?\*(?:<\/strong>)?/i;
    if (audioRegex.test(supportedLanguagesHtml || "")) {
      audioSupported = true;
    }
  }

  return {
    supported: hasTurkish,
    interface: interfaceSupported,
    audio: audioSupported,
    subtitles: subtitlesSupported,
    rawLanguages: cleanHtmlStr
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize server-side Gemini client
  const aiClient = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      })
    : null;

  // API Route to proxy Steam AppDetails and enrich data via Gemini
  app.get("/api/steam-proxy", async (req, res) => {
    const { appid } = req.query;
    if (!appid || typeof appid !== "string") {
      return res.status(400).json({ error: "Missing appid parameter" });
    }

    try {
      console.log(`[SteamProxy] Fetching details for AppID: ${appid}`);
      
      // 1. Fetch main Steam AppDetails (including translations when available in steam backend)
      const steamResponse = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}&l=turkish`);
      if (!steamResponse.ok) {
        return res.status(steamResponse.status).json({ error: `Steam API returned status ${steamResponse.status}` });
      }
      const json = await steamResponse.json();
      
      if (!json[appid] || !json[appid].success) {
        return res.json({ success: false, error: "Steam API success is false for this appid" });
      }

      const data = json[appid].data;

      // Extract video trailer url
      let trailerUrl = "";
      if (data.movies && Array.isArray(data.movies) && data.movies.length > 0) {
        trailerUrl = data.movies[0]?.mp4?.max || data.movies[0]?.mp4?.max_quality || "";
      }

      // Extract 3 full-res screenshots
      const screenshots: string[] = [];
      if (data.screenshots && Array.isArray(data.screenshots)) {
        data.screenshots.slice(0, 3).forEach((sc: any) => {
          if (sc.path_full) screenshots.push(sc.path_full);
        });
      }

      // 2. Fetch public reviews for this appid on Steam (both Turkish & general to ensure we have content)
      let rawReviewsList: any[] = [];
      try {
        console.log(`[SteamProxy] Fetching public Steam reviews for AppID: ${appid}`);
        const reviewsResponse = await fetch(`https://store.steampowered.com/appreviews/${appid}?json=1&num_per_page=12&filter=all`);
        if (reviewsResponse.ok) {
          const reviewsJson = await reviewsResponse.json();
          if (reviewsJson.success && Array.isArray(reviewsJson.reviews)) {
            rawReviewsList = reviewsJson.reviews
              .filter((r: any) => r.voted_up === true && r.review && r.review.trim().length > 10)
              .slice(0, 5)
              .map((r: any) => ({
                author: r.author?.personaname || "Anonim Oyuncu",
                review: r.review.substring(0, 400).trim(),
                voted_up: r.voted_up
              }));
          }
        }
      } catch (revError) {
        console.warn(`[SteamProxy] Failed to fetch reviews for ${appid}:`, revError);
      }

      // 3. Extracted original properties
      const name = data.name || "";
      const descriptionOriginal = data.short_description || data.about_the_game || "Arkadaşlarınızla oynayabileceğiniz mükemmel bir çok oyunculu yapım.";
      const rawCategories = data.categories ? data.categories.map((c: any) => c.description) : [];
      const rawGenres = data.genres ? data.genres.map((g: any) => g.description) : [];
      
      // Combine genres & categories to build highly accurate tags automatically
      const generatedTags = Array.from(new Set([...rawGenres, ...rawCategories]))
        .filter(t => !["Single-player", "Tek Oyunculu", "Steam Cloud", "Steam Achievements", "Steam Başarımları"].includes(t))
        .slice(0, 6);

      // Parse system requirements cleanly using our bulletproof partitioner
      const minRequirementsHtml = data.pc_requirements?.minimum || "";
      const recRequirementsHtml = data.pc_requirements?.recommended || "";
      const sysMin = parseSystemRequirements(minRequirementsHtml, "min");
      const sysRec = parseSystemRequirements(recRequirementsHtml, "rec");

      // Extract raw parsed attributes for fallback
      const defaultSize = parseSizeFromRequirements(minRequirementsHtml, recRequirementsHtml);
      const defaultPlayers = parsePlayersFromCategories([...rawGenres, ...rawCategories]);
      let defaultRating = 4.5;
      if (data.metacritic && data.metacritic.score) {
        defaultRating = Number((data.metacritic.score / 20).toFixed(1));
      }

      // Parse Turkish interface/audio/subtitle support
      const supportedLanguagesHtml = data.supported_languages || "";
      const turkishSupport = parseLanguageSupport(supportedLanguagesHtml);

      // Default values before running translation
      let mainDescriptionTranslated = descriptionOriginal;
      let reviewsTranslated = [
        { author: "SteamOyuncu_1", comment: "Arkadaşlarınızla vakit geçirmek için harika bir coop oyun deneyimi, takım çalışması süper!", rating: 5 },
        { author: "ProCoop_Gamer", comment: "Kesinlikle tavsiye ederim. Online-fix yaması yükledikten sonra gruptakilerle kesintisiz bir çoklu oyuncu eğlencesi yaşıyoruz.", rating: 5 },
        { author: "Lobi_Kralı", comment: "Muhteşem atmosfer, harika mekanikler. Takım halinde oynaması bir başka zevkli.", rating: 5 }
      ];
      let playersEstimated = defaultPlayers;
      let ratingEstimated = defaultRating;
      let sizeEstimated = defaultSize;

      // 4. Gemini translations and reviews are removed as requested.
      // We will use standard default Turkish reviews and fallback data to run without any AI.
      mainDescriptionTranslated = descriptionOriginal;
      reviewsTranslated = [
        { author: "SteamOyuncu_1", comment: "Arkadaşlarınızla vakit geçirmek için harika bir coop oyun deneyimi, takım çalışması süper!", rating: 5 },
        { author: "ProCoop_Gamer", comment: "Kesinlikle tavsiye ederim. Online-fix yaması yükledikten sonra gruptakilerle kesintisiz bir çoklu oyuncu eğlencesi yaşıyoruz.", rating: 5 },
        { author: "Lobi_Kralı", comment: "Muhteşem atmosfer, harika mekanikler. Takım halinde oynaması bir başka zevkli.", rating: 5 }
      ];
      playersEstimated = defaultPlayers;
      ratingEstimated = defaultRating;
      sizeEstimated = defaultSize;

      // Return processed object
      return res.json({
        success: true,
        data: {
          name,
          header_image: data.header_image || "",
          trailer_url: trailerUrl,
          screenshots: screenshots,
          description: mainDescriptionTranslated || descriptionOriginal,
          pc_requirements: data.pc_requirements || {},
          sysMin,
          sysRec,
          genres: rawGenres,
          tags: generatedTags,
          developers: data.developers || [],
          publishers: data.publishers || [],
          price: data.price_overview ? (data.price_overview.final_formatted || data.price_overview.initial_formatted) : "Free / Ücretsiz",
          turkishSupport,
          steamReviews: reviewsTranslated,
          players: playersEstimated,
          rating: ratingEstimated,
          size: sizeEstimated
        }
      });
    } catch (error: any) {
      console.error("[SteamProxy] Error:", error);
      return res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Chat bot route deleted as AI has been removed from the platform.

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
