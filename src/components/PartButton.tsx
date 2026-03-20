import { TouchableOpacity, Text, View } from 'react-native';

interface PartButtonProps {
  label: string;
  onPress: () => void;
  size: number; // calculated cell size
}

export default function PartButton({ label, onPress, size }: PartButtonProps) {
  const capped = Math.min(size, 160);
  return (
    <TouchableOpacity
      style={{
        width: capped,
        height: capped,
        margin: 4,
        borderRadius: 12,
        backgroundColor: '#005982',
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
    >
      <Text
        style={{
          color: '#fff',
          fontWeight: 'bold',
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
