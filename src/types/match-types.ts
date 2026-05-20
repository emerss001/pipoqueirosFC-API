import z from "zod";

export interface CreateMatchBody {
    round: number;
    home_team_id: number;
    away_team_id: number;
    match_date: string; // ISO date string
}

export const CreateMatchSchema = z.object({
    round: z.number(),
    home_team_id: z.number(),
    away_team_id: z.number(),
    match_date: z.string(),
});

export interface UpdateMatchStatusBody {
    status: "SCHEDULED" | "IN_PROGRESS" | "FINISHED";
}

export const UpdateMatchStatusSchema = z.object({
    status: z.enum(["SCHEDULED", "IN_PROGRESS", "FINISHED"]),
});

export interface FinishMatchBody {
    home_score: number;
    away_score: number;
}

export const FinishMatchSchema = z.object({
    home_score: z.number(),
    away_score: z.number(),
});
