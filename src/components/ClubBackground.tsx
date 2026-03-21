import { Image, useWindowDimensions } from 'react-native';
import { useAuth } from '../hooks/useAuth';

const bgSources = [
  require('../../assets/fullbg.jpg'),
  require('../../assets/fullbg_alt.jpg'),
  require('../../assets/fullbg_neutral.jpg'),
];

export default function ClubBackground() {
  const { user } = useAuth();
  const { width, height } = useWindowDimensions();
  const source = bgSources[user?.clubBg ?? 0] ?? bgSources[0];

  return (
    <Image
      source={source}
      style={{ position: 'absolute', top: 0, left: 0, width, height }}
      resizeMode="cover"
      pointerEvents="none"
    />
  );
}
