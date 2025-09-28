import { Book, Discord, Instagram, Medium, Telegram, X } from 'assets/svg';
import { BackgroundCard } from '../BackgroundCard';

export const Whitepaper = () => {
  return (
    <BackgroundCard className='flex-1'>
      <div className='w-[16vw] md:w-[5.5vw] max-h-[20vh] m-auto flex justify-center md:ml-8'>
        <img
          src='/images/asset_1_1.png'
          alt='Logo'
          className='object-contain lg:ml-3'
        />
      </div>
      <div className='flex flex-col flex-1 justify-center'>
        <a
          target='_blank'
          href='https://supervictor-universe.gitbook.io/supervictor-universe-whitepaper'
          className='text-xs lg:text-2xl lg:font-bold tracking-wider font-bungee text-white text-center sm:mb-1 mb-2 lg:mb-5'
        >
          WHITEPAPER
        </a>
        <div className='flex flex-1 justify-center gap-2 lg:gap-6'>
          <a
            target='_blank'
            href='https://x.com/SVictorUniverse'
            className='hover:scale-110 w-[3vh] md:w-[2vw]'
          >
            <X width='100%' height='100%' />
          </a>
          <a
            target='_blank'
            href='https://discord.gg/w6FhnKryGd'
            className='hover:scale-110 w-[3vh] md:w-[2vw]'
          >
            <Discord width='100%' height='100%' />
          </a>
          <a
            target='_blank'
            href='https://www.instagram.com/supervictoruniverse?igsh=ZjdrajU0N282NXY5'
            className='hover:scale-110 w-[3vh] md:w-[2vw]'
          >
            <Instagram width='100%' height='100%' />
          </a>
        </div>
        <div className='flex flex-1 justify-center gap-2 lg:gap-6'>
          <a
            target='_blank'
            href='https://t.me/VictorBySVU'
            className='hover:scale-110 w-[3vh] md:w-[2vw]'
          >
            <Telegram width='100%' height='100%' />
          </a>
          <a
            target='_blank'
            href='https://medium.com/@SVictorUniverse'
            className='hover:scale-110 w-[3vh] md:w-[2vw]'
          >
            <Medium width='100%' height='100%' />
          </a>
          <a
            target='_blank'
            href='https://supervictor-universe.gitbook.io/supervictor-universe-whitepaper'
            className='hover:scale-110 w-[3vh] md:w-[2vw]'
          >
            <Book width='100%' height='100%' />
          </a>
        </div>
      </div>
    </BackgroundCard>
  );
};
