import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { planWeeklySetup } from "../service/weekly-setup.service";

export function startSyncCron() {
    // 0 4 * * 4 -> toda quinta-feira às 04:00 da manhã
    cron.schedule(
        "0 4 * * 4",
        async () => {
            console.log("[CRON - Agendador] Iniciando rotina de Setup Semanal (Quinta-feira)...");

            try {
                // Ao invés de apenas rodar cegamente, ele vai baixar a rodada e 
                // criar as tarefas (ScheduledTask) para a semana inteira!
                await planWeeklySetup();

                console.log(
                    `---------------------- Setup concluído no dia ${new Date().toLocaleString()} ----------------------`,
                );
            } catch (error) {
                console.error("[CRON - Agendador] Erro crítico no Setup Semanal:", error);
            }
        },
        {
            timezone: "America/Sao_Paulo",
        },
    );

    console.log("⏳ [CRON] Setup Semanal configurado para rodar às Quintas-feiras, 04:00 AM.");
}
