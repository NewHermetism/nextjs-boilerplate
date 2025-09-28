export const displayAddress = (address: string): string =>
  `${address.slice(0, 5)}...${address.slice(address.length - 5)}`;
