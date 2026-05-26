import { FastifyReply, FastifyRequest } from "fastify";
import "@fastify/multipart";
import { userFindByIdService, updateUserProfilePictureService } from "../service/users.service";
import { SuccessResponse, ErrorResponse } from "../types/api-response";
import { AppError } from "../errors/app-error";
import { utapi } from "../lib/uploadthing";
import { getUser } from "../helpers/get-user";

export async function userFindById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    if (!id) {
        return reply.status(400).send(new ErrorResponse(400, "User ID is required"));
    }

    const user = await userFindByIdService(id);

    if (!user) {
        return reply.status(404).send(new ErrorResponse(404, "User not found"));
    }

    return reply.status(200).send(new SuccessResponse(200, "User found", user));
}

export async function getAddressUser(request: FastifyRequest, reply: FastifyReply) {
    const { latitude, longitude } = request.body as { latitude: string; longitude: string };

    if (!latitude || !longitude) {
        throw new AppError("Latitude and longitude are required", 400);
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            {
                method: "GET",
                headers: {
                    "User-Agent": "PipoqueirosFC/1.0",
                    "Accept-Language": "pt-BR",
                },
            },
        );

        if (!response.ok) {
            throw new AppError(`Error fetching address: ${response.status} - ${response.statusText}`, response.status);
        }

        const data = await response.json();

        if (!data || !data.address) {
            throw new AppError("No address found for the provided coordinates", 404);
        }

        const address = {
            city: data.address.city || data.address.town || data.address.village || data.address.municipality || "Unknown",
            state: data.address.state || "Unknown",
        };

        return reply.status(200).send(new SuccessResponse(200, "Address found", address));
    } catch (error) {
        console.error("Error in getAddressUser:", error);
        if (error instanceof AppError) {
            return reply.status(error.statusCode).send(new ErrorResponse(error.statusCode, error.message));
        }
        return reply.status(500).send(new ErrorResponse(500, "Internal Server Error"));
    }
}

export async function updateProfilePicture(request: FastifyRequest, reply: FastifyReply) {
    const user = getUser(request);
    const id = user.id;
    if (!id) {
        throw new AppError("User ID is required", 400);
    }

    const data = await request.file();
    if (!data) {
        throw new AppError("No file provided", 400);
    }

    const buffer = await data.toBuffer();
    const file = new File([new Uint8Array(buffer)], data.filename, { type: data.mimetype });

    try {
        const response = await utapi.uploadFiles(file);

        if (response.error) {
            throw new AppError(`Upload failed: ${response.error.message}`, 500);
        }

        const updatedUser = await updateUserProfilePictureService(id, response.data.ufsUrl);

        return reply.status(200).send(
            new SuccessResponse(200, "Profile picture updated successfully", {
                url: response.data.ufsUrl,
                user: updatedUser,
            }),
        );
    } catch (error) {
        console.error("Error updating profile picture:", error);
        if (error instanceof AppError) {
            return reply.status(error.statusCode).send(new ErrorResponse(error.statusCode, error.message));
        }
        return reply.status(500).send(new ErrorResponse(500, "Internal Server Error"));
    }
}
