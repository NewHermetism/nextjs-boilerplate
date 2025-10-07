import { useEffect, useState } from 'react';
import { useSocket } from 'pages/Providers/socket';
import { VDashScore } from 'vdash-utils/types';

interface UseGetLeaderboardProps {
  fetchProps?: any[];
}
export const useGetLeaderboard = ({
  fetchProps = []
}: UseGetLeaderboardProps) => {
  const [leaderboard, setLeaderboard] = useState<VDashScore[]>([]);
  const [loading, setLoading] = useState<boolean>();

  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    const getLeaderboard = (limit: number): Promise<VDashScore[]> => {
      setLoading(true);
      return new Promise<any[]>((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }
        socket.emit('getLeaderboard', {
          limit
        });

        socket.once('getLeaderboard', (data: any[]) => {
          setLeaderboard(data);
          setLoading(false);
          resolve(data);
        });

        socket.once('getLeaderboardError', (error) => {
          setLoading(false);
          reject(error);
        });
      });
    };

    getLeaderboard(100);
  }, [isConnected, ...fetchProps]);

  return { leaderboard, loading };
};
