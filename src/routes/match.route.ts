import { FastifyInstance } from "fastify";
import { getCurrentRoundMatches } from "../controller/match.controller";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { authMiddleware } from "../lib/auth-middleware";

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
}
