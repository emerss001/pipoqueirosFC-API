import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { TaskStatus } from '@prisma/client';
import { syncRound } from '../service/sync.service';
import { executeTurnover } from '../service/system.service';
import { planWeeklySetup } from '../service/weekly-setup.service';

/**
 * Maestro Cron - O Orquestrador Dinâmico
 * Roda a cada 5 minutos procurando tarefas agendadas no banco de dados.
 */
export function startMaestroCron() {
  // Roda a cada 5 minutos: "*/5 * * * *"
  // Se quiser rodar a cada 1 minuto para testes, mude para: "* * * * *"
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Maestro Cron] Buscando tarefas pendentes...');

    try {
      // 1. Busca todas as tarefas PENDENTES cuja data agendada já passou ou é agora
      const pendingTasks = await prisma.scheduledTask.findMany({
        where: {
          status: 'PENDING',
          executeAt: {
            lte: new Date(), // Menor ou igual a agora
          },
        },
        orderBy: {
          executeAt: 'asc', // Executa as mais antigas primeiro
        },
      });

      if (pendingTasks.length === 0) {
        return; // Nenhuma tarefa para rodar agora
      }

      console.log(`[Maestro Cron] ${pendingTasks.length} tarefa(s) encontrada(s). Processando...`);

      for (const task of pendingTasks) {
        // 2. Trava a tarefa como RUNNING para evitar duplicação caso outro processo tente ler
        await prisma.scheduledTask.update({
          where: { id: task.id },
          data: { status: 'RUNNING' },
        });

        console.log(`[Maestro Cron] Iniciando tarefa: ${task.taskName} (ID: ${task.id})`);

        try {
          // ==========================================
          // 3. ROTEADOR DE TAREFAS (SWITCH)
          // ==========================================
          switch (task.taskName) {
            case 'SYNC_MATCHES':
              const settings = await prisma.systemSettings.findFirst();
              const currentRound = settings ? settings.currentActiveRound : 1;
              
              // Chama a função existente para atualizar os jogos com a API
              await syncRound(currentRound); 
              break;

            case 'TURNOVER_ROUND':
              await executeTurnover();
              break;

            case 'WEEKLY_SETUP':
              await planWeeklySetup();
              console.log(`[Maestro Cron] WEEKLY_SETUP executado com sucesso`);
              break;

            default:
              throw new Error(`TaskName não reconhecido: ${task.taskName}`);
          }

          // 4. Se chegou aqui, a tarefa rodou com sucesso. Marca como COMPLETED.
          await prisma.scheduledTask.update({
            where: { id: task.id },
            data: { status: 'COMPLETED', error: null },
          });
          
          console.log(`[Maestro Cron] Tarefa ${task.taskName} concluída com sucesso.`);

        } catch (error: any) {
          // 5. Se falhou, salva o erro no banco e marca como FAILED
          console.error(`[Maestro Cron] Falha na tarefa ${task.taskName}:`, error);
          
          await prisma.scheduledTask.update({
            where: { id: task.id },
            data: { 
              status: 'FAILED', 
              error: error?.message || 'Erro desconhecido'
            },
          });
        }
      }

    } catch (dbError) {
      console.error('[Maestro Cron] Erro crítico ao buscar/atualizar tarefas no banco:', dbError);
    }
  });

  console.log('⏰ Maestro Cron inicializado (Polling a cada 5 minutos).');
}
