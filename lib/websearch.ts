export type WebSearchResult = {
  title: string;
  url: string;
  content: string;
};

export async function webSearchTavily(query: string, maxResults: number = 3): Promise<WebSearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      max_results: Math.max(1, Math.min(maxResults, 5)),
      include_answer: false,
      include_domains: [],
      search_depth: "basic",
    }),
    // Avoid hanging the route on slow networks
    // @ts-ignore: RequestInit extension for Next runtime
    next: { revalidate: 0 },
  });

  if (!response.ok) return [];
  const data = await response.json().catch(() => null);
  if (!data || !Array.isArray(data.results)) return [];

  return data.results
    .slice(0, maxResults)
    .map((r: any) => ({
      title: String(r.title ?? ""),
      url: String(r.url ?? ""),
      content: String(r.content ?? r.snippet ?? ""),
    }));
}

export function formatWebResults(results: WebSearchResult[]): string {
  if (!results.length) return "";
  const lines: string[] = ["Web results:"];
  for (const r of results) {
    const snippet = r.content.replace(/\s+/g, " ").trim().slice(0, 400);
    lines.push(`- ${r.title} (${r.url})\n  ${snippet}`);
  }
  return lines.join("\n");
}


