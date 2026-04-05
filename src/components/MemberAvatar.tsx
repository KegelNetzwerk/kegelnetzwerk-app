import { View, Image } from 'react-native';
import { UserRound } from 'lucide-react-native';
import { BASE_URL } from '../../constants/api';
import { useColors } from '../hooks/useColors';

interface MemberAvatarProps {
  /** Server-relative path (e.g. "/avatars/foo.jpg") or "none" / null — shows icon placeholder */
  pic?: string | null;
  /** Local device URI (guests); takes precedence over pic */
  picUri?: string;
  size: number;
}

/**
 * Renders a circular member/guest avatar.
 * Shows the image when available, otherwise a UserRound icon placeholder.
 */
export default function MemberAvatar({ pic, picUri, size }: MemberAvatarProps) {
  const c = useColors();
  const radius = size / 2;
  const hasImage = picUri || (pic && pic !== 'none');

  if (hasImage) {
    return (
      <Image
        source={{ uri: picUri ?? `${BASE_URL}${pic}` }}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: c.primaryFg + '25',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <UserRound size={size * 0.55} color={c.primaryFg} />
    </View>
  );
}
