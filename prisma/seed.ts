import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('データ投入を開始します...');

  // ジャンルの作成
  const genres = await Promise.all([
    prisma.genre.upsert({
      where: { name: '恋愛' },
      update: {},
      create: {
        name: '恋愛',
        description: '恋愛や好きな人についての話題',
        color: '#EC4899'
      }
    }),
    prisma.genre.upsert({
      where: { name: '仕事' },
      update: {},
      create: {
        name: '仕事',
        description: '仕事やキャリアについての話題',
        color: '#3B82F6'
      }
    }),
    prisma.genre.upsert({
      where: { name: '趣味' },
      update: {},
      create: {
        name: '趣味',
        description: '趣味や好きなことについての話題',
        color: '#10B981'
      }
    }),
    prisma.genre.upsert({
      where: { name: '過去' },
      update: {},
      create: {
        name: '過去',
        description: '思い出や過去の経験についての話題',
        color: '#F59E0B'
      }
    }),
    prisma.genre.upsert({
      where: { name: '未来' },
      update: {},
      create: {
        name: '未来',
        description: '将来の夢や目標についての話題',
        color: '#8B5CF6'
      }
    }),
    prisma.genre.upsert({
      where: { name: 'もしも' },
      update: {},
      create: {
        name: 'もしも',
        description: '仮定の質問や想像の話題',
        color: '#EF4444'
      }
    })
  ]);

  console.log(`ジャンルを ${genres.length} 件作成しました`);

  // カードの作成
  const cards = [
    // 恋愛
    { genreId: genres[0].id, question: '初恋はいつでしたか？', description: 'その時の気持ちを教えてください' },
    { genreId: genres[0].id, question: '理想のデートプランは？', description: 'どんなデートをしてみたいですか' },
    { genreId: genres[0].id, question: '告白された/した経験は？', description: '印象に残っているエピソードを教えてください' },
    { genreId: genres[0].id, question: '恋人に求める条件TOP3は？', description: '何を重視しますか' },
    { genreId: genres[0].id, question: '遠距離恋愛はアリ？ナシ？', description: 'その理由も教えてください' },

    // 仕事
    { genreId: genres[1].id, question: '今の仕事の好きなところは？', description: 'やりがいを感じる瞬間は' },
    { genreId: genres[1].id, question: '仕事で一番大変だったことは？', description: 'どう乗り越えましたか' },
    { genreId: genres[1].id, question: 'リモートワークと出社、どっち派？', description: 'それぞれのメリット・デメリットは' },
    { genreId: genres[1].id, question: '尊敬する上司や先輩はいますか？', description: 'どんなところを尊敬していますか' },
    { genreId: genres[1].id, question: '転職を考えたことはありますか？', description: 'その理由を教えてください' },

    // 趣味
    { genreId: genres[2].id, question: '最近ハマっていることは？', description: 'どんなところが面白いですか' },
    { genreId: genres[2].id, question: '休日の過ごし方を教えてください', description: '理想の休日は' },
    { genreId: genres[2].id, question: '今年挑戦したいことは？', description: '新しい趣味や目標はありますか' },
    { genreId: genres[2].id, question: '好きな映画やドラマは？', description: 'おすすめを教えてください' },
    { genreId: genres[2].id, question: 'インドア派？アウトドア派？', description: 'どんな遊びが好きですか' },

    // 過去
    { genreId: genres[3].id, question: '子供の頃の夢は？', description: '何になりたかったですか' },
    { genreId: genres[3].id, question: '学生時代の思い出を教えてください', description: '一番印象に残っていることは' },
    { genreId: genres[3].id, question: '人生で一番恥ずかしかった出来事は？', description: '今は笑い話になっていますか' },
    { genreId: genres[3].id, question: '初めてのアルバイトは？', description: 'どんな経験をしましたか' },
    { genreId: genres[3].id, question: '昔と今で変わったことは？', description: '性格や考え方の変化はありますか' },

    // 未来
    { genreId: genres[4].id, question: '5年後の自分を想像してください', description: 'どんな生活をしていたいですか' },
    { genreId: genres[4].id, question: 'いつか行きたい場所は？', description: '旅行先の夢を教えてください' },
    { genreId: genres[4].id, question: '将来住みたい場所は？', description: '都会？田舎？海外？' },
    { genreId: genres[4].id, question: '老後の夢はありますか？', description: 'どんな人生を送りたいですか' },
    { genreId: genres[4].id, question: '人生でやり遂げたいことは？', description: 'バケットリストを教えてください' },

    // もしも
    { genreId: genres[5].id, question: 'もし宝くじで1億円当たったら？', description: '何に使いますか' },
    { genreId: genres[5].id, question: 'もし1日だけ誰かと入れ替われるなら？', description: '誰になってみたいですか' },
    { genreId: genres[5].id, question: 'もし透明人間になれたら？', description: '何をしてみたいですか' },
    { genreId: genres[5].id, question: 'もし無人島に1つだけ持っていけるなら？', description: '何を選びますか' },
    { genreId: genres[5].id, question: 'もしタイムマシンがあったら？', description: '過去と未来、どちらに行きますか' }
  ];

  for (const card of cards) {
    await prisma.card.create({
      data: card
    });
  }

  console.log(`カードを ${cards.length} 件作成しました`);
  console.log('データ投入が完了しました！✨');
}

main()
  .catch((e) => {
    console.error('エラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
