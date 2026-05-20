import { prisma } from "../lib/prisma";

export async function userFindByIdService(id: string) {
    const user = await prisma.user.findUnique({
        where: { id },
    });

    return user;
}
