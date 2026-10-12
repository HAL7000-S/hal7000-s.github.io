export type Category = 'ロボット工学' | 'ウマ後肢・腱駆動研究' | '電子工作' | 'AI・言語モデル' | 'その他の技術制作';
export type Entry = { id: string; title: string; summary: string; category: string; updatedAt: string; publishedAt?: string; url?: string; thumbnail?: string };
export type Game = Entry & { status?: '公開可能' | '制作中' };
export type Work = Entry & { status: '完成' | '進行中' | '保留'; period?: string; technologies: string[]; role?: string };
export const profile = { name: 'hal7000-s', intro: 'ロボット、電子工作、AI、そして少し不思議なWebの世界。気になる仕組みを、作りながら考えるための場所です。', github: 'https://github.com/hal7000-s', archive: 'https://hal7000-s.github.io/website01/', skills: ['詳細は準備中です。制作例とあわせて、できることを追加していきます。'] };
export const avatar = { glbUrl: null as string | null };
export const categories: Category[] = ['ロボット工学', 'ウマ後肢・腱駆動研究', '電子工作', 'AI・言語モデル', 'その他の技術制作'];
// 以下はユーザー指定の題材に基づく掲載枠です。実績・進捗を表す確定情報ではありません。
export const works: Work[] = categories.map((category, i) => ({ id: `work-${i}`, title: category, summary: ['動きと仕組みを探る研究・制作の掲載枠。', 'ウマの後肢と腱駆動に関する研究の掲載枠。', '回路とコードから形にする制作の掲載枠。', 'AIや言語モデルに関する制作・検討の掲載枠。', '分類に収まらない実験や試作の掲載枠。'][i], category, updatedAt: '2026-10-12', status: '保留', technologies: [] }));
export const games: Game[] = [
 ...['Cube Walker', '4Dゲーム', '夢世界', 'その他のインタラクティブWeb作品'].map((title, i) => ({ id: `game-${i}`, title, summary: ['キューブと歩く、インタラクティブ作品の掲載枠。', '4次元を題材にしたゲームの掲載枠。', '夢のような世界を探索する作品の掲載枠。', 'ブラウザーで触れられる実験の掲載枠。'][i], category: 'Web作品', updatedAt: '2026-10-12' })),
 { id: 'bayesian-mcmc', title: 'Bayesian MCMC Demo', category: '数学・確率統計・インタラクティブデモ', summary: 'コイン投げの観測結果から、Metropolis法を使って表の出る確率を推定するWebアプリ。MCMCのヒストグラムと理論的なBeta事後分布を比較できる。', status: '公開可能', url: '/demos/bayesian-mcmc/index.html', updatedAt: '2026-10-12' }
];
export const articles: Entry[] = [
 { id: 'article-robot', title: 'ロボットと機構の製作ノート', summary: '研究・製作日記を追加するためのサンプルです。記事本文はまだありません。', category: 'ロボット・機構', updatedAt: '2026-10-12' },
 { id: 'article-code', title: 'AIとコードの実験メモ', summary: 'Zenn・Qiita・Notion・GitHubなどの記事を、URLとともに登録できます。', category: 'AI・プログラミング', updatedAt: '2026-10-12' },
 { id: 'article-build', title: '作っている途中の記録', summary: 'うまくいったことも、止まったところも。製作日記の掲載枠です。', category: '製作日記', updatedAt: '2026-10-12' }
];
export const records: Entry[] = [
 { id: 'record-made', title: '作ったもの・達成したこと', summary: '完成した作品だけでなく、小さな試作や一区切りも記録する場所。公開する記録は準備中です。', category: '作った', updatedAt: '2026-10-12' },
 { id: 'record-learned', title: '学んだこと', summary: '仕組みがわかった瞬間や、考え方の変化を残す場所。公開する記録は準備中です。', category: '学んだ', updatedAt: '2026-10-12' },
 { id: 'record-released', title: '手放したもの', summary: 'やめたこと、削ったもの、手放せた考えを残す場所。公開する記録は準備中です。', category: '手放した', updatedAt: '2026-10-12' }
];
export function recentUpdates() {
 return [{ entries: works, path: '/works/', label: 'Works' }, { entries: games, path: '/games/', label: 'Games' }, { entries: articles, path: '/articles/', label: 'Articles' }, { entries: records, path: '/records/', label: 'Records' }].flatMap(group => group.entries.map(entry => ({ ...entry, path: `${group.path}#${entry.id}`, label: group.label }))).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id)).slice(0,5);
}
