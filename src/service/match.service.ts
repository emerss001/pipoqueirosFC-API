import { MatchStatus, ResultGuess } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { CreateMatchBody, UpdateMatchStatusBody, FinishMatchBody } from "../types/match-types";
import { getActiveRoundService } from "./system.service";

// export async function createMatchService(data: CreateMatchBody) {
//     const match = await prisma.match.create({
//         data: {
//             round: data.round,
//             homeTeamId: data.home_team_id,
//             awayTeamId: data.away_team_id,
//             match_date: new Date(data.match_date),
//         },
//     });

//     return match;
// }

export async function updateMatchStatusService(id: number, data: UpdateMatchStatusBody) {
    const match = await prisma.match.update({
        where: { id },
        data: {
            status: data.status as MatchStatus,
        },
    });

    return match;
}

export async function finishMatchService(matchId: number, data: FinishMatchBody) {
    // 1. Busca a partida e TODOS os palpites atrelados a ela
    const existingMatch = await prisma.match.findUnique({
        where: { id: matchId },
        include: { predictions: true },
    });

    if (!existingMatch) {
        throw new Error("Partida não encontrada.");
    }

    // Trava de segurança: impede que a partida receba pontos em dobro
    if (existingMatch.status === MatchStatus.FINISHED || existingMatch.pointsCalculated) {
        throw new Error("A partida já foi encerrada ou os pontos já foram calculados.");
    }

    // 2. Descobre o resultado oficial na vida real
    const actualResult: ResultGuess =
        data.home_score > data.away_score ? "HOME_WIN" : data.away_score > data.home_score ? "AWAY_WIN" : "DRAW";

    // Array que vai segurar todas as queries para executarmos de uma vez só
    const operations = [];

    // 3. Primeira query: Atualiza o placar e tranca a partida
    operations.push(
        prisma.match.update({
            where: { id: matchId },
            data: {
                homeScore: data.home_score,
                awayScore: data.away_score,
                status: MatchStatus.FINISHED,
                pointsCalculated: true,
            },
        }),
    );

    // 4. Lógica de cálculo para cada palpite
    for (const prediction of existingMatch.predictions) {
        let points = 0;

        if (prediction.type === "EXACT_SCORE") {
            // Tentou o placar exato e cravou: 5 pontos
            if (prediction.homeScoreGuess === data.home_score && prediction.awayScoreGuess === data.away_score) {
                points = 5;
            }
        } else if (prediction.type === "MATCH_RESULT") {
            // Apostou só no resultado e acertou: 3 pontos
            if (prediction.resultGuess === actualResult) {
                points = 3;
            }
        }

        // 5. Se o usuário pontuou, adicionamos as atualizações dele na Transaction
        if (points > 0) {
            // Registra no histórico do palpite que ele rendeu pontos
            operations.push(
                prisma.prediction.update({
                    where: { id: prediction.id },
                    data: { pointsEarned: points },
                }),
            );

            // Adiciona os pontos ao Ranking geral do usuário NESTE bolão específico
            operations.push(
                prisma.groupParticipant.update({
                    where: {
                        bettingGroupId_userId: {
                            bettingGroupId: prediction.bettingGroupId,
                            userId: prediction.userId,
                        },
                    },
                    data: {
                        score: { increment: points },
                    },
                }),
            );
        }
    }

    // 6. Executa TODAS as queries no banco. Se uma falhar, todas falham, mantendo a consistência.
    await prisma.$transaction(operations);

    return {
        message: "Partida finalizada e pontos distribuídos com sucesso!",
        processedPredictions: existingMatch.predictions.length,
    };
}

export async function getCurrentRoundMatchesService() {
    const activeRound = await getActiveRoundService();

    const matches = await prisma.match.findMany({
        where: {
            round: activeRound,
        },
        include: {
            homeTeam: true,
            awayTeam: true,
        },
        orderBy: {
            matchDate: "asc",
        },
    });

    return {
        round: activeRound,
        matches,
    };
}
