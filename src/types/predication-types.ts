import z from "zod";
import { PredicationCreateInput } from "../../generated/prisma/models";

export interface createPredicationParams {
    userId: string;
    matchId: string;
    predicationType: PredicationCreateInput["type"];
    home_score_guess: number | null;
    away_score_guess: number | null;
    result_guess: PredicationCreateInput["result_guess"] | null;
}

export const createPredicationSchema = z.object({
    userId: z.string(),
    matchId: z.string(),
    predicationType: z.enum(["EXACT_SCORE", "MATCH_RESULT"]),
    home_score_guess: z.number().nullable().optional(),
    away_score_guess: z.number().nullable().optional(),
    result_guess: z.enum(["HOME_WIN", "AWAY_WIN", "DRAW"]).nullable().optional(),
});
