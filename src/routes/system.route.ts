import { FastifyInstance } from "fastify";
import { getActiveRound } from "../controller/system.controller";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { adminMiddleware } from "../lib/auth-middleware";
import { errorResponseSchema } from "../types/api-response";

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
            response: {
                200: z.object({
                    code: z.number(),
                    message: z.string(),
                    current_active_round: z.number().nullable(),
                }),
                500: errorResponseSchema,
            },
        },
        handler: getActiveRound,
    });
}
