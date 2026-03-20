import { TouchableOpacity, Text, Image, View } from 'react-native';
import { BASE_URL } from '../../constants/api';
import { useTheme } from '../hooks/useTheme';

interface MemberButtonProps {
  nickname: string;
  pic: string | null;
  disabled?: boolean;
  selected?: boolean;
  size: number;
  onPress: () => void;
}

export default function MemberButton({
  nickname,
  pic,
  disabled,
  selected,
  size,
  onPress,
}: MemberButtonProps) {
  const theme = useTheme();
  const capped = Math.min(size, 160);

  // Darken primary color slightly for selected state
  const bgColor = disabled
    ? '#d1d5db'
    : selected
    ? theme.secondary
    : theme.primary;

  return (
    <TouchableOpacity
      style={{
        width: capped,
        height: capped,
        margin: 4,
        borderRadius: 12,
        backgroundColor: bgColor,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: disabled ? 0 : 0.15,
        shadowRadius: 4,
        elevation: disabled ? 0 : 3,
        opacity: disabled ? 0.6 : 1,
      }}
      activeOpacity={disabled ? 1 : 0.75}
      onPress={disabled ? undefined : onPress}
    >
      {pic ? (
        <Image
          source={{ uri: `${BASE_URL}${pic}` }}
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
            backgroundColor: 'rgba(255,255,255,0.2)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 4,
          }}
        >
          <Text style={{ fontSize: capped * 0.18, color: '#fff' }}>
            {nickname.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <Text
        style={{
          color: '#fff',
          fontFamily: 'DMSans_600SemiBold',
          fontSize: Math.min(12, capped * 0.12),
          textAlign: 'center',
          paddingHorizontal: 4,
        }}
        numberOfLines={2}
      >
        {nickname}
      </Text>
    </TouchableOpacity>
  );
}
