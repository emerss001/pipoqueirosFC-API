import { FastifyReply, FastifyRequest } from "fastify";
import { getCurrentRoundMatchesService } from "../service/match.service";

export async function getCurrentRoundMatches(request: FastifyRequest, reply: FastifyReply) {
    try {
        const result = await getCurrentRoundMatchesService();
        return reply.status(200).send(result);
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Failed to fetch current round matches" });
    }
}
