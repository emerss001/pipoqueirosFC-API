import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { syncRound } from "../service/sync.service";

export function startSyncCron() {
    // 0 4 * * 4 -> toda quinta-feira às 04:00 da manhã
    cron.schedule(
        "* * * * *",
        async () => {
            console.log("[CRON - Agendador] Iniciando rotina semanal de sincronização...");

            try {
                // 1. Descobre qual é a rodada atual consultando as configurações do sistema
                const settings = await prisma.systemSettings.findFirst();

                // Se não achar a configuração, assume a rodada 1 como fallback de segurança
                const currentRound = settings ? settings.currentActiveRound : 1;

                // 2. Aciona o serviço que busca na API e faz os Upserts no banco
                await syncRound(currentRound);

                console.log(`[CRON - Agendador] Sucesso! Rodada ${currentRound} sincronizada.`);
                console.log(
                    `---------------------- feito no dia ${new Date().toLocaleString()} ----------------------`,
                );
            } catch (error) {
                console.error("[CRON - Agendador] Erro crítico ao tentar sincronizar:", error);
            }
        },
        {
            timezone: "America/Sao_Paulo",
        },
    );

    console.log("⏳ [CRON] Agendador semanal configurado para rodar às Quintas-feiras, 04:00 AM.");
}
