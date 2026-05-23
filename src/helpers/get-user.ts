import { FastifyRequest } from "fastify";

/**
 * Retorna o usuário autenticado da requisição.
 * Só deve ser utilizado em rotas protegidas pelo `authMiddleware`.
 */
export function getUser(request: FastifyRequest) {
    if (!request.user) {
        throw new Error("User is not authenticated. Ensure this route uses the authMiddleware.");
    }
    return request.user;
}
