import { XMLParser } from "fast-xml-parser";

const ITEMS_PER_SOURCE = 8;
export interface NewsItem {
    title: string;
    url: string;
    meta?: string;
}

function formatSection(sourceName: string, items: NewsItem[]): string {
    if (items.length === 0){
        return `## ${sourceName}\n(取得できませんでした)\n`;
    }
    const lines = items.map((item, i) => {
        const metaPart = item.meta ? ` (${item.meta})`: "";
        return `${i+1}.[${item.title}](${item.url})${metaPart}`; 
    });
    return `## ${sourceName}\n${lines.join("\n")}\n`;
}

async function fetchGitHubTrending(): Promise<NewsItem[]>{
    const res = await fetch("https://mshibanami.github.io/GitHubTrendingRSS/daily/all.xml");
    const xml = await res.text();
    const parser = new XMLParser();
    const data = parser.parse(xml);
    const rawItems = data.rss.channel.item;
    const items = Array.isArray(rawItems) ? rawItems : [rawItems];
    return items.slice(0, ITEMS_PER_SOURCE).map((item: any) => ({
        title: item.title,
        url: item.link,
    }));
}

async function fetchHackerNews(): Promise<NewsItem[]>{
    const res = await fetch(
        `https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=${ITEMS_PER_SOURCE}`
    );
    const data = (await  res.json()) as {hits: any[]};
    return data.hits.map((hit) => ({
        title: hit.title,
        url: hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
        meta: `${hit.points}pt`,
    }));
}

async function fetchZenn(): Promise<NewsItem[]>{
    const res = await fetch(
        `https://zenn.dev/api/articles?order=daily`
    );
    const data = (await res.json()) as { articles: any[] };
    return data.articles.slice(0, ITEMS_PER_SOURCE).map((article) => ({
        title: article.title,
        url:  `https://zenn.dev${article.path}`,
        meta: `${article.liked_count}likes`,
    }));
}

async function fetchQiita(): Promise<NewsItem[]> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const query = encodeURIComponent(`stocks:>3 created:>=${since}`);
    const res = await fetch(
        `https://qiita.com/api/v2/items?page=1&per_page=${ITEMS_PER_SOURCE}&query=${query}`
    );
    const data = (await res.json()) as any[];
    return data
        .sort((a, b) => b.likes_count - a.likes_count)
        .map((item) => ({
            title: item.title,
            url: item.url,
            meta: `${item.likes_count}likes`,
        }));
}

export async function getMorningTechNews(): Promise<string> {
    const [github, hn, zenn, qiita] = await Promise.allSettled([
        fetchGitHubTrending(),
        fetchHackerNews(),
        fetchZenn(),
        fetchQiita(),
    ]);

    const sections = [
        formatSection("GitHub Trending", github.status === "fulfilled" ? github.value: []),
        formatSection("Hacker News", hn.status === "fulfilled" ? hn.value : []),
        formatSection("Zenn", zenn.status === "fulfilled" ? zenn.value : []),
        formatSection("Qiita", qiita.status === "fulfilled" ? qiita.value : []),
    ];

    return sections.join("\n");
}