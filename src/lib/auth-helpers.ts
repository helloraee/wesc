import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import type { Role } from "@/types";

const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  TEAM_MANAGER: 2,
  COACH: 1,
};

export function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized", code: "UNAUTHORIZED" },
    { status: 401 }
  );
}

export function forbidden() {
  return NextResponse.json(
    { error: "Forbidden", code: "FORBIDDEN" },
    { status: 403 }
  );
}

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth(allowedRoles?: Role[]) {
  const session = await getSession();

  if (!session?.user) return null;

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return null;
  }

  return session;
}

export function hasMinRole(userRole: Role, minRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

export function isAdmin(role: Role): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}
