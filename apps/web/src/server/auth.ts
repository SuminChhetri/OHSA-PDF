/**
 * NextAuth configuration.
 *
 * Role-based access:
 *   RECORDKEEPER — create/edit cases
 *   REVIEWER     — read-only
 *   EXECUTIVE    — certify 300A (1904.32(b)(3))
 *   ADMIN        — user management + all of the above
 */

import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@osha/db";

// ── Type augmentation ─────────────────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
  interface User {
    id: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}

// ── Auth options ──────────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        // Demo seeds use a plaintext prefix marker — replace with real bcrypt in production.
        let valid = false;
        if (user.passwordHash.startsWith("DEMO_HASH:")) {
          const plain = user.passwordHash.split(":")[1];
          valid = plain === credentials.password;
        } else {
          valid = await bcrypt.compare(credentials.password, user.passwordHash);
        }

        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },
};

/**
 * Server-side session helper for use in tRPC context and Route Handlers.
 */
export function getServerAuthSession(ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) {
  return getServerSession(ctx.req, ctx.res, authOptions);
}
