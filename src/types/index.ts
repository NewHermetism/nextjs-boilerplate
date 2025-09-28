export * from './sdkDappTypes';
export * from './profile.types';
export * from './widget.types';
export * from './sdkCoreTypes';
export * from './transaction.types';

export interface SvgProps {
  width?: string;
  height?: string;
}

export enum Links {
  Link0 = 'https://xoxno.com/collection/SUPERVIC-f07785',
  Link1 = 'https://xoxno.com/collection/VICBITS-da9df7',
  Link2 = 'https://xoxno.com/collection/HAMHAM-800c2e',
  Link3 = 'https://xoxno.com/collection/SVUACT0-e86669',
  Link4 = 'https://xoxno.com/collection/VIDSUPVIC-eb16ab',
  Link5 = 'https://xoxno.com/collection/HALLOVIC-b80f05',
  Link6 = 'https://xoxno.com/collection/BEEF-032185',
  Link7 = 'https://xoxno.com/collection/MINIBOSSES-104b7f'
}

export enum EventType {
  START = 'START',
  END = 'END',
  JUMP = 'JUMP',
  CREATE_OBSTACLE = 'CREATE_OBSTACLE'
}
