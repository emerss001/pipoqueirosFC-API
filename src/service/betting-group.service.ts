import { AppError } from "../errors/app-error"; // Atualize o caminho se necessário
import generateCodeBettingGroup from "../helpers/generate-code-betting-group";
import { prisma } from "../lib/prisma";

export async function createBettingGroupService(name: string, creatorId: string) {
    const codeGenerated = generateCodeBettingGroup();

    const codeIsExists = await prisma.bettingGroup.findUnique({
        where: { code: codeGenerated },
        select: { id: true },
    });

    if (codeIsExists) {
        return createBettingGroupService(name, creatorId);
    }

    const BettingGroupCreated = await prisma.bettingGroup.create({
        data: {
            name: name,
            code: codeGenerated,
            creatorId,
        },
    });

    await prisma.groupParticipant.create({
        data: {
            userId: creatorId,
            bettingGroupId: BettingGroupCreated.id,
        },
    });

    return BettingGroupCreated;
}

export async function findBettingGroupByCodeService(code: string) {
    const bettingGroup = await prisma.bettingGroup.findUnique({
        where: { code },
        select: {
            id: true,
            name: true,
            creator: {
                select: { name: true },
            },
            participants: {
                select: {
                    user: {
                        select: { name: true, image: true },
                    },
                },
            },
        },
    });

    return bettingGroup;
}

export async function addUserToBettingGroupService(userId: string, bettingGroupCode: string) {
    const bettingGroup = await prisma.bettingGroup.findFirst({
        where: {
            code: bettingGroupCode,
        },
    });

    if (!bettingGroup) {
        throw new AppError("Bolão com este código não encontrado", 404);
    }

    const userAlreadyInBettingGroup = await prisma.groupParticipant.findFirst({
        where: {
            userId: userId,
            bettingGroupId: bettingGroup.id,
        },
    });

    if (userAlreadyInBettingGroup) {
        throw new AppError("Usuário já está no bolão", 409);
    }

    await prisma.groupParticipant.create({
        data: {
            userId: userId,
            bettingGroupId: bettingGroup.id,
        },
    });
}

export async function getBettingGroupRankingService(code: string) {
    const bettingGroup = await prisma.bettingGroup.findFirst({
        where: {
            code,
        },
    });

    if (!bettingGroup) {
        throw new AppError("Bolão não encontrado", 404);
    }

    const ranking = await prisma.groupParticipant.findMany({
        where: {
            bettingGroupId: bettingGroup.id,
        },
        select: {
            score: true,
            user: {
                select: {
                    name: true,
                    image: true,
                },
            },
        },
        orderBy: {
            score: "desc",
        },
    });

    return ranking;
}

export async function getUserBettingGroupsService(userId: string) {
    const userExists = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
    });

    if (!userExists) {
        throw new AppError("Usuário não encontrado", 404);
    }

    const bettingGroups = await prisma.bettingGroup.findMany({
        where: {
            participants: {
                some: {
                    userId,
                },
            },
        },
        select: {
            id: true,
            name: true,
            code: true,
            createdAt: true,
            creator: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            participants: {
                select: {
                    score: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    },
                },
            },
        },
    });

    return bettingGroups;
}

