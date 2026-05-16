import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure, protectedProcedure, publicProcedure } from "../trpc";

const VALID_ROLES = ["ADMIN", "RECORDKEEPER", "REVIEWER", "EXECUTIVE"] as const;

export const usersRouter = router({
  /** Public registration — creates a standard REVIEWER account. Admin role is assigned by the software admin team only. */
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findUnique({ where: { email: input.email } });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
      }
      const passwordHash = await bcrypt.hash(input.password, 12);
      await ctx.prisma.user.create({
        data: { name: input.name, email: input.email, passwordHash, role: "REVIEWER" },
      });
    }),

  /** List all users. Admin only. */
  list: adminProcedure.query(({ ctx }) => {
    return ctx.prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { name: "asc" },
    });
  }),

  /** Get the currently authenticated user. */
  me: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.user.findUniqueOrThrow({
      where: { id: ctx.session.user.id },
      select: { id: true, email: true, name: true, role: true },
    });
  }),

  /** Create a new user. Admin only. */
  create: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
        role: z.enum(VALID_ROLES),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.user.findUnique({ where: { email: input.email } });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
      }
      const passwordHash = await bcrypt.hash(input.password, 12);
      const user = await ctx.prisma.user.create({
        data: { email: input.email, name: input.name, role: input.role, passwordHash },
        select: { id: true, email: true, name: true, role: true },
      });
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "CREATE",
          entityType: "User",
          entityId: user.id,
          after: JSON.stringify({ email: user.email, role: user.role }),
          reason: `Admin created account for ${user.email}`,
        },
      });
      return user;
    }),

  /** Update a user's role. Admin only. */
  updateRole: adminProcedure
    .input(z.object({ userId: z.string(), role: z.enum(VALID_ROLES) }))
    .mutation(async ({ ctx, input }) => {
      const before = await ctx.prisma.user.findUniqueOrThrow({
        where: { id: input.userId },
        select: { role: true, email: true },
      });
      const updated = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: { id: true, email: true, role: true },
      });
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "PERMISSION_CHANGE",
          entityType: "User",
          entityId: input.userId,
          before: JSON.stringify({ role: before.role }),
          after: JSON.stringify({ role: input.role }),
          reason: `Role changed for ${before.email}: ${before.role} → ${input.role}`,
        },
      });
      return updated;
    }),

  /** Reset a user's password. Admin only. */
  resetPassword: adminProcedure
    .input(z.object({ userId: z.string(), newPassword: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      const target = await ctx.prisma.user.findUniqueOrThrow({
        where: { id: input.userId },
        select: { email: true },
      });
      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      const updated = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { passwordHash },
        select: { id: true, email: true },
      });
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "UPDATE",
          entityType: "User",
          entityId: input.userId,
          reason: `Password reset for ${target.email}`,
        },
      });
      return updated;
    }),
});
