import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { fetchRoundMatches } from "../service/api-sports.service";
import { finishMatchService } from "../service/match.service";

export function startConsolidatorCron() {
    cron.schedule(
        "0 * * * *",
        async () => {
            console.log("[CRON - Consolidador] Verificando se há jogos recém-encerrados...");

            try {
                // 1. Descobre a rodada ativa
                const settings = await prisma.systemSettings.findFirst();
                const currentRound = settings ? settings.currentActiveRound : 1;

                // 2. Busca os dados mais "frescos" da API externa
                const apiMatches = await fetchRoundMatches(currentRound);

                // 3. Filtra apenas as partidas que a API marcou como "Encerrado"
                const finishedApiMatches = apiMatches.filter((m) => m.statusText.toLowerCase().includes("fim"));

                // 4. Varre os jogos encerrados para ver se falta distribuir pontos em algum
                for (const apiMatch of finishedApiMatches) {
                    // Busca a partida no SEU banco de dados usando o ID da API
                    const dbMatch = await prisma.match.findUnique({
                        where: { externalId: apiMatch.id },
                    });

                    // O SEGREDO ESTÁ AQUI:
                    // Se a partida existe e ainda não teve os pontos calculados...
                    if (dbMatch && !dbMatch.pointsCalculated) {
                        console.log(
                            `[CRON - Consolidador] Jogo encerrado detectado (ID interno: ${dbMatch.id}). Acionando distribuição de pontos...`,
                        );

                        // Pega os gols reais direto da API
                        const realHomeScore = apiMatch.homeCompetitor.score;
                        const realAwayScore = apiMatch.awayCompetitor.score;

                        // Chama o serviço que construímos, passando os gols para ele salvar e calcular
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
