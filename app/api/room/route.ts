import { prisma } from '../../lib/prisma';

export async function POST(request: Request) {
  const { roomId, players, requiredCount, selectedGenres = [], cardCount = 4 } = await request.json();
  await prisma.room.create({
    data: {
      id: roomId,
      players,
      requiredCount,
      selectedGenres,
      cardCount,
    }
  });
  return Response.json({ ok: true });
}