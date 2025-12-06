// server.js
const { createServer } = require('http');
const { Server } = require('socket.io');

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "*",
    }
});

// クライアントが接続したとき
io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    // ルーム参加
    socket.on('joinRoom', (socket) => {
        socket.join(roomId);
        console.log(`${playerId}が${roomId}に参加しました！`);
        // ルームの全員に通知
        io.to(roomId).emit('playerJoined', { playerId });
    });

    // カード配布イベント
    socket.on('dealCards', ({ roomId, playerId }) => {
        // ここでカード配布のロジックを実装
        // 例: io.to(roomId).emit('cardsDealt', { ... });
    });

    socket.on('playCard', ({ roomId, playerId, cardId }) => {
        // ほかの人に通知
        io.to(roomId).emit('cardPlayed', { playerId, cardId });
    });
});

// サーバーを起動
httpServer.listen(4000, () => {
    console.log('Socket.IO server running at http://localhost:4000/');
})