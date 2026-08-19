import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Music,
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Disc,
  Radio,
} from 'lucide-react';

const DEFAULT_TRACKS = [
  {
    id: 'track-1',
    title: 'Cyberpunk Phonk VIP 2026',
    artist: 'Thanox Gaming Audio',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=cyberpunk-2099-10701.mp3',
  },
  {
    id: 'track-2',
    title: 'Future Neon Drift',
    artist: 'Thanox Records',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=electronic-future-beats-117997.mp3',
  },
];

export const MusicPlayer: React.FC = () => {
  const { settings } = useStore();

  const isEnabled = settings.musicEnabled !== false;
  const tracks =
    settings.musicTracks && settings.musicTracks.length > 0
      ? settings.musicTracks
      : DEFAULT_TRACKS;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInteractedRef = useRef(false);

  // Clamp current track index
  const safeIndex = currentTrackIndex >= tracks.length ? 0 : currentTrackIndex;
  const currentTrack = tracks[safeIndex] || tracks[0];

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle track changes
  useEffect(() => {
    if (!isEnabled || !audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    }
  }, [safeIndex]);

  // Robust Autoplay Handler across all mobile & desktop browsers
  useEffect(() => {
    if (!isEnabled) {
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    const startPlayback = () => {
      if (!audioRef.current) return;
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          hasInteractedRef.current = true;
        })
        .catch(() => {
          // Autoplay blocked without user gesture - will be triggered on first gesture below
        });
    };

    // 1. Try immediate autoplay on mount
    startPlayback();

    // 2. Attach global user-gesture listeners on first touch/click/scroll/keypress
    const handleUserGesture = () => {
      if (!hasInteractedRef.current && audioRef.current) {
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            hasInteractedRef.current = true;
          })
          .catch(() => {});
      }
      cleanupListeners();
    };

    const events = ['click', 'touchstart', 'touchend', 'mousedown', 'keydown', 'scroll'];
    const cleanupListeners = () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserGesture));
    };

    events.forEach((evt) =>
      window.addEventListener(evt, handleUserGesture, { once: true, passive: true })
    );

    return () => {
      cleanupListeners();
    };
  }, [isEnabled, currentTrack?.url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          hasInteractedRef.current = true;
        })
        .catch((e) => {
          console.warn('Audio play prevented:', e);
        });
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
  };

  if (!isEnabled) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={currentTrack?.url}
        onEnded={nextTrack}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        preload="auto"
        playsInline
      />

      <div className="fixed bottom-4 left-4 z-40 select-none">
        {isExpanded ? (
          <div className="bg-[#0F0F1A]/95 backdrop-blur-2xl border border-[#7C3AED]/40 shadow-[0_10px_35px_rgba(124,58,237,0.3)] rounded-3xl p-4 w-72 sm:w-80 space-y-3.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-[#9D5CF6]">
                  <Radio className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#F0EDFF]">
                    Thanox Audio
                  </span>
                  <span className="text-[9.5px] text-[#8B84A8] ml-1.5">
                    ({safeIndex + 1}/{tracks.length})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 text-[#8B84A8] hover:text-white rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                title="Thu gọn"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Track Info */}
            <div className="space-y-0.5">
              <div className="font-display font-extrabold text-xs text-[#F0EDFF] truncate">
                {currentTrack?.title || 'Cyberpunk Phonk VIP'}
              </div>
              <div className="text-[10.5px] text-[#8B84A8] truncate">
                {currentTrack?.artist || 'Thanox Audio'}
              </div>
            </div>

            {/* Visualizer & Controls */}
            <div className="flex items-center justify-between gap-2 pt-1">
              {/* Sound wave bars */}
              <div className="flex items-end gap-1 h-5 w-12 shrink-0">
                <span
                  className={`w-1 bg-[#9D5CF6] rounded-full transition-all duration-200 ${
                    isPlaying ? 'h-5 animate-pulse' : 'h-1.5'
                  }`}
                />
                <span
                  className={`w-1 bg-cyan-400 rounded-full transition-all duration-300 ${
                    isPlaying ? 'h-3.5 animate-pulse' : 'h-2'
                  }`}
                />
                <span
                  className={`w-1 bg-purple-400 rounded-full transition-all duration-150 ${
                    isPlaying ? 'h-4.5 animate-pulse' : 'h-1.5'
                  }`}
                />
                <span
                  className={`w-1 bg-emerald-400 rounded-full transition-all duration-250 ${
                    isPlaying ? 'h-2.5 animate-pulse' : 'h-1'
                  }`}
                />
              </div>

              {/* Play / Next buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={togglePlay}
                  className="w-9 h-9 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white flex items-center justify-center shadow-lg shadow-[#7C3AED]/35 transition-transform active:scale-95 cursor-pointer"
                  title={isPlaying ? 'Tạm dừng' : 'Phát nhạc'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <button
                  onClick={nextTrack}
                  className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-[#CBC7E0] hover:text-white transition-colors cursor-pointer"
                  title="Chuyển bài tiếp theo"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Volume / Mute */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 text-[#8B84A8] hover:text-white transition-colors cursor-pointer"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-14 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
                />
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#0F0F1A]/95 backdrop-blur-xl border border-[#7C3AED]/40 shadow-[0_4px_25px_rgba(124,58,237,0.35)] hover:border-[#7C3AED] text-white text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          >
            <div
              className={`w-6 h-6 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-[#9D5CF6] group-hover:bg-[#7C3AED] group-hover:text-white transition-colors`}
            >
              <Music className={`w-3.5 h-3.5 ${isPlaying ? 'animate-bounce' : ''}`} />
            </div>
            <span className="text-[11px] font-semibold text-[#F0EDFF] max-w-[110px] sm:max-w-[140px] truncate">
              {isPlaying ? currentTrack?.title : '🎵 Phát Nhạc Nền'}
            </span>
            <ChevronUp className="w-3 h-3 text-[#8B84A8]" />
          </button>
        )}
      </div>
    </>
  );
};
