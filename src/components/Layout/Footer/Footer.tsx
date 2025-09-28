export const Footer = () => {
  return (
    <footer className='pl-3 pr-3 pb-3 lg:pl-6 lg:pr-6 lg:pb-6 flex justify-between lg:justify-end gap-8 text-sm lg:mx-9'>
      <a
        href='/privacy-policy.pdf'
        target='_blank'
        rel='noopener noreferrer'
        className='hover:text-purple-300 transition-colors text-xs lg:text-sm font-bold tracking-wider font-bungee text-white text-center'
      >
        PRIVACY POLICY
      </a>
      <a
        href='/cookie-policy.pdf'
        target='_blank'
        rel='noopener noreferrer'
        className='hover:text-purple-300 transition-colors text-xs lg:text-sm font-bold tracking-wider font-bungee text-white text-center'
      >
        COOKIE POLICY
      </a>
    </footer>
  );
};
