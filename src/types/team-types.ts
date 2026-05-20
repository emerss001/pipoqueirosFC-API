import z from "zod";

export interface CreateTeamBody {
    name: string;
    abbreviated_name: string;
    shield_url: string;
}

export const CreateTeamSchema = z.object({
    name: z.string(),
    abbreviated_name: z.string(),
    shield_url: z.string(),
});
