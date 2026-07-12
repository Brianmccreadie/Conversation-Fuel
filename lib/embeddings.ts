// Voyage AI embeddings — 1024 dimensions, matching vector(1024) in the schema.
// Returns null when VOYAGE_API_KEY is unset so ingestion can proceed without
// matching (embeddings backfill once the key is added).

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
const MODEL = "voyage-3.5";
const BATCH_SIZE = 128;

export async function embed(
  texts: string[],
  inputType: "document" | "query" = "document"
): Promise<number[][] | null> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key || texts.length === 0) return key ? [] : null;

  const all: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const res = await fetch(VOYAGE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        input: batch.map((t) => t.slice(0, 16000)),
        input_type: inputType,
      }),
    });
    if (!res.ok) {
      throw new Error(`Voyage embeddings failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as {
      data: { index: number; embedding: number[] }[];
    };
    const sorted = [...json.data].sort((a, b) => a.index - b.index);
    all.push(...sorted.map((d) => d.embedding));
  }
  return all;
}
