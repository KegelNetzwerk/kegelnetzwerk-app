import { TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface PartButtonProps {
  label: string;
  onPress: () => void;
  onLongPress: () => void;
  size: number;
}

export default function PartButton({ label, onPress, onLongPress, size }: PartButtonProps) {
  const theme = useTheme();
  const capped = Math.min(size, 160);

  return (
    <TouchableOpacity
      style={{
        width: capped,
        height: capped,
        margin: 4,
        borderRadius: 12,
        backgroundColor: theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
      }}
      activeOpacity={0.75}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
    >
      <Text
        style={{
          color: '#fff',
          fontFamily: 'DMSans_700Bold',
          fontSize: Math.min(16, capped * 0.16),
          textAlign: 'center',
          paddingHorizontal: 8,
        }}
        numberOfLines={3}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
