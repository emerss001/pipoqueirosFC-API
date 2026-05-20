import z from "zod";

export interface UpdateActiveRoundBody {
    round: number;
}

export const UpdateActiveRoundSchema = z.object({
    round: z.number(),
});
