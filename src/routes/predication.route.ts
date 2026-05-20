import { FastifyInstance } from "fastify";
import { createPredicationController } from "../controller/predication.controller";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { createPredicationSchema } from "../types/predication-types";
import { authMiddleware } from "../lib/auth-middleware";

export async function predicationRoute(app: FastifyInstance) {
    const publicServer = app.withTypeProvider<ZodTypeProvider>();

    publicServer.route({
        method: "POST",
        url: "/predications",
        preHandler: [authMiddleware],
        schema: {
            tags: ["Predications"],
            description: "[🔒 Autenticado] Criar uma nova predição (palpite)",
            body: createPredicationSchema,
            security: [{ bearerAuth: [] }],
        },
        handler: createPredicationController,
    });

    // app.get("/predications/:id", findPredicationByIdController);
    // app.get("/predications", findAllPredicationsController);
    // app.put("/predications/:id", updatePredicationController);
    // app.delete("/predications/:id", deletePredicationController);
}
