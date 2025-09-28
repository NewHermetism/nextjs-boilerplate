import { SvgProps } from 'types';

export const X = ({ width = '50', height = '50' }: SvgProps) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox='0 0 50 50'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M38.1799 3.96648H45.208L29.8537 21.5154L47.9168 45.3956H33.7736L22.6961 30.9124L10.0209 45.3956H2.98856L19.4115 26.625L2.0835 3.96648H16.5858L26.5989 17.2047L38.1799 3.96648ZM35.7133 41.1889H39.6076L14.4697 7.95217H10.2907L35.7133 41.1889Z'
        fill='white'
      />
    </svg>
  );
};
