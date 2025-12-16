'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

import GameSetup from './components/GameSetup';
import WaitingRoom from './components/WaitingRoom'

export default function Home() {
  const [tab, setTab] = useState<'online' | 'offline' | 'waiting'>('online');
  const router = useRouter();

  const [roomId, setRoomId] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const [requiredCount, setRequiredCount] = useState(2);

  return (
    <div className="min-h-screen bg-[url('/back_ground_talk.png')] bg-cover bg-center bg-no-repeat">
      {/* タイトル・説明など */}
      <div className="flex gap-1 mt-1 justify-center">
        <button
          className={`px-10 py-2 rounded-t ${tab === 'online' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setTab('online')}
        >
          オンラインモード
        </button>
        <button
          className={`px-10 py-2 rounded-t ${tab === 'offline' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setTab('offline')}
        >
          オフラインモード
        </button>
      </div>
      <div className="bg-white rounded-xl shadow max-w-3xl p-6 mx-auto border-b border-gray-300 overflow-y-auto" style={{ maxHeight: '99vh' }}>
        {tab === 'online' && (
          <GameSetup
            onComplete={async (data) => {
              const newRoomId = uuidv4();
              // ルーム情報をAPIに保存
              // players配列を必ずrequiredCount分で初期化
              const players = Array(data.requiredCount).fill('');
              players[0] = data.ownerName;
              await fetch('/api/room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  roomId: newRoomId,
                  players,
                  requiredCount: data.requiredCount,
                  selectedGenres: data.selectedGenres,
                  cardCount: data.cardCount,
                  ownerName: data.ownerName
                })
              });
              // ルームページへ遷移
              router.push(`/room/${newRoomId}`);
              console.log('Created room with ID:', newRoomId);
              console.log('Initial data:', data);
            }}
          />
        )}
        {/* オフライン画面は後で実装 */}
        {tab === 'offline' && (
          <div className="text-center py-10 text-gray-500">オフラインモードは後で実装します</div>
        )}
        {tab === 'waiting' && (
          <WaitingRoom
            roomId={roomId}
            players={players ?? []}
            requiredCount={requiredCount}
          />
        )}
      </div>
    </div>
  );
}