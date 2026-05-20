import { FastifyReply, FastifyRequest } from "fastify";
import { userFindByIdService } from "../service/users.service";

export async function userFindById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    if (!id) {
        return reply.status(400).send({ error: "User ID is required" });
    }

    const user = await userFindByIdService(id);

    if (!user) {
        return reply.status(404).send({ error: "User not found" });
    }

    return reply.status(200).send(user);
}
