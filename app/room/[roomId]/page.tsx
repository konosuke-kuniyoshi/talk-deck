'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import WaitingRoom from '@/app/components/WaitingRoom';
import GameBoard from '@/app/components/GameBoard';

const RoomPage = () => {
    const params = useParams();
    const roomId = (params.roomId ?? '') as string;
    const [players, setPlayers] = useState<string[]>([]);
    // 初回はオーナー（0）で固定、Socket.IOで更新されたら上書き
    const [selfIndex, setSelfIndex] = useState<number>(() => {
      if (typeof window !== 'undefined' && window.sessionStorage.getItem('isOwner') === 'true') {
        return 0;
      }
      return 0;
    });
    const [requiredCount, setRequiredCount] = useState<number>(2);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [cardCount, setCardCount] = useState<number>(4);
    const [isGameStarted, setIsGameStarted] = useState(false);

    useEffect(() => {
      if (!roomId) return;
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
          // statusが'playing'ならゲーム画面へ
          if (data.status === 'playing') {
            setIsGameStarted(true);
          }
        })
        .catch(err => {
          // エラー時の処理（例: ログ表示やUIでエラー表示）
          console.error(err);
          setPlayers([]);
          setRequiredCount(0);
          setSelectedGenres([]);
          setCardCount(4);
        });

      // Socket.IOでplayersUpdatedとgameStartedを受信（クライアントサイドのみ）
      if (typeof window !== 'undefined') {
        import('@/app/lib/socket').then(({ getSocket }) => {
          const socket = getSocket();
          const handler = ({ players, selfIndexes }: { players: string[], selfIndexes: Record<string, number> }) => {
            // players配列を必ず最新で反映
            console.log('playersUpdated:', { players, selfIndexes, socketId: socket.id });
            setPlayers([...players]);
            // 自分のsocket.idからselfIndexを取得
            if (socket && socket.id && selfIndexes && selfIndexes[socket.id] !== undefined) {
              setSelfIndex(selfIndexes[socket.id]);
              console.log('setSelfIndex:', selfIndexes[socket.id]);
            }
          };
          socket.on('playersUpdated', handler);

          // 参加人数変更イベント
          const requiredCountHandler = ({ requiredCount }: { requiredCount: number }) => {
            setRequiredCount(requiredCount);
          };
          socket.on('requiredCountUpdated', requiredCountHandler);

          // ゲーム開始イベント
          const gameStartHandler = () => {
            setIsGameStarted(true);
          };
          socket.on('gameStarted', gameStartHandler);

          // クリーンアップ
          return () => {
            socket.off('playersUpdated', handler);
            socket.off('requiredCountUpdated', requiredCountHandler);
            socket.off('gameStarted', gameStartHandler);
          };
        });
      }
    }, [roomId]);

  return (
    isGameStarted ? (
      <GameBoard
        roomId={roomId}
        selectedGenres={selectedGenres}
        cardCount={cardCount}
        requiredCount={requiredCount}
        players={players}
        selfIndex={selfIndex}
      />
    ) : (
      <WaitingRoom
        roomId={roomId}
        players={players}
        requiredCount={requiredCount}
        onStart={() => setIsGameStarted(true)}
        selfIndex={selfIndex}
      />
    )
  );
};

export default RoomPage;