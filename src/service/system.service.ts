import { prisma } from "../lib/prisma";
import { planWeeklySetup } from "./weekly-setup.service";

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

/**
 * Executa a virada de rodada:
 * - Verifica se todos os jogos da rodada atual estão finalizados
 * - Avança a rodada no sistema
 * - Aciona o planejamento (Weekly Setup) da nova rodada
 */
export async function executeTurnover() {
    console.log("[SystemService] Iniciando o processo de Turnover (Virada de Rodada)...");

    const settings = await prisma.systemSettings.findFirst();
    if (!settings) return;

    const currentRound = settings.currentActiveRound;

    const currentMatches = await prisma.match.findMany({
        where: { round: currentRound },
    });

    if (currentMatches.length === 0) {
        console.log(`[SystemService] Nenhum jogo encontrado para a rodada ${currentRound}.`);
        return;
    }

    const allFinished = currentMatches.every((match) => match.status === "FINISHED");

    if (allFinished) {
        const nextRound = currentRound + 1;

        await prisma.systemSettings.update({
            where: { id: settings.id },
            data: { currentActiveRound: nextRound },
        });

        console.log(
            `[SystemService] Rodada ${currentRound} totalmente encerrada! Avançando para a rodada ${nextRound}.`,
        );

        // Dispara o setup da nova rodada imediatamente para já agendar os próximos jogos
        console.log(`[SystemService] Planejando os agendamentos da rodada ${nextRound}...`);
        await planWeeklySetup();
    } else {
        const pendingMatches = currentMatches.filter((m) => m.status !== "FINISHED").length;
        console.log(
            `[SystemService] A rodada ${currentRound} ainda tem ${pendingMatches} jogo(s) pendente(s). Virada abortada.`,
        );
    }
}
