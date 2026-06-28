import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { readSession } from "./session";
import { isAdminEmail, adminEmails } from "./admin";
import type { User } from "@/lib/generated/prisma/client";

// Server-side authorization that loads fresh data. Middleware gates routes
// cheaply; these guards re-check against the database (e.g. soft-deleted users).

export async function getCurrentUser(): Promise<User | null> {
  const session = await readSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user || user.deletedAt) return null;
  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!isAdminEmail(user.email, adminEmails())) redirect("/dashboard");
  return user;
}

export function isAdmin(user: User): boolean {
  return isAdminEmail(user.email, adminEmails());
}
