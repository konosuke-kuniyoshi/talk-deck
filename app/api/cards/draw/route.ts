
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
// サーバー側でroomDealtCardIdsを参照するためにグローバル変数を利用
// （本番運用ではメモリ永続性や多プロセス対応が必要だが、ここでは簡易実装）
// @ts-ignore
if (!global.roomDealtCardIds) global.roomDealtCardIds = {};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { genreIds, cardCount, roomId } = body;
        // サーバー側で配布済みカードIDを取得
        // @ts-ignore
        const roomDealtCardIds = global.roomDealtCardIds || {};
        const excludeCardIds = Array.from(roomDealtCardIds[roomId] || []).filter((id): id is string => typeof id === 'string');

        // バリデーション
        if (!genreIds || genreIds.length === 0) {
            return NextResponse.json(
                { error: 'Genre IDs are required' },
                { status: 400 }
            );
        }

        if (!cardCount || cardCount <= 0) {
            return NextResponse.json(
                { error: 'Card count must be greater thon 0' },
                { status: 400 }
            )
        }

        // ランダムが選択されているか確認
        const isRandom = genreIds.includes('random');

        // 条件に合うカードを全部取得
        const whereClause = isRandom
            ? {
                id: { notIn: excludeCardIds } }
            : {
                genreId: { in: genreIds },
                id: { notIn: excludeCardIds }
            };

        const availableCards = await prisma.card.findMany({
            where: whereClause,
            include: {
                genre: {  // ジャンル情報も一緒に取得
                    select: {
                        id: true,
                        name: true,
                        color: true
                    }
                }
            }
        });

        // カードが足りない場合
        if (availableCards.length === 0) {
            return NextResponse.json(
                { error: 'No cards available' },
                { status: 404 }
            );
        }

        if (availableCards.length < cardCount) {
            return NextResponse.json(
                { error: `Only ${availableCards.length} cards available, but ${cardCount} requested` },
                { status: 400 }
            );
        }

        // ランダムにシャッフルして指定枚数だけ取得
        const shuffled = availableCards.sort(() => Math.random() - 0.5);
        const selectedCards = shuffled.slice(0, cardCount);

        return NextResponse.json(selectedCards, { status: 200 });

    } catch (error) {
        console.error('Failed to draw cards:', error);
        return NextResponse.json(
        { error: 'Failed to draw cards' },
        { status: 500 }
        );
    }
}