'use client';

import { useState, useEffect } from 'react';
import { Player, GenreOption } from '@/app/types/game';

interface GameSetupProps {
    onComplete: (data: GameSetupData) => void;
}

interface GameSetupData {
    players: Player[];
    requiredCount: number;
    cardCount: number;
    selectedGenres: string[];
    ownerName: string;
}

export default function GameSetup({ onComplete }: GameSetupProps) {
    // プレイヤー設定
    const [playerName, setPlayerName] = useState<string>('');
    const [playerCount, setPlayerCount] = useState(2);

    // カード設定
    const [cardCount, setCardCount] = useState(10);

    // ジャンル設定
    const [genres, setGenres] = useState<GenreOption[]>([]);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    
    // その他
    const [loading, setLoading] = useState(true);

    // コンポーネント表示時にジャンル一覧を取得
    useEffect(() => {
        fetchGenres();
    }, []);

    const fetchGenres = async () => {
        try {
            const response = await fetch('/api/genres');
            const data = await response.json();
            setGenres(data);
        } catch (error) {
            console.error('Failed to fetch genres:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleGenre = (genreId: string) => {
        setSelectedGenres(prev => {
            // 既に選択済みなら削除
            if (prev.includes(genreId)) {
                return prev.filter(id => id !== genreId);
            }
            // 未選択なら追加
            return [...prev, genreId];
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // バリデーション
        if (!playerName.trim()) {
            alert('表示名を入力してください');
            return;
        }
        if (selectedGenres.length === 0) {
            alert('ジャンルを1つ以上選択してください');
            return;
        }
        // 親コンポーネントに渡す（1人のみ）
        onComplete({
            players: [{ id: '1', name: playerName.trim() }],
            requiredCount: playerCount,
            cardCount,
            selectedGenres,
            ownerName: playerName.trim()
        });
    };

    // 読み込み中の表示
    if (loading) {
        return (
        <div className="w-full max-w-2xl mx-auto p-6">
            <div className="text-center text-gray-600">
                読み込み中...
            </div>
        </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto p-6 overflow-y-auto">
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
                ゲーム設定
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-8">

                {/* プレイヤー名入力 */}
                <div>
                    <label className="block text-sm font-medium mb-3 text-gray-700">
                        表示名
                    </label>
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="プレイヤー名"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* プレイヤー人数選択 */}
                <div>
                    <label className="block text-sm font-medium mb-3 text-gray-700">
                        プレイヤー人数
                    </label>
                    <div className="flex gap-3">
                        {[2, 3, 4].map(count => (
                        <button
                            key={count}
                            type="button"
                            onClick={() => setPlayerCount(count)}
                            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                            playerCount === count
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {count}人
                        </button>
                        ))}
                    </div>
                </div>

                {/* カード枚数選択 */}
                <div>
                    <label className="block text-sm font-medium mb-3 text-gray-700">
                        トークテーマ数
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                        {[5, 10, 20, 30].map(count => (
                        <button
                            key={count}
                            type="button"
                            onClick={() => setCardCount(count)}
                            className={`py-3 px-4 rounded-lg font-semibold transition-colors ${
                            cardCount === count
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            {count}枚
                        </button>
                        ))}
                    </div>
                </div>

                {/* ジャンル選択 */}
                <div>
                    <label className="block text-sm font-medium mb-3 text-gray-700">
                        ジャンル選択
                    </label>
                    <div className="space-y-3">
                        {/* ランダムオプション */}
                        <button
                        type="button"
                        onClick={() => toggleGenre('random')}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            selectedGenres.includes('random')
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-gray-800">すべて</div>
                                    <div className="text-sm text-gray-600">全ジャンルからランダム</div>
                                </div>
                                {selectedGenres.includes('random') && (
                                <div className="text-purple-500 text-xl">✓</div>
                                )}
                            </div>
                        </button>

                        {/* 各ジャンル */}
                        {genres.map(genre => (
                        <button
                            key={genre.id}
                            type="button"
                            onClick={() => toggleGenre(genre.id)}
                            disabled={selectedGenres.includes('random')}
                            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            selectedGenres.includes(genre.id)
                                ? 'border-blue-500 bg-blue-50'
                                : selectedGenres.includes('random')
                                ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div 
                                    className="font-semibold"
                                    style={{ color: genre.color }}
                                    >
                                        {genre.name}
                                    </div>
                                    {genre.description && (
                                    <div className="text-sm text-gray-600">{genre.description}</div>
                                    )}
                                </div>
                                {selectedGenres.includes(genre.id) && (
                                    <div 
                                    className="text-xl"
                                    style={{ color: genre.color }}
                                    >
                                        ✓
                                    </div>
                                )}
                            </div>
                        </button>
                        ))}
                    </div>
                </div>

                {/* 送信ボタン */}
                <button
                type="submit"
                className="w-full py-4 px-6 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                    ルーム作成
                </button>
            </form>
        </div>
    );
}