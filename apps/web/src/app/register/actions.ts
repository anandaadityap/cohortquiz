"use server";

import { hash } from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function registerTutor(_prev: { error?: string } | undefined, formData: FormData) {
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(80),
      email: z.string().trim().email(),
      password: z.string().min(8).max(72),
    })
    .safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
  if (!parsed.success) {
    return { error: "Check your name, email, and password (8+ characters)." };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Could not create that account." };
  }

  const passwordHash = await hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash,
    },
  });

  await signIn("credentials", {
    email,
    password: parsed.data.password,
    redirectTo: "/dashboard",
  });
}
