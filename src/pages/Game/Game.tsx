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
import { isTestModeEnabled } from 'utils/isTestModeEnabled';
export const Game = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const { isLandscape } = useIsMobile();
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const isLeaderboardOpenRef = useRef(isLeaderboardOpen);

  const { tokenLogin } = useGetLoginInfo();
  const accessToken = isTestModeEnabled()
    ? 'test-mode-token'
    : tokenLogin?.nativeAuthToken;

  useEffect(() => {
    isLeaderboardOpenRef.current = isLeaderboardOpen;
  }, [isLeaderboardOpen]);

  useEffect(() => {
    if ((isMobile || isTablet) && !isLandscape) setIsLeaderboardOpen(false);
  }, [isMobile, isTablet, isLandscape]);

  useEffect(() => {
    if (accessToken) {
      const config = {
        type: Phaser.AUTO,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: 900,
          height: 440,
          parent: 'phaser-game'
        },
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
      const playSceneInstance = new PlayScene(
        accessToken,
        () => setIsLeaderboardOpen(true),
        () => isLeaderboardOpenRef.current
      );
      gameRef.current.scene.add('PlayScene', playSceneInstance);
    }
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [accessToken]);

  const { leaderboard, loading } = useGetLeaderboard({
    fetchProps: [isLeaderboardOpen],
    shouldFetch: isLeaderboardOpen
  });

  return (
    <AuthRedirectWrapper>
      <div className='min-h-[calc(100vh-140px)] w-full flex flex-col items-center justify-center gap-6 px-4 py-10'>
        {(isMobile || isTablet) && !isLandscape && <RotateScreen />}
        <div className='w-full max-w-5xl flex flex-col items-center gap-4'>
          <div className='w-full'>
            <div
              className="game-stage relative w-full aspect-[45/22] rounded-[32px] border border-white/20 bg-[url('/images/platform_bg.png')] bg-cover bg-center shadow-[0_25px_80px_rgba(0,0,0,0.45)] overflow-hidden"
            >
              <div id='phaser-game' className='absolute inset-0' />
            </div>
          </div>
        </div>
        <LeaderboardModal
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
          leaderboard={leaderboard}
          loading={loading}
        />
      </div>
    </AuthRedirectWrapper>
  );
};
