import { FastifyReply, FastifyRequest } from "fastify";
import { getActiveRoundService } from "../service/system.service";
import { SuccessResponse, ErrorResponse } from "../types/api-response";

export async function getActiveRound(request: FastifyRequest, reply: FastifyReply) {
    try {
        const round = await getActiveRoundService();
        return reply.status(200).send(new SuccessResponse(200, "Rodada encontrada", { current_active_round: round }));
    } catch (error) {
        console.error(error);
        return reply.status(500).send(new ErrorResponse(500, "Failed to fetch active round"));
    }
}
