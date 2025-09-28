import { BackgroundCard } from '../BackgroundCard';

type LeaderboardProps = {
  onOpen: () => void;
};

export const Leaderboard = ({ onOpen }: LeaderboardProps) => (
  <BackgroundCard className='hover:scale-105 transition-transform cursor-pointer flex-1'>
    <button
      type='button'
      onClick={onOpen}
      className='flex flex-1 justify-center items-center w-full h-full text-white font-bungee text-2xl lg:text-5xl tracking-wider'
    >
      Leaderboard
    </button>
  </BackgroundCard>
);
