import { FaTrophy } from 'react-icons/fa';

import { BackgroundCard } from '../BackgroundCard';

type LeaderboardProps = {
  onOpen: () => void;
};

export const Leaderboard = ({ onOpen }: LeaderboardProps) => (
  <BackgroundCard className='hover:scale-105 transition-transform cursor-pointer flex-1'>
    <button
      type='button'
      onClick={onOpen}
      className='flex flex-1 items-center justify-center w-full h-full px-4 py-6 text-white font-bungee'
    >
      <span className='flex flex-col items-center gap-2 text-center sm:flex-row sm:gap-4'>
        <FaTrophy
          className='text-3xl text-yellow-300 drop-shadow-md md:text-4xl lg:text-5xl'
          aria-hidden='true'
        />
        <span className='text-lg md:text-2xl lg:text-3xl tracking-wider uppercase'>
          Leaderboard
        </span>
      </span>
    </button>
  </BackgroundCard>
);
