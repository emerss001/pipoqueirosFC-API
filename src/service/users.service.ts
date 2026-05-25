import { prisma } from "../lib/prisma";

export async function userFindByIdService(id: string) {
    const user = await prisma.user.findUnique({
        where: { id },
    });

    return user;
}

export async function updateUserProfilePictureService(userId: string, imageUrl: string) {
    return prisma.user.update({
        where: { id: userId },
        data: { image: imageUrl },
    });
}
