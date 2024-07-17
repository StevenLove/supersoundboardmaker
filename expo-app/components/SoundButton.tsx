import React, { useCallback } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";

const SoundButton = React.memo(
  ({ label, playSound, stopSound, isPlaying, stopAllSounds }) => {
    const handlePress = useCallback(
      async (volume) => {
        console.log("tapped button", label);
        await playSound(volume);
      },
      [label, playSound]
    );

    return (
      <View style={styles.buttonContainer}>
        <View style={styles.leftButton}>
          <View style={styles.textUnderlay}>
            <Text style={styles.buttonText}>
              {label} {isPlaying() ? "⏸️" : "▶️"}
            </Text>
          </View>
          <View style={styles.clickableContainer}>
            <Pressable
              style={[styles.clickableArea]}
              onPress={() => handlePress(0.33)}
            />
            <Pressable
              style={[styles.clickableArea]}
              onPress={() => handlePress(0.66)}
            />
            <Pressable
              style={[styles.clickableArea]}
              onPress={() => handlePress(1.0)}
            />
          </View>
        </View>
        <Pressable
          style={[styles.button, styles.rightButton]}
          onPress={() => stopSound()}
        >
          <Text style={styles.buttonText}>X</Text>
        </Pressable>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: "row",
    margin: 5,
    width: 180,
    position: "relative",
  },
  textUnderlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    // right: 30, // Leave space for the stop button
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  clickableContainer: {
    margin: 0,
    flexDirection: "row",
    flex: 3,
    backgroundColor: "#00000000",
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
    zIndex: 2,
  },
  clickableArea: {
    flex: 1,
  },
  button: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  leftButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  rightButton: {
    flex: 0.1,
    backgroundColor: "#f76c6c",
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  buttonText: {
    color: "#3d3d3d",
    textAlign: "center",
  },
});

export default SoundButton;
