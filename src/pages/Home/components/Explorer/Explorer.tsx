import { BackgroundCard } from '../BackgroundCard';

export const Explorer = () => {
  return (
    <BackgroundCard className='hover:scale-105 transition-transform cursor-pointer col-span-1 flex:1 items-end'>
      <a
        target='_blank'
        href='https://explorer.multiversx.com/tokens/VICTOR-9fa27f'
        className='w-[30vw] md:w-[15vw]'
      >
        <img src='/images/asset_4.png' alt='Logo' className='object-contain' />
      </a>
    </BackgroundCard>
  );
};
