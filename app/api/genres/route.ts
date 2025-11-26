import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
    try {
        // データベースからジャンル一覧を取得
        const genres = await prisma.genre.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                color: true,
                _count: {
                    select: { cards: true } //カード数も取得
                }
            },
            orderBy: { name: 'asc' } //名前順にソート
        });

        return NextResponse.json(genres, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch genres:', error);
        return NextResponse.json(
            { error: 'Failed to fetch genres' },
            { status: 500 }
        );
    }
}