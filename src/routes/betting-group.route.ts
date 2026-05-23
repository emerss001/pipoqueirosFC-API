import { FastifyInstance } from "fastify";
import {
    addUserToBettingGroupController,
    createBettingGroupController,
    findBettingGroupByCodeController,
    getBettingGroupRankingController,
} from "../controller/betting-group.controller";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { authMiddleware } from "../lib/auth-middleware";
import { errorResponseSchema } from "../types/api-response";

export async function bettingGroupRoute(app: FastifyInstance) {
    const publicServer = app.withTypeProvider<ZodTypeProvider>();

    publicServer.route({
        method: "POST",
        url: "/betting-groups",
        preHandler: [authMiddleware],
        schema: {
            tags: ["Betting Groups"],
            description: "[🔒 Autenticado] Criar um novo bolão",
            body: z.object({
                name: z.string(),
            }),
            security: [{ bearerAuth: [] }],
            response: {
                201: z.object({
                    name: z.string(),
                    id: z.number(),
                    createdAt: z.date(),
                    code: z.string(),
                    creatorId: z.string(),
                }),
                400: errorResponseSchema,
                500: errorResponseSchema,
            },
        },
        handler: createBettingGroupController,
    });

    publicServer.route({
        method: "GET",
        url: "/betting-groups/:code",
        preHandler: [authMiddleware],
        schema: {
            tags: ["Betting Groups"],
            description: "[🔒 Autenticado] Buscar bolão pelo código",
            params: z.object({
                code: z.string(),
            }),
            security: [{ bearerAuth: [] }],
            response: {
                200: z.object({
                    id: z.number(),
                    name: z.string(),
                    creator: z.object({
                        name: z.string(),
                    }),
                    participants: z.array(
                        z.object({
                            user: z.object({
                                name: z.string(),
                                image: z.string().nullable(),
                            }),
                        }),
                    ),
                }),
                400: errorResponseSchema,
                404: errorResponseSchema,
                500: errorResponseSchema,
            },
        },
        handler: findBettingGroupByCodeController,
    });

    publicServer.route({
        method: "POST",
        url: "/betting-groups/add-user",
        preHandler: [authMiddleware],
        schema: {
            tags: ["Betting Groups"],
            description: "[🔒 Autenticado] Adicionar usuário em um bolão",
            body: z.object({
                bettingGroupCode: z.string(),
            }),
            security: [{ bearerAuth: [] }],
            response: {
                200: z.object({
                    message: z.string(),
                }),
                400: errorResponseSchema,
                404: errorResponseSchema,
                409: errorResponseSchema,
                500: errorResponseSchema,
            },
        },
        handler: addUserToBettingGroupController,
    });

    publicServer.route({
        method: "GET",
        url: "/betting-groups/:code/ranking",
        preHandler: [authMiddleware],
        schema: {
            tags: ["Betting Groups"],
            description: "[🔒 Autenticado] Buscar ranking de um bolão",
            params: z.object({
                code: z.string(),
            }),
            security: [{ bearerAuth: [] }],
            response: {
                200: z.object({
                    ranking: z.array(
                        z.object({
                            user: z.object({
                                name: z.string(),
                                image: z.string().nullable(),
                            }),
                            score: z.number(),
                        }),
                    ),
                }),
                400: errorResponseSchema,
                404: errorResponseSchema,
                500: errorResponseSchema,
            },
        },
        handler: getBettingGroupRankingController,
    });
}
