import { prisma } from "../lib/prisma";
import { syncRound } from "./sync.service";
// import { subMinutes } from 'date-fns'; // Opcional: Se você usa date-fns, é útil

/**
 * Weekly Setup - Planejador da Rodada
 *
 * Função responsável por olhar para a rodada atual, puxar a grade da API (se necessário),
 * e espalhar as tarefas `SYNC_MATCHES` ao longo da semana exatamente nos horários dos jogos.
 */
export async function planWeeklySetup() {
    console.log("[Weekly Setup] Iniciando planejamento da semana...");

    try {
        // 1. Pega a rodada atual
        const settings = await prisma.systemSettings.findFirst();
        const currentRound = settings ? settings.currentActiveRound : 1;

        // 2. Busca e atualiza os jogos dessa rodada usando a função que já existe!
        // Isso vai garantir que o banco local (tabela Match) esteja com a grade da semana preenchida
        console.log(`[Weekly Setup] Baixando a grade da rodada ${currentRound}...`);
        await syncRound(currentRound);

        // 3. Busca os jogos recém-salvos/atualizados no banco para a rodada atual
        const matches = await prisma.match.findMany({
            where: { round: currentRound },
            orderBy: { matchDate: "asc" },
        });

        if (matches.length === 0) {
            console.log(`[Weekly Setup] Nenhum jogo encontrado para a rodada ${currentRound}. Abortando agendamento.`);
            return;
        }

        // 4. Limpa tarefas antigas e não rodadas dessa mesma rodada (Para evitar agendamentos duplicados)
        // Isso é ótimo caso o WeeklySetup rode duas vezes por acidente
        await prisma.scheduledTask.deleteMany({
            where: {
                taskName: "SYNC_MATCHES",
                status: "PENDING",
            },
        });

        // 5. Agenda 1 tarefa SYNC_MATCHES para o momento exato de cada jogo!
        const newTasks = [];

        // Usamos um Set para não agendar duas tarefas pro mesmo horário se 2 jogos começarem juntos (ex: 16:00 domingo)
        const uniqueStartTimes = new Set<number>();

        for (const match of matches) {
            const timeMs = match.matchDate.getTime();

            if (!uniqueStartTimes.has(timeMs)) {
                uniqueStartTimes.add(timeMs);

                newTasks.push({
                    taskName: "SYNC_MATCHES",
                    // Agenda para a hora exata do jogo
                    executeAt: match.matchDate,
                    payload: JSON.parse(JSON.stringify({ round: currentRound, type: "start_of_match" })),
                });
            }
        }

        if (newTasks.length > 0) {
            await prisma.scheduledTask.createMany({
                data: newTasks,
            });
            console.log(`[Weekly Setup] ${newTasks.length} tarefas de sincronização (SYNC_MATCHES) criadas!`);
        }

        console.log("[Weekly Setup] Planejamento semanal finalizado com sucesso.");
    } catch (error) {
        console.error("[Weekly Setup] Erro crítico ao planejar a semana:", error);
    }
}
