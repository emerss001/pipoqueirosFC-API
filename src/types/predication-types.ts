import z from "zod";

export interface createPredicationParams {
    userId: string;
    matchId: number;
    predicationType: "EXACT_SCORE" | "MATCH_RESULT";
    home_score_guess: number | null;
    away_score_guess: number | null;
    result_guess: "HOME_WIN" | "AWAY_WIN" | "DRAW" | null;
    bettingGroupId: number;
}

export const createPredicationSchema = z.object({
    userId: z.string(),
    matchId: z.number(),
    predicationType: z.enum(["EXACT_SCORE", "MATCH_RESULT"]),
    home_score_guess: z.number().nullable().optional(),
    away_score_guess: z.number().nullable().optional(),
    result_guess: z.enum(["HOME_WIN", "AWAY_WIN", "DRAW"]).nullable().optional(),
    bettingGroupId: z.number(),
});
