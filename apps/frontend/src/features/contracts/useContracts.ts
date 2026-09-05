import { useQuery } from '@tanstack/react-query';
import { getContracts, getContract, type Contract } from '../../api/contracts';

export function useContracts(employeeId?: string) {
  return useQuery<Contract[], Error>({
    queryKey: ['contracts', employeeId],
    queryFn: () => getContracts(employeeId),
  });
}

export function useContract(id: string) {
  return useQuery<Contract, Error>({
    queryKey: ['contracts', id],
    queryFn: () => getContract(id),
  });
}
