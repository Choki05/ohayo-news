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

async function fetchReddit(): Promise<NewsItem[]>{
    const res = await fetch(
        `https://www.reddit.com/r/programming/top.json?limit=${ITEMS_PER_SOURCE}&t=day`,
        { headers: {"User-Agent": "ohayo-news-mcp/1.0"} }
    );
    const data = (await res.json()) as {data: {children: any[] }  };
    return data.data.children.map((child) => ({
        title: child.data.title,
        url: `https://www.reddit.com${child.data.permalink}`,
        meta: `${child.data.ups}pt`,
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
    const res = await fetch(
        `https://qiita.com/api/v2/items?page=1&per_page=20`
    );
    const data = (await res.json()) as any[];
    return data
        .sort((a,b) => b.likes_count - a.likes_count)
        .slice(0, ITEMS_PER_SOURCE)
        .map((item) => ({
            title: item.title,
            url: item.url,
            meta: `${item.likes_count}likes`,
        }));
}