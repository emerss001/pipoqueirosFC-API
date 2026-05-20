import { FastifyInstance } from "fastify";
import { userFindById } from "../controller/user.controller";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { authMiddleware } from "../lib/auth-middleware";

export async function usersRoute(app: FastifyInstance) {
    const publicServer = app.withTypeProvider<ZodTypeProvider>();

    publicServer.route({
        method: "GET",
        url: "/users/:id",
        preHandler: [authMiddleware],
        schema: {
            tags: ["Users"],
            description: "[🔒 Autenticado] Buscar usuário pelo ID",
            params: z.object({
                id: z.string(),
            }),
            security: [{ bearerAuth: [] }],
        },
        handler: userFindById,
    });
}
