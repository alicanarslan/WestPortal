export interface SystemRequirements {
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
}

export interface TurkishLanguageSupport {
  supported: boolean;
  interface: boolean;
  audio: boolean;
  subtitles: boolean;
  rawLanguages?: string;
}

export interface SteamReview {
  author: string;
  comment: string;
  rating: number;
}

export interface Game {
  id: number;
  title: string;
  tagline?: string;
  description: string;
  features: string[];
  tags: string[];
  rating: number; // 1-5
  steamripUrl: string;
  glowColor: string; // for animated neon shadow tags and details
  players: string;
  size: string;
  sysMin: SystemRequirements;
  sysRec: SystemRequirements;
  bannerGradient: string;
  imageUrl: string;
  youtubeId?: string;
  trailerUrl?: string;
  screenshots?: string[];
  steamUrl: string;
  turkishSupport?: TurkishLanguageSupport;
  steamReviews?: SteamReview[];
  forbiddenTags?: string[];
}

export const GAMES_DATA: Game[] = [
  {
    id: 1604030,
    title: "V Rising",
    tagline: "Yüz yıllık uykudan sonra vampir olarak uyanın ve şatonuzu inşa edin!",
    description: "V Rising'de zayıf bir vampir olarak uyanın. Kan avlayın, yakıcı güneş ışığından kaçının, görkemli bir Gotik şato inşa edin ve canavarlar ve rakip oyuncularla dolu açık dünyada kendi vampir imparatorluğunuzu kurarak mutlak lord haline gelin.",
    features: ["Gotik Şato İnşa Etme", "Gerçek Zamanlı Aksiyon Savaş Mekanikleri", "Güneş Işığı ve Kan Susuzluğu Sistemi", "Co-op Klanlar ve PVP Savaşları"],
    tags: ["Vampir", "Hayatta Kalma", "Açık Dünya", "Co-op"],
    rating: 4.8,
    steamripUrl: "https://online-fix.me/games/survival/16997-v-rising-po-seti.html",
    glowColor: "from-purple-700 to-indigo-600",
    players: "1-40 Oyuncu",
    size: "15 GB",
    sysMin: { cpu: "Intel Core i5-6600 / AMD Ryzen 5 1500X", gpu: "NVIDIA GTX 770 / AMD R9 280 (2GB)", ram: "12 GB RAM", storage: "15 GB kullanılabilir alan" },
    sysRec: { cpu: "Intel Core i5-11600K / AMD Ryzen 5 5600X", gpu: "NVIDIA GTX 1070 / AMD RX 590 (8GB)", ram: "16 GB RAM", storage: "15 GB SSD" },
    bannerGradient: "linear-gradient(135deg, #3b0764, #4f46e5)",
    imageUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1604030/header.jpg",
    steamUrl: "https://store.steampowered.com/app/1604030/V_Rising"
  },
  {
    id: 848450,
    title: "Subnautica: Below Zero",
    tagline: "4546B gezegeninin buz gibi sualtı derinliklerinde hayatta kalın.",
    description: "Subnautica: Below Zero'da kutup bölgesinin tehlikeli su altı dünyasına dalın. Hayatta kalmak için ekipman üretin, yırtıcı canlılardan kaçının ve gezegenin derinliklerinde gizlenen kayıp araştırma ekibinin ardındaki gizemi çözün.",
    features: ["Göz Alıcı Kutup Ekosistemi", "Üs İnşa Etme ve Araç Üretimi", "Gizemli Uzaylı Teknolojileri", "Muhteşem Ses Tasarımı"],
    tags: ["Hayatta Kalma", "Sualtı", "Açık Dünya", "Bilim Kurgu"],
    rating: 4.7,
    steamripUrl: "https://online-fix.me/games/survival/18049-subnautica-below-zero-po-seti.html",
    glowColor: "from-cyan-500 to-blue-400",
    players: "Tek Oyunculu",
    size: "15 GB",
    sysMin: { cpu: "Intel Core i3 / AMD Ryzen 3 2.6Ghz+", gpu: "NVIDIA GTX 1050 Ti / AMD RX 560", ram: "8 GB RAM", storage: "15 GB kullanılabilir alan" },
    sysRec: { cpu: "Intel Core i5 / AMD Ryzen 5 3.0Ghz+", gpu: "NVIDIA GTX 1660 / AMD RX 590", ram: "16 GB RAM", storage: "15 GB SSD" },
    bannerGradient: "linear-gradient(135deg, #0891b2, #0284c7)",
    imageUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/848450/header.jpg",
    steamUrl: "https://store.steampowered.com/app/848450/Subnautica_Below_Zero/"
  },
  {
    id: 632360,
    title: "Risk of Rain 2",
    tagline: "Yabancı bir gezegende her saniye zorlaşan kaos ortamından kaçın!",
    description: "Risk of Rain 2, çılgın canavar dalgalarına karşı amansızca hayatta kalmaya çalıştığınız ikonik bir üçüncü şahıs roguelike oyunudur. Eşyaları üst üste istifleyin, inanılmaz hızlara erişin ve zamanla artan zorluk seviyesine karşı koyun.",
    features: ["Düzinelerce Benzersiz Karakter", "Eşya Sinerjileri ile Sınırsız Güç", "Kaotik ve Unutulmaz Epik Boss Savaşları", "3D Elektronik Müzikler"],
    tags: ["Roguelike", "Aksiyon", "Nişancı", "Co-op"],
    rating: 4.9,
    steamripUrl: "https://online-fix.me/games/shooter/16146-risk-of-rain-2-po-seti.html",
    glowColor: "from-orange-500 to-yellow-500",
    players: "1-4 Oyuncu",
    size: "12 GB",
    sysMin: { cpu: "Intel Core i3-6100 / AMD FX-8350", gpu: "NVIDIA GTX 580 / AMD HD 7870", ram: "4 GB RAM", storage: "4 GB kullanılabilir alan" },
    sysRec: { cpu: "Intel Core i5-4670K / AMD Ryzen 5 1500X", gpu: "NVIDIA GTX 970 / AMD RX 480", ram: "8 GB RAM", storage: "4 GB SSD" },
    bannerGradient: "linear-gradient(135deg, #7c2d12, #fbbf24)",
    imageUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/632360/header.jpg",
    steamUrl: "https://store.steampowered.com/app/632360/Risk_of_Rain_2"
  },
  {
    id: 1966720,
    title: "Lethal Company",
    tagline: "Eski uydulardan hurda toplayın, kar hedeflerini karşılayın ve hayatta kalın!",
    description: "Endüstrileşmiş uydulardan hurda toplamakla görevli sözleşmeli bir işçisiniz. Şirketin günlük kotalarını karşılamak için tehlikelerle dolu tesislerin derinliklerini keşfedin, canavarlarla karşılaşın ve ekibinizi koruyun.",
    features: ["Gerçekçi Yakınlık Sesi (Proximity Chat)", "Yoğun ve Atmosferik Korku Ögeleri", "Derin Kar Hedefleri Yönetimi", "Eğlenceli Telsiz ve Ekip İletişimi"],
    tags: ["Korku", "Co-op", "Çok Oyunculu", "Hayatta Kalma"],
    rating: 4.9,
    steamripUrl: "https://online-fix.me/games/survival/17498-lethal-company-po-seti.html",
    glowColor: "from-amber-600 to-red-600",
    players: "1-4 Oyuncu (Modlarla daha fazla)",
    size: "1 GB",
    sysMin: { cpu: "Intel Core i5-7400 @ 3.00GHz", gpu: "NVIDIA GeForce GTX 1050", ram: "4 GB RAM", storage: "2 GB kullanılabilir alan" },
    sysRec: { cpu: "Intel Core i5-10400", gpu: "NVIDIA GeForce GTX 1660", ram: "8 GB RAM", storage: "2 GB SSD" },
    bannerGradient: "linear-gradient(135deg, #451a03, #b91c1c)",
    imageUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1966720/header.jpg",
    steamUrl: "https://store.steampowered.com/app/1966720/Lethal_Company/"
  },
  {
    id: 553850,
    title: "Helldivers 2",
    tagline: "Süper Dünya için demokrasi mücadelesine galaksinin dört bir yanından katılın!",
    description: "Evrenin en amansız ordularına karşı arkadaşlarınızla özgürlük mücadelesi verin. Stratejik yıkıcı silahları gökten çağırın, düşman üslerini darmadağın edin ve gerçek zamanlı taktiksel savaşta bir kahraman olun.",
    features: ["Dinamik Galaktik Kampanya", "Sınırsız Stratejik Destek Çağrıları", "Taktiksel ve Yoğun Dost Ateşi Savaşları", "Yüksek Yoğunluklu Aksiyon"],
    tags: ["Aksiyon", "Nişancı", "Multiplayer", "Co-op"],
    rating: 4.5,
    steamripUrl: "https://online-fix.me/index.php?do=search&subaction=search&story=Helldivers%202",
    glowColor: "from-yellow-500 to-blue-600",
    players: "1-4 Oyuncu",
    size: "100 GB",
    sysMin: { cpu: "Intel Core i7-4790K / AMD Ryzen 5 1500X", gpu: "NVIDIA GTX 1050 Ti / AMD RX 470 (4GB)", ram: "8 GB RAM", storage: "100 GB kullanılabilir alan" },
    sysRec: { cpu: "Intel Core i7-9700K / AMD Ryzen 7 3700X", gpu: "NVIDIA RTX 2060 / AMD RX 6600 XT", ram: "16 GB RAM", storage: "100 GB SSD" },
    bannerGradient: "linear-gradient(135deg, #1e293b, #ca8a04)",
    imageUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/553850/header.jpg",
    steamUrl: "https://store.steampowered.com/app/553850/HELLDIVERS_2/"
  },
  {
    id: 892970,
    title: "Valheim",
    tagline: "Viking arafında şan ve şeref dolu bir hayatta kalma destanı yazın!",
    description: "İskandinav mitolojisinden esinlenen geniş, rastgele oluşturulmuş bir dünyada Viking hayatta kalma efsanesini inşa edin. Gemiler tasarlayın, kaleler yapın ve Odin'in kadim düşmanlarını alt ederek gücünüzü tanrılara kanıtlayın.",
    features: ["Voxel Tabanlı Detaylı İnşaat", "Mistik İskandinav Patron (Boss) Savaşları", "Gemi Yapımı ve Okyanus Keşfi", "10 Kişiye Kadar Eşli Oyun"],
    tags: ["Hayatta Kalma", "Açık Dünya", "Viking", "Rol Yapma"],
    rating: 4.8,
    steamripUrl: "https://online-fix.me/games/survival/16281-valheim-po-seti.html",
    glowColor: "from-emerald-500 to-teal-400",
    players: "1-10 Oyuncu",
    size: "5 GB",
    sysMin: { cpu: "Dual Core 2.6 GHz", gpu: "NVIDIA GeForce GTX 950 / AMD Radeon R9 280", ram: "8 GB RAM", storage: "5 GB kullanılabilir alan" },
    sysRec: { cpu: "Intel Core i5 3GHz+", gpu: "NVIDIA GeForce GTX 1060 / AMD Radeon RX 580", ram: "16 GB RAM", storage: "5 GB SSD" },
    bannerGradient: "linear-gradient(135deg, #064e3b, #0f766e)",
    imageUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/892970/header.jpg",
    steamUrl: "https://store.steampowered.com/app/892970/Valheim/"
  },
  {
    id: 602960,
    title: "Barotrauma",
    tagline: "Jüpiter'in sularla kaplı uydusu Europa'da denizaltınızı yönetin ve hayatta kalın!",
    description: "Barotrauma, okyanus derinliklerinde geçen 2D fütüristik bir denizaltı simülatörüdür. Reaktörü kontrol edin, sızıntıları onarın, canavarlarla yüzleşin ve en önemlisi; ekibinizin içindeki gizli hainlere karşı tetikte olun!",
    features: ["Gerçekçi Basınç ve Fizik Sistemleri", "Hain Rolü (Traitor Modu) ile Eğlence", "Denizaltı Kablolama ve Otomasyon", "Gelişmiş Tıbbi Tedavi Simülasyonu"],
    tags: ["Simülasyon", "Denizaltı", "Co-op", "Kaotik"],
    rating: 4.8,
    steamripUrl: "https://online-fix.me/games/survival/16310-barotrauma-po-seti.html",
    glowColor: "from-blue-900 to-teal-600",
    players: "1-16 Oyuncu",
    size: "3 GB",
    sysMin: { cpu: "Dual Core 2.4 GHz", gpu: "VRAM 2 GB / DX11", ram: "4 GB RAM", storage: "3 GB kullanılabilir alan" },
    sysRec: { cpu: "Quad Core 3.0 GHz", gpu: "GeForce GTX 950 / Radeon R9 370 (4 GB)", ram: "8 GB RAM", storage: "3 GB SSD" },
    bannerGradient: "linear-gradient(135deg, #1e3a8a, #0d9488)",
    imageUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/602960/header.jpg",
    steamUrl: "https://store.steampowered.com/app/602960/Barotrauma"
  },
  {
    id: 1245620,
    title: "Elden Ring",
    tagline: "Limgrave topraklarında kaderinizi çizin ve Elden Lordu ünvanını kuşanın!",
    description: "FromSoftware tarafından yaratılan başyapıt niteliğindeki Elden Ring, büyüleyici, uçsuz bucaksız bir fantezi dünyasında geçmektedir. Arkadaşlarınızla parmak izi çağrıları yaparak eşli oyun modunda boss'ları alt edin.",
    features: ["Olağanüstü Geniş ve Büyülü Açık Dünya", "Zorlu ve Tatmin Edici Savaş Tasarımı", "Yüzlerce Silah, Büyü ve Zırh Çeşidi", "Çevrimiçi Eşli Patron Mücadeleleri"],
    tags: ["Rol Yapma", "Açık Dünya", "Zorlu", "Aksiyon"],
    rating: 4.9,
    steamripUrl: "https://online-fix.me/index.php?do=search&subaction=search&story=Elden%20Ring",
    glowColor: "from-yellow-600 to-amber-700",
    players: "1-4 Oyuncu",
    size: "60 GB",
    sysMin: { cpu: "Intel Core i5-8400 / AMD Ryzen 3 3300X", gpu: "NVIDIA GTX 1060 (3GB) / AMD RX 580 (4GB)", ram: "12 GB RAM", storage: "60 GB kullanılabilir alan" },
    sysRec: { cpu: "Intel Core i7-8700K / AMD Ryzen 5 3600X", gpu: "NVIDIA GTX 1070 (8GB) / AMD RX Vega 56", ram: "16 GB RAM", storage: "60 GB SSD" },
    bannerGradient: "linear-gradient(135deg, #451a03, #ca8a04)",
    imageUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg",
    steamUrl: "https://store.steampowered.com/app/1245620/ELDEN_RING/"
  }
];
