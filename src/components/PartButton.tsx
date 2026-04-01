import { TouchableOpacity, Text, View, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../hooks/useColors';
import { BASE_URL } from '../../constants/api';

interface PartButtonProps {
  label: string;
  pic?: string;
  onPress: () => void;
  onLongPress: () => void;
  size: number;
}

export default function PartButton({ label, pic, onPress, onLongPress, size }: PartButtonProps) {
  const c = useColors();
  const capped = Math.min(size, 160);

  const isEmoji = pic?.startsWith('emoji:');
  const isCustomImage = pic && pic !== 'none' && !isEmoji;

  // Image area: 90% of button width; height leaves room for the label below
  const imgWidth = Math.round(capped * 0.9);
  const imgAreaHeight = Math.round(capped * 0.68);

  const imageUri = isCustomImage
    ? (pic.startsWith('http') ? pic : `${BASE_URL}${pic}`)
    : null;

  const avatarSize = Math.round(capped * 0.45);

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
        style={{
          flex: 1,
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingTop: 5,
        }}
      >
        {isEmoji ? (
          <View style={{ width: imgWidth, height: imgAreaHeight, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: Math.round(imgAreaHeight * 0.6) }}>{pic.slice(6)}</Text>
          </View>
        ) : imageUri ? (
          <View style={{ width: imgWidth, height: imgAreaHeight, padding: 6 }}>
            <Image
              source={{ uri: imageUri }}
              style={{ flex: 1, borderRadius: 6 }}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View style={{ width: imgWidth, height: imgAreaHeight, justifyContent: 'center', alignItems: 'center' }}>
            <View
              style={{
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                backgroundColor: c.primaryFg + '25',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: Math.round(avatarSize * 0.45), color: c.primaryFg }}>
                {label.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
        )}
        <Text
          style={{
            color: c.text,
            fontFamily: 'DMSans_700Bold',
            fontSize: Math.min(16, capped * 0.16),
            textAlign: 'center',
            paddingHorizontal: 8,
            paddingTop: 3,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}
