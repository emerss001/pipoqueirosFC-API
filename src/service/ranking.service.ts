import { prisma } from "../lib/prisma";

export async function GetRankingGeneralService() {
    const ranking = await prisma.$queryRaw`
        SELECT 
            u.id, 
            u.name, 
            u.image, 
            COALESCE(SUM(gp.score), 0)::int AS "totalScore"
        FROM users u
        INNER JOIN group_participants gp ON u.id = gp."userId"
        GROUP BY u.id, u.name, u.image
        ORDER BY "totalScore" DESC, u.name ASC
        LIMIT 50;
    `;

    return ranking;
}

export async function getRankingByStateService(state: string) {
    const ranking = await prisma.$queryRaw`
        SELECT 
            u.id, 
            u.name, 
            u.image, 
            COALESCE(SUM(gp.score), 0)::int AS "totalScore"
        FROM users u
        INNER JOIN group_participants gp ON u.id = gp."userId"
        WHERE TRIM(LOWER(u.state)) = TRIM(LOWER(${state}))
        GROUP BY u.id, u.name, u.image
        ORDER BY "totalScore" DESC, u.name ASC
        LIMIT 50;
    `;

    return ranking;
}

export async function getRankingByCityService(city: string) {
    const ranking = await prisma.$queryRaw`
        SELECT 
            u.id, 
            u.name, 
            u.image, 
            COALESCE(SUM(gp.score), 0)::int AS "totalScore"
        FROM users u
        INNER JOIN group_participants gp ON u.id = gp."userId"
        WHERE TRIM(LOWER(u.city)) = TRIM(LOWER(${city}))
        GROUP BY u.id, u.name, u.image
        ORDER BY "totalScore" DESC, u.name ASC
        LIMIT 50;
    `;

    return ranking;
}
