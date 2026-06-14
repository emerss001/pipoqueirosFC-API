import { FastifyReply, FastifyRequest } from "fastify";
import { createPredicationParams } from "../types/predication-types";
import { createPredicationService } from "../service/predication.service";
import { SuccessResponse, ErrorResponse } from "../types/api-response";
import { getUser } from "../helpers/get-user";
import { AppError } from "../errors/app-error";

export async function createPredicationController(request: FastifyRequest, reply: FastifyReply) {
    const user = getUser(request);
    const { matchId, predicationType, home_score_guess, away_score_guess, result_guess, bettingGroupCode } =
        request.body as createPredicationParams;

    if (!matchId || !predicationType || !bettingGroupCode) {
        return reply
            .status(400)
            .send(new ErrorResponse(400, "Id da partida, Tipo de palpite, e o código do bolão são obrigatórios"));
    }

    try {
        const predication = await createPredicationService(
            {
                matchId,
                predicationType,
                home_score_guess,
                away_score_guess,
                result_guess,
                bettingGroupCode,
            },
            user.id,
        );
        return reply.status(201).send(new SuccessResponse(201, "Predication created successfully", predication));
    } catch (error) {
        console.error("Error creating predication:", error);
        if (error instanceof AppError) {
            return reply.status(error.statusCode).send(new ErrorResponse(error.statusCode, error.message));
        }

        return reply.status(500).send(new ErrorResponse(500, "Ocorreu um erro ao criar o palpite"));
    }
}
