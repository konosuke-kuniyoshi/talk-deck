// サーバー起動時に全ルームを削除
(async () => {
    try {
        const { prisma } = require('./app/lib/prisma.js');
        await prisma.room.deleteMany({});
        console.log('All rooms deleted on server start');
    } catch (e) {
        console.error('Failed to delete rooms on server start:', e);
    }
})();
// server.js
const { createServer } = require('http');
const { Server } = require('socket.io');

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "*",
    }
});

// ルームごとにplayers配列とsocketId→indexのマップ、ターンインデックスを管理
const roomPlayers = {};
const roomSocketIndex = {};
const roomTurnIndex = {};

io.on('connection', (socket) => {
        // すべてのイベントをログ出力
        socket.onAny((event, ...args) => {
            console.log('onAny', event, args);
        });
    console.log('a user connected:', socket.id);

    // ルーム参加
    socket.on('joinRoom', async ({ roomId, name }) => {
        // ルームのrequiredCountを取得
        let requiredCount = 2;
        try {
            const { prisma } = require('./app/lib/prisma.js');
            const room = await prisma.room.findUnique({ where: { id: roomId } });
            requiredCount = room?.requiredCount || 2;
        } catch (e) {}

        // ルームが未登録ならDBから初期化
        if (!roomPlayers[roomId]) {
            try {
                const { prisma } = require('./app/lib/prisma.js');
                const room = await prisma.room.findUnique({ where: { id: roomId } });
                roomPlayers[roomId] = room && Array.isArray(room.players)
                    ? room.players.filter(n => n)
                    : [];
                roomTurnIndex[roomId] = 0;
            } catch (e) {
                roomPlayers[roomId] = [];
                roomTurnIndex[roomId] = 0;
            }
            roomSocketIndex[roomId] = {};
        }

        // 既に必要参加者数を満たしている場合は入室不可（空欄があれば入室可能）
        if (roomPlayers[roomId].length >= requiredCount && roomPlayers[roomId].findIndex(n => n === '') === -1) {
            socket.emit('roomFull');
            return;
        }

        socket.join(roomId);
        // ルーム作成時（最初の参加者＝オーナー）は空欄追加しない
        const currentSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
        if (currentSize > 1) {
            while (roomPlayers[roomId].length < currentSize) {
                roomPlayers[roomId].push('');
            }
        }
        // 最初の参加者（オーナー）は必ずselfIndex=0
        let selfIndex = roomSocketIndex[roomId][socket.id];
        if (selfIndex === undefined) {
            const currentSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
            if (currentSize === 1) {
                selfIndex = 0;
            } else {
                // 空欄インデックスを探す
                selfIndex = roomPlayers[roomId].findIndex((n, idx) => n === '' && !Object.values(roomSocketIndex[roomId]).includes(idx));
                if (selfIndex === -1) {
                    // 空欄インデックスがなければ定員オーバー
                    socket.emit('roomFull');
                    return;
                }
            }
            roomSocketIndex[roomId][socket.id] = selfIndex;
        }
        // 空欄インデックスに参加者名を割り当てる
        if (roomPlayers[roomId][selfIndex] === '' && name) {
            roomPlayers[roomId][selfIndex] = name;
        }
        // 参加者リスト・必要参加者数を全員に最新状態で通知
        // 空文字を除去した配列を送信し、順序を全クライアントで統一
        const filteredPlayers = roomPlayers[roomId].map(n => n || '').slice();
        io.to(roomId).emit('playersUpdated', { players: filteredPlayers, selfIndexes: roomSocketIndex[roomId] });
        io.to(roomId).emit('requiredCountUpdated', { requiredCount });
    });
    
    // 参加人数変更イベント
    socket.on('updateRequiredCount', ({ roomId, requiredCount }) => {
        // 既存参加者が1人以上の場合のみ空欄追加・削除
        if (roomPlayers[roomId] && roomPlayers[roomId].length > 0) {
            while (roomPlayers[roomId].length < requiredCount) {
                roomPlayers[roomId].push('');
            }
            while (roomPlayers[roomId].length > requiredCount) {
                roomPlayers[roomId].pop();
            }
        }
        io.to(roomId).emit('requiredCountUpdated', { requiredCount });
        const filteredPlayers = roomPlayers[roomId].map(n => n || '').slice();
        io.to(roomId).emit('playersUpdated', { players: filteredPlayers, selfIndexes: roomSocketIndex[roomId] });
    });

    // プレイヤー名変更イベント
    socket.on('updatePlayerName', ({ roomId, index, name }) => {
        // サーバー側players配列を更新
        if (roomPlayers[roomId] && roomSocketIndex[roomId]) {
            // このsocket.idに割り当てられたindexのみ上書き可能
            if (roomSocketIndex[roomId][socket.id] === index) {
                roomPlayers[roomId][index] = name;
            }
            // 全員に最新リストとselfIndexesを送信
            const filteredPlayers = roomPlayers[roomId].map(n => n || '').slice();
            io.to(roomId).emit('playersUpdated', { players: filteredPlayers, selfIndexes: roomSocketIndex[roomId] });
        }
    });

    // ゲーム開始イベント
    socket.on('startGame', ({ roomId }) => {
        console.log('[startGame] called', roomId);
        // Roomのstatusを'playing'に更新し、ランダム順配列を生成して送信
        (async () => {
            try {
                const { prisma } = require('./app/lib/prisma');
                const result = await prisma.room.update({
                    where: { id: roomId },
                    data: { status: 'playing' }
                });
                console.log(`[startGame] Room status updated:`, { roomId, status: result.status });
            } catch (e) {
                console.error(`[startGame] Failed to update room status:`, { roomId, error: e });
            }
            // roomPlayersのインデックスをシャッフル
            const playerCount = roomPlayers[roomId]?.length || 0;
            const shuffledIndexes = Array.from({ length: playerCount }, (_, i) => i);
            for (let i = shuffledIndexes.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledIndexes[i], shuffledIndexes[j]] = [shuffledIndexes[j], shuffledIndexes[i]];
            }
            // 全クライアントにランダム順配列を送信
            io.to(roomId).emit('gameStarted', { shuffledIndexes });
        })();
    });

    // カード配布イベント
    socket.on('dealCards', ({ roomId, playerId }) => {
        // ここでカード配布のロジックを実装
        // 例: io.to(roomId).emit('cardsDealt', { ... });
    });

    // 場のカード・ターン情報の共有
    socket.on('centerCard', (data) => {
        // サーバー側でターンインデックスを管理
        const roomId = data.roomId;
        if (!(roomId in roomTurnIndex)) roomTurnIndex[roomId] = 0;
        // カードが出されたらターンを進める（単純インクリメント）
        roomTurnIndex[roomId] = (roomTurnIndex[roomId] || 0) + 1;
        io.to(roomId).emit('centerCard', { ...data, turnIndex: roomTurnIndex[roomId] });
    });

    socket.on('playCard', ({ roomId, playerId, cardId }) => {
        // ほかの人に通知
        io.to(roomId).emit('cardPlayed', { playerId, cardId });
    });
    // プレイヤーがルームから抜けたときの処理
    socket.on('disconnect', () => {
        for (const roomId of Object.keys(roomSocketIndex)) {
            const idx = roomSocketIndex[roomId][socket.id];
            if (typeof idx === 'number' && roomPlayers[roomId]) {
                roomPlayers[roomId].splice(idx, 1);
                delete roomSocketIndex[roomId][socket.id];
                for (const sid of Object.keys(roomSocketIndex[roomId])) {
                    if (roomSocketIndex[roomId][sid] > idx) {
                        roomSocketIndex[roomId][sid]--;
                    }
                }
                const filteredPlayers = roomPlayers[roomId].map(n => n || '').slice();
                io.to(roomId).emit('playersUpdated', { players: filteredPlayers, selfIndexes: roomSocketIndex[roomId] });
                // 参加者が0人になったらDBからルーム削除
                if (roomPlayers[roomId].filter(n => n).length === 0) {
                    (async () => {
                        try {
                            const { prisma } = require('./app/lib/prisma.js');
                            await prisma.room.delete({ where: { id: roomId } });
                            console.log(`[Room Deleted] id=${roomId}`);
                        } catch (e) {
                            console.error(`[Room Delete Error] id=${roomId}`, e);
                        }
                        // メモリ上のデータも削除
                        delete roomPlayers[roomId];
                        delete roomSocketIndex[roomId];
                        delete roomTurnIndex[roomId];
                    })();
                }
            }
        }
    });
});

// サーバーを起動
httpServer.listen(4000, () => {
    console.log('Socket.IO server running at http://localhost:4000/');
})