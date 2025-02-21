import React, { createContext, useContext, useState, useEffect } from "react";
import { Audio } from "expo-av";
import soundBank from "@assets/generated/soundBank.js";

const FADE_STEP = 0.3;
const FADE_INTERVAL = 50;
const NO_FADE = true;

const SoundManagerContext = createContext({
  playSoundById: (id: number, volume: number) => {},
  stopAllSounds: () => {},
  stopAllSounds2: () => {},
  stopSound: (id: number) => {},
  isPlaying: (id: number) => false,
  getInfo: () => "default title",
});

export const SoundManagerProvider = ({ children }) => {
  const [sounds, setSounds] = useState(new Map());
  const [intervals, setIntervals] = useState(0);

  useEffect(() => {
    const loadSoundBank = async () => {
      const loadedSounds = new Map();
      for (const sound of soundBank) {
        const { sound: soundObj } = await Audio.Sound.createAsync(sound.file);
        await soundObj.setVolumeAsync(0); // Start with volume at 0
        loadedSounds.set(sound.id, [
          {
            sound: soundObj,
            currentVolume: 0,
            targetVolume: 0,
            isPlaying: false,
          },
        ]);
      }
      console.log("soundbank", soundBank);
      console.log("loaded sounds", loadedSounds);
      setSounds(loadedSounds);
      if (NO_FADE) {
        return () => {};
      }
      const interval = setInterval(() => {
        setIntervals((prev) => prev + 1); // Use functional update form

        loadedSounds.forEach((soundObjs) => {
          soundObjs.forEach(async (soundObj) => {
            if (soundObj.currentVolume !== soundObj.targetVolume) {
              let nextVolume;
              const diff = soundObj.targetVolume - soundObj.currentVolume;
              if (Math.abs(diff) < FADE_STEP) {
                nextVolume = soundObj.targetVolume;
              } else {
                nextVolume =
                  soundObj.currentVolume + Math.sign(diff) * FADE_STEP;
              }
              await soundObj.sound.setVolumeAsync(nextVolume);
              if (nextVolume === 0 && soundObj?.isPlaying) {
                soundObj.isPlaying = false;
                soundObj.sound.stopAsync();
              }
              soundObj.currentVolume = nextVolume;
            }
          });
        });
      }, FADE_INTERVAL);

      return () => clearInterval(interval);
    };

    loadSoundBank();

    return () => {
      stopAllSounds();
    };
  }, []);

  const playSoundById = async (id: number, volume: number = 0.33) => {
    const soundObjs = sounds.get(id);
    if (soundObjs) {
      const availableSoundObj = soundObjs.find(
        (soundObj) => !soundObj.isPlaying
      );
      if (availableSoundObj) {
        if (volume > 1 || volume < 0)
          console.warn("Volume should be between 0 and 1");
        availableSoundObj.targetVolume = Math.min(Math.max(volume, 0), 1);
        await availableSoundObj.sound.setVolumeAsync(NO_FADE ? volume : 0);
        await availableSoundObj.sound.replayAsync();
        availableSoundObj.isPlaying = true;
        availableSoundObj.sound.setOnPlaybackStatusUpdate(async (status) => {
          if (status.didJustFinish) {
            availableSoundObj.isPlaying = false;
            if (soundObjs.length > 1) {
              const index = soundObjs.indexOf(availableSoundObj);
              if (index > -1) {
                soundObjs.splice(index, 1);
                await availableSoundObj.sound.unloadAsync();
              }
            }
            setSounds(new Map(sounds)); // Trigger re-render
          }
        });

        const { sound: newSoundObj } = await Audio.Sound.createAsync(
          soundBank.find((s) => s.id === id).file
        );
        soundObjs.push({
          sound: newSoundObj,
          currentVolume: NO_FADE ? volume : 0,
          targetVolume: NO_FADE ? volume : 0,
          isPlaying: false,
        });
        setSounds(new Map(sounds)); // Trigger re-render
      }
    }
  };

  const stopSound = async (id) => {
    const soundObjs = sounds.get(id);
    if (soundObjs) {
      for (const soundObj of soundObjs) {
        soundObj.targetVolume = 0;
        if (soundObj.isPlaying) {
          await soundObj.sound.stopAsync();
          soundObj.isPlaying = false;
        }
      }
      setSounds(new Map(sounds)); // Trigger re-render
    }
  };

  const stopAllSounds = async () => {
    const updatedSounds = new Map(sounds);
    updatedSounds.forEach((soundObjs) => {
      soundObjs.forEach(async (soundObj) => {
        soundObj.targetVolume = 0;
      });
    });
    setSounds(updatedSounds);
  };

  const stopAllSounds2 = async () => {
    const updatedSounds = new Map(sounds);
    updatedSounds.forEach((soundObjs) => {
      soundObjs.forEach(async (soundObj) => {
        soundObj.sound.stopAsync();
        soundObj.isPlaying = false;
      });
    });
    setSounds(updatedSounds);
  };

  const isPlaying = (id) => {
    const soundObjs = sounds.get(id);
    return soundObjs?.some((soundObj) => soundObj.isPlaying);
  };

  const getInfo = () => {
    return "intervals: " + intervals;
  };

  return (
    <SoundManagerContext.Provider
      value={{
        playSoundById,
        stopAllSounds,
        stopAllSounds2,
        stopSound,
        isPlaying,
        getInfo,
      }}
    >
      {children}
    </SoundManagerContext.Provider>
  );
};

export const useSoundManager = () => {
  return useContext(SoundManagerContext);
};
