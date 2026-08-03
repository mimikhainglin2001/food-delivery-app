import { Image } from 'expo-image';
import { StyleSheet, View, Animated, Easing } from 'react-native';

import classes from './animated-icon.module.css';
const DURATION = 300;

export function AnimatedSplashOverlay() {
  return null;
}

const scaleAnim = useRef(new Animated.Value(0)).current;
const logoScale = useRef(new Animated.Value(0)).current;
const logoOpacity = useRef(new Animated.Value(0)).current;
const glowRotate = useRef(new Animated.Value(0)).current;
const glowScale = useRef(new Animated.Value(0.8)).current;
const glowOpacity = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.sequence([
    Animated.timing(scaleAnim, {
      toValue: 1.2,
      duration: DURATION * 0.6,
      easing: Easing.elastic(1.2),
      useNativeDriver: true,
    }),
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: DURATION * 0.4,
      easing: Easing.elastic(1.2),
      useNativeDriver: true,
    }),
  ]).start();
}, []);

useEffect(() => {
  Animated.sequence([
    Animated.delay(DURATION * 0.6),
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1.2,
        duration: DURATION * 0.6,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: DURATION * 0.6,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
    ]),
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: DURATION * 0.4,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
    ]),
  ]).start();
}, []);

useEffect(() => {
  Animated.sequence([
    Animated.parallel([
      Animated.timing(glowRotate, {
        toValue: 1,
        duration: DURATION / 1000,
        easing: Easing.elastic(0.7),
        useNativeDriver: true,
      }),
      Animated.timing(glowScale, {
        toValue: 1,
        duration: DURATION / 1000,
        easing: Easing.elastic(0.7),
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: DURATION / 1000,
        easing: Easing.elastic(0.7),
        useNativeDriver: true,
      }),
    ]),
    Animated.timing(glowRotate, {
      toValue: 1,
      duration: 60 * 1000 * 4,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
  ]).start();
}, []);

const glowRotateInterpolate = glowRotate.interpolate({
  inputRange: [0, 1],
  outputRange: ['-180deg', '7200deg'],
});

const glowScaleInterpolate = glowScale.interpolate({
  inputRange: [0.8, 1],
  outputRange: [0.8, 1],
});

const logoScaleInterpolate = logoScale.interpolate({
  inputRange: [0, 1],
  outputRange: [0, 1],
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View
        style={[
          styles.glow,
          { transform: [{ rotate: glowRotateInterpolate }, { scale: glowScaleInterpolate }], opacity: glowOpacity },
        ]}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View
        style={[
          styles.background,
          { transform: [{ scale: scaleAnim }] },
        ]}>
        <div className={classes.expoLogoBackground} />
      </Animated.View>

      <Animated.View style={styles.imageContainer}>
        <Animated.View
          style={[
            { transform: [{ scale: logoScaleInterpolate }], opacity: logoOpacity },
          ]}>
          <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

import { useRef, useEffect } from 'react';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    zIndex: 1000,
    position: 'absolute',
    top: 128 / 2 + 138,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
  },
  image: {
    position: 'absolute',
    width: 76,
    height: 71,
  },
  background: {
    width: 128,
    height: 128,
    position: 'absolute',
  },
});
