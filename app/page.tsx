'use client';

import GameSetup from './components/GameSetup';

export default function Home() {
  const handleComplete = (data: any) => {
    console.log('設定完了！', data);
    alert(`プレイヤー: ${data.players.map((p: any) => p.name).join(', ')}\nカード数: ${data.cardCount}\nジャンル数: ${data.selectedGenres.length}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎴 トークデッキ
          </h1>
          <p className="text-gray-600">
            会話が弾むトークテーマカードゲーム
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl">
          <GameSetup onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
}