import { FastifyInstance } from "fastify";
import { createPredicationController } from "../controller/predication.controller";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { createPredicationSchema } from "../types/predication-types";
import { authMiddleware } from "../lib/auth-middleware";
import z from "zod";
import { errorResponseSchema } from "../types/api-response";

export async function predicationRoute(app: FastifyInstance) {
    const publicServer = app.withTypeProvider<ZodTypeProvider>();

    publicServer.route({
        method: "POST",
        url: "/predications",
        preHandler: [authMiddleware],
        schema: {
            tags: ["Predications"],
            description: "[🔒 Autenticado] Criar uma nova predição (palpite)",
            body: createPredicationSchema,
            security: [{ bearerAuth: [] }],
            response: {
                201: z.object({
                    code: z.number(),
                    message: z.string(),
                    data: z.object({
                        id: z.number(),
                        userId: z.string(),
                        matchId: z.number(),
                        bettingGroupId: z.number(),
                        type: z.enum(["EXACT_SCORE", "MATCH_RESULT"]),
                        homeScoreGuess: z.number().nullable(),
                        awayScoreGuess: z.number().nullable(),
                        resultGuess: z.enum(["HOME_WIN", "AWAY_WIN", "DRAW"]).nullable(),
                        pointsEarned: z.number(),
                    }),
                }),
                400: errorResponseSchema,
                404: errorResponseSchema,
                500: errorResponseSchema,
            },
        },
        handler: createPredicationController,
    });
}
