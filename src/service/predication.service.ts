import { AppError } from "../errors/app-error";
import { prisma } from "../lib/prisma";
import { createPredicationParams } from "../types/predication-types";

export async function createPredicationService(params: createPredicationParams, userId: string) {
    const match = await prisma.match.findUnique({
        where: { id: params.matchId },
        select: { id: true },
    });

    if (!match) {
        throw new AppError("Partida não encontrada", 404);
    }

    const existingPrediction = await prisma.prediction.findFirst({
        where: {
            userId: userId,
            matchId: params.matchId,
            type: params.predicationType,
            bettingGroupId: params.bettingGroupId,
        },
    });

    if (existingPrediction) {
        throw new AppError("Este palpite já foi feito para esta partida neste bolão", 400);
    }

    const predication = await prisma.prediction.create({
        data: {
            userId: userId,
            matchId: params.matchId,
            type: params.predicationType,
            homeScoreGuess: params.home_score_guess ?? null,
            awayScoreGuess: params.away_score_guess ?? null,
            resultGuess: params.result_guess ?? null,
            bettingGroupId: params.bettingGroupId,
        },
    });

    return predication;
}
