export interface AuthUser {
  id: string;
  email: string;
  employeeId: string | null;
  companyId: string | null;
  roles: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      params: Record<string, string>;
    }
  }
}
