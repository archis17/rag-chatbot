import { getMongoCollection } from "./mongodb";
// Lazy import to avoid edge bundling issues on Vercel
let _pipeline: typeof import("@xenova/transformers").pipeline | null = null;
async function getPipeline() {
  if (!_pipeline) {
    const mod = await import("@xenova/transformers");
    _pipeline = mod.pipeline;
  }
  return _pipeline!;
}
import { cosineSimilarity } from "./utils";

// Inline Doc type here if needed
export interface Doc {
  text: string;
  metadata: Record<string, string | number | boolean | null>;
  embedding?: number[];
}

const dbName = process.env.MONGODB_DB_NAME || "sportsrag";
const collectionName = "football_matches";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let embedder: any;
async function getEmbedder() {
  if (!embedder) {
    const pipeline = await getPipeline();
    embedder = await pipeline("feature-extraction", "Xenova/all-mpnet-base-v2");
  }
  return embedder;
}

export async function retrieveRelevantDocs(queryText: string, topK = 3) {
  const collection = await getMongoCollection<Doc>(dbName, collectionName);
  // Ideally use Atlas Vector Search here ($vectorSearch), but falling back to in-memory cosine sim for small datasets
  // For production, this MUST be $vectorSearch aggregation
  const docs = await collection.find({}).limit(5000).toArray(); // Limit to prevent OOM on large datasets

  const embedder = await getEmbedder();
  const queryEmbeddingResult = await embedder(queryText, { pooling: "mean", normalize: true });
  const queryEmbedding = Array.from(queryEmbeddingResult.data as Float32Array);

  const docsWithSimilarity = docs.map((doc) => {
    const similarity = cosineSimilarity(queryEmbedding, doc.embedding || []);
    return { doc, similarity };
  });

  docsWithSimilarity.sort((a, b) => b.similarity - a.similarity);
  return docsWithSimilarity.slice(0, topK).map(({ doc }) => doc);
}
