import { useChainId } from 'wagmi';
import { getContractAddress } from '../config/contract';

export function useContractAddress() {
  const chainId = useChainId();
  return getContractAddress(chainId);
}
