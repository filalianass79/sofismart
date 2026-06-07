import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      roleCode: string;
      permissions: string[];
      passwordMustChange: boolean;
      employeeId?: string;
    };
  }

  interface User {
    role?: UserRole;
    roleCode?: string;
    permissions?: string[];
    passwordMustChange?: boolean;
    employeeId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    roleCode?: string;
    permissions?: string[];
    passwordMustChange?: boolean;
    employeeId?: string;
  }
}
