import { FastifyReply, FastifyRequest } from "fastify";
import { createMatchService, updateMatchStatusService, finishMatchService, getCurrentRoundMatchesService } from "../service/match.service";
import { CreateMatchBody, UpdateMatchStatusBody, FinishMatchBody } from "../types/match-types";

export async function createMatch(request: FastifyRequest, reply: FastifyReply) {
    const data = request.body as CreateMatchBody;

    if (!data.round || !data.home_team_id || !data.away_team_id || !data.match_date) {
        return reply.status(400).send({ error: "Missing required fields" });
    }

    try {
        const match = await createMatchService(data);
        return reply.status(201).send(match);
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Failed to create match" });
    }
}

export async function updateMatchStatus(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const data = request.body as UpdateMatchStatusBody;

    if (!id) {
        return reply.status(400).send({ error: "Match ID is required" });
    }

    if (!data.status || !['SCHEDULED', 'IN_PROGRESS', 'FINISHED'].includes(data.status)) {
        return reply.status(400).send({ error: "Invalid or missing status" });
    }

    try {
        const match = await updateMatchStatusService(id, data);
        return reply.status(200).send(match);
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Failed to update match status" });
    }
}

export async function finishMatch(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const data = request.body as FinishMatchBody;

    if (!id) {
        return reply.status(400).send({ error: "Match ID is required" });
    }

    if (data.home_score === undefined || data.away_score === undefined) {
        return reply.status(400).send({ error: "Missing home_score or away_score" });
    }

    try {
        await finishMatchService(id, data);
        return reply.status(200).send({ message: "Match finished and points distributed successfully" });
    } catch (error: any) {
        console.error(error);
        if (error.message === "Match already finished") {
            return reply.status(400).send({ error: error.message });
        }
        if (error.message === "Match not found") {
            return reply.status(404).send({ error: error.message });
        }
        return reply.status(500).send({ error: "Failed to finish match" });
    }
}

export async function getCurrentRoundMatches(request: FastifyRequest, reply: FastifyReply) {
    try {
        const result = await getCurrentRoundMatchesService();
        return reply.status(200).send(result);
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: "Failed to fetch current round matches" });
    }
}
