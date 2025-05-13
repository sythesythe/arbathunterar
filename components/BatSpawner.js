import React, { useState, useEffect } from 'react';
import { View, Image, TouchableWithoutFeedback, Dimensions, Animated, Easing, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

// Difficulty settings
const DIFFICULTY_SETTINGS = {
  EASY: {
    maxBats: 3,
    spawnInterval: 3000,
    minSpeed: 2000,
    maxSpeed: 3000,
    batSize: 60,
  },
  MEDIUM: {
    maxBats: 5,
    spawnInterval: 2000,
    minSpeed: 1500,
    maxSpeed: 2500,
    batSize: 50,
  },
  HARD: {
    maxBats: 7,
    spawnInterval: 1500,
    minSpeed: 1000,
    maxSpeed: 2000,
    batSize: 40,
  }
};

const BatSpawner = ({ onBatKilled, difficulty = 'MEDIUM' }) => {
  const [bats, setBats] = useState([]);
  const settings = DIFFICULTY_SETTINGS[difficulty];

  // Function to create a new bat with animation values
  const createBat = () => {
    // Start position in the middle area of the screen
    const x = Math.random() * (width * 0.6) + width * 0.2; // Middle 60% of screen width
    const y = Math.random() * (height * 0.6) + height * 0.2; // Middle 60% of screen height

    const newBat = {
      id: Math.random().toString(),
      x: new Animated.Value(x),
      y: new Animated.Value(y),
      opacity: new Animated.Value(1),
    };

    // Create flying animation sequence
    const createFlyingAnimation = () => {
      // Create a random circular-like movement
      const radius = Math.random() * 100 + 50; // Random radius between 50 and 150
      const duration = Math.random() * (settings.maxSpeed - settings.minSpeed) + settings.minSpeed;
      
      // Get current position
      const currentX = newBat.x.__getValue();
      const currentY = newBat.y.__getValue();

      // Calculate next position ensuring it stays in bounds
      const angle = Math.random() * Math.PI * 2;
      let targetX = currentX + Math.cos(angle) * radius;
      let targetY = currentY + Math.sin(angle) * radius;

      // Keep bats within screen bounds with padding
      const padding = settings.batSize;
      targetX = Math.max(padding, Math.min(width - padding, targetX));
      targetY = Math.max(padding, Math.min(height - padding, targetY));

      return Animated.parallel([
        Animated.timing(newBat.x, {
          toValue: targetX,
          duration: duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(newBat.y, {
          toValue: targetY,
          duration: duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]);
    };

    // Start continuous flying animation
    const flyLoop = () => {
      const flyingAnimation = createFlyingAnimation();
      flyingAnimation.start(() => {
        if (newBat.opacity.__getValue() !== 0) { // Check if bat still exists
          flyLoop(); // Continue flying if bat is still alive
        }
      });
    };

    flyLoop();
    return newBat;
  };

  // Spawn new bats periodically
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      setBats(currentBats => {
        if (currentBats.length < settings.maxBats) {
          return [...currentBats, createBat()];
        }
        return currentBats;
      });
    }, settings.spawnInterval);

    return () => clearInterval(spawnInterval);
  }, [settings]);

  // Handle bat tap
  const handleBatTap = (batId) => {
    const tappedBat = bats.find(bat => bat.id === batId);
    if (tappedBat) {
      // Stop ongoing animations
      tappedBat.x.stopAnimation();
      tappedBat.y.stopAnimation();

      // Animate bat death with fade out
      Animated.timing(tappedBat.opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setBats(currentBats => currentBats.filter(bat => bat.id !== batId));
        if (onBatKilled) onBatKilled();
      });
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {bats.map(bat => (
        <TouchableWithoutFeedback 
          key={bat.id} 
          onPress={() => handleBatTap(bat.id)}
        >
          <Animated.View
            style={[
              styles.batContainer,
              {
                transform: [
                  { translateX: bat.x },
                  { translateY: bat.y },
                ],
                opacity: bat.opacity,
              }
            ]}
          >
            <Image
              source={require('../assets/images/pixel_bats.gif')}
              style={{
                width: settings.batSize,
                height: settings.batSize,
              }}
              resizeMode="contain"
            />
          </Animated.View>
        </TouchableWithoutFeedback>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  batContainer: {
    position: 'absolute',
    width: 60, // Make touch area slightly larger than bat
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BatSpawner; 