import { TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../hooks/useColors';

interface PartButtonProps {
  label: string;
  onPress: () => void;
  onLongPress: () => void;
  size: number;
}

export default function PartButton({ label, onPress, onLongPress, size }: PartButtonProps) {
  const c = useColors();
  const capped = Math.min(size, 160);

  return (
    <TouchableOpacity
      style={{
        width: capped,
        height: capped,
        margin: 4,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: c.divider,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
      }}
      activeOpacity={0.75}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
    >
      <LinearGradient
        colors={c.isDark ? [c.subSurface, c.card] : ['#ffffff', c.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <Text
          style={{
            color: c.text,
            fontFamily: 'DMSans_700Bold',
            fontSize: Math.min(16, capped * 0.16),
            textAlign: 'center',
            paddingHorizontal: 8,
          }}
          numberOfLines={3}
        >
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}
