import { BackgroundCard } from '../BackgroundCard';
import { useIsMobile } from 'utils/useIsMobile';

export const Merch = () => {
  const { isMobile } = useIsMobile();

  return (
    <BackgroundCard
      className={` ${
        isMobile
          ? `!bg-[url('/images/back_2.jpg')]`
          : `!bg-[url('/images/back_3.png')]`
      } bg-center bg-contain hover:scale-105 transition-transform cursor-pointer lg:col-span-2`}
    >
      <a
        target='_blank'
        href='https://supervictoruniverse.com/'
        className='flex flex-col flex-1 justify-center w-full'
      >
        <div className='text-4xl lg:text-6xl font-bold tracking-wider font-bungee text-white text-center mb-1 lg:mb-7'>
          Merch
        </div>
        <div className='flex flex-1 justify-around items-end'>
          {Array.from({ length: 5 }).map((_, index) => (
            <div className='w-[15vw] md:w-[7vw]' key={index}>
              <img
                key={index}
                src={`/images/asset_${index + 5}.png`}
                alt='Logo'
                className='object-contain'
              />
            </div>
          ))}
        </div>
      </a>
    </BackgroundCard>
  );
};
