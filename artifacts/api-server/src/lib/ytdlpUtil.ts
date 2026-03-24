import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
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

  const dest = YTDLP_CANDIDATE_PATHS[1];
  try {
    console.log("[ytdlp] Downloading yt-dlp binary...");
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

export interface YtdlpInfo {
  title: string;
  duration: number;
  uploader: string;
  thumbnail: string;
}

export async function getVideoInfo(query: string): Promise<YtdlpInfo> {
  const bin = await getYtdlpBin();
  const url = query.startsWith("http") ? query : `ytsearch1:${query}`;
  const { stdout } = await execFileAsync(bin, [
    "--no-warnings", "-J", "--no-playlist", url,
  ], { timeout: 30000, maxBuffer: 10 * 1024 * 1024 });
  const info = JSON.parse(stdout);
  return {
    title: info.title || "Unknown",
    duration: info.duration || 0,
    uploader: info.uploader || info.channel || "Unknown",
    thumbnail: info.thumbnail || "",
  };
}

export async function downloadAudio(query: string, maxDurationSec = 600): Promise<{ buffer: Buffer; title: string; duration: number }> {
  const bin = await getYtdlpBin();
  const url = query.startsWith("http") ? query : `ytsearch1:${query}`;

  const info = await getVideoInfo(query);
  if (info.duration > maxDurationSec) {
    throw new Error(`Too long (${Math.floor(info.duration / 60)} min). Max is ${maxDurationSec / 60} min.`);
  }

  const tmpBase = `/tmp/ytaudio_${Date.now()}`;
  const ffdir = ffmpegDir();
  const args = [
    "--no-warnings", "-x",
    "--audio-format", "mp3",
    "--audio-quality", "5",
    "-o", `${tmpBase}.%(ext)s`,
    "--no-playlist",
    ...(ffdir ? ["--ffmpeg-location", ffdir] : []),
    url,
  ];

  await execFileAsync(bin, args, { timeout: 120000, maxBuffer: 100 * 1024 * 1024 });

  const outFile = `${tmpBase}.mp3`;
  if (!fs.existsSync(outFile)) {
    const files = fs.readdirSync("/tmp").filter(f => f.startsWith(path.basename(tmpBase)));
    if (!files.length) throw new Error("Download failed — no output file.");
    const actual = path.join("/tmp", files[0]);
    const buf = fs.readFileSync(actual);
    try { fs.unlinkSync(actual); } catch {}
    return { buffer: buf, title: info.title, duration: info.duration };
  }

  const buffer = fs.readFileSync(outFile);
  try { fs.unlinkSync(outFile); } catch {}
  return { buffer, title: info.title, duration: info.duration };
}

export async function downloadVideo(query: string, maxDurationSec = 300): Promise<{ buffer: Buffer; title: string; duration: number }> {
  const bin = await getYtdlpBin();
  const url = query.startsWith("http") ? query : `ytsearch1:${query}`;

  const info = await getVideoInfo(query);
  if (info.duration > maxDurationSec) {
    throw new Error(`Too long (${Math.floor(info.duration / 60)} min). Max is ${maxDurationSec / 60} min.`);
  }

  const tmpBase = `/tmp/ytvideo_${Date.now()}`;
  const ffdir = ffmpegDir();
  const args = [
    "--no-warnings",
    "-f", "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best[height<=480]/best",
    "--merge-output-format", "mp4",
    "-o", `${tmpBase}.%(ext)s`,
    "--no-playlist",
    ...(ffdir ? ["--ffmpeg-location", ffdir] : []),
    url,
  ];

  await execFileAsync(bin, args, { timeout: 180000, maxBuffer: 200 * 1024 * 1024 });

  const outFile = `${tmpBase}.mp4`;
  if (!fs.existsSync(outFile)) {
    const files = fs.readdirSync("/tmp").filter(f => f.startsWith(path.basename(tmpBase)));
    if (!files.length) throw new Error("Download failed — no output file.");
    const actual = path.join("/tmp", files[0]);
    const buf = fs.readFileSync(actual);
    try { fs.unlinkSync(actual); } catch {}
    return { buffer: buf, title: info.title, duration: info.duration };
  }

  const buffer = fs.readFileSync(outFile);
  try { fs.unlinkSync(outFile); } catch {}
  return { buffer, title: info.title, duration: info.duration };
}
