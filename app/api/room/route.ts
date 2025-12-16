import { prisma } from '../../lib/prisma';

export async function POST(request: Request) {
  const { roomId, players, requiredCount, selectedGenres = [], cardCount = 4, ownerName } = await request.json();
  // players[0]にオーナー名を必ずセット
  const fixedPlayers = Array.isArray(players) ? [...players] : [];
  console.log('API POST players:', players, 'ownerName:', ownerName);
  if (ownerName) {
    fixedPlayers[0] = ownerName;
  }
  await prisma.room.create({
    data: {
      id: roomId,
      players: fixedPlayers,
      requiredCount,
      selectedGenres,
      cardCount,
    }
  });
  return Response.json({ ok: true });
}