import type { NextAuthConfig } from "next-auth";

/**
 * Configuration Auth.js partagée (sans adapter ni accès base de données).
 * Utilisable dans `proxy.ts` pour la protection des routes.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  },
  trustHost: true,
  providers: [],
  callbacks: {
    /** Protection des routes applicatives. */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      const isPublic =
        pathname === "/" ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/register") ||
        pathname.startsWith("/forgot-password") ||
        pathname.startsWith("/reset-password") ||
        pathname.startsWith("/verify-email") ||
        pathname.startsWith("/invite") ||
        pathname.startsWith("/api/cron/"); // authentifié par Bearer token

      if (isPublic) return true;
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.globalRole = (user as { globalRole?: string }).globalRole ?? "USER";
        token.isActive = (user as { isActive?: boolean }).isActive ?? true;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.globalRole = (token.globalRole as "USER" | "ADMIN") ?? "USER";
        session.user.isActive = (token.isActive as boolean) ?? true;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
