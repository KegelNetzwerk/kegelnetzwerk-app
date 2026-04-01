import { Image, Text } from 'react-native';
import { BASE_URL } from '../../constants/api';

interface Props {
  pic: string;
  size: number;
}

export default function PartPicView({ pic, size }: Props) {
  if (!pic || pic === 'none') return null;

  if (pic.startsWith('emoji:')) {
    return (
      <Text style={{ fontSize: size, lineHeight: size * 1.2, textAlign: 'center' }}>
        {pic.slice(6)}
      </Text>
    );
  }

  const uri = pic.startsWith('http') ? pic : `${BASE_URL}${pic}`;
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: 4 }}
      resizeMode="cover"
    />
  );
}
