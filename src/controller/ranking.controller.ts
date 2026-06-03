import { FastifyReply, FastifyRequest } from "fastify";
import { ErrorResponse, SuccessResponse } from "../types/api-response";
import { AppError } from "../errors/app-error";
import {
    getRankingByCityService,
    getRankingByStateService,
    GetRankingGeneralService,
} from "../service/ranking.service";
import { getUser } from "../helpers/get-user";

export async function getRankingGeneralController(request: FastifyRequest, reply: FastifyReply) {
    try {
        const ranking = await GetRankingGeneralService();
        return reply.status(200).send(new SuccessResponse(200, "Ranking geral obtido com sucesso", ranking));
    } catch (error) {
        console.error("Error getting general ranking:", error);
        if (error instanceof AppError) {
            return reply.status(error.statusCode).send(new ErrorResponse(error.statusCode, error.message));
        }

        return reply.status(500).send(new ErrorResponse(500, "Ocorreu um erro ao obter o ranking geral"));
    }
}

export async function getRankingByStateController(request: FastifyRequest, reply: FastifyReply) {
    try {
        const user = getUser(request);
        if (!user) {
            return reply.status(401).send(new ErrorResponse(401, "Usuário não autenticado"));
        }

        const state = user.state;
        if (state === null || state === undefined || state.length !== 2) {
            return reply.status(400).send(new ErrorResponse(400, "O estado deve ser representado por 2 caracteres"));
        }

        const ranking = await getRankingByStateService(state);
        return reply
            .status(200)
            .send(new SuccessResponse(200, `Ranking por estado (${state}) obtido com sucesso`, ranking));
    } catch (error) {
        console.error("Error getting ranking by state:", error);
        if (error instanceof AppError) {
            return reply.status(error.statusCode).send(new ErrorResponse(error.statusCode, error.message));
        }

        return reply.status(500).send(new ErrorResponse(500, "Ocorreu um erro ao obter o ranking por estado"));
    }
}

export async function getRankingByCityController(request: FastifyRequest, reply: FastifyReply) {
    try {
        const user = getUser(request);
        if (!user) {
            return reply.status(401).send(new ErrorResponse(401, "Usuário não autenticado"));
        }

        const city = user.city;
        if (!city || city.trim() === "") {
            return reply.status(400).send(new ErrorResponse(400, "A cidade deve ser informada"));
        }

        const ranking = await getRankingByCityService(city);
        return reply
            .status(200)
            .send(new SuccessResponse(200, `Ranking por cidade (${city}) obtido com sucesso`, ranking));
    } catch (error) {
        console.error("Error getting ranking by city:", error);
        if (error instanceof AppError) {
            return reply.status(error.statusCode).send(new ErrorResponse(error.statusCode, error.message));
        }

        return reply.status(500).send(new ErrorResponse(500, "Ocorreu um erro ao obter o ranking por cidade"));
    }
}
