import { prisma } from "../lib/prisma";
import { ApiCompetitor } from "../types/api-sports";
import { fetchRoundMatches } from "./api-sports.service";

// Função auxiliar para converter o texto da API para o  Enum MatchStatus
function parseMatchStatus(statusText: string) {
    const lowerStatus = statusText.toLowerCase();
    if (lowerStatus.includes("encerrado")) return "FINISHED";
    if (lowerStatus.includes("andamento") || lowerStatus.includes("prog.")) return "IN_PROGRESS";
    return "SCHEDULED";
}

// Função auxiliar para cadastrar ou atualizar (upsert) um time
async function upsertTeam(apiTeam: ApiCompetitor) {
    return await prisma.team.upsert({
        where: { externalId: apiTeam.id },
        update: {
            name: apiTeam.name,
            abbreviatedName: apiTeam.symbolicName,
        },
        create: {
            externalId: apiTeam.id,
            name: apiTeam.name,
            abbreviatedName: apiTeam.symbolicName,
            shieldUrl: "",
        },
    });
}

/**
 * Busca a rodada na API e sincroniza times e partidas no banco de dados.
 */
export async function syncRound(roundNumber: number) {
    console.log(`Iniciando sincronização da rodada ${roundNumber}...`);

    // 1. Busca os dados externos
    const apiMatches = await fetchRoundMatches(roundNumber);

    for (const apiMatch of apiMatches) {
        try {
            // 2. Garante que os times existem no banco ANTES da partida
            const homeTeam = await upsertTeam(apiMatch.homeCompetitor);
            const awayTeam = await upsertTeam(apiMatch.awayCompetitor);

            // 3. Define o status da partida
            const matchStatus = parseMatchStatus(apiMatch.statusText);

            // 4. Insere ou atualiza a partida
            const savedMatch = await prisma.match.upsert({
                where: { externalId: apiMatch.id },
                update: {
                    homeScore: apiMatch.homeCompetitor.score !== -1 ? apiMatch.homeCompetitor.score : null,
                    awayScore: apiMatch.awayCompetitor.score !== -1 ? apiMatch.awayCompetitor.score : null,
                    status: matchStatus,
                    matchDate: new Date(apiMatch.startTime.substring(0, 19) + "Z"),
                },
                create: {
                    externalId: apiMatch.id,
                    round: apiMatch.roundNum,
                    homeTeamId: homeTeam.id, // Usa a chave interna do SEU banco, não a da API
                    awayTeamId: awayTeam.id, // Usa a chave interna do SEU banco
                    matchDate: new Date(apiMatch.startTime.substring(0, 19) + "Z"),
                    homeScore: apiMatch.homeCompetitor.score !== -1 ? apiMatch.homeCompetitor.score : null,
                    awayScore: apiMatch.awayCompetitor.score !== -1 ? apiMatch.awayCompetitor.score : null,
                    status: matchStatus,
                    pointsCalculated: false, // Inicia travado para distribuição de pontos
                },
            });

            console.log(`[Sincronizado] ${homeTeam.name} x ${awayTeam.name} - Status: ${matchStatus}`);
        } catch (error) {
            console.error(`Erro ao sincronizar partida ID ${apiMatch.id}:`, error);
        }
    }

    console.log(`Sincronização da rodada ${roundNumber} finalizada com sucesso!`);
}
