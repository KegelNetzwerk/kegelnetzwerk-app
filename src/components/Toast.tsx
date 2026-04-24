import { useEffect, useRef } from 'react';
import { Animated, Text, View, Platform } from 'react-native';

export interface ToastItem {
  id: string;
  message: string;
}

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

function SingleToast({ message }: { message: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 180, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        backgroundColor: '#1f2937',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        opacity,
        transform: [{ translateY }],
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.25)',
        elevation: 6,
      }}
    >
      <Text style={{ fontFamily: 'DMSans_500Medium', color: '#fff', fontSize: 14 }}>
        {message}
      </Text>
    </Animated.View>
  );
}

interface ToastStackProps {
  toasts: ToastItem[];
}

export default function ToastStack({ toasts }: ToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 100,
        left: 24,
        right: 24,
        gap: 6,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <SingleToast key={t.id} message={t.message} />
      ))}
    </View>
  );
}
