import { useState } from 'react';
import { AuthRedirectWrapper } from 'wrappers';
import { UserInfoPanel } from 'components';

import { useScrollToElement, useGetLeaderboard } from 'hooks';
import {
  Whitepaper,
  ComingSoon,
  Play,
  BackgroundCard,
  Explorer,
  Merch,
  Leaderboard
} from './components';

import { Links } from 'types';
import { useGetProfile } from 'hooks/useGetProfile';
import { useIsMobile } from 'utils/useIsMobile';
import { LeaderboardModal } from 'pages/Game/components/LeaderboardModal';

export const Home = () => {
  useScrollToElement();
  useGetProfile();
  const { isMobile } = useIsMobile();
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  const { leaderboard, loading } = useGetLeaderboard({
    fetchProps: [isLeaderboardOpen],
    shouldFetch: isLeaderboardOpen
  });

  const linksArray = Object.values(Links);

  return (
    <AuthRedirectWrapper requireAuth={false}>
      <UserInfoPanel />
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        leaderboard={leaderboard}
        loading={loading}
      />
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-8 w-full'>
        <div className='lg:space-y-4 flex lg:flex-col gap-3 lg:gap-1'>
          <Whitepaper />
          {isMobile && (
            <div className='flex flex-col gap-3'>
              <Play />
              <Leaderboard onOpen={() => setIsLeaderboardOpen(true)} />
            </div>
          )}
          {!isMobile && <ComingSoon />}
        </div>
        {!isMobile && (
          <div className='flex flex-col gap-3'>
            <Play />
            <Leaderboard onOpen={() => setIsLeaderboardOpen(true)} />
          </div>
        )}
        {isMobile && (
          <div className='flex gap-3'>
            <Explorer />
            <ComingSoon />
          </div>
        )}
        {isMobile && <Merch />}
        <div className='grid grid-cols-3 grid-rows-3 gap-3 lg:gap-4'>
          {Array.from({ length: 9 }).map((_, index) => (
            <BackgroundCard
              key={index}
              className='hover:scale-105 transition-transform cursor-pointer items-center !p-0'
            >
              <a
                target='_blank'
                href={linksArray[index]}
                className='flex flex-1 justify-center h-[11vh]'
              >
                <img
                  src={`/images/nft__${index + 1}.png`}
                  alt='Logo'
                  width={index === 3 || index === 4 ? '75%' : '100%'}
                  className='object-contain'
                />
              </a>
            </BackgroundCard>
          ))}
        </div>
      </div>
      {!isMobile && (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 w-full'>
          <Explorer />
          <Merch />
        </div>
      )}
    </AuthRedirectWrapper>
  );
};
