import { randomUUID } from "node:crypto";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import {
  applySyncEvents,
  getCertificateByCode,
  getGamification,
  setWeeklyGoal,
  timezoneFromRequest,
} from "./gamification";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    guest: publicProcedure
      .input(z.object({ timezone: z.string().max(64).optional(), name: z.string().max(80).optional() }).optional())
      .mutation(async ({ ctx, input }) => {
        const openId = `guest:${randomUUID()}`;
        const name = input?.name?.trim() || "Learner";
        await db.upsertUser({
          openId,
          name,
          loginMethod: "guest",
          lastSignedIn: new Date(),
        });
        const user = await db.getUserByOpenId(openId);
        if (!user) {
          throw new Error("Could not create guest learner");
        }
        const token = await sdk.signSession(
          { openId, appId: ENV.appId || "ngo-learn", name },
          { expiresInMs: ONE_YEAR_MS }
        );
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        await getGamification(user.id, timezoneFromRequest(input?.timezone));
        return user;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  gamification: router({
    snapshot: protectedProcedure
      .input(z.object({ timezone: z.string().max(64).optional() }).optional())
      .query(({ ctx, input }) => getGamification(ctx.user.id, timezoneFromRequest(input?.timezone))),
    sync: protectedProcedure
      .input(z.object({ events: z.array(z.any()).max(200), timezone: z.string().max(64).optional() }))
      .mutation(({ ctx, input }) =>
        applySyncEvents(ctx.user.id, input.events, { timezone: timezoneFromRequest(input.timezone) })
      ),
    setWeeklyGoal: protectedProcedure
      .input(z.object({ goal: z.number().min(1).max(14) }))
      .mutation(({ ctx, input }) => setWeeklyGoal(ctx.user.id, input.goal)),
  }),
  certificate: router({
    byCode: publicProcedure
      .input(z.object({ code: z.string().min(1).max(32) }))
      .query(({ input }) => getCertificateByCode(input.code)),
  }),
});

export type AppRouter = typeof appRouter;
