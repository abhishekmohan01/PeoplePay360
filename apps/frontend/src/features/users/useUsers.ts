import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, type UserAccount } from '../../api/users';

export function useUsers() {
  return useQuery<UserAccount[], Error>({
    queryKey: ['users'],
    queryFn: getUsers,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<UserAccount>) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}
