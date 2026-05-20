import { prisma } from "../lib/prisma";

export async function getActiveRoundService() {
    let settings = await prisma.system_settings.findUnique({
        where: { id: 1 },
    });

    if (!settings) {
        settings = await prisma.system_settings.create({
            data: { id: 1, current_active_round: 1 },
        });
    }

    return settings.current_active_round;
}

export async function updateActiveRoundService(round: number) {
    const settings = await prisma.system_settings.upsert({
        where: { id: 1 },
        update: { current_active_round: round },
        create: { id: 1, current_active_round: round },
    });

    return settings;
}
