import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth/config";
import { verifyPassword } from "@/lib/auth/password";
import {
  clearOldLoginAttempts,
  isLoginRateLimited,
  recordLoginAttempt,
} from "@/lib/auth/rate-limit";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

class RateLimitError extends Error {
  code = "RATE_LIMITED";
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(rawCredentials, request) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        const ip =
          request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request?.headers?.get("x-real-ip") ||
          "0.0.0.0";

        if (await isLoginRateLimited(email, ip)) {
          throw new RateLimitError("Trop de tentatives, réessayez plus tard.");
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.passwordHash || !user.isActive) {
          await recordLoginAttempt({ email, ip, success: false, userId: user?.id });
          return null;
        }

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) {
          await recordLoginAttempt({ email, ip, success: false, userId: user.id });
          return null;
        }

        if (!user.emailVerified) {
          await recordLoginAttempt({ email, ip, success: false, userId: user.id });
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        await recordLoginAttempt({ email, ip, success: true, userId: user.id });
        await clearOldLoginAttempts(email);
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          globalRole: user.globalRole,
          isActive: user.isActive,
        };
      },
    }),
  ],
});
