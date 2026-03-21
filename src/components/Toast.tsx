import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

export interface ToastItem {
  id: string;
  message: string;
}

function SingleToast({ message }: { message: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
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
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: 100,
        left: 24,
        right: 24,
        gap: 6,
      }}
    >
      {toasts.map((t) => (
        <SingleToast key={t.id} message={t.message} />
      ))}
    </View>
  );
}
