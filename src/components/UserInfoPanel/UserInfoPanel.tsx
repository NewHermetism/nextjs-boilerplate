import { useState, useEffect } from 'react';
import { useGetAccount } from '@multiversx/sdk-dapp/hooks/account/useGetAccount';
import { useGetProfile } from 'hooks/useGetProfile';

export const UserInfoPanel = () => {
  const { address } = useGetAccount();
  const { profile, isLoading } = useGetProfile();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'w' || event.key === 'W') {
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  if (!address || !isVisible) {
    return null;
  }

  const shortAddress = `${address.substring(0, 10)}...${address.substring(address.length - 6)}`;

  return (
    <div className='fixed top-4 right-4 bg-black/90 text-white px-6 py-4 rounded-lg font-mono text-sm z-50 border border-gray-700 shadow-2xl min-w-[320px]'>
      <div className='flex justify-between items-center mb-3 pb-2 border-b border-gray-700'>
        <h3 className='text-base font-bold text-gray-200'>User Info</h3>
        <span className='text-xs text-gray-500'>Press W to toggle</span>
      </div>

      <div className='space-y-3'>
        <div>
          <div className='text-xs text-gray-400 mb-1'>Wallet Address</div>
          <div className='text-green-400 font-semibold'>{shortAddress}</div>
          <div className='text-[10px] text-gray-600 mt-1 break-all'>{address}</div>
        </div>

        <div className='border-t border-gray-700 pt-3'>
          <div className='text-xs text-gray-400 mb-2'>NFT Ownership</div>
          {isLoading ? (
            <div className='text-xs text-gray-500'>Loading...</div>
          ) : profile ? (
            <div className='space-y-1'>
              <div className='flex items-center justify-between text-xs'>
                <span className='text-gray-300'>White Pijama</span>
                <span className={profile.has_white_pijama_nft ? 'text-green-400' : 'text-red-400'}>
                  {profile.has_white_pijama_nft ? 'OWNED' : 'NOT OWNED'}
                </span>
              </div>
              <div className='flex items-center justify-between text-xs'>
                <span className='text-gray-300'>Boss</span>
                <span className={profile.has_boss_nft ? 'text-green-400' : 'text-red-400'}>
                  {profile.has_boss_nft ? 'OWNED' : 'NOT OWNED'}
                </span>
              </div>
              <div className='flex items-center justify-between text-xs'>
                <span className='text-gray-300'>Blue Victor</span>
                <span className={profile.has_blue_victor_nft ? 'text-green-400' : 'text-red-400'}>
                  {profile.has_blue_victor_nft ? 'OWNED' : 'NOT OWNED'}
                </span>
              </div>
            </div>
          ) : (
            <div className='text-xs text-gray-500'>No profile data</div>
          )}
        </div>
      </div>
    </div>
  );
};
