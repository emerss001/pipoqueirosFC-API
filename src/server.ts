import Fastify from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { usersRoute } from "./routes/users.route";
import { bettingGroupRoute } from "./routes/betting-group.route";
import { predicationRoute } from "./routes/predication.route";
import { matchRoute } from "./routes/match.route";
import { teamRoute } from "./routes/team.route";
import { systemRoute } from "./routes/system.route";
import { auth } from "./lib/auth";
import cors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import fastifySwagger from "@fastify/swagger";
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import fastifyApiReference from "@scalar/fastify-api-reference";
import { startMaestroCron } from "./crons/maestro-cron";
import { planWeeklySetup } from "./service/weekly-setup.service";
import { rankingRoute } from "./routes/ranking.route";

const app = Fastify({
    logger: true,
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(cors, {
    origin: "*",
    credentials: true,
});

app.register(fastifyMultipart, {
    limits: {
        fileSize: 18 * 1024 * 1024, // 18MB limit
    },
});

app.get("/swagger.json", async () => {
    return app.swagger();
});

app.register(fastifySwagger, {
    openapi: {
        info: {
            title: "PipoqueirosFC API",
            description: "API para o aplicativo PipoqueirosFC",
            version: "1.0.0",
        },

        servers: [
            {
                description: "Localhost",
                url: "http://localhost:3333",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },

    transform: jsonSchemaTransform,
});

app.register(fastifyApiReference, {
    routePrefix: "/api-docs",
    configuration: {
        sources: [
            {
                title: "PipoqueirosFC API",
                slug: "pipoqueiros-fc-api",
                url: "/swagger.json",
            },
            {
                title: "Better Auth",
                slug: "better-auth-api",
                url: "/api/auth/open-api/generate-schema",
            },
        ],
    },
});

app.get("/", async () => {
    return { message: "API rodando 🚀" };
});

app.all("/api/auth/*", async (request, reply) => {
    // 1. Reconstruímos a URL completa da requisição
    const url = `${request.protocol}://${request.headers.host}${request.url}`;

    // 2. Como o Fastify já consumiu o stream e gerou o request.body,
    // nós o transformamos de volta em string JSON.
    const hasBody = ["POST", "PUT", "PATCH"].includes(request.method);
    const body = hasBody && request.body ? JSON.stringify(request.body) : null;

    // 3. Montamos a requisição no padrão Web que o Better Auth entende perfeitamente
    const req = new Request(url, {
        method: request.method,
        // O TypeScript pode pedir um cast aqui dependendo da sua versão
        headers: fromNodeHeaders(request.headers),
        body,
    });

    // 4. Chamamos o handler nativo (auth.handler) em vez do toNodeHandler
    const response = await auth.handler(req);

    // 5. Repassamos o código de status e todos os headers (essencial para CORS e tokens)
    reply.status(response.status);
    response.headers.forEach((value, key) => {
        reply.header(key, value);
    });

    // 6. Retornamos o corpo da resposta
    const responseBody = await response.text();
    return reply.send(responseBody);
});

app.register(usersRoute);
app.register(bettingGroupRoute);
app.register(predicationRoute);
app.register(matchRoute);
app.register(teamRoute);
app.register(systemRoute);
app.register(rankingRoute);

// ATENÇÃO: Chamada forçada apenas para testar e popular o banco de dados agora.
// Numa situação real, o Turnover via maestro cuidaria do planWeeklySetup.
// console.log("🛠️  [DEBUG] Disparando planWeeklySetup manualmente na inicialização...");
// planWeeklySetup().then(() => {
//     console.log("🛠️  [DEBUG] Setup manual finalizado. O Maestro vai assumir daqui em diante.");
// });

startMaestroCron();

app.listen({ port: 3333, host: "0.0.0.0" }).then(() => {
    console.log("Server running on http://localhost:3333");
    console.log("------ versão última do código 1.0.3 ------");
});
