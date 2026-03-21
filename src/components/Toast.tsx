import { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';

interface ToastProps {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: 100,
        left: 24,
        right: 24,
        backgroundColor: '#1f2937',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 18,
        opacity,
        transform: [{ translateY }],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        alignItems: 'center',
      }}
    >
      <Text style={{ fontFamily: 'DMSans_500Medium', color: '#fff', fontSize: 14 }}>
        {message}
      </Text>
    </Animated.View>
  );
}
