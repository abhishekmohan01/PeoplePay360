import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getContracts, getContract, createContract, type Contract } from '../../api/contracts';

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

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createContract>[0]) => createContract(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

