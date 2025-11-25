import { displayAddress } from 'utils/display/address';
import { VDashScore } from 'types';
import { useIsMobile } from 'utils/useIsMobile';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderboard: VDashScore[];
  loading?: boolean;
}

export const LeaderboardModal = ({
  isOpen,
  onClose,
  leaderboard,
  loading = false
}: LeaderboardModalProps) => {
  if (!isOpen) return null;
  const { isMobile } = useIsMobile();

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 border-2 border-black shadow-md'; // Gold
    if (index === 1) return 'bg-gradient-to-r from-gray-300 to-gray-400 border-2 border-black shadow-md'; // Silver
    if (index === 2) return 'bg-gradient-to-r from-amber-600/40 to-amber-700/40 border-2 border-black shadow-md'; // Bronze
    return 'bg-[#6ED0E0]';
  };

  const renderBody = () => {
    if (loading) {
      return (
        <tr className='bg-transparent'>
          <td colSpan={5} className='py-8 text-center text-white text-lg'>
            Loading leaderboard...
          </td>
        </tr>
      );
    }

    if (!leaderboard.length) {
      return (
        <tr className='bg-transparent'>
          <td colSpan={5} className='py-8 text-center text-white text-lg'>
            No leaderboard data available yet.
          </td>
        </tr>
      );
    }

    return leaderboard.map(({ avatar, player_address, reward, score }, index) => (
      <tr key={player_address} className={`${getRankColor(index)} rounded`}>
        <td className='py-2 px-4 font-bold'>{index + 1}</td>
        <td className='py-2 px-4'>
          <img
            src={`/images/head_${avatar + 1}.png`}
            alt={`Character ${avatar}`}
            className='mx-auto h-8 w-8 object-contain'
          />
        </td>
        <td
          className='py-2 px-4 cursor-pointer'
          onClick={() => handleCopy(player_address)}
        >
          {displayAddress(player_address)}
        </td>
        <td className='py-2 px-4'>{score}</td>
        <td className='py-2 px-4'>{reward}</td>
      </tr>
    ));
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-0 font-micro`}
    >
      <div
        className={`relative rounded-2xl border-4 border-[#6e4b9e] bg-[#9C80C4] shadow-2xl ${
          isMobile ? 'w-[90vw] max-h-[85vh]' : 'w-[900px] max-h-[85vh]'
        } flex flex-col`}
      >
        <button
          onClick={onClose}
          className='absolute top-1 right-2 text-white text-2xl font-bold hover:text-gray-300 z-10'
        >
          &times;
        </button>
        <div className='p-6 pb-2'>
          <h2 className='text-2xl font-bold text-white text-center mb-4'>LEADERBOARD</h2>
        </div>
        <div className='overflow-y-auto px-6 pb-6 flex-1 max-h-[60vh]'>
          <table className='w-full border-separate border-spacing-y-2 text-center'>
            <thead className='sticky top-0 z-10'>
              <tr className='bg-[#FDF3A1] text-black font-thin text-2xl'>
                <th className='py-2 px-4'>RANK</th>
                <th className='py-2 px-4'>CHARACTER</th>
                <th className='py-2 px-4'>PLAYER (ERD)</th>
                <th className='py-2 px-4'>SCORE</th>
                <th className='py-2 px-4'>REWARD ($VICTOR)</th>
              </tr>
            </thead>
            <tbody>
              {renderBody()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
