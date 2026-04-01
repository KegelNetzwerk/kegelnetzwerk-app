import { TouchableOpacity, Text, Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BASE_URL } from '../../constants/api';
import { useColors } from '../hooks/useColors';

interface MemberButtonProps {
  nickname: string;
  pic: string | null;
  picUri?: string; // local URI (guests); takes precedence over pic
  disabled?: boolean;
  selected?: boolean;
  size: number;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function MemberButton({
  nickname,
  pic,
  picUri,
  disabled,
  selected,
  size,
  onPress,
  onLongPress,
}: MemberButtonProps) {
  const c = useColors();
  const capped = Math.min(size, 160);

  const gradientColors: [string, string] = disabled
    ? [c.divider, c.divider]
    : c.isDark
      ? [c.subSurface, c.card]
      : ['#ffffff', c.surface];

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
        shadowOpacity: disabled ? 0 : 0.08,
        shadowRadius: 8,
        elevation: disabled ? 0 : 2,
        opacity: disabled ? 0.5 : 1,
      }}
      activeOpacity={disabled ? 1 : 0.75}
      onPress={disabled ? undefined : onPress}
      onLongPress={disabled ? undefined : onLongPress}
      delayLongPress={400}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        {(picUri || pic) ? (
          <Image
            source={{ uri: picUri ?? `${BASE_URL}${pic}` }}
            style={{
              width: capped * 0.55,
              height: capped * 0.55,
              borderRadius: capped * 0.275,
              marginBottom: 4,
            }}
          />
        ) : (
          <View
            style={{
              width: capped * 0.45,
              height: capped * 0.45,
              borderRadius: capped * 0.225,
              backgroundColor: c.primaryFg + '25',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 4,
            }}
          >
            <Text style={{ fontSize: capped * 0.18, color: c.primaryFg }}>
              {nickname.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text
          style={{
            color: disabled ? c.textFaint : c.text,
            fontFamily: 'DMSans_600SemiBold',
            fontSize: Math.min(16, capped * 0.16),
            textAlign: 'center',
            paddingHorizontal: 4,
          }}
          numberOfLines={2}
        >
          {nickname}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}
