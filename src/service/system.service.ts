import { prisma } from "../lib/prisma";

export async function getActiveRoundService() {
    let settings = await prisma.systemSettings.findUnique({
        where: { id: 1 },
    });

    if (!settings) {
        settings = await prisma.systemSettings.create({
            data: { id: 1, currentActiveRound: 1 },
        });
    }

    return settings.currentActiveRound;
}

export async function updateActiveRoundService(round: number) {
    const settings = await prisma.systemSettings.upsert({
        where: { id: 1 },
        update: { currentActiveRound: round },
        create: { id: 1, currentActiveRound: round },
    });

    return settings;
}
