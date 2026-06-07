import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/enums";
import { verifyPassword } from "@/lib/password";
import { loadUserPermissions } from "@/lib/rbac/has-permission";
import { createAuditLog } from "@/lib/audit";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Identifiants",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      authorize: async (credentials) => {
        const email = (credentials?.email as string | undefined)?.toLowerCase().trim();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const rateKey = `login:${email}`;
        const limited = checkRateLimit(rateKey, 8, 15 * 60 * 1000);
        if (!limited.ok) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { employee: true, appRole: true },
        });

        if (!user?.passwordHash) {
          await createAuditLog({
            action: "LOGIN_FAILED",
            module: "auth",
            newValues: { email, reason: "user_not_found" },
          });
          return null;
        }

        if (user.accountStatus !== "ACTIVE") {
          await createAuditLog({
            actorUserId: user.id,
            action: "LOGIN_BLOCKED",
            module: "auth",
            targetType: "User",
            targetId: user.id,
            newValues: { accountStatus: user.accountStatus },
          });
          return null;
        }

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) {
          await createAuditLog({
            actorUserId: user.id,
            action: "LOGIN_FAILED",
            module: "auth",
            targetType: "User",
            targetId: user.id,
          });
          return null;
        }

        resetRateLimit(rateKey);

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await createAuditLog({
          actorUserId: user.id,
          action: "LOGIN_SUCCESS",
          module: "auth",
          targetType: "User",
          targetId: user.id,
        });

        const permissions = await loadUserPermissions(prisma, user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? `${user.employee?.firstName ?? ""} ${user.employee?.lastName ?? ""}`.trim(),
          role: user.role as UserRole,
          roleCode: user.appRole?.code ?? user.role,
          permissions: [...permissions],
          passwordMustChange: user.passwordMustChange,
          employeeId: user.employeeId ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger }) {
      if (user) {
        token.sub = user.id;
        token.role = "role" in user ? (user.role as UserRole) : undefined;
        token.roleCode = "roleCode" in user ? (user.roleCode as string) : undefined;
        token.permissions = "permissions" in user ? (user.permissions as string[]) : [];
        token.passwordMustChange = "passwordMustChange" in user ? !!user.passwordMustChange : false;
        token.employeeId = "employeeId" in user ? user.employeeId : undefined;
      }
      if (trigger === "update" && token.sub) {
        /* session update via update() */
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as UserRole) ?? "COMMERCIAL";
        session.user.roleCode = (token.roleCode as string) ?? session.user.role;
        session.user.permissions = (token.permissions as string[]) ?? [];
        session.user.passwordMustChange = !!token.passwordMustChange;
        session.user.employeeId = token.employeeId as string | undefined;
      }
      return session;
    },
  },
});
