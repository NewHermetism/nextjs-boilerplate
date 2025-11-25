import { useEffect, useState } from 'react';
import { useSocket } from 'pages/Providers/socket'; // Calls the Socket.
import { VDashScore } from 'types';

const MIN_LEADERBOARD_ENTRIES = 30;

interface UseGetLeaderboardProps {
  fetchProps?: any[];
  shouldFetch?: boolean;
  limit?: number;
}

export const useGetLeaderboard = ({
  fetchProps = [],
  shouldFetch = true,
  limit = MIN_LEADERBOARD_ENTRIES
}: UseGetLeaderboardProps) => {

  const [leaderboard, setLeaderboard] = useState<VDashScore[]>([]);
  const [loading, setLoading] = useState<boolean>();

  const { socket, isConnected } = useSocket();

 
  useEffect(() => {
    if (!isConnected || !shouldFetch) {
      return;
    }


    const normalizedLimit = Math.max(limit, MIN_LEADERBOARD_ENTRIES);

    const getLeaderboard = (entriesLimit: number): Promise<VDashScore[]> => {
      setLoading(true);
      return new Promise<VDashScore[]>((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }
        socket.emit('getLeaderboard', {
          limit: entriesLimit
        });

        socket.once('getLeaderboard', (data: any) => {
          const normalizedData = Array.isArray(data)
            ? data
            : Array.isArray(data?.leaderboard)
              ? data.leaderboard
              : [];
          setLeaderboard(normalizedData);
          setLoading(false);
          resolve(normalizedData);
        });

        socket.once('getLeaderboardError', (error) => {
          setLoading(false);
          reject(error);
        });
      });
    };


    getLeaderboard(normalizedLimit);
  }, [isConnected, shouldFetch, limit, socket, ...fetchProps]);

  return { leaderboard, loading };
};
