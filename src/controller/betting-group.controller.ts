import { FastifyReply, FastifyRequest } from "fastify";
import { getUser } from "../helpers/get-user";
import { SuccessResponse, ErrorResponse } from "../types/api-response";
import {
    addUserToBettingGroupService,
    createBettingGroupService,
    findBettingGroupByCodeService,
    getBettingGroupRankingService,
    getUserBettingGroupsService,
} from "../service/betting-group.service";

import { AppError } from "../errors/app-error";

export async function createBettingGroupController(request: FastifyRequest, reply: FastifyReply) {
    const { name } = request.body as { name: string };
    const user = getUser(request);
    const creatorId = user.id;

    if (!name) {
        return reply.status(400).send(new ErrorResponse(400, "O nome do bolão é obrigatório"));
    }

    try {
        const bettingGroup = await createBettingGroupService(name, creatorId);
        return reply.status(201).send(new SuccessResponse(201, "Bolão criado com sucesso", bettingGroup));
    } catch (error) {
        console.error("Error creating betting group:", error);
        if (error instanceof AppError) {
            return reply.status(error.statusCode).send(new ErrorResponse(error.statusCode, error.message));
        }

        return reply.status(500).send(new ErrorResponse(500, "Ocorreu um erro ao criar o bolão"));
    }
}

export async function findBettingGroupByCodeController(request: FastifyRequest, reply: FastifyReply) {
    const { code } = request.params as { code: string };

    if (!code) {
        return reply.status(400).send(new ErrorResponse(400, "O código do bolão é obrigatório"));
    }

    try {
        const bettingGroup = await findBettingGroupByCodeService(code);

        if (!bettingGroup) {
            return reply.status(404).send(new ErrorResponse(404, "Bolão não encontrado"));
        }

        return reply.status(200).send(new SuccessResponse(200, "Bolão encontrado", bettingGroup));
    } catch (error) {
        console.error("Error finding betting group by code:", error);
        if (error instanceof AppError) {
            return reply.status(error.statusCode).send(new ErrorResponse(error.statusCode, error.message));
        }

        return reply.status(500).send(new ErrorResponse(500, "Ocorreu um erro ao buscar o bolão"));
    }
}

export async function addUserToBettingGroupController(request: FastifyRequest, reply: FastifyReply) {
    const user = getUser(request);
    const userId = user.id;
    const { bettingGroupCode } = request.body as { bettingGroupCode: string };

    if (!bettingGroupCode) {
        return reply.status(400).send(new ErrorResponse(400, "O código do bolão é obrigatório"));
    }

    try {
        await addUserToBettingGroupService(userId, bettingGroupCode);
        return reply.status(200).send(new SuccessResponse(200, "Usuário adicionado ao bolão com sucesso", null));
    } catch (error: any) {
        console.error("Error adding user to betting group:", error);
        if (error instanceof AppError) {
            return reply.status(error.statusCode).send(new ErrorResponse(error.statusCode, error.message));
        }

        return reply.status(500).send(new ErrorResponse(500, "Ocorreu um erro ao adicionar o usuário ao bolão"));
    }
}

export async function getBettingGroupRankingController(request: FastifyRequest, reply: FastifyReply) {
    const { code } = request.params as { code: string };

    if (!code) {
        return reply.status(400).send(new ErrorResponse(400, "O código do grupo é obrigatório"));
    }

    try {
        const ranking = await getBettingGroupRankingService(code);
        return reply.status(200).send(new SuccessResponse(200, "Ranking fetched successfully", ranking));
    } catch (error: any) {
        console.error("Error fetching betting group ranking:", error);
        if (error instanceof AppError) {
            return reply.status(error.statusCode).send(new ErrorResponse(error.statusCode, error.message));
        }

        return reply.status(500).send(new ErrorResponse(500, "Ocorreu um erro ao buscar o ranking do bolão"));
    }
}

export async function getUserBettingGroupsController(request: FastifyRequest, reply: FastifyReply) {
    const user = getUser(request);
    const id = user.id;

    if (!id) {
        return reply.status(400).send(new ErrorResponse(400, "O ID do usuário é obrigatório"));
    }

    try {
        const bettingGroups = await getUserBettingGroupsService(id);
        return reply
            .status(200)
            .send(new SuccessResponse(200, "Bolões do usuário encontrados com sucesso", bettingGroups));
    } catch (error) {
        console.error("Error fetching user betting groups:", error);
        if (error instanceof AppError) {
            return reply.status(error.statusCode).send(new ErrorResponse(error.statusCode, error.message));
        }

        return reply.status(500).send(new ErrorResponse(500, "Ocorreu um erro ao buscar os bolões do usuário"));
    }
}
