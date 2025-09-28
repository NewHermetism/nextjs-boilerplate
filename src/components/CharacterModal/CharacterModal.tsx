import { motion } from 'framer-motion';
import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CharacterModal = ({ onClose, isOpen }: Props) => {
  const [isFirstSelected, setIsFirstSelected] = useState(true);
  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20'
      onClick={onClose} // Closes when clicking the backdrop
    >
      <motion.div
        className='flex flex-col bg-gradient-to-b from-[#02064F] to-[#7A38C3] rounded-2xl justify-center p-8 shadow-lg w-96 relative z-20'
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        {/* Close Button */}
        <button className='absolute top-3 right-3 text-white' onClick={onClose}>
          ✖
        </button>
        {/* Modal Header */}
        <h2 className='text-xl font-bold tracking-wider font-bungee text-white text-center'>
          Choose your character
        </h2>

        {/* Modal Body */}
        <div className='flex justify-center mt-6 mb-2 gap-4'>
          <motion.img
            src='/gifs/char_1.gif'
            alt='GIF 1'
            className={`w-full h-auto rounded-2xl cursor-pointer transition-all hover:scale-105  ${
              isFirstSelected
                ? 'border-4 border-green-500 shadow-lg shadow-green-500'
                : 'border-4 border-transparent opacity-70 hover:opacity-100'
            }`}
            onClick={() => setIsFirstSelected(true)}
          />
          <img
            src='/gifs/char_1.gif'
            alt='GIF 1'
            className={`w-full h-auto rounded-2xl cursor-pointer transition-all hover:scale-105 ${
              !isFirstSelected
                ? 'border-4 border-green-500 shadow-lg shadow-green-500'
                : 'border-4 border-transparent opacity-70 hover:opacity-100'
            }`}
            onClick={() => setIsFirstSelected(false)}
          />
        </div>
        {/* Modal Footer */}
        <div className='mt-4 flex justify-center'>
          <button
            className='bg-green-500 text-white px-4 py-1 rounded-2xl hover:scale-105'
            onClick={onClose}
          >
            Select
          </button>
        </div>
      </motion.div>
    </div>
  );
};
