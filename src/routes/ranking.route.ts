import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { errorResponseSchema } from "../types/api-response";
import {
    getRankingByCityController,
    getRankingByStateController,
    getRankingGeneralController,
} from "../controller/ranking.controller";
import { authMiddleware } from "../lib/auth-middleware";

export async function rankingRoute(app: FastifyInstance) {
    const publicServer = app.withTypeProvider<ZodTypeProvider>();

    publicServer.route({
        method: "GET",
        url: "/ranking/general",
        preHandler: [authMiddleware],
        schema: {
            tags: ["Ranking"],
            description: "Obter o ranking geral dos usuários",
            response: {
                200: z.object({
                    code: z.number(),
                    message: z.string(),
                    data: z.array(
                        z.object({
                            id: z.string(),
                            name: z.string(),
                            image: z.string().nullable(),
                            totalScore: z.number(),
                        }),
                    ),
                }),
                400: errorResponseSchema,
                404: errorResponseSchema,
                500: errorResponseSchema,
            },
        },
        handler: getRankingGeneralController,
    });

    publicServer.route({
        method: "GET",
        url: "/ranking/state/",
        preHandler: [authMiddleware],
        schema: {
            tags: ["Ranking"],
            description: "[🔒 Autenticado] Obter o ranking dos usuários por estado",
            security: [{ bearerAuth: [] }],
            response: {
                200: z.object({
                    code: z.number(),
                    message: z.string(),
                    data: z.array(
                        z.object({
                            id: z.string(),
                            name: z.string(),
                            image: z.string().nullable(),
                            totalScore: z.number(),
                        }),
                    ),
                }),
                400: errorResponseSchema,
                404: errorResponseSchema,
                500: errorResponseSchema,
            },
        },
        handler: getRankingByStateController,
    });

    publicServer.route({
        method: "GET",
        url: "/ranking/city/",
        preHandler: [authMiddleware],
        schema: {
            tags: ["Ranking"],
            description: "Obter o ranking dos usuários por cidade",
            response: {
                200: z.object({
                    code: z.number(),
                    message: z.string(),
                    data: z.array(
                        z.object({
                            id: z.string(),
                            name: z.string(),
                            image: z.string().nullable(),
                            totalScore: z.number(),
                        }),
                    ),
                }),
                400: errorResponseSchema,
                404: errorResponseSchema,
                500: errorResponseSchema,
            },
        },
        handler: getRankingByCityController,
    });
}
