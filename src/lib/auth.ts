import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI, bearer } from "better-auth/plugins";
import { prisma } from "./prisma";

export const auth = betterAuth({
    baseURL: process.env.API_URL || "http://localhost:3333",
    trustedOrigins: ["http://localhost:3333", "http://localhost:3000"],

    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    plugins: [openAPI(), bearer()],

    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            scope: ["profile", "email", "name"],
        },
    },
});
