import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { fetchRoundMatches } from "../service/api-sports.service";
import { finishMatchService } from "../service/match.service";

// Função auxiliar (igual a do sync.service)
function parseMatchStatus(statusText: string) {
    const lowerStatus = statusText.toLowerCase();
    if (lowerStatus.includes("fim")) return "FINISHED";
    if (lowerStatus.includes("segundo") || lowerStatus.includes("primeiro")) return "IN_PROGRESS";
    return "SCHEDULED";
}

export function startConsolidatorCron() {
    cron.schedule(
        "0 * * * *",
        async () => {
            console.log("[CRON - Consolidador] Verificando status e resultados das partidas...");

            try {
                // 1. Descobre a rodada ativa
                const settings = await prisma.systemSettings.findFirst();
                const currentRound = settings ? settings.currentActiveRound : 1;

                // 2. Busca os dados mais "frescos" da API externa
                const apiMatches = await fetchRoundMatches(currentRound);

                // 3. Varre todos os jogos da API externa
                for (const apiMatch of apiMatches) {
                    // Busca a partida no SEU banco de dados usando o ID da API
                    const dbMatch = await prisma.match.findUnique({
                        where: { externalId: apiMatch.id },
                    });

                    if (!dbMatch) continue;

                    const apiStatus = parseMatchStatus(apiMatch.statusText);
                    const realHomeScore = apiMatch.homeCompetitor.score !== -1 ? apiMatch.homeCompetitor.score : null;
                    const realAwayScore = apiMatch.awayCompetitor.score !== -1 ? apiMatch.awayCompetitor.score : null;

                    // Cenário A: Jogo está rolando (ou já rolou mas ainda não foi consolidado)
                    // Atualiza o placar ao vivo e o status se mudou.
                    if (apiStatus === "IN_PROGRESS" || apiStatus === "FINISHED") {
                        if (
                            dbMatch.status !== apiStatus ||
                            dbMatch.homeScore !== realHomeScore ||
                            dbMatch.awayScore !== realAwayScore
                        ) {
                            await prisma.match.update({
                                where: { id: dbMatch.id },
                                data: {
                                    status: apiStatus as "SCHEDULED" | "IN_PROGRESS" | "FINISHED",
                                    homeScore: realHomeScore,
                                    awayScore: realAwayScore,
                                },
                            });
                            console.log(
                                `[CRON - Consolidador] Partida ${dbMatch.id} atualizada: Status=${apiStatus}, Placar: ${realHomeScore}x${realAwayScore}`,
                            );
                        }
                    }

                    // Cenário B: Jogo ENCERRADO, precisamos distribuir os pontos!
                    if (
                        apiStatus === "FINISHED" &&
                        !dbMatch.pointsCalculated &&
                        realHomeScore !== null &&
                        realAwayScore !== null
                    ) {
                        console.log(
                            `[CRON - Consolidador] Jogo encerrado detectado (ID interno: ${dbMatch.id}). Acionando distribuição de pontos...`,
                        );

                        // Chama o serviço para distribuir pontos (ele também marca como FINISHED e pointsCalculated: true)
                        await finishMatchService(dbMatch.id, {
                            home_score: realHomeScore,
                            away_score: realAwayScore,
                        });

                        console.log(`[CRON - Consolidador] Pontos distribuídos com sucesso para o jogo ${dbMatch.id}!`);
                    }
                }

                console.log("[CRON - Consolidador] Varredura horária concluída.");
            } catch (error) {
                console.error("[CRON - Consolidador] Erro ao consolidar partidas:", error);
            }
        },
        {
            timezone: "America/Sao_Paulo",
        },
    );

    console.log("⏳ [CRON] Consolidador de resultados configurado para rodar de hora em hora.");
}
