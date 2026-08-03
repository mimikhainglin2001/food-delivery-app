import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState, useEffect, useRef } from 'react';
import { Dimensions, StyleSheet, View, Animated, Easing } from 'react-native';

const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;
const DURATION = 600;

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animate) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: DURATION,
          easing: Easing.elastic(0.7),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: DURATION,
          easing: Easing.elastic(0.7),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setVisible(false);
      });
    }
  }, [animate]);

  const image = <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />;

  if (!visible) return null;

  return animate ? (
    <Animated.View
      style={[
        styles.splashOverlay,
        { opacity, transform: [{ scale }] },
      ]}>
      {image}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}>
      {image}
    </View>
  );
}

export function AnimatedIcon() {
  const scaleAnim = useRef(new Animated.Value(INITIAL_SCALE_FACTOR)).current;
  const logoScale = useRef(new Animated.Value(1.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: DURATION,
      easing: Easing.elastic(0.7),
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(DURATION * 0.4),
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: DURATION,
          easing: Easing.elastic(0.7),
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: DURATION,
          easing: Easing.elastic(0.7),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(glowRotate, {
      toValue: 1,
      duration: 60 * 1000 * 4,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, []);

  const glowRotateInterpolate = glowRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '7200deg'],
  });

  const logoScaleInterpolate = logoScale.interpolate({
    inputRange: [1, 1.3],
    outputRange: [1, 1.3],
  });

  return (
    <View style={styles.iconContainer}>
      <Animated.View
        style={[
          styles.glow,
          { transform: [{ rotate: glowRotateInterpolate }] },
        ]}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View
        style={[
          styles.background,
          { transform: [{ scale: scaleAnim }] },
        ]}
      />
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

const styles = StyleSheet.create({
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
    zIndex: 100,
  },
  image: {
    width: 76,
    height: 71,
  },
  background: {
    borderRadius: 40,
    experimental_backgroundImage: `linear-gradient(180deg, #3C9FFE, #0274DF)`,
    width: 128,
    height: 128,
    position: 'absolute',
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});