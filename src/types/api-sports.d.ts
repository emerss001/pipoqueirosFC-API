// types/api-sports.d.ts

export interface ApiCompetitor {
    id: number;
    name: string;
    symbolicName: string;
    score: number; // -1 se o placar não estiver disponível
}

export interface ApiMatch {
    id: number;
    roundNum: number;
    startTime: string;
    statusText: string;
    homeCompetitor: ApiCompetitor;
    awayCompetitor: ApiCompetitor;
}

// Supondo que a API retorne um array de jogos ou um objeto contendo o array
export interface ApiRoundResponse {
    games: ApiMatch[];
}
