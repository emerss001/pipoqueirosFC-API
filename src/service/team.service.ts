import { prisma } from "../lib/prisma";
import { CreateTeamBody } from "../types/team-types";

export async function createTeamService(data: CreateTeamBody) {
    const team = await prisma.team.create({
        data: {
            name: data.name,
            abbreviatedName: data.abbreviated_name,
            shieldUrl: data.shield_url,
        },
    });

    return team;
}

export async function getAllTeamsService() {
    const teams = await prisma.team.findMany({
        orderBy: {
            name: "asc",
        },
    });

    return teams;
}
