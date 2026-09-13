import { auth } from "@/auth";

export async function requireTutor() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You need to sign in first.");
  }
  return session.user;
}
