import { displayAddress } from 'utils/display/address';
import { VDashScore } from '../../../../games/dino/vdash-utils/types';
import { useIsMobile } from 'utils/useIsMobile';
interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderboard: VDashScore[];
}

export const LeaderboardModal = ({
  isOpen,
  onClose,
  leaderboard
}: LeaderboardModalProps) => {
  if (!isOpen) return null;
  const { isMobile } = useIsMobile();

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-0 font-micro`}
    >
      <div
        className={`relative rounded-2xl border-4 border-[#6e4b9e] bg-[#9C80C4] p-6 shadow-2xl ${
          isMobile ? 'w-[90vw]' : 'w-[900px]'
        } ${
          isMobile ? 'h-[75vh] overflow-scroll scrollbar-hide' : 'm-h-[40vh]'
        }`}
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
            {leaderboard.map(
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
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
