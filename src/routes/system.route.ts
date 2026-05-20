import { FastifyInstance } from "fastify";
import { getActiveRound, updateActiveRound } from "../controller/system.controller";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { UpdateActiveRoundSchema } from "../types/system-types";
import { adminMiddleware } from "../lib/auth-middleware";

export async function systemRoute(app: FastifyInstance) {
    const publicServer = app.withTypeProvider<ZodTypeProvider>();

    publicServer.route({
        method: "GET",
        url: "/system/active-round",
        preHandler: [adminMiddleware],
        schema: {
            tags: ["System"],
            description: "[🛡️ Admin Only] Buscar a rodada ativa",
            security: [{ bearerAuth: [] }],
        },
        handler: getActiveRound,
    });

    publicServer.route({
        method: "PATCH",
        url: "/system/active-round",
        preHandler: [adminMiddleware],
        schema: {
            tags: ["System"],
            description: "[🛡️ Admin Only] Atualizar a rodada ativa",
            body: UpdateActiveRoundSchema,
            security: [{ bearerAuth: [] }],
        },
        handler: updateActiveRound,
    });
}
