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