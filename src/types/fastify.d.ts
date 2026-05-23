import "fastify";
import { User } from "better-auth";

declare module "fastify" {
    interface FastifyRequest {
        // Anexamos a interface de User no Request. 
        // Usamos interseção para incluir a 'role' caso o Prisma estenda o usuário padrão
        user?: User & { role?: string };
    }
}
