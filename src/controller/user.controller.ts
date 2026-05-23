import { FastifyReply, FastifyRequest } from "fastify";
import { userFindByIdService } from "../service/users.service";
import { SuccessResponse, ErrorResponse } from "../types/api-response";

export async function userFindById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    if (!id) {
        return reply.status(400).send(new ErrorResponse(400, "User ID is required"));
    }

    const user = await userFindByIdService(id);

    if (!user) {
        return reply.status(404).send(new ErrorResponse(404, "User not found"));
    }

    return reply.status(200).send(new SuccessResponse(200, "User found", user));
}
