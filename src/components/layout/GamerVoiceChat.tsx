import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, MicOff, PhoneOff, Volume2, ShieldAlert, Signal, 
  User, CheckCircle2, Radio, Activity, Sparkles, Maximize2
} from "lucide-react";
import { db } from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
// We import dynamically or normally. Since we installed it, we can import normally.
import { Room, RoomEvent, Participant, LocalParticipant, RemoteParticipant, Track } from "livekit-client";

// Define preset voice channels
export interface VoiceChannel {
  id: string;
  name: string;
  count: number;
}

export const PRESET_VOICE_CHANNELS: VoiceChannel[] = [
  { id: "genel-ses", name: "📢 Genel Ses Lobi", count: 0 },
  { id: "vrising-ses", name: "⚔️ Özel Ses Lobi", count: 0 }
];

interface GamerVoiceChatProps {
  gamerProfile: any;
  onlinePlayers: any[]; // connected players in portal to identify who is in each room
  activeVoiceChannelId: string | null;
  onJoinChannel: (channelId: string | null) => void;
  isDarkMode?: boolean;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  isMuted?: boolean;
  onMuteToggle?: (muted: boolean) => void;
}

export default function GamerVoiceChat({ 
  gamerProfile, 
  onlinePlayers,
  activeVoiceChannelId,
  onJoinChannel,
  isDarkMode = true,
  isMinimized = false,
  onToggleMinimize,
  isMuted: propMuted,
  onMuteToggle
}: GamerVoiceChatProps) {
  const [internalMuted, setInternalMuted] = useState(false);
  const isMuted = propMuted !== undefined ? propMuted : internalMuted;
  const setIsMuted = (value: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof value === "function" ? value(isMuted) : value;
    if (onMuteToggle) {
      onMuteToggle(next);
    } else {
      setInternalMuted(next);
    }
  };
  const [connectionState, setConnectionState] = useState<"disconnected" | "connecting" | "connected" | "failed">("disconnected");
  const [isDemo, setIsDemo] = useState(false);
  const [canPlayAudio, setCanPlayAudio] = useState(true);
  
  // Ref tracking for join/leave sounds
  const prevOccupantsRef = useRef<string[]>([]);
  const isFirstLoadRef = useRef(true);
  
  // Audio level representations
  const [localAudioLevel, setLocalAudioLevel] = useState<number>(0);
  const [participantSpeakers, setParticipantSpeakers] = useState<Record<string, { isSpeaking: boolean; audioLevel: number }>>({});

  // Refs for tracking active objects
  const roomRef = useRef<Room | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const latestChannelIdRef = useRef<string | null>(null);

  // Sync latest channel ID ref synchronously in the render phase to prevent race conditions during transitions
  latestChannelIdRef.current = activeVoiceChannelId;

  const activeChannel = PRESET_VOICE_CHANNELS.find(c => c.id === activeVoiceChannelId);

  // Firestore update helper on connection/disconnection
  const updateFirebaseVoiceState = async (channelId: string | null, mutedState: boolean) => {
    if (!gamerProfile?.uid) return;
    try {
      const userRef = doc(db, "users", gamerProfile.uid);
      await setDoc(userRef, {
        activeVoiceChannel: channelId,
        isMuted: mutedState,
        lastVoiceActive: new Date()
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore voice state update error:", err);
    }
  };

  // 1. Handle component unmount cleanup
  useEffect(() => {
    return () => {
      cleanupAudio(true);
    };
  }, []);

  // 2. LiveKit and Web Audio API initialization logic
  useEffect(() => {
    if (!activeVoiceChannelId) {
      cleanupAudio(false);
      setConnectionState("disconnected");
      return;
    }

    setConnectionState("connecting");
    setIsMuted(false);
    setCanPlayAudio(true);

    // Call server endpoint to generate access token
    const fetchTokenAndConnect = async () => {
      try {
        const response = await fetch(
          `/api/livekit-token?room=${activeVoiceChannelId}&identity=${encodeURIComponent(gamerProfile?.username || "GamerPlayer")}`
        );
        const result = await response.json();

        if (result.success && result.token && result.url) {
          // WE HAVE REAL CREDS - CONNECT TO PRODUCTION LIVEKIT SERVER
          setIsDemo(false);
          await connectToLiveKit(result.token, result.url);
        } else {
          // NO CREDENTIALS CONFIGURED - FALLBACK TO HIGH-FIDELITY LOCAL AUDIO SANDBOX
          console.log("[VoiceChat] LiveKit unconfigured. Falling back to local Web Audio Sandbox.");
          setIsDemo(true);
          await connectToLocalAudioSandbox();
        }
      } catch (err) {
        console.warn("[VoiceChat] Connection fetch failed, using local fallback:", err);
        setIsDemo(true);
        await connectToLocalAudioSandbox();
      }
    };

    fetchTokenAndConnect();

    return () => {
      cleanupAudio(false);
    };
  }, [activeVoiceChannelId]);

  // Handle Mute/Unmute state sync with physical tracks
  useEffect(() => {
    if (connectionState !== "connected") return;

    if (isDemo) {
      // Local demo mute handling
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = !isMuted;
        });
      }
      if (isMuted) {
        setLocalAudioLevel(0);
      }
    } else {
      // LiveKit real mute handling
      if (roomRef.current) {
        roomRef.current.localParticipant.setMicrophoneEnabled(!isMuted);
      }
    }

    updateFirebaseVoiceState(activeVoiceChannelId, isMuted);
  }, [isMuted, connectionState, isDemo]);

  // Connects to a real LiveKit production room
  const connectToLiveKit = async (token: string, url: string) => {
    try {
      // Create Livekit Room with custom performance constraints (Audio Only)
      const room = new Room({
        adaptiveStream: { pixelDensity: "screen" },
        dynacast: false, // only needed for video
        videoCaptureDefaults: {
          resolution: { width: 0, height: 0 } // force audio only
        }
      });

      roomRef.current = room;

      // Register speaker low-latency indicators
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const speakingMap: Record<string, { isSpeaking: boolean; audioLevel: number }> = {};
        speakers.forEach((speaker) => {
          speakingMap[speaker.identity] = {
            isSpeaking: speaker.isSpeaking,
            audioLevel: speaker.audioLevel // Float range from 0 to 1
          };
        });
        setParticipantSpeakers(prev => ({
          ...prev,
          ...speakingMap
        }));
      });

      room.on(RoomEvent.ParticipantConnected, (p) => {
        console.log(`[VoiceChat] Participant joined: ${p.identity}`);
      });

      room.on(RoomEvent.Disconnected, () => {
        setConnectionState("disconnected");
      });

      // Listen to audio playback status changes to capture autoplay browser blocks
      room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
        console.log("[VoiceChat] Audio playback status updated:", room.canPlaybackAudio);
        setCanPlayAudio(room.canPlaybackAudio);
      });

      // Track subscription handlers to fix silent voice connection
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          console.log(`[VoiceChat] Subscribed to audio track from participant: ${participant.identity}`);
          const element = track.attach();
          element.className = "livekit-audio-element";
          document.body.appendChild(element);
          
          // Explicitly trigger play to ensure browser starts audio playback immediately
          element.play().catch((err) => {
            console.warn("[VoiceChat] Audio element play failed (potentially blocked by autoplay):", err);
          });

          setCanPlayAudio(room.canPlaybackAudio);
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          console.log(`[VoiceChat] Unsubscribed from audio track of participant: ${participant.identity}`);
          const elements = track.detach();
          elements.forEach((el) => el.remove());
          setCanPlayAudio(room.canPlaybackAudio);
        }
      });

      // Connect using server signed credential JWT token
      await room.connect(url, token);
      console.log("[VoiceChat] LiveKit connected successfully!");

      // Enable microphone input
      await room.localParticipant.setMicrophoneEnabled(true);
      setConnectionState("connected");
      updateFirebaseVoiceState(activeVoiceChannelId, false);
      setCanPlayAudio(room.canPlaybackAudio);

      // Setup a fast monitor interval to render real audio waves for local + remote speaking participants
      const volumeMonitor = setInterval(() => {
        if (!roomRef.current) {
          clearInterval(volumeMonitor);
          return;
        }

        // 1. Sync local participant level
        if (room.localParticipant.isSpeaking && !isMuted) {
          setLocalAudioLevel(room.localParticipant.audioLevel);
        } else {
          setLocalAudioLevel(0);
        }

        // 2. Sync remote speakers audio waves
        const updatedSpeakers: Record<string, { isSpeaking: boolean; audioLevel: number }> = {};
        room.remoteParticipants.forEach((p) => {
          updatedSpeakers[p.identity] = {
            isSpeaking: p.isSpeaking,
            audioLevel: p.isSpeaking ? p.audioLevel : 0
          };
        });
        setParticipantSpeakers(updatedSpeakers);
      }, 80);

      // Store interval on the room instance to cleanly dispose on unmount
      (room as any)._audioInterval = volumeMonitor;

    } catch (err) {
      console.error("[VoiceChat] LiveKit connection failed:", err);
      setConnectionState("failed");
      // Seamless fail-over to demo mode so user interface doesn't freeze
      setIsDemo(true);
      connectToLocalAudioSandbox();
    }
  };

  // Connects to Local Web Audio API Sandbox (used during unconfigured environments or fallback)
  const connectToLocalAudioSandbox = async () => {
    try {
      // Request browser micro audio track permission natively
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Instantiate AudioContext nodes to read decibel amplitude
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      setConnectionState("connected");
      updateFirebaseVoiceState(activeVoiceChannelId, false);

      // Render Loop for real-time local speaking mic waves
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyserRef.current || isMuted) {
          setLocalAudioLevel(0);
          animationFrameRef.current = requestAnimationFrame(checkVolume);
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Normalize 0-255 scale to 0-1 range for audio wave bars
        const normalized = Math.min(average / 120, 1);
        setLocalAudioLevel(normalized);

        animationFrameRef.current = requestAnimationFrame(checkVolume);
      };

      animationFrameRef.current = requestAnimationFrame(checkVolume);

    } catch (err) {
      console.warn("[VoiceChat] Mic permissions denied or missing media input. Falling back to simple simulated speakers.", err);
      // Run in fully visual simulated speaker mode
      setConnectionState("connected");
      updateFirebaseVoiceState(activeVoiceChannelId, false);
      
      const interval = setInterval(() => {
        if (isMuted) {
          setLocalAudioLevel(0);
        } else {
          // Generate realistic voice level peaks
          const amplitude = Math.random() > 0.3 ? Math.random() * 0.7 : 0;
          setLocalAudioLevel(amplitude);
        }
      }, 150);
      (mediaStreamRef as any)._interval = interval;
    }
  };

  // Disposes and releases all active audio track inputs, contexts, and intervals safely
  const cleanupAudio = (isUnmounting: boolean = false) => {
    // 1. Fire offline state status to Firebase
    // If we are transitioning/switching to a different channel, skip setting state to null in Firestore
    // to prevent the old disconnect request from racing and overwriting the new connect request.
    if (activeVoiceChannelId && (isUnmounting || latestChannelIdRef.current === null)) {
      updateFirebaseVoiceState(null, false);
    }

    // 2. Shut down media stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if ((mediaStreamRef as any)._interval) {
      clearInterval((mediaStreamRef as any)._interval);
    }

    // 3. Close Audio Context loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    analyserRef.current = null;

    // 4. Leave LiveKit Room
    if (roomRef.current) {
      if ((roomRef.current as any)._audioInterval) {
        clearInterval((roomRef.current as any)._audioInterval);
      }
      roomRef.current.disconnect();
      roomRef.current = null;
    }

    // Clean up any remaining audio elements
    document.querySelectorAll(".livekit-audio-element").forEach((el) => el.remove());

    setParticipantSpeakers({});
    setLocalAudioLevel(0);
  };

  // Lists all participants who are currently active inside our voice channel
  const occupants = React.useMemo(() => {
    // Map existing Firebase Users lists connected to this room
    return onlinePlayers.filter(p => p.activeVoiceChannel === activeVoiceChannelId);
  }, [onlinePlayers, activeVoiceChannelId]);

  // Play sound notifications (join/leave) using Web Audio API oscillators
  const playNotificationSound = (type: "join" | "leave") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      if (type === "join") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(392.00, now); // G4
        osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.2); // C4
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      console.warn("Failed to play notification chime:", e);
    }
  };

  // Monitor occupants changes and trigger chimes on join/leave
  useEffect(() => {
    if (connectionState !== "connected" || !activeVoiceChannelId) {
      prevOccupantsRef.current = [];
      isFirstLoadRef.current = true;
      return;
    }

    const currentUids = occupants.map(o => o.uid);
    const myUid = gamerProfile?.uid;

    if (isFirstLoadRef.current) {
      prevOccupantsRef.current = currentUids;
      isFirstLoadRef.current = false;
      return;
    }

    const joined = currentUids.filter(uid => !prevOccupantsRef.current.includes(uid));
    const left = prevOccupantsRef.current.filter(uid => !currentUids.includes(uid));

    const otherJoined = joined.filter(uid => uid !== myUid);
    const otherLeft = left.filter(uid => uid !== myUid);

    if (otherJoined.length > 0) {
      playNotificationSound("join");
    } else if (otherLeft.length > 0) {
      playNotificationSound("leave");
    }

    prevOccupantsRef.current = currentUids;
  }, [occupants, connectionState, activeVoiceChannelId, gamerProfile]);

  // Disable simulation engine as mock bots are officially removed from layout
  useEffect(() => {
    return;
  }, []);

  if (connectionState === "disconnected") return null;

  if (isMinimized) {
    return (
      <div 
        id="active-gamer-voice-station-minimized"
        className="flex items-center justify-between gap-2"
      >
        {/* Status/Channel Name */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div className="relative shrink-0 flex animate-pulse">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <div className="absolute top-0 right-0 h-1 w-1 rounded-full bg-emerald-400" />
          </div>
          <div className="min-w-0">
            <span className={`text-[11px] font-black truncate uppercase font-sans ${
              isDarkMode ? "text-slate-200" : "text-slate-800"
            }`}>
              {activeChannel?.name ? activeChannel.name.replace(/[^a-zA-Z0-9\sğıüşöçĞİÜŞÖÇ]/g, '').trim() : "Ses"}
            </span>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(prev => !prev)}
            className={`p-1.5 rounded-lg border transition-all active:scale-95 cursor-pointer ${
              isMuted 
                ? "bg-rose-500/15 border-rose-500/40 text-rose-400 hover:bg-rose-500/25" 
                : isDarkMode
                ? "bg-slate-950 border-slate-900 text-slate-400 hover:text-white"
                : "bg-white border-slate-200 text-slate-650 hover:bg-slate-100"
            }`}
            title={isMuted ? "Sesi Aç" : "Sessiz"}
          >
            {isMuted ? (
              <MicOff className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
            )}
          </button>

          {/* Maximize Button */}
          <button
            onClick={onToggleMinimize}
            className={`p-1.5 rounded-lg border transition-all active:scale-95 cursor-pointer ${
              isDarkMode
                ? "bg-slate-950 border-slate-900 text-slate-400 hover:text-white"
                : "bg-white border-slate-200 text-slate-650 hover:bg-slate-100"
            }`}
            title="Ekranı Büyüt"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Disconnect Button */}
          <button
            onClick={() => onJoinChannel(null)}
            className={`p-1.5 rounded-lg border transition-all active:scale-95 cursor-pointer ${
              isDarkMode 
                ? "bg-slate-950 border-slate-900 hover:bg-rose-500/15 hover:border-rose-500/40 text-slate-500 hover:text-rose-400" 
                : "bg-white border-slate-200 hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-650 hover:text-rose-600"
            }`}
            title="Ayrıl"
          >
            <PhoneOff className="w-3.5 h-3.5 text-rose-500/80" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="active-gamer-voice-station"
      className={`p-3.5 rounded-xl border border-dashed transition-all duration-300 space-y-4 ${
        isDarkMode 
          ? "bg-slate-900/40 border-cyan-500/20 shadow-lg shadow-black/40 text-slate-100" 
          : "bg-slate-50 border-cyan-500/35 shadow-sm text-slate-800"
      }`}
    >
      {/* 1. Meta Room Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex shrink-0">
            <Radio className="w-4 h-4 text-cyan-550 animate-pulse shrink-0" />
            <div className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-emerald-400 null" />
          </div>
          <div className="min-w-0">
            <span className={`text-[10px] font-mono font-bold block ${
              isDarkMode ? "text-slate-505" : "text-slate-450"
            }`}>// SES BAĞLANTISI</span>
            <span className={`text-xs font-black truncate block uppercase font-sans ${
              isDarkMode ? "text-slate-200" : "text-slate-800"
            }`}>
              {activeChannel?.name || "Ses Kanalı"}
            </span>
          </div>
        </div>

        {/* Signal state indicator */}
        <div className="flex items-center gap-1 shrink-0">
          <Signal className="w-3.5 h-3.5 text-emerald-500" />
          <span className={`text-[9.5px] font-mono px-1.5 py-0.5 border rounded-md font-bold ${
            isDarkMode 
              ? "bg-[#05060a] border-emerald-950 text-emerald-400" 
              : "bg-emerald-50 border-emerald-200 text-emerald-600"
          }`}>
            {isDemo ? "DEMO-RTC" : "LIVE-RTC"}
          </span>
        </div>
      </div>

      {/* 2. Audio Level Speaking Visualizer */}
      <div className={`p-3 border rounded-xl flex items-center justify-between transition-all duration-300 ${
        isDarkMode 
          ? "bg-[#05060a]/95 border-slate-950 text-slate-100" 
          : "bg-white border-slate-200 text-slate-800"
      }`}>
        <div className="flex items-center gap-2">
          {isMuted ? (
            <MicOff className="w-4 h-4 text-rose-500" />
          ) : (
            <Mic className="w-4 h-4 text-cyan-500 animate-pulse" />
          )}
          <span className={`text-[11px] font-mono font-medium ${
            isDarkMode ? "text-slate-400" : "text-slate-600"
          }`}>
            {isMuted ? "Mikrofon Kapalı" : "Konuşuyor..."}
          </span>
        </div>

        {/* Dynamic bar level animation */}
        <div className="flex items-end gap-0.5 h-4 px-1 shrink-0">
          {Array.from({ length: 6 }).map((_, idx) => {
            const activeLevel = isMuted ? 0 : localAudioLevel;
            const barHeights = [40, 95, 70, 100, 50, 80];
            const dynamicScale = activeLevel * barHeights[idx];
            return (
              <div 
                key={idx}
                className="w-[3px] rounded-full bg-cyan-500"
                style={{ 
                  height: `${Math.max(15, dynamicScale)}%`,
                  opacity: isMuted ? 0.3 : 0.4 + (activeLevel * 0.6),
                  transition: "height 0.1s ease"
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Autoplay Warning Banner */}
      {!canPlayAudio && (
        <button
          type="button"
          onClick={async () => {
            if (roomRef.current) {
              try {
                await roomRef.current.startAudio();
                setCanPlayAudio(roomRef.current.canPlaybackAudio);
              } catch (err) {
                console.error("Failed to start audio:", err);
              }
            }
          }}
          className="w-full py-2.5 px-3 text-[11px] bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 rounded-xl font-bold flex items-center justify-center gap-1.5 animate-pulse transition-all cursor-pointer font-sans"
        >
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          Tarayıcı Sesini Etkinleştirmek İçin Tıklayın
        </button>
      )}

      {/* 3. Occupants Badge Lists */}
      <div className="space-y-1.5">
        <span className={`text-[9px] font-bold font-mono tracking-wider block uppercase ${
          isDarkMode ? "text-slate-500" : "text-slate-400"
        }`}>
          KATILIMCILAR ({occupants.length})
        </span>

        <div className="space-y-1 text-xs">
          {occupants.map((member) => {
            const isMe = member.uid === gamerProfile?.uid;
            const memberMute = isMe ? isMuted : (member.isMuted ?? false);
            const speakerInfo = participantSpeakers[member.name] || { isSpeaking: false, audioLevel: 0 };
            const isSpeakingNow = isMe ? (localAudioLevel > 0.05 && !isMuted) : (speakerInfo.isSpeaking && !memberMute);
            const amplitude = isMe ? localAudioLevel : (speakerInfo.audioLevel || 0);

            return (
              <div 
                key={member.uid}
                className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-300 ${
                  isSpeakingNow 
                    ? isDarkMode 
                      ? "bg-cyan-500/10 border-cyan-550 text-cyan-300 font-bold scale-[1.01]" 
                      : "bg-cyan-50 border-cyan-400/65 text-cyan-800 font-bold scale-[1.01]"
                    : isDarkMode 
                    ? "bg-slate-950/60 border-slate-900 text-slate-300" 
                    : "bg-white border-slate-200 text-slate-700 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`relative rounded-full p-0.5 ${
                    isSpeakingNow ? "ring-2 ring-cyan-400 animate-pulse" : ""
                  }`}>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold text-white uppercase shrink-0 ${
                      isDarkMode
                        ? "bg-gradient-to-br from-indigo-950 to-slate-950 border border-slate-800"
                        : "bg-gradient-to-br from-indigo-500 to-indigo-600 border border-indigo-400"
                    }`}>
                      {member.name.substring(0, 1)}
                    </div>
                  </div>

                  <span className={`text-[11px] font-sans font-medium truncate pr-1 ${
                    isDarkMode ? "text-slate-300" : "text-slate-705"
                  }`}>
                    {member.name} {isMe && "(Siz)"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isSpeakingNow ? (
                    <div className="flex items-end gap-[1px] h-2.5 shrink-0 px-1">
                      {Array.from({ length: 3 }).map((_, bIdx) => {
                        const heights = [30, 90, 60];
                        const customHeight = amplitude * heights[bIdx];
                        return (
                          <div 
                            key={bIdx}
                            className="w-[1.5px] bg-cyan-400 rounded-full"
                            style={{ 
                              height: `${Math.max(20, customHeight)}%`, 
                              transition: "height 0.08s ease"
                            }}
                          />
                        );
                      })}
                    </div>
                  ) : null}

                  {memberMute ? (
                    <span className="text-[8px] font-black font-mono border border-rose-500/30 bg-rose-500/15 text-rose-400 rounded px-1.5 py-0.5 scale-90 shrink-0 uppercase tracking-widest flex items-center gap-1">
                      <MicOff className="w-2 h-2" strokeWidth={3} /> SESSİZ
                    </span>
                  ) : (
                    <span className={`text-[8px] font-black font-mono rounded px-1.5 py-0.5 scale-90 shrink-0 uppercase tracking-widest flex items-center gap-1 border ${
                      isSpeakingNow 
                        ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400" 
                        : isDarkMode
                        ? "bg-slate-900 border-slate-800 text-slate-500"
                        : "bg-slate-100 border-slate-200 text-slate-500"
                    }`}>
                      <Volume2 className="w-2.5 h-2.5" /> BAĞLI
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Controls Action Row */}
      <div className={`grid grid-cols-2 gap-2 pt-2 border-t ${
        isDarkMode ? "border-slate-800" : "border-slate-200"
      }`}>
        <button
          onClick={() => setIsMuted(prev => !prev)}
          className={`px-3 py-2 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer border flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
            isMuted 
              ? "bg-gradient-to-r from-rose-500/15 to-red-900/10 border-rose-500/40 text-rose-400 hover:from-rose-500/25 hover:to-red-900/15 shadow-rose-950/10" 
              : isDarkMode
              ? "bg-slate-950 border-slate-900 text-slate-400 hover:text-white hover:bg-slate-900"
              : "bg-white border-slate-200 text-slate-650 hover:bg-slate-100"
          }`}
        >
          {isMuted ? (
            <>
              <MicOff className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />
              <span>SESİ AÇ</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" strokeWidth={2.5} />
              <span>SESSİZ</span>
            </>
          )}
        </button>

        <button
          onClick={() => onJoinChannel(null)}
          className={`px-3 py-2 text-xs font-black uppercase tracking-wider border rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
            isDarkMode 
              ? "bg-slate-950 border-slate-900 hover:bg-rose-500/15 hover:border-rose-500/40 text-slate-500 hover:text-rose-400" 
              : "bg-white border-slate-200 hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-650 hover:text-rose-600"
          }`}
        >
          <PhoneOff className="w-3.5 h-3.5 shrink-0 text-rose-500/80" />
          <span>AYRIL</span>
        </button>
      </div>
    </div>
  );
}
