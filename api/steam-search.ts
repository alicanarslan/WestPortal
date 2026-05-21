export default async function handler(req: any, res: any) {
  const { term } = req.query;
  if (!term || typeof term !== "string") {
    return res.status(400).json({ error: "Missing term parameter" });
  }

  try {
    const steamResponse = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=turkish&cc=TR`
    );
    if (!steamResponse.ok) {
      return res.status(steamResponse.status).json({ error: `Steam API returned status ${steamResponse.status}` });
    }
    const json = await steamResponse.json();
    return res.status(200).json({
      success: true,
      items: json.items || []
    });
  } catch (error: any) {
    console.error("[SteamSearch] Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
