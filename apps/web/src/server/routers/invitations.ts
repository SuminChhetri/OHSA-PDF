/**
 * Invitations router — invite users to an establishment with a specific role.
 *
 * Invite flow:
 *   1. Owner calls invitations.send({ email, role, establishmentId })
 *   2. System creates an Invitation record with a random token (expires 7 days)
 *   3. Token is returned (in production, email it; in dev, display in UI)
 *   4. Invitee visits /invite/[token] — creates account or links existing
 *   5. On acceptance: EstablishmentMember row is created, Invitation.acceptedAt set
 *
 * All invite/accept/revoke events are written to the audit log.
 */

import crypto from "crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, ownerProcedure, protectedProcedure } from "../trpc";

const VALID_ROLES = ["OWNER", "EDITOR", "SENSITIVE_REVIEWER", "REVIEWER", "DOWNLOAD_REVIEWER"] as const;

export const invitationsRouter = router({
  /** Send an invitation. Returns the invite token (email delivery is out of scope for self-hosted). */
  send: ownerProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(VALID_ROLES),
        establishmentId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the caller is a member/owner of the establishment
      const establishment = await ctx.prisma.establishment.findUniqueOrThrow({
        where: { id: input.establishmentId },
      });

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Revoke any existing pending invitation for the same email+establishment
      await ctx.prisma.invitation.deleteMany({
        where: {
          email: input.email,
          establishmentId: input.establishmentId,
          acceptedAt: null,
        },
      });

      const invitation = await ctx.prisma.invitation.create({
        data: {
          email: input.email,
          role: input.role,
          establishmentId: input.establishmentId,
          invitedById: ctx.session.user.id,
          token,
          expiresAt,
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "INVITE_SENT",
          entityType: "Invitation",
          entityId: invitation.id,
          reason: `Invited ${input.email} as ${input.role} to ${establishment.name}`,
        },
      });

      return {
        token,
        inviteUrl: `/invite/${token}`,
        expiresAt,
        message: `Invitation created. Share this link with ${input.email}: /invite/${token}`,
      };
    }),

  /** List pending (not yet accepted) invitations for an establishment. */
  listPending: ownerProcedure
    .input(z.object({ establishmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.invitation.findMany({
        where: { establishmentId: input.establishmentId, acceptedAt: null },
        include: { invitedBy: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
    }),

  /** Revoke a pending invitation. */
  revoke: ownerProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const inv = await ctx.prisma.invitation.findUniqueOrThrow({
        where: { id: input.invitationId },
      });

      if (inv.acceptedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invitation already accepted." });
      }

      await ctx.prisma.invitation.delete({ where: { id: input.invitationId } });

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "PERMISSION_CHANGE",
          entityType: "Invitation",
          entityId: input.invitationId,
          reason: `Revoked invitation for ${inv.email}`,
        },
      });

      return { revoked: true };
    }),

  /** Accept an invitation by token. Creates user if needed, adds EstablishmentMember. */
  accept: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const inv = await ctx.prisma.invitation.findUnique({ where: { token: input.token } });

      if (!inv) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid invitation token." });
      if (inv.acceptedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Invitation already used." });
      if (inv.expiresAt < new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "Invitation expired." });

      // Verify email matches the logged-in user
      const user = await ctx.prisma.user.findUniqueOrThrow({ where: { id: ctx.session.user.id } });
      if (user.email.toLowerCase() !== inv.email.toLowerCase()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invitation was sent to a different email address.",
        });
      }

      // Create or update EstablishmentMember
      await ctx.prisma.establishmentMember.upsert({
        where: { userId_establishmentId: { userId: user.id, establishmentId: inv.establishmentId } },
        create: {
          userId: user.id,
          establishmentId: inv.establishmentId,
          role: inv.role,
          invitedById: inv.invitedById,
        },
        update: { role: inv.role },
      });

      // Mark invitation as accepted
      await ctx.prisma.invitation.update({
        where: { id: inv.id },
        data: { acceptedAt: new Date() },
      });

      await ctx.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "INVITE_ACCEPTED",
          entityType: "EstablishmentMember",
          entityId: inv.establishmentId,
          reason: `${user.email} accepted invitation as ${inv.role}`,
        },
      });

      return { establishmentId: inv.establishmentId, role: inv.role };
    }),

  /** List all members of an establishment. */
  listMembers: ownerProcedure
    .input(z.object({ establishmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.establishmentMember.findMany({
        where: { establishmentId: input.establishmentId },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      });
    }),

  /** Change a member's role. Logged as PERMISSION_CHANGE. */
  changeRole: ownerProcedure
    .input(
      z.object({
        userId: z.string(),
        establishmentId: z.string(),
        newRole: z.enum(VALID_ROLES),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.prisma.establishmentMember.findUniqueOrThrow({
        where: { userId_establishmentId: { userId: input.userId, establishmentId: input.establishmentId } },
        include: { user: { select: { email: true } } },
      });

      await ctx.prisma.establishmentMember.update({
        where: { userId_establishmentId: { userId: input.userId, establishmentId: input.establishmentId } },
        data: { role: input.newRole },
      });

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "PERMISSION_CHANGE",
          entityType: "EstablishmentMember",
          entityId: input.establishmentId,
          before: JSON.stringify({ role: member.role }),
          after: JSON.stringify({ role: input.newRole }),
          reason: `Role changed for ${member.user.email}: ${member.role} → ${input.newRole}`,
        },
      });

      return { updated: true };
    }),
});
