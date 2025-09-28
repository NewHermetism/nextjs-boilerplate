import { Link } from 'react-router-dom';
import { BackgroundCard } from '../BackgroundCard';

export const Play = () => {
  return (
    <BackgroundCard className='hover:scale-105 transition-transform cursor-pointer flex-1'>
      <Link to='/game' className='flex flex-1 justify-center'>
        <div className='w-[15vw] md:w-[12vw] flex justify-center'>
          <img
            src='/images/asset_3.png'
            alt='Logo'
            className='object-contain lg:ml-2'
          />
        </div>
        <div className='flex flex-col flex-1 justify-center items-center'>
          <div className='text-3xl lg:text-7xl font-bold tracking-wider font-bungee text-white text-center lg:mb-5'>
            Play
          </div>
        </div>
      </Link>
    </BackgroundCard>
  );
};
