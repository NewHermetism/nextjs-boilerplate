import { PropsWithChildren } from 'react';
import { WithClassnameType } from 'types';

interface BackgroundCardType extends PropsWithChildren, WithClassnameType {
  anchor?: string;
  className?: string;
}

export const BackgroundCard = (props: BackgroundCardType) => {
  const { children, anchor, className } = props;
  return (
    <div
      className={`flex bg-gradient-to-b from-[#02064F] to-[#7A38C3] rounded-2xl justify-center px-2 py-1 ${className}`}
      data-testid={props['data-testid']}
      id={anchor}
    >
      {children}
    </div>
  );
};
