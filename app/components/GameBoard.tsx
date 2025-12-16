'use client';

import { useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';

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
    otherPlayerNames: string[];
    playerName: string; // 自分のプレイヤー名
}

export default function GameBoard({ roomId, selectedGenres, cardCount, requiredCount, otherPlayerNames, playerName }: GameBoardProps) {
    const [hand, setHand] = useState<CardWithGenre[]>([]);
    const [centerCard, setCenterCard] = useState<CardWithGenre | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // otherPlayerNamesはpropsの値のみを使用（仮名生成はしない）

    // プレイヤー順（自分＋他プレイヤー）
    const allPlayerNames = [playerName, ...otherPlayerNames];
    // ゲーム開始時にランダムな順番で並び替え
    const [playerOrder, setPlayerOrder] = useState<string[]>([]);
    const [turnIndex, setTurnIndex] = useState(0);
    useEffect(() => {
        // シャッフル関数
        function shuffle(array: string[]) {
            const arr = [...array];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }
        setPlayerOrder(shuffle(allPlayerNames));
        setTurnIndex(0);
    }, [roomId]);

    // 手札を配る処理
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
    useEffect(() => {
        fetchCards();
    }, [selectedGenres, cardCount]);

    // socket取得
    const socket = getSocket();
    // カードを場に出す処理
    // 自分のターンのみカードを出せる（ターン表示と同じロジックで判定）
    const isMyTurn = playerOrder.length > 0 && playerOrder[turnIndex % playerOrder.length] === playerName;
    const handleCardClick = (cardIdx: number) => {
        if (!isMyTurn) return;
        const selected = hand[cardIdx];
        setCenterCard(selected); // まず自分の画面に即反映
        const nextTurnIndex = (turnIndex + 1) % playerOrder.length;
        socket.emit('centerCard', { roomId, card: selected, turnIndex: nextTurnIndex });
        fetchCards();
        // setTurnIndexはサーバーからのcenterCard受信時のみ更新
    };

    // centerCardの受信
    useEffect(() => {
        if (!socket) return;
        const handler = (data: { roomId: string; card: CardWithGenre; turnIndex?: number }) => {
            if (data.roomId === roomId) {
                setCenterCard(data.card);
                if (typeof data.turnIndex === 'number') {
                    setTurnIndex(data.turnIndex);
                }
            }
        };
        socket.on('centerCard', handler);
        return () => {
            socket.off('centerCard', handler);
        };
    }, [socket, roomId]);

    const handCount = 4;

    // 他プレイヤーの配置情報
    const getOtherPlayerPositions = () => {
        if (requiredCount === 1) return [];
        if (requiredCount === 2) return [
            { label: otherPlayerNames[0] || '', style: 'absolute top-8 left-1/2 -translate-x-1/2' }
        ];
        if (requiredCount === 3) return [
            { label: otherPlayerNames[0] || '', style: 'absolute top-16 left-1/4 -translate-x-1/2' },
            { label: otherPlayerNames[1] || '', style: 'absolute top-16 right-1/4 translate-x-1/2' }
        ];
        if (requiredCount === 4) return [
            { label: otherPlayerNames[0] || '', style: 'absolute top-16 left-1/6 -translate-x-1/2' },
            { label: otherPlayerNames[1] || '', style: 'absolute top-8 left-1/2 -translate-x-1/2' },
            { label: otherPlayerNames[2] || '', style: 'absolute top-16 right-1/6 translate-x-1/2' }
        ];
        return [];
    };
    const otherPositions = getOtherPlayerPositions();

    return (
        <div className="relative flex flex-col h-screen justify-between bg-green-700">
            {/* 現在のターン表示（画面左上） */}
            <div className="absolute top-4 left-4 z-50 text-white text-lg font-bold bg-black/40 px-4 py-1 rounded" style={{ minWidth: '260px' }}>
                {(() => {
                    const currentTurnName = playerOrder.length > 0 ? playerOrder[turnIndex % playerOrder.length] : '';
                    const isMyTurn = currentTurnName === playerName;
                    return (
                        <>
                            <div className="flex items-center text-lg font-bold">
                                <span style={{ minWidth: '7em', display: 'inline-block' }}>現在のターン：</span>
                                <span>{isMyTurn ? 'あなた' : currentTurnName}</span>
                            </div>
                            <div className="flex items-center text-lg font-bold mt-1">
                                <span style={{ minWidth: '7em', display: 'inline-block' }}>ターン数　　：</span>
                                <span>{turnIndex + 1}</span>
                            </div>
                        </>
                    );
                })()}
            </div>
            {/* 場（中央）に出されたカード */}
            {centerCard && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
                    <div className="w-28 h-40 rounded-lg shadow-lg border-2 border-yellow-400 bg-white flex items-center justify-center">
                        <span className="text-base font-bold text-black text-center px-2 break-words">
                            {centerCard.question}
                        </span>
                    </div>
                </div>
            )}
            {/* デッキ画像（中央右） */}
            <div
                className="absolute right-1/3 top-1/2 -translate-y-1/2 w-20 h-28 pb-2 flex items-center justify-center z-30 bg-gray-300 rounded-lg shadow-lg"
            >
                <img
                    src="/deck.svg"
                    alt="デッキ"
                    className="w-full h-full object-contain"
                />
            </div>
            {/* 他プレイヤーの手札（配置に応じて表示） */}
            {otherPositions.map((pos, idx) => (
                <div key={idx} className={pos.style + ' flex flex-col items-center z-10'}>
                    <div className="flex">
                        {Array.from({ length: handCount }).map((_, i) => (
                            <div
                                key={i}
                                className="mx-1 w-16 h-24 rounded-lg shadow-lg border-2 border-gray-400 bg-gray-300 flex items-center justify-center"
                            >
                                {/* 裏面デザイン: SVG画像 */}
                                <img
                                    src="/front_card_background.svg"
                                    alt="カード裏面"
                                    className="w-full h-full object-cover"
                                />
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
                ) : hand.slice(0, handCount).map((card, idx) => (
                    <div
                        key={card.id}
                        className={`mx-2 w-24 h-32 rounded-lg shadow-lg flex flex-col items-center justify-center border-2 border-gray-300 bg-white transition ${isMyTurn ? 'hover:-translate-y-5 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                        onClick={() => handleCardClick(idx)}
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