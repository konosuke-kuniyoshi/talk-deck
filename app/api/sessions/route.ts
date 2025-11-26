import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// セッション作成
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { cardCount, selectedGenres } = body;

        // セッションを作成
        const session = await prisma.gameSession.create({
            data: {
                cardCount: cardCount || 10,
                selectedGenres: selectedGenres || [],
                usedCardIds: [],
                currentCardIndex: 0
            }
        });

        return NextResponse.json({session}, {status: 200});

    } catch (error) {
        console.error('Failed to create session:', error);
        return NextResponse.json(
            { error: 'Failed to create session' },
            { status: 500 }
        );
    }
}

// セッション更新
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { sessionId, usedCardIds, currentCardIndex } = body;

        // バリデーション
        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            );
        }

        // セッションを更新
        const session = await prisma.gameSession.update({
            where: { id: sessionId },
            data: {
                ...(usedCardIds && { usedCardIds }),
                ...(currentCardIndex !== undefined && { currentCardIndex })
            }
        });

        return NextResponse.json({session}, {status: 200});

    } catch (error) {
        console.error('Failed to update session:', error);
        return NextResponse.json(
            { error: 'Failed to update session' },
            { status: 500 }
        );
    }
}

// セッション取得
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            );
        }

        const session = await prisma.gameSession.findUnique({
            where: { id: sessionId }
        });

        if (!session) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({session}, {status: 200});
        
    } catch (error) {
        console.error('Failed to fetch session:', error);
        return NextResponse.json(
            { error: 'Failed to fetch session' },
            { status: 500 }
        );
    }
}