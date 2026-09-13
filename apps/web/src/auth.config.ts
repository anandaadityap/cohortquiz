import type { NextAuthConfig } from "next-auth";

const protectedPrefixes = ["/dashboard", "/materials", "/quizzes", "/tryouts"];

function isProtected(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export const authConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth, request }) {
      if (isProtected(request.nextUrl.pathname)) return !!auth?.user;
      return true;
    },
  },
} satisfies NextAuthConfig;
