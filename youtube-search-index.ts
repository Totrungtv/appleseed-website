// Supabase Edge Function: youtube-search
// Secret bắt buộc: YOUTUBE_API_KEY
// Không đưa API key vào frontend.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: cors });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!apiKey) return json({ error: "Missing YOUTUBE_API_KEY" }, 500);

    const body = await req.json().catch(() => ({}));
    const q = String(body.q || "").trim().slice(0, 120);
    const maxResults = Math.min(Math.max(Number(body.maxResults) || 12, 1), 25);
    const regionCode = String(body.regionCode || "VN").slice(0, 2);
    const relevanceLanguage = String(body.relevanceLanguage || "vi").slice(0, 10);

    if (!q) return json({ error: "Missing q" }, 400);

    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("q", q);
    searchUrl.searchParams.set("maxResults", String(maxResults));
    searchUrl.searchParams.set("regionCode", regionCode);
    searchUrl.searchParams.set("relevanceLanguage", relevanceLanguage);
    searchUrl.searchParams.set("safeSearch", "moderate");
    searchUrl.searchParams.set("key", apiKey);

    const sr = await fetch(searchUrl);
    const searchData = await sr.json();
    if (!sr.ok) {
      return json({ error: searchData?.error?.message || "YouTube search failed" }, sr.status);
    }

    const ids = (searchData.items || [])
      .map((x: any) => x?.id?.videoId)
      .filter(Boolean);

    if (!ids.length) return json({ items: [] });

    // Verify embed availability and Made-for-Kids status before exposing results
    // to the embedded player.
    const videoUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    videoUrl.searchParams.set("part", "snippet,status");
    videoUrl.searchParams.set("id", ids.join(","));
    videoUrl.searchParams.set("key", apiKey);

    const vr = await fetch(videoUrl);
    const videoData = await vr.json();
    if (!vr.ok) {
      return json({ error: videoData?.error?.message || "YouTube video lookup failed" }, vr.status);
    }

    const allowed = new Set(
      (videoData.items || [])
        .filter((x: any) => x?.status?.embeddable !== false)
        .filter((x: any) => x?.status?.madeForKids !== true)
        .map((x: any) => x.id)
    );

    const items = (searchData.items || [])
      .filter((x: any) => allowed.has(x?.id?.videoId))
      .map((x: any) => ({
        videoId: x.id.videoId,
        title: x.snippet?.title || "",
        description: x.snippet?.description || "",
        channelTitle: x.snippet?.channelTitle || "",
        publishedAt: x.snippet?.publishedAt || "",
        thumbnail:
          x.snippet?.thumbnails?.high?.url ||
          x.snippet?.thumbnails?.medium?.url ||
          x.snippet?.thumbnails?.default?.url ||
          `https://i.ytimg.com/vi/${x.id.videoId}/hqdefault.jpg`,
      }));

    return json({ items });
  } catch (err) {
    console.error(err);
    return json({ error: "Internal YouTube search error" }, 500);
  }
});
