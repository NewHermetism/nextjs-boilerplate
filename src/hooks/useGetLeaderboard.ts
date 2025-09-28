import { useEffect, useState } from 'react';
import { useSocket } from 'pages/Providers/socket';
// NOTE: using local temp types for offline dev
import { VDashScore } from 'types/vdash.types';

interface UseGetLeaderboardProps {
  fetchProps?: any[];
  shouldFetch?: boolean;
  limit?: number;
}
export const useGetLeaderboard = ({
  fetchProps = [],
  shouldFetch = true,
  limit = 100
}: UseGetLeaderboardProps) => {
  const [leaderboard, setLeaderboard] = useState<VDashScore[]>([]);
  const [loading, setLoading] = useState<boolean>();

  const { socket, isConnected } = useSocket();
  const publicLeaderboardUrl = import.meta.env
    .VITE_PUBLIC_LEADERBOARD_URL as string | undefined;

  useEffect(() => {
    const disableAuth = import.meta.env.VITE_DISABLE_AUTH === 'true';

    if (!shouldFetch) {
      return;
    }

    // TEMP: offline stub for leaderboard when auth is disabled
    if (disableAuth) {
      const stub: VDashScore[] = Array.from({ length: 10 }).map((_, i) => ({
        avatar: i % 3,
        player_address: `erd1${'x'.repeat(3)}...${'y'.repeat(3)}${i}`,
        reward: 0,
        score: 1000 - i * 10
      }));
      setLeaderboard(stub);
      setLoading(false);
      return;
    }

    const fetchViaSocket = () => {
      if (!socket || !isConnected) {
        return false;
      }

      setLoading(true);
      const successEvent = 'getLeaderboard';
      const errorEvent = 'getLeaderboardError';

      const handleSuccess = (data: VDashScore[]) => {
        setLeaderboard(data);
        setLoading(false);
      };

      const handleError = () => {
        setLoading(false);
      };

      socket.emit('getLeaderboard', {
        limit
      });

      socket.once(successEvent, handleSuccess);
      socket.once(errorEvent, handleError);

      return () => {
        socket.off(successEvent, handleSuccess);
        socket.off(errorEvent, handleError);
      };
    };

    const fetchViaHttp = async () => {
      if (!publicLeaderboardUrl) {
        console.warn(
          'Missing VITE_PUBLIC_LEADERBOARD_URL env var for public leaderboard access.'
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const url = publicLeaderboardUrl.includes('?')
          ? `${publicLeaderboardUrl}&limit=${limit}`
          : `${publicLeaderboardUrl}?limit=${limit}`;

        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch leaderboard: ${response.status}`);
        }

        const data = (await response.json()) as VDashScore[];
        setLeaderboard(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const cleanup = fetchViaSocket();

    if (!cleanup) {
      void fetchViaHttp();
    }

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [isConnected, socket, shouldFetch, publicLeaderboardUrl, limit, ...fetchProps]);

  return { leaderboard, loading };
};
