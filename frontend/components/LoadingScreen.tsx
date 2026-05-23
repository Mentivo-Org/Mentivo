import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Modal, Dimensions, Text } from 'react-native';
import Svg, { Path, G, Circle } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const AnimatedG = Animated.createAnimatedComponent(G);

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  const swingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(swingAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(swingAnim, {
          toValue: -1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [swingAnim]);

  const rotation = swingAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-35deg', '35deg'],
  });

  // Pivot point from SVG: cx="7.68879" cy="1.35651"
  const pivotX = 7.68879;
  const pivotY = 1.35651;

  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.svgWrapper}>
            <Svg width={100} height={100} viewBox="0 0 16 16" fill="none">
              {/* Static side bars */}
              <Path
                d="M14.0792 1.35767V14.6516M1.35767 1.35767V14.6516"
                stroke="#4A82FD"
                strokeWidth="2.71555"
                strokeLinecap="round"
              />
              
              {/* Pivot dot (static) */}
              <Circle cx={pivotX} cy={pivotY} r="0.253241" fill="#4A82FD" />

              {/* Pendulum assembly (animated) */}
              <AnimatedG
                style={{
                  transform: [
                    { translateX: pivotX },
                    { translateY: pivotY },
                    { rotate: rotation },
                    { translateX: -pivotX },
                    { translateY: -pivotY },
                  ],
                }}
              >
                {/* Bob */}
                <Path
                  d="M11.1753 4.23291C11.6522 4.23291 12.0386 4.61925 12.0386 5.09619C12.0386 5.57314 11.6522 5.95947 11.1753 5.95947C10.6983 5.95947 10.312 5.57314 10.312 5.09619C10.312 4.61925 10.6984 4.23292 11.1753 4.23291Z"
                  fill="#4A82FD"
                  stroke="#4A82FD"
                  strokeWidth="0.181037"
                />
                
                {/* Arcs/Decorative curves */}
                <Path
                  d="M12.3307 5.66161C11.1745 6.90774 9.52266 7.68754 7.68869 7.68754C4.19216 7.68754 1.35767 4.85304 1.35767 1.35651M8.00159 7.2261C4.50506 7.2261 1.87876 4.5998 1.87876 1.10327M11.2584 7.2261C6.82913 9.70129 2.26958 6.70501 2.11739 4.90189"
                  stroke="#4A82FD"
                  strokeWidth="0.288305"
                  strokeLinecap="round"
                />
                
                {/* Pendulum arm */}
                <Path
                  d="M7.68872 1.35645L11.2341 5.28168"
                  stroke="#4A82FD"
                  strokeWidth="0.288305"
                  strokeLinecap="round"
                />
              </AnimatedG>
            </Svg>
          </View>
          {message && (
            <Text style={styles.messageText}>{message}</Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    height: height,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgWrapper: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    marginTop: 20,
    fontSize: 16,
    color: '#4A82FD',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default LoadingScreen;
