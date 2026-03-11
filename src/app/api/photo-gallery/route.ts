import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

async function listImagesRecursive(absDir: string, relBase: string): Promise<string[]> {
  let entries: Array<{ name: string; isDirectory: () => boolean }> = [];
  try {
    entries = (await fs.readdir(absDir, { withFileTypes: true })) as any;
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries) {
    const abs = path.join(absDir, entry.name);
    const rel = path.join(relBase, entry.name).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      const nested = await listImagesRecursive(abs, rel);
      files.push(...nested);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXT.has(ext)) continue;
    if (entry.name.toLowerCase().includes("sniffertrek-logo")) continue;
    files.push(`/${rel}`);
  }
  return files;
}

export async function GET() {
  const cwd = process.cwd();
  const roots = [
    { abs: path.join(cwd, "public", "photos"), rel: "photos" },
    { abs: path.join(cwd, "public", "images", "photos"), rel: "images/photos" },
    { abs: path.join(cwd, "public", "images"), rel: "images" },
  ];

  const all: string[] = [];
  for (const root of roots) {
    const files = await listImagesRecursive(root.abs, root.rel);
    all.push(...files);
  }

  const deduped = Array.from(new Set(all)).slice(0, 60);
  return NextResponse.json({ photos: deduped }, { headers: { "Cache-Control": "no-store" } });
}

