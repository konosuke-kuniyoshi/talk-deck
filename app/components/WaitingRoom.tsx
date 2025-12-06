'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface WaitingRoomProps {
    roomId: string;
    players: string[];
    requiredCount: number;
    onStart?: () => void;
}


export default function WaitingRoom({ roomId, players = [], requiredCount: initialCount, onStart }: WaitingRoomProps) {

    const [requiredCount, setRequiredCount] = useState(initialCount);
    const isReady = players.length >= requiredCount;
    const [roomUrl, setRoomUrl] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setRoomUrl(window.location.href);
        }
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(roomUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleStart = () => {
        if (typeof onStart === 'function') {
            onStart();
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 text-center min-h-screen">
            <h2 className="text-2xl font-bold mb-4">待機中...</h2>

            <div className="border-2 border-blue-400 rounded-xl p-4 mb-6 bg-white min-h-[calc(100vh-200px)]">
                <div className="mb-4 flex items-center justify-between">
                    <span>参加者リスト： {players.length} / {requiredCount}人</span>
                    <select
                        value={requiredCount}
                        onChange={e => setRequiredCount(Number(e.target.value))}
                        className="ml-2 px-2 py-1 border rounded"
                    >
                        {[1, 2, 3, 4].map(n => (
                            <option key={n} value={n}>{n}人</option>
                        ))}
                    </select>
                </div>
                <ul>
                    {Array.from({ length: requiredCount }, (_, i) => (
                        <li key={i} className={`flex items-center p-3 rounded-lg border-2 mb-3 ${
                            players[i]
                            ? 'bg-blue-200 border-blue-400'
                            : 'bg-blue-900 border-blue-600 opacity-70'
                        }`}>
                            <div className="flex-1 text-left text-lg font-bold text-white">
                                {players[i] ? players[i] : '未参加'}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            {!isReady ? (
                <div className="text-blue-500 font-semibold">全員揃うまでお待ちください...</div>
            ) : (
                <div className="text-green-600 font-bold">全員揃いました！ゲーム開始します！</div>
            )}

            <div className="mb-2 flex justify-center items-center gap-2">
                <div className="flex gap-2">
                    <div className="flex flex-col items-center">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-20 py-2 rounded-lg border bg-white shadow hover:bg-purple-50 transition"
                        >
                            <span className="font-bold text-gray-800">招待</span>
                        </button>
                        <div style={{ height: '20px' }}>
                            {copied && (
                                <span className="text-green-500 text-xs mt-1">リンクをコピーしました！</span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <button
                            onClick={handleStart}
                            className="flex items-center gap-2 px-20 py-2 rounded-lg border bg-white shadow hover:bg-purple-50 transition"
                        >
                            <span className="font-bold text-gray-800">開始</span>
                        </button>
                        <div style={{ height: '20px' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}