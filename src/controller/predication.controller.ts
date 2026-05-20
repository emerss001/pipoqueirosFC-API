import { FastifyReply, FastifyRequest } from "fastify";
import { createPredicationParams } from "../types/predication-types";
import { createPredicationService } from "../service/predication.service";

export async function createPredicationController(request: FastifyRequest, reply: FastifyReply) {
    const { userId, matchId, predicationType, home_score_guess, away_score_guess, result_guess } =
        request.body as createPredicationParams;

    if (!userId || !matchId || !predicationType) {
        return reply.status(400).send({ error: "User ID, Match ID, and Predication Type are required" });
    }

    try {
        const predication = await createPredicationService({
            userId,
            matchId,
            predicationType,
            home_score_guess,
            away_score_guess,
            result_guess,
        });
        return reply.status(201).send(predication);
    } catch (error) {
        console.error("Error creating predication:", error);
        return reply.status(500).send({ error: "An error occurred while creating the predication" });
    }
}
