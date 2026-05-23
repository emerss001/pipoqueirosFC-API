import { FastifyReply, FastifyRequest } from "fastify";
import { getCurrentRoundMatchesService } from "../service/match.service";
import { SuccessResponse, ErrorResponse } from "../types/api-response";
import { AppError } from "../errors/app-error";
import { getUser } from "../helpers/get-user";

export async function getCurrentRoundMatches(request: FastifyRequest, reply: FastifyReply) {
    const user = getUser(request);

    try {
        const result = await getCurrentRoundMatchesService(user.id);
        return reply.status(200).send(new SuccessResponse(200, "Partidas da rodada atual", result));
    } catch (error) {
        console.error(error);
        if (error instanceof AppError) {
            return reply.status(error.statusCode).send(new ErrorResponse(error.statusCode, error.message));
        }

        return reply.status(500).send(new ErrorResponse(500, "Falha ao buscar partidas da rodada atual"));
    }
}
