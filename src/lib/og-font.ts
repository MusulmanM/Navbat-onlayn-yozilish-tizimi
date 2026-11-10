// Loads an Inter subset (only the characters used) for OG images; falls back to no font.
export async function loadInter(text: string, weight: 400 | 700): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(url, { signal: AbortSignal.timeout(4000) })).text();
    const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!match) return null;
    const font = await fetch(match[1], { signal: AbortSignal.timeout(4000) });
    return font.ok ? await font.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export async function interFonts(text: string) {
  const [regular, bold] = await Promise.all([loadInter(text, 400), loadInter(text, 700)]);
  return [
    ...(regular
      ? [{ name: "Inter", data: regular, weight: 400 as const, style: "normal" as const }]
      : []),
    ...(bold
      ? [{ name: "Inter", data: bold, weight: 700 as const, style: "normal" as const }]
      : []),
  ];
}
