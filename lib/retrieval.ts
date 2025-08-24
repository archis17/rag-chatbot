import { getMongoCollection } from "./mongodb";
import { pipeline } from "@xenova/transformers";
import { cosineSimilarity } from "./utils";

// Inline Doc type here if needed
export interface Doc {
  text: string;
  metadata: Record<string, string | number | boolean | null>;
  embedding?: number[];
}

const dbName = process.env.MONGODB_DB_NAME || "sportsrag";
const collectionName = "ipl_matches";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let embedder: any;
async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-mpnet-base-v2");
  }
  return embedder;
}

export async function retrieveRelevantDocs(queryText: string, topK = 3) {
  const collection = await getMongoCollection<Doc>(dbName, collectionName);
  const docs = await collection.find({}).toArray();

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
