import { prisma } from "../lib/prisma";
import { ApiCompetitor } from "../types/api-sports";
import { fetchRoundMatches } from "./api-sports.service";
import { finishMatchService } from "./match.service";

// Função auxiliar para converter o texto da API para o  Enum MatchStatus
function parseMatchStatus(statusText: string) {
    const lowerStatus = statusText.toLowerCase();
    
    if (lowerStatus.includes("recém-finalizado") || lowerStatus === "fim" || lowerStatus.includes("encerrado")) {
        return "FINISHED";
    }
    
    if (
        lowerStatus.includes("primeiro tempo") || 
        lowerStatus.includes("segundo tempo") || 
        lowerStatus.includes("intervalo") || 
        lowerStatus.includes("andamento") || 
        lowerStatus.includes("prog.")
    ) {
        return "IN_PROGRESS";
    }
    
    // Padrão para "programação" ou agendados
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
                    matchDate: new Date(apiMatch.startTime), // Usa a string ISO completa da API, respeitando o offset
                },
                create: {
                    externalId: apiMatch.id,
                    round: apiMatch.roundNum,
                    homeTeamId: homeTeam.id, // Usa a chave interna do SEU banco, não a da API
                    awayTeamId: awayTeam.id, // Usa a chave interna do SEU banco
                    matchDate: new Date(apiMatch.startTime), // Usa a string ISO completa da API
                    homeScore: apiMatch.homeCompetitor.score !== -1 ? apiMatch.homeCompetitor.score : null,
                    awayScore: apiMatch.awayCompetitor.score !== -1 ? apiMatch.awayCompetitor.score : null,
                    status: matchStatus,
                    pointsCalculated: false, // Inicia travado para distribuição de pontos
                },
            });

            console.log(`[Sincronizado] ${homeTeam.name} x ${awayTeam.name} - Status: ${matchStatus}`);

            // Distribui os pontos se o jogo acabou e ainda não foram calculados
            if (
                matchStatus === "FINISHED" &&
                !savedMatch.pointsCalculated &&
                savedMatch.homeScore !== null &&
                savedMatch.awayScore !== null
            ) {
                console.log(`[SyncService] Jogo ${savedMatch.id} encerrado. Acionando distribuição de pontos...`);
                await finishMatchService(savedMatch.id, {
                    home_score: savedMatch.homeScore,
                    away_score: savedMatch.awayScore,
                });
                console.log(`[SyncService] Pontos distribuídos com sucesso para o jogo ${savedMatch.id}!`);
            }
        } catch (error) {
            console.error(`Erro ao sincronizar partida ID ${apiMatch.id}:`, error);
        }
    }

    // 5. Verificação dinâmica: Há algum jogo que precisa de monitoramento contínuo?
    // Se há jogo rolando (IN_PROGRESS) OU jogo que já passou do horário previsto mas ainda não começou na API (atraso)
    const nowMs = new Date().getTime();
    const needsMonitoring = apiMatches.find((m) => {
        const status = parseMatchStatus(m.statusText);
        if (status === "IN_PROGRESS") return true;

        if (status === "SCHEDULED") {
            const matchStartMs = new Date(m.startTime).getTime();
            // Se o horário atual for maior ou igual ao horário do jogo, significa que já deveria ter começado.
            if (nowMs >= matchStartMs) {
                return true;
            }
        }
        return false;
    });

    if (needsMonitoring) {
        console.log(`[SyncService] Jogo(s) em andamento ou atrasado(s)! Garantindo próximo agendamento...`);
        
        // Verifica se JÁ EXISTE uma tarefa agendada para os próximos 10 minutos
        // para não acumularmos milhares de tarefas.
        const now = new Date();
        const inTenMinutes = new Date(now.getTime() + 10 * 60000);
        
        const existingTask = await prisma.scheduledTask.findFirst({
            where: {
                taskName: 'SYNC_MATCHES',
                status: 'PENDING',
                executeAt: {
                    gt: now,
                    lte: inTenMinutes
                }
            }
        });

        if (!existingTask) {
            const nextExecution = new Date(now.getTime() + 5 * 60000); // Daqui a 5 min
            await prisma.scheduledTask.create({
                data: {
                    taskName: 'SYNC_MATCHES',
                    executeAt: nextExecution,
                    payload: JSON.parse(JSON.stringify({ round: roundNumber, reason: 'match_in_progress' }))
                }
            });
            console.log(`[SyncService] Próxima consulta à API agendada dinamicamente para: ${nextExecution.toLocaleString()}`);
        } else {
            console.log(`[SyncService] Já existe uma consulta agendada para breve. Ignorando.`);
        }
    }

    // 6. Verificação de Fim de Rodada: Todos os jogos terminaram?
    const allFinished = apiMatches.length > 0 && apiMatches.every(m => parseMatchStatus(m.statusText) === "FINISHED");
    
    if (allFinished) {
        console.log(`[SyncService] Todos os jogos da rodada ${roundNumber} parecem estar FINISHED.`);
        
        // Verifica se a tarefa de Turnover já não foi agendada
        const existingTurnover = await prisma.scheduledTask.findFirst({
            where: {
                taskName: 'TURNOVER_ROUND',
                status: 'PENDING',
                payload: {
                    path: ['round'],
                    equals: roundNumber
                }
            }
        });

        if (!existingTurnover) {
            // Calcula a próxima madrugada às 04:00 AM (Horário de Brasília)
            // 04:00 AM em BRT (UTC-3) corresponde a 07:00 AM em UTC.
            const turnoverTime = new Date();
            
            // Se o horário atual já passou das 04:00 AM (07:00 UTC), agendamos para o dia seguinte.
            // (Ex: O jogo acabou domingo 20h BRT / 23h UTC. 23 >= 7, então vai para segunda-feira).
            if (turnoverTime.getUTCHours() >= 7) {
                turnoverTime.setUTCDate(turnoverTime.getUTCDate() + 1);
            }
            
            // Zera os minutos e segundos, cravando às 07:00:00 UTC (04:00:00 BRT)
            turnoverTime.setUTCHours(7, 0, 0, 0); 
            
            await prisma.scheduledTask.create({
                data: {
                    taskName: 'TURNOVER_ROUND',
                    executeAt: turnoverTime,
                    payload: JSON.parse(JSON.stringify({ round: roundNumber }))
                }
            });
            console.log(`[SyncService] Virada de rodada (TURNOVER) agendada dinamicamente para: ${turnoverTime.toLocaleString()}`);
        }
    }

    console.log(`Sincronização da rodada ${roundNumber} finalizada com sucesso!`);
}
