import z from "zod";

export interface createBettingGroupParams {
    name: string;
    creatorId: string;
}

export const createBettingGroupSchema = z.object({
    name: z.string().min(1, "Name is required"),
    creatorId: z.string().min(1, "Creator ID is required"),
});

export interface addUserToBettingGroupParams {
    userId: string;
    bettingGroupId: number;
}

export const addUserToBettingGroupSchema = z.object({
    userId: z.string(),
    bettingGroupId: z.string(),
});
