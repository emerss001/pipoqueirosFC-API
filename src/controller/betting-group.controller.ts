import { FastifyReply, FastifyRequest } from "fastify";
import { addUserToBettingGroupParams, createBettingGroupParams } from "../types/betting-group-types";
import {
    addUserToBettingGroupService,
    createBettingGroupService,
    findBettingGroupByCodeService,
    getBettingGroupRankingService,
    getBettingGroupParticipantsService,
} from "../service/betting-group.service";

export async function createBettingGroupController(request: FastifyRequest, reply: FastifyReply) {
    const { name, creatorId } = request.body as createBettingGroupParams;

    if (!name || !creatorId) {
        return reply.status(400).send({ error: "Name and Creator ID are required" });
    }

    try {
        const bettingGroup = await createBettingGroupService({ name, creatorId });
        return reply.status(201).send(bettingGroup);
    } catch (error) {
        console.error("Error creating betting group:", error);
        return reply.status(500).send({ error: "An error occurred while creating the betting group" });
    }
}

export async function findBettingGroupByCodeController(request: FastifyRequest, reply: FastifyReply) {
    const { code } = request.params as { code: string };

    if (!code) {
        return reply.status(400).send({ error: "Code is required" });
    }

    try {
        const bettingGroup = await findBettingGroupByCodeService(code);

        if (!bettingGroup) {
            return reply.status(404).send({ error: "Betting group not found" });
        }

        return reply.status(200).send(bettingGroup);
    } catch (error) {
        console.error("Error finding betting group by code:", error);
        return reply.status(500).send({ error: "An error occurred while finding the betting group" });
    }
}

export async function addUserToBettingGroupController(request: FastifyRequest, reply: FastifyReply) {
    const { userId, bettingGroupCode } = request.body as addUserToBettingGroupParams;

    if (!userId || !bettingGroupCode) {
        return reply.status(400).send({ error: "User ID and Betting Group Code are required" });
    }

    try {
        await addUserToBettingGroupService({ userId, bettingGroupCode });
        return reply.status(200).send({ message: "User added to betting group successfully" });
    } catch (error: any) {
        console.error("Error adding user to betting group:", error);
        if (error.message === "User already in betting group") {
            return reply.status(409).send({ error: error.message });
        }
        if (error.message === "Betting group not found") {
            return reply.status(404).send({ error: error.message });
        }
        return reply.status(500).send({ error: "An error occurred while adding the user to the betting group" });
    }
}

export async function getBettingGroupRankingController(request: FastifyRequest, reply: FastifyReply) {
    const { code } = request.params as { code: string };

    if (!code) {
        return reply.status(400).send({ error: "Betting Group Code is required" });
    }

    try {
        const ranking = await getBettingGroupRankingService(code);
        return reply.status(200).send(ranking);
    } catch (error: any) {
        console.error("Error fetching betting group ranking:", error);
        if (error.message === "Betting group not found") {
            return reply.status(404).send({ error: error.message });
        }
        return reply.status(500).send({ error: "An error occurred while fetching the ranking" });
    }
}

export async function getBettingGroupParticipantsController(request: FastifyRequest, reply: FastifyReply) {
    const { code } = request.params as { code: string };

    if (!code) {
        return reply.status(400).send({ error: "Betting Group ID is required" });
    }

    try {
        const participants = await getBettingGroupParticipantsService(code);
        return reply.status(200).send(participants);
    } catch (error: any) {
        console.error("Error fetching betting group participants:", error);
        if (error.message === "Betting group not found") {
            return reply.status(404).send({ error: error.message });
        }
        return reply.status(500).send({ error: "An error occurred while fetching the participants" });
    }
}
