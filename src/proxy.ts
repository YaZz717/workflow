import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

// Next.js 16 : `middleware` a été renommé `proxy` (runtime nodejs).
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // Exécute la protection sur tout sauf les assets statiques et l'API auth.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
