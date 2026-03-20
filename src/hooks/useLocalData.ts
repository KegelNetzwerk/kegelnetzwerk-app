import { useState, useEffect } from 'react';
import { getCachedMembers, getCachedGames, cacheMembers, cacheGames } from '../storage/cache';
import { fetchMembers } from '../api/members';
import { fetchGames } from '../api/games';
import type { Member } from '../models/Member';
import type { GameOrPenalty } from '../models/GameOrPenalty';

export function useLocalData() {
  const [members, setMembers] = useState<Member[]>([]);
  const [games, setGames] = useState<GameOrPenalty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      // Serve cache immediately
      const [cachedMembers, cachedGames] = await Promise.all([
        getCachedMembers(),
        getCachedGames(),
      ]);
      if (mounted) {
        setMembers(cachedMembers);
        setGames(cachedGames);
        setLoading(false);
      }

      // Refresh in background
      try {
        const [freshMembers, freshGames] = await Promise.all([fetchMembers(), fetchGames()]);
        await cacheMembers(freshMembers);
        await cacheGames(freshGames);
        if (mounted) {
          setMembers(freshMembers);
          setGames(freshGames);
        }
      } catch {
        // Use cached data — no network available
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  return { members, games, loading };
}
