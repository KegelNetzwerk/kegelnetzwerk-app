import { useAuth, DEFAULT_COLORS, type ClubColors } from './useAuth';

export function useTheme(): ClubColors {
  const { user } = useAuth();
  return user?.colors ?? DEFAULT_COLORS;
}
