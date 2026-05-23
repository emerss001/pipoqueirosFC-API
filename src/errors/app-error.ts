export class AppError extends Error {
    public readonly statusCode: number;

    constructor(message: string, statusCode: number = 400) {
        super(message);
        this.statusCode = statusCode;

        // Garante que o nome da classe seja "AppError", útil para logs ou instanceof
        this.name = "AppError";

        // Captura a stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}
