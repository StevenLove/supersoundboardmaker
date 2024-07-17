import React, { createContext, useContext, useState, useEffect } from "react";
import { Audio } from "expo-av";
import soundBank from "../assets/generated/soundBank.js";

const FADE_STEP = 0.3;
const FADE_INTERVAL = 50;

const SoundManagerContext = createContext({
  playSoundById: (id: number, volume: number) => {},
  stopAllSounds: () => {},
  stopSound: (id: number) => {},
  isPlaying: (id: number) => false,
});

export const SoundManagerProvider = ({ children }) => {
  const [sounds, setSounds] = useState(new Map());

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

      const interval = setInterval(() => {
        loadedSounds.forEach((soundObjs) => {
          soundObjs.forEach(async (soundObj) => {
            if (soundObj.currentVolume !== soundObj.targetVolume) {
              let nextVolume;
              let diff = soundObj.targetVolume - soundObj.currentVolume;
              if (Math.abs(diff) < FADE_STEP) {
                nextVolume = soundObj.targetVolume;
              } else {
                nextVolume =
                  soundObj.currentVolume + Math.sign(diff) * FADE_STEP;
              }
              await soundObj.sound.setVolumeAsync(nextVolume);
              if (nextVolume === 0 && soundObj?.isPlaying) {
                await soundObj.sound.stopAsync();
                soundObj.isPlaying = false;
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
    console.log("playSoundById", id, volume);
    const soundObjs = sounds.get(id);
    if (soundObjs) {
      const availableSoundObj = soundObjs.find(
        (soundObj) => !soundObj.isPlaying
      );
      if (availableSoundObj) {
        if (volume > 1) console.warn("Volume should be between 0 and 1");
        if (volume < 0) console.warn("Volume should be between 0 and 1");
        console.log("volume", volume);
        availableSoundObj.targetVolume = Math.min(Math.max(volume, 0), 1);
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
        await newSoundObj.setVolumeAsync(0);
        soundObjs.push({
          sound: newSoundObj,
          currentVolume: 0,
          targetVolume: 0,
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
        soundObj.isPlaying = false;
      });
    });
    setSounds(updatedSounds);
  };

  const isPlaying = (id) => {
    const soundObjs = sounds.get(id);
    return soundObjs?.some((soundObj) => soundObj.isPlaying);
  };

  return (
    <SoundManagerContext.Provider
      value={{ playSoundById, stopAllSounds, stopSound, isPlaying }}
    >
      {children}
    </SoundManagerContext.Provider>
  );
};

export const useSoundManager = () => {
  return useContext(SoundManagerContext);
};
