import { prisma } from '../../../lib/prisma';

export async function GET(request: Request, context: { params: Promise<{ roomId: string }> }) {
  const params = await context.params;
  const roomId = params.roomId;
  console.log('API GET roomId:', roomId);
  if (!roomId) {
    return new Response(JSON.stringify({ error: 'Missing roomId' }), { status: 400 });
  }
  try {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    // roomにはselectedGenres, cardCountも含まれる
    if (room) {
      return Response.json(room);
    } else {
      return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
    }
  } catch (err) {
    console.error('API Error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}