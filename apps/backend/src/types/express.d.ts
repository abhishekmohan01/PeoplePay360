export interface AuthUser {
  id: string;
  email: string;
  employeeId: string | null;
  companyId: string | null;
  roles: string[];
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}
