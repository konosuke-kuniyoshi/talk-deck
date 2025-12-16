'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '../lib/socket';

interface WaitingRoomProps {
    roomId: string;
    players: string[];
    requiredCount: number;
    onStart?: () => void;
    // 自分のインデックスをpropsで受け取る想定（なければ0固定）
    selfIndex?: number;
}


// roomFullErrorはローカルstateのみで管理し、他プレイヤーと共有しない
export default function WaitingRoom({ roomId, players = [], requiredCount: initialCount, onStart, selfIndex = 0 }: WaitingRoomProps) {

    const [requiredCount, setRequiredCount] = useState(initialCount);
    // roomFullErrorはローカルstateのみ。他プレイヤーとpropsやグローバルで共有しない
    const [roomFullError, setRoomFullError] = useState(false);
    // ルーム作成者のみselectで変更可能
    const isOwner = selfIndex === 0;
    const isReady = players.length >= requiredCount;
    const [roomUrl, setRoomUrl] = useState('');
    const [copied, setCopied] = useState(false);
    // プレイヤー名編集用state（players配列のみで管理）
    const [selfName, setSelfName] = useState(players[selfIndex] || '');
    const socketRef = useState(() => getSocket())[0];

    // roomFullイベント受信時にエラー表示
    useEffect(() => {
        const handleRoomFull = () => {
            setRoomFullError(true);
        };
        socketRef.on('roomFull', handleRoomFull);
        return () => {
            socketRef.off('roomFull', handleRoomFull);
        };
    }, [socketRef]);

    // ルーム作成者（オーナー）のみ名前付きでjoinRoom
    useEffect(() => {
        if (selfIndex === 0) {
            socketRef.emit('joinRoom', { roomId, name: selfName });
        }
    }, [roomId, selfName, selfIndex]);

    // 参加者（オーナー以外）は通常joinRoom
    useEffect(() => {
        if (selfIndex !== 0) {
            socketRef.emit('joinRoom', { roomId });
        }
    }, [roomId, selfIndex]);

    // playersが更新されたらselfNameも同期
    useEffect(() => {
        console.log('WaitingRoom players/selfIndex/selfName:', players, selfIndex, selfName);
        if (players[selfIndex]) {
            setSelfName(players[selfIndex]);
        }
    }, [players, selfIndex]);

    // サーバーからのplayers配列更新イベントを受信
    useEffect(() => {
        // players配列はRoomPageからpropsで渡されるので、ここでsetSelfNameのみ同期
        setSelfName(players[selfIndex] || '');
    }, [players, selfIndex]);

    // 名前変更時サーバーにemit（players配列のみで管理）
    const handleSelfNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setSelfName(newName);
        socketRef.emit('updatePlayerName', { roomId, index: selfIndex, name: newName });
    };

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

    // 参加人数変更時にサーバーへ通知（オーナーのみ）
    const handleRequiredCountChange = (newCount: number) => {
        if (!isOwner) return;
        setRequiredCount(newCount);
        socketRef.emit('updateRequiredCount', { roomId, requiredCount: newCount });
    };

    // サーバーからrequiredCountUpdatedイベントを受信し、全員の画面で反映
    useEffect(() => {
        const handler = ({ requiredCount }: { requiredCount: number }) => {
            setRequiredCount(requiredCount);
        };
        socketRef.on('requiredCountUpdated', handler);
        return () => {
            socketRef.off('requiredCountUpdated', handler);
        };
    }, [socketRef]);

    const handleStart = () => {
        if (!isOwner) return;
        // Socket.IOで全員にゲーム開始を通知
        console.log('emit startGame', roomId);
        socketRef.emit('startGame', { roomId });
        if (typeof onStart === 'function') {
            onStart();
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 text-center min-h-screen">
            {roomFullError ? (
                <div className="text-red-600 text-xl font-bold mb-8">定員オーバーのため入室できません</div>
            ) : (
                <>
                    <h2 className="text-2xl font-bold mb-4">待機中...</h2>
                    <div className="border-2 border-blue-400 rounded-xl p-4 mb-6 bg-white min-h-[370px] w-[360px] mx-auto">
                        <div className="mb-4 flex items-center justify-between">
                            <span>参加者リスト： {players.filter(n => n).length} / {requiredCount}人</span>
                            {isOwner ? (
                                <select
                                    value={requiredCount}
                                    onChange={e => handleRequiredCountChange(Number(e.target.value))}
                                    className="ml-2 px-2 py-1 border rounded"
                                >
                                    {[1, 2, 3, 4].map(n => (
                                        <option key={n} value={n}>{n}人</option>
                                    ))}
                                </select>
                            ) : null}
                        </div>
                        <ul>
                            {/* 表示順をselfIndexが先頭になるように並び替え（requiredCount分の枠を必ず表示） */}
                            {(() => {
                                const arr = Array.from({ length: requiredCount }, (_, i) => i);
                                const order = [selfIndex, ...arr.filter(i => i !== selfIndex)];
                                return order.map(i => (
                                    <li key={i} className={`flex items-center p-3 rounded-lg border-2 mb-3 ${
                                        players[i] ? 'bg-blue-200 border-blue-400' : 'bg-blue-900 border-blue-600 opacity-70'
                                    }`}>
                                        <div className="flex-1 text-left text-lg font-bold text-white">
                                            {i === selfIndex ? (
                                                <input
                                                    type="text"
                                                    value={selfName}
                                                    onChange={handleSelfNameChange}
                                                    className="w-full px-2 py-1 rounded text-gray-900 font-bold"
                                                    maxLength={16}
                                                    placeholder="プレイヤー名"
                                                />
                                            ) : (
                                                players[i] ? players[i] : '未参加'
                                            )}
                                        </div>
                                    </li>
                                ));
                            })()}
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
                            {isOwner && (
                                <div className="flex flex-col items-center">
                                    <button
                                        onClick={handleStart}
                                        className={`flex items-center gap-2 px-20 py-2 rounded-lg border bg-white shadow transition bg-white hover:bg-purple-50`}
                                    >
                                        <span className="font-bold text-gray-800">開始</span>
                                    </button>
                                    <div style={{ height: '20px' }}></div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}