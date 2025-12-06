'use client';

import { useEffect, useState } from 'react';

type CardWithGenre = {
    id: string;
    question: string;
    description?: string | null;
    genre: {
        id: string;
        name: string;
        color: string;
    };
};

interface GameBoardProps {
    roomId: string;
    selectedGenres: string[];
    cardCount: number;
    requiredCount: number;
}

export default function GameBoard({ roomId, selectedGenres, cardCount, requiredCount }: GameBoardProps) {
    const [hand, setHand] = useState<CardWithGenre[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCards = async () => {
            if (!selectedGenres || selectedGenres.length === 0 || !cardCount) {
                setError('ジャンルまたはカード枚数が未設定です');
                setLoading(false);
                return;
            }
            
            setLoading(true);
            setError(null);
            try {
                const res = await fetch('/api/cards/draw', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ genreIds: selectedGenres, cardCount })
                });
                if (!res.ok) throw new Error('カード取得に失敗しました');
                const data = await res.json();
                setHand(data);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCards();
    }, [selectedGenres, cardCount]);

    const handCount = 4;

    // 他プレイヤーの配置情報
    const getOtherPlayerPositions = () => {
        if (requiredCount === 1) return [];
        if (requiredCount === 2) return [
            { label: '対面', style: 'absolute top-8 left-1/2 -translate-x-1/2' }
        ];
        if (requiredCount === 3) return [
            { label: '左斜め上', style: 'absolute top-16 left-1/4 -translate-x-1/2' },
            { label: '右斜め上', style: 'absolute top-16 right-1/4 translate-x-1/2' }
        ];
        if (requiredCount === 4) return [
            { label: '左斜め上', style: 'absolute top-16 left-1/6 -translate-x-1/2' },
            { label: '対面', style: 'absolute top-8 left-1/2 -translate-x-1/2' },
            { label: '右斜め上', style: 'absolute top-16 right-1/6 translate-x-1/2' }
        ];
        return [];
    };
    const otherPositions = getOtherPlayerPositions();

    return (
        <div className="relative flex flex-col h-screen justify-between bg-green-700">
            {/* 他プレイヤーの手札（配置に応じて表示） */}
            {otherPositions.map((pos, idx) => (
                <div key={idx} className={pos.style + ' flex flex-col items-center z-10'}>
                    <div className="flex">
                        {Array.from({ length: handCount }).map((_, i) => (
                            <div
                                key={i}
                                className="mx-1 w-16 h-24 rounded-lg shadow-lg border-2 border-gray-400 bg-gray-300 flex items-center justify-center"
                            >
                                {/* 裏面デザイン */}
                                <div className="w-10 h-16 bg-gray-500 rounded"></div>
                            </div>
                        ))}
                    </div>
                    <span className="text-xs text-white mt-1">{pos.label}</span>
                </div>
            ))}

            {/* 自分の手札（下部） */}
            <div className="fixed bottom-0 left-0 w-full flex justify-center items-end mb-8 z-20">
                {loading ? (
                    <div className="text-gray-500">カードを取得中...</div>
                ) : error ? (
                    <div className="text-red-500">{error}</div>
                ) : hand.length === 0 ? (
                    <div className="text-gray-500">カードがありません</div>
                ) : hand.slice(0, handCount).map(card => (
                    <div
                        key={card.id}
                        className="mx-2 w-24 h-32 rounded-lg shadow-lg flex flex-col items-center justify-center border-2 border-gray-300 bg-white"
                    >
                        <span className="text-xs font-bold text-black text-center px-1 break-words">
                            {card.question}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}