import { VictorLeague } from 'assets/svg/VictorLeague';
import { BackgroundCard } from '../BackgroundCard';

export const ComingSoon = () => {
  return (
    <BackgroundCard className='flex-1 flex-row-reverse lg:flex-row'>
      <div className='w-[25vw] md:w-[6vw] max-h-[20vh] m-auto flex justify-center md:ml-8'>
        <img
          className='lg:scale-x-[1] scale-x-[-1] object-contain lg:ml-3'
          src='/images/asset_2.png'
          alt='Logo'
        />
      </div>
      <div className='flex flex-col flex-1 justify-center items-center'>
        <div className='text-xl lg:text-2xl font-bold tracking-wider font-bungee text-white text-center mb-5'>
          COMING SOON
        </div>
        <div className='max-h-[5vh]'>
          <VictorLeague />
        </div>
      </div>
    </BackgroundCard>
  );
};
