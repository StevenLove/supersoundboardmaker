import React from "react";
import { Button, View, StyleSheet, FlatList } from "react-native";
import {
  SoundManagerProvider,
  useSoundManager,
} from "@components/SoundManager"; // Adjust the import path accordingly
import soundBank from "@assets/generated/soundBank.js";
import SoundButton from "@components/SoundButton"; // Adjust the import path accordingly

export default function App() {
  return (
    <SoundManagerProvider>
      <SoundBoard />
    </SoundManagerProvider>
  );
}

// define a type that has name, id, and type props
type PlayableSound = {
  name: string;
  id: number;
};

type PlayableDirectory = {
  name: string;
  directory: string;
  id: number;
};

type Playable = PlayableSound | PlayableDirectory;

const SoundBoard = () => {
  const {
    playSoundById,
    stopAllSounds,
    stopAllSounds2,
    stopSound,
    isPlaying,
    getInfo,
  } = useSoundManager();

  // iterate over the soundBank and extract the directories into a set
  const directories = React.useMemo(() => {
    return [
      ...new Set(
        soundBank
          .filter((sound) => {
            return sound.path.split("/").length > 3;
          })
          .map((sound) => {
            return sound.path.split("/").slice(0, -1).join("/");
          })
      ),
    ];
  }, [soundBank]);

  // Extract unique directories from the soundBank
  const playables: Playable[] = React.useMemo(() => {
    return [
      ...directories.map((dir) => {
        return {
          id: Math.random(),
          name: dir.split("/").slice(-1)[0],
          directory: dir,
        };
      }),
      ...soundBank
        .filter((sound) => {
          return sound.path.split("/").length == 3;
        })
        .map((sound) => {
          return { name: sound.name, id: sound.id };
        }),
    ];
  }, [soundBank, directories]);
  // Function to play a random sound from a given directory
  const playRandomSoundFromDirectory = (directory) => {
    console.log("Playing random sound from directory", directory);
    const soundsInDirectory = soundBank.filter((sound) =>
      sound.path.startsWith(directory)
    );
    const randomIndex = Math.floor(Math.random() * soundsInDirectory.length);
    const randomSound = soundsInDirectory[randomIndex];
    playSoundById(randomSound.id, 1.0); // Play at default volume
    return;
  };

  function asPlayableDirectory(p: Playable): p is PlayableDirectory {
    return (p as PlayableDirectory).directory !== undefined;
  }
  function asPlayableSound(p: Playable): p is PlayableSound {
    return (p as PlayableSound).name !== undefined;
  }

  const renderItem = ({ item }) => {
    let p = item;
    if (asPlayableDirectory(p)) {
      return (
        <SoundButton
          label={p.name}
          isPlaying={() => false} //isPlaying(item.id)}
          playSound={
            (volume: number) => playRandomSoundFromDirectory(p.directory)
            // playSoundById(3, volume)
          }
          stopSound={() => {
            // stopSound(item.id);
          }}
          stopAllSounds={stopAllSounds}
        />
      );
    }
    if (asPlayableSound(p)) {
      return (
        <SoundButton
          label={p.name}
          isPlaying={() => isPlaying(p.id)}
          playSound={(volume: number) => playSoundById(p.id, volume)}
          stopSound={() => {
            stopSound(p.id);
          }}
          stopAllSounds={stopAllSounds}
        />
      );
    }
    return (
      <SoundButton
        label="Unknown"
        isPlaying={() => false}
        playSound={() => {}}
        stopSound={() => {}}
        stopAllSounds={() => {}}
      />
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={playables}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.flatListContainer}
      />
      <Button title="Stop Slow" onPress={stopAllSounds} />
      <Button title="Stop Now" onPress={stopAllSounds2} />
      {/* <Button title={getInfo()} onPress={() => {}} /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  flatListContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  row: {
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
});
