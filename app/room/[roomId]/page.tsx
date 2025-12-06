'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import WaitingRoom from '@/app/components/WaitingRoom';
import GameBoard from '@/app/components/GameBoard';

const RoomPage = () => {
    const params = useParams();
    const roomId = (params.roomId ?? '') as string;
    const [players, setPlayers] = useState<string[]>([]);
    const [requiredCount, setRequiredCount] = useState<number>(2);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [cardCount, setCardCount] = useState<number>(4);
    const [isGameStarted, setIsGameStarted] = useState(false);

    useEffect(() => {
    if (!roomId) return;
    console.log('fetch前:', roomId);
    fetch(`/api/room/${roomId}`)
      .then(res => {
        console.log('fetch後:', roomId);
        if (!res.ok) {
          throw new Error('Room not found');
        }
        return res.json();
      })
      .then(data => {
        setPlayers(data.players);
        setRequiredCount(data.requiredCount);
        setSelectedGenres(data.selectedGenres || []);
        setCardCount(data.cardCount || 4);
      })
      .catch(err => {
        // エラー時の処理（例: ログ表示やUIでエラー表示）
        console.error(err);
        setPlayers([]);
        setRequiredCount(0);
        setSelectedGenres([]);
        setCardCount(4);
      });
  }, [roomId]);

  return (
    isGameStarted ? (
      <GameBoard
        roomId={roomId}
        selectedGenres={selectedGenres}
        cardCount={cardCount}
        requiredCount={requiredCount}
      />
    ) : (
      <WaitingRoom
        roomId={roomId}
        players={players}
        requiredCount={requiredCount}
        onStart={() => setIsGameStarted(true)}
      />
    )
  );
};

export default RoomPage;