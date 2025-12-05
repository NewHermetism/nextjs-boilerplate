import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoPhoneLandscapeOutline } from 'react-icons/io5';

export const RotateScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='w-full h-full  bg-opacity-90 flex flex-col items-center justify-center text-white text-center z-50'
    >
      <motion.div
        animate={{ rotate: [0, 90, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <IoPhoneLandscapeOutline className='text-6xl mb-4 animate-bounce' />
      </motion.div>

      <p className='text-2xl font-bold'>Best in landscape, but playable in portrait.</p>
      <p className='text-lg opacity-80'>
        Rotate for more room if you can; otherwise continue playing.
      </p>
    </motion.div>
  );
};
