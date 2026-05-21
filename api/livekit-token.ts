import { AccessToken } from "livekit-server-sdk";

export default async function handler(req: any, res: any) {
  const { room, identity } = req.query;
  if (!room || !identity || typeof room !== "string" || typeof identity !== "string") {
    return res.status(400).json({ error: "Missing room or identity query parameters" });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !livekitUrl) {
    return res.status(200).json({
      success: false,
      message: "Livekit API credentials not configured. Falling back to local Web Audio Sandbox."
    });
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity: identity,
      name: identity,
    });
    
    at.addGrant({
      roomJoin: true,
      room: room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    return res.status(200).json({
      success: true,
      token,
      url: livekitUrl
    });
  } catch (error: any) {
    console.error("[LivekitToken] Error generating token:", error);
    return res.status(500).json({ error: error.message || "Internal token server error" });
  }
}
