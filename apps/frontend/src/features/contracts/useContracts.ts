import { useQuery } from '@tanstack/react-query';
import { getContracts, getContract, type Contract } from '../../api/contracts';

export function useContracts() {
  return useQuery<Contract[], Error>({
    queryKey: ['contracts'],
    queryFn: getContracts,
  });
}

export function useContract(id: string) {
  return useQuery<Contract, Error>({
    queryKey: ['contracts', id],
    queryFn: () => getContract(id),
  });
}
