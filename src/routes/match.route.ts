import { FastifyInstance } from "fastify";
import { createMatch, updateMatchStatus, finishMatch, getCurrentRoundMatches } from "../controller/match.controller";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { CreateMatchSchema, UpdateMatchStatusSchema, FinishMatchSchema } from "../types/match-types";
import { adminMiddleware, authMiddleware } from "../lib/auth-middleware";

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
        },
        handler: getCurrentRoundMatches,
    });

    publicServer.route({
        method: "POST",
        url: "/matches",
        preHandler: [adminMiddleware],
        schema: {
            tags: ["Matches"],
            description: "[🛡️ Admin Only] Criar uma nova partida",
            body: CreateMatchSchema,
            security: [{ bearerAuth: [] }],
        },
        handler: createMatch,
    });

    publicServer.route({
        method: "PATCH",
        url: "/matches/:id/status",
        preHandler: [adminMiddleware],
        schema: {
            tags: ["Matches"],
            description: "[🛡️ Admin Only] Atualizar status de uma partida",
            params: z.object({
                id: z.string(),
            }),
            body: UpdateMatchStatusSchema,
            security: [{ bearerAuth: [] }],
        },
        handler: updateMatchStatus,
    });

    publicServer.route({
        method: "POST",
        url: "/matches/:id/finish",
        preHandler: [adminMiddleware],
        schema: {
            tags: ["Matches"],
            description: "[🛡️ Admin Only] Finalizar uma partida",
            params: z.object({
                id: z.string(),
            }),
            body: FinishMatchSchema,
            security: [{ bearerAuth: [] }],
        },
        handler: finishMatch,
    });
}
