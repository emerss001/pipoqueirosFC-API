import { FastifyRequest, FastifyReply } from "fastify";
import { auth } from "./auth";
import { prisma } from "./prisma";
import { fromNodeHeaders } from "better-auth/node";

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
    });

    if (!session || !session.user) {
        return reply.status(401).send({ message: "Unauthorized" });
    }

    // Anexa o usuário à requisição para uso posterior
    request.user = session.user;
}

export async function adminMiddleware(request: FastifyRequest, reply: FastifyReply) {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
    });

    if (!session || !session.user) {
        return reply.status(401).send({ message: "Unauthorized" });
    }

    // Busca o usuário no banco para garantir que temos a role mais atualizada
    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
        return reply.status(403).send({ message: "Forbidden: Admins only" });
    }

    request.user = dbUser;
}
