import { z } from "zod";
import { router, protectedProcedure, recordkeeperProcedure } from "../trpc";
import { checkExemption, checkITAEligibility } from "@osha/regulatory-logic";

const EstablishmentInput = z.object({
  name: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zip: z.string().min(5),
  naicsCode: z.string().min(4).max(6),
  sicCode: z.string().optional(),
});

export const establishmentsRouter = router({
  /** Search NAICS codes by code prefix or title keyword. */
  naicsSearch: protectedProcedure
    .input(z.object({ q: z.string() }))
    .query(({ ctx, input }) => {
      const q = input.q.trim();
      if (q.length < 2) return [];
      return ctx.prisma.naicsCode.findMany({
        where: {
          OR: [
            { code: { startsWith: q } },
            { title: { contains: q, mode: "insensitive" } },
          ],
        },
        orderBy: { code: "asc" },
        take: 12,
      });
    }),

  /** List all establishments accessible to the current user. */
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.establishment.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { reportingYears: true } },
      },
    });
  }),

  /** Get a single establishment with its reporting years. */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.establishment.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          reportingYears: {
            orderBy: { year: "desc" },
            include: { _count: { select: { cases: true } } },
          },
        },
      });
    }),

  /** Create a new establishment. Any authenticated user may create one. */
  create: protectedProcedure
    .input(EstablishmentInput)
    .mutation(({ ctx, input }) => {
      return ctx.prisma.establishment.create({ data: input });
    }),

  /** Update an establishment's details. */
  update: recordkeeperProcedure
    .input(z.object({ id: z.string() }).merge(EstablishmentInput.partial()))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.establishment.update({ where: { id }, data });
    }),

  /**
   * Returns the recordkeeping exemption status and ITA eligibility
   * for an establishment in a given reporting year.
   */
  complianceStatus: protectedProcedure
    .input(
      z.object({
        establishmentId: z.string(),
        reportingYear: z.number().int().min(2000).max(2100),
        peakEmployeeCountPriorYear: z.number().int().min(0),
        totalEmployeesInYear: z.number().int().min(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const establishment = await ctx.prisma.establishment.findUniqueOrThrow({
        where: { id: input.establishmentId },
      });

      const exemption = checkExemption({
        peakEmployeeCountPriorYear: input.peakEmployeeCountPriorYear,
        naicsCode: establishment.naicsCode,
      });

      const ita = checkITAEligibility({
        totalEmployeesInYear: input.totalEmployeesInYear,
        naicsCode: establishment.naicsCode,
        reportingYear: input.reportingYear,
      });

      return { establishment, exemption, ita };
    }),
});
