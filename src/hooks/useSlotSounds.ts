import { useEffect, useRef, useState } from 'react';
import { secureRandom } from '../utils/random';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VOLUME_KEY = 'slot_volume';

type SoundName =
  | 'spin_start'
  | 'reel_stop_1'
  | 'reel_stop_2'
  | 'reel_stop_3'
  | 'reel_stop_4'
  | 'reel_stop_5'
  | 'reels_spinning'
  | 'win_small'
  | 'win_big'
  | 'win_jackpot'
  | 'feature_trigger'
  | 'feature_win'
  | 'coin_flip'
  | 'coin_lost';

const SOUND_SOURCES: Record<SoundName, number> = {
  spin_start:      require('../../assets/sounds/slot/spin_start.wav'),
  reel_stop_1:     require('../../assets/sounds/slot/reel_stop.wav'),
  reel_stop_2:     require('../../assets/sounds/slot/reel_stop.wav'),
  reel_stop_3:     require('../../assets/sounds/slot/reel_stop.wav'),
  reel_stop_4:     require('../../assets/sounds/slot/reel_stop.wav'),
  reel_stop_5:     require('../../assets/sounds/slot/reel_stop.wav'),
  reels_spinning:  require('../../assets/sounds/slot/reels_spinning.wav'),
  win_small:       require('../../assets/sounds/slot/win_small.wav'),
  win_big:         require('../../assets/sounds/slot/win_big.wav'),
  win_jackpot:     require('../../assets/sounds/slot/win_jackpot.wav'),
  feature_trigger: require('../../assets/sounds/slot/feature_trigger.wav'),
  feature_win:     require('../../assets/sounds/slot/feature_win.wav'),
  coin_flip:       require('../../assets/sounds/slot/coin_flip.wav'),
  coin_lost:       require('../../assets/sounds/slot/coin_lost.wav'),
};

const FADE_STEPS = 20;
const FADE_STEP_MS = 20; // 400 ms total fade-in

export function useSlotSounds() {
  const players = useRef<Partial<Record<SoundName, AudioPlayer>>>({});
  const [volume, setVolumeState] = useState(1);
  const volumeRef = useRef(1);
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

    let cancelled = false;

    AsyncStorage.getItem(VOLUME_KEY).then((stored) => {
      if (cancelled) return;
      const v = stored !== null ? Number.parseFloat(stored) : 1;
      const initial = Number.isNaN(v) ? 1 : v;
      setVolumeState(initial);
      volumeRef.current = initial;

      for (const [name, source] of Object.entries(SOUND_SOURCES) as [SoundName, number][]) {
        try {
          const player = createAudioPlayer(source);
          if (name === 'reels_spinning') player.loop = true;
          player.volume = initial;
          players.current[name] = player;
        } catch {
          // Invalid audio file — sound stays silent
        }
      }
    });

    return () => {
      cancelled = true;
      if (fadeRef.current) clearInterval(fadeRef.current);
      for (const player of Object.values(players.current)) {
        try { player?.remove(); } catch { /* ignore */ }
      }
      players.current = {};
    };
  }, []);

  function clearFade() {
    if (fadeRef.current) {
      clearInterval(fadeRef.current);
      fadeRef.current = null;
    }
  }

  async function play(name: SoundName) {
    try {
      const player = players.current[name];
      if (!player) return;
      await player.seekTo(0);
      player.play();
    } catch {
      // Never crash the game due to audio failure
    }
  }

  function setVolume(v: number) {
    setVolumeState(v);
    volumeRef.current = v;
    clearFade(); // stop any in-progress fade so the new value takes effect immediately
    for (const player of Object.values(players.current)) {
      if (player) player.volume = v;
    }
    AsyncStorage.setItem(VOLUME_KEY, String(v)).catch(() => {});
  }

  async function startSpinning() {
    try {
      const player = players.current['reels_spinning'];
      if (!player) return;
      clearFade();

      // Seek to a random position so the loop never sounds like it restarted
      const dur = player.duration;
      const seekPos = dur > 0 ? secureRandom() * dur : 0;
      await player.seekTo(seekPos);

      // Start silent then fade in over FADE_STEPS × FADE_STEP_MS ms
      player.volume = 0;
      player.play();

      const target = volumeRef.current;
      let step = 0;
      fadeRef.current = setInterval(() => {
        step++;
        const p = players.current['reels_spinning'];
        if (p) p.volume = (step / FADE_STEPS) * target;
        if (step >= FADE_STEPS) {
          if (p) p.volume = target; // ensure exact final value
          clearFade();
        }
      }, FADE_STEP_MS);
    } catch {}
  }

  function stopSpinning() {
    clearFade();
    try {
      players.current['reels_spinning']?.pause();
    } catch {}
  }

  return { play, startSpinning, stopSpinning, volume, setVolume };
}
