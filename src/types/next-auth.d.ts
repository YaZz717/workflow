import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      globalRole: "USER" | "ADMIN";
      isActive: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    globalRole?: "USER" | "ADMIN";
    isActive?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    globalRole: "USER" | "ADMIN";
    isActive: boolean;
  }
}
