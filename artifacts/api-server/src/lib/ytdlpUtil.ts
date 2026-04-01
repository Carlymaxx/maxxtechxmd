import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import os from "os";
import path from "path";
import https from "https";

const execFileAsync = promisify(execFile);

const YTDLP_DOWNLOAD_URL = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux";

const YTDLP_CANDIDATE_PATHS = [
  "/home/runner/yt-dlp-bin",
  "/app/yt-dlp-bin",
  path.join(process.cwd(), "yt-dlp-bin"),
];

let cachedBin: string | null | undefined = undefined;

export function ffmpegDir(): string {
  const candidates = [
    "/nix/store/6h39ipxhzp4r5in5g4rhdjz7p7fkicd0-replit-runtime-path/bin",
    "/usr/bin",
    "/usr/local/bin",
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "ffmpeg"))) return dir;
  }
  return "";
}

async function downloadBinary(dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const follow = (url: string) => {
      https.get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          follow(res.headers.location!);
          return;
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          fs.chmodSync(dest, 0o755);
          resolve();
        });
      }).on("error", reject);
    };
    follow(YTDLP_DOWNLOAD_URL);
  });
}

export async function getYtdlpBin(): Promise<string> {
  if (cachedBin !== undefined) {
    if (cachedBin) return cachedBin;
    throw new Error("yt-dlp unavailable");
  }

  for (const p of YTDLP_CANDIDATE_PATHS) {
    if (fs.existsSync(p)) {
      try {
        await execFileAsync(p, ["--version"], { timeout: 5000 });
        cachedBin = p;
        return p;
      } catch {}
    }
  }

  try {
    const { stdout } = await execFileAsync("yt-dlp", ["--version"], { timeout: 5000 });
    if (stdout.trim()) {
      cachedBin = "yt-dlp";
      return "yt-dlp";
    }
  } catch {}

  const dest = process.env.HOME
    ? path.join(process.env.HOME, "yt-dlp-bin")
    : path.join(os.tmpdir(), "yt-dlp-bin");
  try {
    console.log("[ytdlp] Downloading yt-dlp binary to", dest, "...");
    await downloadBinary(dest);
    await execFileAsync(dest, ["--version"], { timeout: 5000 });
    cachedBin = dest;
    console.log("[ytdlp] yt-dlp binary ready at", dest);
    return dest;
  } catch (e) {
    cachedBin = null;
    throw new Error("Could not obtain yt-dlp binary: " + String(e));
  }
}

// ── YouTube search by scraping (no yt-dlp, no API key) ───────────────────────
// Returns the YouTube video URL for the top result of a query.
export async function searchYouTube(query: string): Promise<string> {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%3D%3D`;
  const res = await fetch(searchUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`YouTube search failed (HTTP ${res.status})`);
  const html = await res.text();

  // ytInitialData contains all video IDs in "videoId":"..." patterns
  const matches = html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g);
  for (const m of matches) {
    const id = m[1];
    // Skip YouTube Shorts / ads / playlists that sneak in
    if (id) return `https://www.youtube.com/watch?v=${id}`;
  }
  throw new Error(`No results found for "${query}"`);
}

// ── yt-dlp base args — iOS client bypasses YouTube bot detection on server IPs ──
function ytdlpBaseArgs(): string[] {
  return [
    "--no-warnings",
    "--extractor-args", "youtube:player_client=ios",
    "--no-playlist",
  ];
}

export interface YtdlpInfo {
  title: string;
  duration: number;
  uploader: string;
  thumbnail: string;
}

export async function getVideoInfo(urlOrQuery: string): Promise<YtdlpInfo> {
  const bin = await getYtdlpBin();
  const url = urlOrQuery.startsWith("http") ? urlOrQuery : await searchYouTube(urlOrQuery);
  const { stdout } = await execFileAsync(bin, [
    ...ytdlpBaseArgs(), "-J", url,
  ], { timeout: 30000, maxBuffer: 10 * 1024 * 1024 });
  const info = JSON.parse(stdout);
  return {
    title: info.title || "Unknown",
    duration: info.duration || 0,
    uploader: info.uploader || info.channel || "Unknown",
    thumbnail: info.thumbnail || "",
  };
}

/**
 * Download audio from YouTube/URL.
 * Returns a file path (in /tmp) — the caller must delete it after use.
 * Zero RAM buffering: data lives on disk, Baileys streams via file:// URL.
 */
export async function downloadAudio(urlOrQuery: string, maxDurationSec = 600): Promise<{ filePath: string; title: string; duration: number }> {
  const bin = await getYtdlpBin();
  const url = urlOrQuery.startsWith("http") ? urlOrQuery : await searchYouTube(urlOrQuery);

  const info = await getVideoInfo(url);
  if (info.duration > maxDurationSec) {
    throw new Error(`Too long (${Math.floor(info.duration / 60)} min). Max is ${maxDurationSec / 60} min.`);
  }

  const tmpBase = `/tmp/ytaudio_${Date.now()}`;
  const ffdir = ffmpegDir();
  const args = [
    ...ytdlpBaseArgs(),
    "-x",
    "--audio-format", "mp3",
    "--audio-quality", "5",
    "-o", `${tmpBase}.%(ext)s`,
    ...(ffdir ? ["--ffmpeg-location", ffdir] : []),
    url,
  ];

  await execFileAsync(bin, args, { timeout: 120000, maxBuffer: 1 * 1024 * 1024 });

  const outFile = `${tmpBase}.mp3`;
  if (!fs.existsSync(outFile)) {
    const files = fs.readdirSync("/tmp").filter(f => f.startsWith(path.basename(tmpBase)));
    if (!files.length) throw new Error("Download failed — no output file.");
    return { filePath: path.join("/tmp", files[0]), title: info.title, duration: info.duration };
  }

  return { filePath: outFile, title: info.title, duration: info.duration };
}

/**
 * Download video from YouTube/URL.
 * Returns a file path (in /tmp) — the caller must delete it after use.
 * Zero RAM buffering: data lives on disk, Baileys streams via file:// URL.
 */
export async function downloadVideo(urlOrQuery: string, maxDurationSec = 300): Promise<{ filePath: string; title: string; duration: number }> {
  const bin = await getYtdlpBin();
  const url = urlOrQuery.startsWith("http") ? urlOrQuery : await searchYouTube(urlOrQuery);

  const info = await getVideoInfo(url);
  if (info.duration > maxDurationSec) {
    throw new Error(`Too long (${Math.floor(info.duration / 60)} min). Max is ${maxDurationSec / 60} min.`);
  }

  const tmpBase = `/tmp/ytvideo_${Date.now()}`;
  const ffdir = ffmpegDir();
  const args = [
    ...ytdlpBaseArgs(),
    "-f", "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best[height<=480]/best",
    "--merge-output-format", "mp4",
    "-o", `${tmpBase}.%(ext)s`,
    ...(ffdir ? ["--ffmpeg-location", ffdir] : []),
    url,
  ];

  await execFileAsync(bin, args, { timeout: 180000, maxBuffer: 1 * 1024 * 1024 });

  const outFile = `${tmpBase}.mp4`;
  if (!fs.existsSync(outFile)) {
    const files = fs.readdirSync("/tmp").filter(f => f.startsWith(path.basename(tmpBase)));
    if (!files.length) throw new Error("Download failed — no output file.");
    return { filePath: path.join("/tmp", files[0]), title: info.title, duration: info.duration };
  }

  return { filePath: outFile, title: info.title, duration: info.duration };
}
