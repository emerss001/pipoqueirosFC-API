import { FastifyInstance } from "fastify";
import { getCurrentRoundMatches } from "../controller/match.controller";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { authMiddleware } from "../lib/auth-middleware";
import z from "zod";
import { errorResponseSchema } from "../types/api-response";

export async function matchRoute(app: FastifyInstance) {
    const publicServer = app.withTypeProvider<ZodTypeProvider>();

    publicServer.route({
        method: "GET",
        url: "/matches/current",
        preHandler: [authMiddleware],
        schema: {
            tags: ["Matches"],
            description: "[🔒 Autenticado] Buscar partidas da rodada atual",
            security: [{ bearerAuth: [] }],
            response: {
                200: z.object({
                    code: z.number(),
                    message: z.string(),
                    data: z.array(
                        z.object({
                            id: z.number(),
                            externalId: z.number(),
                            matchDate: z.string(),
                            status: z.enum(["SCHEDULED", "IN_PROGRESS", "FINISHED"]),
                            awayScore: z.number().nullable(),
                            homeScore: z.number().nullable(),
                            homeTeam: z.object({
                                id: z.number(),
                                externalId: z.number(),
                                name: z.string(),
                                abbreviatedName: z.string(),
                                shieldUrl: z.string(),
                            }),
                            awayTeam: z.object({
                                id: z.number(),
                                externalId: z.number(),
                                name: z.string(),
                                abbreviatedName: z.string(),
                                shieldUrl: z.string(),
                            }),
                            predictions: z.array(
                                z.object({
                                    id: z.number(),
                                    type: z.enum(["EXACT_SCORE", "MATCH_RESULT"]),
                                    homeScoreGuess: z.number().nullable(),
                                    awayScoreGuess: z.number().nullable(),
                                    matchResultGuess: z.enum(["HOME_WIN", "AWAY_WIN", "DRAW"]).nullable(),
                                }),
                            ),
                        }),
                    ),
                }),
                500: errorResponseSchema,
            },
        },
        handler: getCurrentRoundMatches,
    });
}
