import { useEffect, useState } from 'react';
import { useSocket } from 'pages/Providers/socket'; // Calls the Socket. 
import { VDashScore } from 'types';

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

  const [leaderboard, setLeaderboard] = useState<VDashScore[]>([]); // (?) Why useState<VDashScore[] works, where is defined ?. 

  const [loading, setLoading] = useState<boolean>();

  const { socket, isConnected } = useSocket(); //The CONSTs associated with the socket are defined from `pages/Providers/socket`

 
  useEffect(() => {
    if (!isConnected || !shouldFetch) {
      return;
    }


    const getLeaderboard = (entriesLimit: number): Promise<VDashScore[]> => {

      setLoading(true);
      return new Promise<any[]>((resolve, reject) => {
        if (!socket) {
          reject(new Error('Socket not connected'));
          return;
        }
        socket.emit('getLeaderboard', {
          limit: entriesLimit
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


    getLeaderboard(limit);
  }, [isConnected, shouldFetch, limit, socket, ...fetchProps]);

  return { leaderboard, loading };
};
