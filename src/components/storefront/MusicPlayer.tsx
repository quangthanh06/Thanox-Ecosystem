import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';

/**
 * MusicPlayer — INVISIBLE background audio player.
 * 
 * Admin thêm nhạc trong Settings → có nhạc tự động phát nền.
 * KHÔNG hiển thị widget nổi nào — tránh che thanh điều hướng mobile.
 * Nhạc chỉ phát khi admin đã cấu hình ít nhất 1 bài trong settings.musicTracks.
 */
export const MusicPlayer: React.FC = () => {
  const { settings } = useStore();

  const isEnabled = settings.musicEnabled !== false;
  // Chỉ dùng bài hát Admin cấu hình — KHÔNG dùng nhạc mặc định.
  // Danh sách trống => ẩn hoàn toàn (không render gì cả).
  const tracks = settings.musicTracks && settings.musicTracks.length > 0 ? settings.musicTracks : [];

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clamp current track index
  const safeIndex = currentTrackIndex >= tracks.length ? 0 : currentTrackIndex;
  const currentTrack = tracks[safeIndex] || tracks[0];

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle track changes
  useEffect(() => {
    if (!isEnabled || !audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    }
  }, [safeIndex]);

  // Auto-Play on first user interaction (browser policy requires gesture)
  useEffect(() => {
    if (!isEnabled || tracks.length === 0) {
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    // Try immediate unmuted playback
    audio.muted = false;
    audio.volume = volume;
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch(() => {
        // Browser blocked autoplay — wait for user interaction
        audio.muted = true;
        audio
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            setIsPlaying(false);
          });
      });

    // Global unlock on any user tap / click / touch anywhere on page
    const unlockAndPlay = () => {
      if (audioRef.current) {
        audioRef.current.muted = false;
        audioRef.current.volume = volume;
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {});
      }
      cleanup();
    };

    const events = ['click', 'touchstart', 'touchend', 'pointerdown', 'mousedown', 'keydown', 'scroll'];
    const cleanup = () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, unlockAndPlay, true);
        document.removeEventListener(evt, unlockAndPlay, true);
      });
    };

    events.forEach((evt) => {
      window.addEventListener(evt, unlockAndPlay, { once: true, passive: true, capture: true });
      document.addEventListener(evt, unlockAndPlay, { once: true, passive: true, capture: true });
    });

    return () => {
      cleanup();
    };
  }, [isEnabled, currentTrack?.url]);

  // When track ends: repeat if 1 track, advance if multiple
  const handleTrackEnded = () => {
    if (tracks.length <= 1) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    }
  };

  // Không có bài hát nào hoặc chưa bật => không render gì cả
  if (!isEnabled || tracks.length === 0) return null;

  // INVISIBLE — chỉ render thẻ <audio> ẩn, không có widget nào
  return (
    <audio
      ref={audioRef}
      src={currentTrack?.url}
      onEnded={handleTrackEnded}
      onPause={() => setIsPlaying(false)}
      onPlay={() => setIsPlaying(true)}
      preload="auto"
      playsInline
      loop={tracks.length === 1}
      style={{ display: 'none' }}
    />
  );
};
