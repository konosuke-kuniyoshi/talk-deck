export interface Player {
  id: string;
  name: string;
  avatar?: string;
}

export interface GameState {
  players: Player[];
  selectedGenres: string[];
  currentCard: CardWithGenre | null;
  usedCards: string[];
  sessionId: string | null;
}

export interface CardWithGenre {
  id: string;
  question: string;
  description?: string | null;
  genre: {
    id: string;
    name: string;
    color: string;
  };
}

export interface GenreOption {
  id: string;
  name: string;
  description?: string | null;
  color: string;
}
