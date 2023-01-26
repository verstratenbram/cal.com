import { z } from "zod";

import prisma from "@calcom/prisma";

import { router, authedAdminProcedure } from "../../trpc";

export const deploymentSetupRouter = router({
  update: authedAdminProcedure
    .input(
      z.object({
        licenseKey: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const data = {
        licenseConsentAt: new Date(),
        ...(input.licenseKey ? { licenseKey: input.licenseKey } : {}),
      };

      await prisma.deployment.upsert({ where: { id: 1 }, create: data, update: data });

      return;
    }),
});
