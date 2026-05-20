import { ApiMatch } from "../types/api-sports";

const API_BASE_URL =
    process.env.SPORTS_API_URL ||
    "https://webws.365scores.com/web/games/fixtures/?appTypeId=5&langId=31&timezoneName=America/Bahia&userCountryId=21&competitions=113&roundKey=113_76_1_";

/**
 * Busca todos os jogos de uma rodada específica
 * @param roundNumber Número da rodada do Brasileirão
 * @returns Array de partidas tipadas
 */
export async function fetchRoundMatches(roundNumber: number): Promise<ApiMatch[]> {
    try {
        const endpoint = `${API_BASE_URL}_${roundNumber}`;

        const response = await fetch(endpoint, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Erro na API externa: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();

        return data.games as ApiMatch[];
    } catch (error) {
        console.error(`Falha ao buscar a rodada ${roundNumber}:`, error);
        throw error;
    }
}
