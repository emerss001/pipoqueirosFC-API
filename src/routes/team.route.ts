import { FastifyInstance } from "fastify";
import { createTeam, getAllTeams } from "../controller/team.controller";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { CreateTeamSchema } from "../types/team-types";
import { adminMiddleware } from "../lib/auth-middleware";

export async function teamRoute(app: FastifyInstance) {
    const publicServer = app.withTypeProvider<ZodTypeProvider>();

    publicServer.route({
        method: "GET",
        url: "/teams",
        preHandler: [adminMiddleware],
        schema: {
            tags: ["Teams"],
            description: "[🛡️ Admin Only] Buscar todos os times",
            security: [{ bearerAuth: [] }],
        },
        handler: getAllTeams,
    });

    publicServer.route({
        method: "POST",
        url: "/teams",
        preHandler: [adminMiddleware],
        schema: {
            tags: ["Teams"],
            description: "[🛡️ Admin Only] Criar um novo time",
            body: CreateTeamSchema,
            security: [{ bearerAuth: [] }],
        },
        handler: createTeam,
    });
}
