import z from "zod";

export class SuccessResponse<T = any> {
    public code: number;
    public message: string;
    public data: T;

    constructor(code: number, message: string, data: T) {
        this.code = code;
        this.message = message;
        this.data = data;
    }
}

export class ErrorResponse {
    public code: number;
    public message: string;

    constructor(code: number, message: string) {
        this.code = code;
        this.message = message;
    }
}

export const errorResponseSchema = z.object({
    code: z.number(),
    message: z.string(),
});
