import { ApiMatch } from "../types/api-sports";

const API_BASE_URL =
    process.env.SPORTS_API_URL ||
    "https://webws.365scores.com/web/games/current/?appTypeId=5&langId=31&timezoneName=America%2FBahia&userCountryId=21&competitions=113";

/**
 * Busca todos os jogos de uma rodada específica
 * @param roundNumber Número da rodada do Brasileirão
 * @returns Array de partidas tipadas e filtradas
 */
export async function fetchRoundMatches(roundNumber: number): Promise<ApiMatch[]> {
    try {
        const response = await fetch(API_BASE_URL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Erro na API externa: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();

        // Validação de segurança e tipagem garantida
        if (!data || !Array.isArray(data.games)) {
            console.warn("A estrutura da resposta da API não contém um array de 'games'.");
            return [];
        }

        // Filtra estritamente os jogos onde o roundNum bate com o parâmetro
        const filteredGames = data.games.filter((game: ApiMatch) => game.roundNum === roundNumber);

        return filteredGames;
    } catch (error) {
        console.error(`Falha ao buscar a rodada ${roundNumber}:`, error);
        throw error;
    }
}
