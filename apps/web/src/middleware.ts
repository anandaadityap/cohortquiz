import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/dashboard/:path*", "/materials/:path*", "/quizzes/:path*", "/tryouts/:path*"],
};
