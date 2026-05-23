import { FastifyReply, FastifyRequest } from "fastify";
import { createTeamService, getAllTeamsService } from "../service/team.service";
import { CreateTeamBody } from "../types/team-types";
import { SuccessResponse, ErrorResponse } from "../types/api-response";

export async function createTeam(request: FastifyRequest, reply: FastifyReply) {
    const data = request.body as CreateTeamBody;

    if (!data.name || !data.abbreviated_name || !data.shield_url) {
        return reply.status(400).send(new ErrorResponse(400, "Missing required fields: name, abbreviated_name, shield_url"));
    }

    try {
        const team = await createTeamService(data);
        return reply.status(201).send(new SuccessResponse(201, "Team created successfully", team));
    } catch (error) {
        console.error(error);
        return reply.status(500).send(new ErrorResponse(500, "Failed to create team"));
    }
}

export async function getAllTeams(request: FastifyRequest, reply: FastifyReply) {
    try {
        const teams = await getAllTeamsService();
        return reply.status(200).send(new SuccessResponse(200, "Teams fetched successfully", teams));
    } catch (error) {
        console.error(error);
        return reply.status(500).send(new ErrorResponse(500, "Failed to fetch teams"));
    }
}
