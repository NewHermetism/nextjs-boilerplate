import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import { WithClassnameType } from 'types';

interface MxLinkPropsType extends PropsWithChildren, WithClassnameType {
  to: string;
}

export const MxLink = ({
  to,
  children,
  className = 'inline-block rounded-2xl px-2 py-1 lg:px-3 lg:py-2 text-center hover:no-underline my-0 bg-blue-600 text-white hover:bg-blue-700 lg:ml-2 mr-0'
}: MxLinkPropsType) => {
  return (
    <Link type='button' to={to} className={`stars-btn ${className}`}>
      <strong>{children}</strong>
      <div id='container-stars'>
        <div id='stars'></div>
      </div>

      <div id='glow'>
        <div className='circle'></div>
        <div className='circle'></div>
      </div>
    </Link>
  );
};
