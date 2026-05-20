import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { syncRound } from "../service/sync.service";

export function startTurnoverCron() {
    // A expressão '0 3 * * 2' significa:
    // "No minuto 0, da hora 3 (da manhã), na Terça-feira (dia 2 da semana)"

    cron.schedule(
        "0 3 * * 2",
        async () => {
            console.log("[CRON - Zelador] Verificando se a rodada atual pode ser encerrada...");

            try {
                const settings = await prisma.systemSettings.findFirst();
                if (!settings) return;

                const currentRound = settings.currentActiveRound;

                // 1. Busca todos os jogos mapeados para a rodada atual
                const currentMatches = await prisma.match.findMany({
                    where: { round: currentRound },
                });

                if (currentMatches.length === 0) {
                    console.log(`[CRON - Zelador] Nenhum jogo encontrado para a rodada ${currentRound}.`);
                    return;
                }

                // 2. A Validação: Verifica se TODOS os jogos estão com status FINISHED
                // O método .every() retorna true apenas se todos os itens cumprirem a condição
                const allFinished = currentMatches.every((match) => match.status === "FINISHED");

                if (allFinished) {
                    const nextRound = currentRound + 1;

                    // 3. Atualiza a configuração do sistema
                    await prisma.systemSettings.update({
                        where: { id: settings.id },
                        data: { currentActiveRound: nextRound },
                    });

                    console.log(
                        `[CRON - Zelador] Rodada ${currentRound} totalmente encerrada! Avançando para a rodada ${nextRound}.`,
                    );

                    // 4. O Bônus: Já puxa os jogos da nova rodada na mesma hora para o app não ficar vazio
                    console.log(`[CRON - Zelador] Puxando calendário da rodada ${nextRound}...`);
                    await syncRound(nextRound);
                } else {
                    // Se um jogo foi adiado ou atrasou, ele barra a virada de rodada
                    const pendingMatches = currentMatches.filter((m) => m.status !== "FINISHED").length;
                    console.log(
                        `[CRON - Zelador] A rodada ${currentRound} ainda tem ${pendingMatches} jogo(s) pendente(s). Virada adiada.`,
                    );
                }
            } catch (error) {
                console.error("[CRON - Zelador] Erro ao tentar virar a rodada:", error);
            }
        },
        {
            timezone: "America/Sao_Paulo",
        },
    );

    console.log("⏳ [CRON] Zelador de Rodada configurado para rodar às Terças-feiras, 03:00 AM.");
}
