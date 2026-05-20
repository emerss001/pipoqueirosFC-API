import { FastifyInstance } from "fastify";
import {
    addUserToBettingGroupController,
    createBettingGroupController,
    findBettingGroupByCodeController,
    getBettingGroupRankingController,
    getBettingGroupParticipantsController,
} from "../controller/betting-group.controller";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { createBettingGroupSchema, addUserToBettingGroupSchema } from "../types/betting-group-types";
import z from "zod";
import { authMiddleware } from "../lib/auth-middleware";

export async function bettingGroupRoute(app: FastifyInstance) {
    const publicServer = app.withTypeProvider<ZodTypeProvider>();

    publicServer.route({
        method: "POST",
        url: "/betting-groups",
        preHandler: [authMiddleware],
        schema: {
            tags: ["Betting Groups"],
            description: "[🔒 Autenticado] Criar um novo bolão",
            body: createBettingGroupSchema,
            security: [{ bearerAuth: [] }],
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
            body: addUserToBettingGroupSchema,
            security: [{ bearerAuth: [] }],
        },
        handler: addUserToBettingGroupController,
    });

    publicServer.route({
        method: "GET",
        url: "/betting-groups/:idOrCode/ranking",
        preHandler: [authMiddleware],
        schema: {
            tags: ["Betting Groups"],
            description: "[🔒 Autenticado] Buscar ranking de um bolão",
            params: z.object({
                idOrCode: z.string(),
            }),
            security: [{ bearerAuth: [] }],
        },
        handler: getBettingGroupRankingController,
    });

    publicServer.route({
        method: "GET",
        url: "/betting-groups/:idOrCode/participants",
        preHandler: [authMiddleware],
        schema: {
            tags: ["Betting Groups"],
            description: "[🔒 Autenticado] Buscar participantes de um bolão",
            params: z.object({
                idOrCode: z.string(),
            }),
            security: [{ bearerAuth: [] }],
        },
        handler: getBettingGroupParticipantsController,
    });
}
