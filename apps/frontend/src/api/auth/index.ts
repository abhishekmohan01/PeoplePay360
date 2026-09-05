import { apiClient } from '../client';
import type { User } from '../../stores/auth.store';
import { mockUsers } from '../users';

// Mocking the backend login response
export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  // Fake network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Find user in our mock database
  const account = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (account) {
    // For mock purposes: superadmin uses 'admin', everyone else uses 'password'
    const expectedPassword = account.role === 'Admin' ? 'admin' : 'password';
    
    if (password === expectedPassword) {
      return {
        token: `mock-jwt-token-${account.id}`,
        user: {
          id: account.id,
          name: account.name,
          email: account.email,
          roles: [account.role] // Pass the exact role assigned in UserManagement
        }
      };
    }
  }

  throw new Error('Invalid credentials or user not authorized.');
}
