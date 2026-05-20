import { prisma } from "../lib/prisma";
import { createPredicationParams } from "../types/predication-types";

export async function createPredicationService(params: createPredicationParams) {
    const predication = await prisma.predication.create({
        data: {
            userId: params.userId,
            matchId: params.matchId,
            type: params.predicationType,
            home_score_guess: params.home_score_guess ?? null,
            away_score_guess: params.away_score_guess ?? null,
            result_guess: params.result_guess ?? null,
        },
    });

    return predication;
}
