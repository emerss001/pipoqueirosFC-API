import { prisma } from "../lib/prisma";
import { createPredicationParams } from "../types/predication-types";

export async function createPredicationService(params: createPredicationParams) {
    const predication = await prisma.prediction.create({
        data: {
            userId: params.userId,
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
