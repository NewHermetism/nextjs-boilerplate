import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';

import PlayScene from '../../games/dino/scenes/PlayScene';
import PreloadScene from '../../games/dino/scenes/PreloadScene';
import { AuthRedirectWrapper } from 'wrappers';
import { useIsMobile } from 'utils/useIsMobile';
import { RotateScreen } from './components/RotateScreen';
import { LeaderboardModal } from './components/LeaderboardModal';
import { useGetLeaderboard, useGetLoginInfo } from 'hooks';
import { isTablet, isMobile } from 'react-device-detect';

export const Game = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const { isLandscape } = useIsMobile();
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const isLeaderboardOpenRef = useRef(isLeaderboardOpen);

  const { tokenLogin } = useGetLoginInfo();

  useEffect(() => {
    isLeaderboardOpenRef.current = isLeaderboardOpen;
  }, [isLeaderboardOpen]);

  useEffect(() => {
    if ((isMobile || isTablet) && !isLandscape) setIsLeaderboardOpen(false);
  }, [isMobile, isTablet, isLandscape]);

  useEffect(() => {
    if (tokenLogin?.nativeAuthToken) {
      const config = {
        type: Phaser.AUTO,
        width: '900',
        height: '440',
        pixelArt: true,
        transparent: true,
        physics: {
          default: 'arcade',
          arcade: {
            debug: false,
            fps: 60,
            fixedSteps: true
          }
        },
        scene: [new PreloadScene()],
        parent: 'phaser-game'
      };

      gameRef.current = new Phaser.Game(config);
      gameRef.current.scene.add(
        'PlayScene',
        new PlayScene(
          tokenLogin?.nativeAuthToken,
          () => setIsLeaderboardOpen(true),
          () => isLeaderboardOpenRef.current
        )
      );
    }
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [tokenLogin?.nativeAuthToken]);

  const { leaderboard, loading } = useGetLeaderboard({
    fetchProps: [isLeaderboardOpen],
    shouldFetch: isLeaderboardOpen
  });

  return (
    <AuthRedirectWrapper>
      <div className='flex flex-col justify-center items-center h-[calc(100vh-200px)] bg-transparent'>
        {(isMobile || isTablet) && !isLandscape && <RotateScreen />}
        <LeaderboardModal
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
          leaderboard={leaderboard}
          loading={loading}
        />
        <div
          id='phaser-game'
          className={`${
            isTablet && isLandscape
              ? 'relative'
              : isMobile && isLandscape
              ? `absolute top-0 bg-[url('/images/platform_bg.png')]`
              : 'relative'
          } flex justify-center w-full h-full max-h-[46vw]`}
        />
      </div>
    </AuthRedirectWrapper>
  );
};
