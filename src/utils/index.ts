export const isValidEthereumAddress = (address: string) => {
  const ethereumAddressRegExp = /^0x[a-fA-F0-9]{40}$/;
  return ethereumAddressRegExp.test(address);
}
