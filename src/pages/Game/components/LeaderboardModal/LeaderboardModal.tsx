import { useEffect } from 'react';
import { displayAddress } from 'utils/display/address';
// NOTE: using local temp types for offline dev
import { VDashScore } from 'types/vdash.types';
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  return (
    <div
      role='dialog'
      aria-modal='true'
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 font-micro px-4'
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-[900px] rounded-2xl border-4 border-[#6e4b9e] bg-[#9C80C4] p-6 shadow-2xl ${
          isMobile ? 'max-h-[75vh]' : 'max-h-[80vh]'
        } overflow-y-auto scrollbar-thin`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          className='absolute top-1 right-2 text-white text-2xl font-bold hover:text-gray-300'
        >
          &times;
        </button>
        <table className='w-full border-separate border-spacing-y-2 text-center'>
          <thead>
            <tr className='bg-[#FDF3A1] text-black font-thin text-2xl'>
              <th className='py-2 px-4'>RANK</th>
              <th className='py-2 px-4'>CHARACTER</th>
              <th className='py-2 px-4'>PLAYER (ERD)</th>
              <th className='py-2 px-4'>SCORE</th>
              <th className='py-2 px-4'>REWARD ($VICTOR)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className='py-6 text-lg text-white'>
                  Loading leaderboard...
                </td>
              </tr>
            ) : leaderboard.length > 0 ? (
              leaderboard.map(
                ({ avatar, player_address, reward, score }, index) => (
                  <tr key={index} className='bg-[#6ED0E0] rounded'>
                    <td className='py-2 px-4'>{index + 1}</td>
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
                )
              )
            ) : (
              <tr>
                <td colSpan={5} className='py-6 text-lg text-white'>
                  No leaderboard entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
