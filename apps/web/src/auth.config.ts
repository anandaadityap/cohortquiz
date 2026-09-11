import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "TUTOR";
      }
      return session;
    },
    authorized({ auth, request }) {
      const isApp = request.nextUrl.pathname.startsWith("/app");
      if (isApp) return !!auth?.user;
      return true;
    },
  },
} satisfies NextAuthConfig;
