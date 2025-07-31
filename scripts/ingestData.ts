import { config } from "dotenv";
config();

import { getMongoCollection } from "../lib/mongodb";
import { pipeline, FeatureExtractionPipeline } from "@xenova/transformers";
import { fileURLToPath } from 'url'; // <-- ADD THIS IMPORT

// Define your document interface for type safety
interface Doc {
  text: string;
  metadata: Record<string, string | number | boolean | null>;
  embedding?: number[];
}

// Sample sports documents
const sampleDocs: Doc[] = [
  {
    text: "The 2024 Summer Olympics will feature new sports including breakdancing.",
    metadata: { source: "Olympics news", category: "events" },
  },
  {
    text: "Lionel Messi scored a historic goal to win the Copa America.",
    metadata: { source: "Football news", category: "highlights" },
  },
  {
    text: "Serena Williams announced her retirement from professional tennis.",
    metadata: { source: "Tennis news", category: "retirement" },
  },
];

async function initEmbedder(): Promise<FeatureExtractionPipeline> {
  const embedder = await pipeline("feature-extraction", "Xenova/all-mpnet-base-v2");
  return embedder;
}

async function embedText(embedder: FeatureExtractionPipeline, text: string): Promise<number[]> {
  const result = await embedder(text, { pooling: "mean", normalize: true });
  const vector = Array.from(result.data as Float32Array);
  return vector;
}

async function ingestData() {
  try {
    console.log("Starting data ingestion...");

    const embedder = await initEmbedder();
    const collection = await getMongoCollection<Doc>(process.env.MONGODB_DB_NAME || "sportsrag", "documents");

    for (const doc of sampleDocs) {
      const embedding = await embedText(embedder, doc.text);
      await collection.insertOne({
        text: doc.text,
        metadata: doc.metadata,
        embedding,
      });
      console.log(`Ingested doc: "${doc.text.substring(0, 30)}..."`);
    }
    console.log("Data ingestion completed successfully!");
  } catch (error) {
    console.error("Error ingesting data:", error);
  }
}

// If run directly, execute the ingestion
// This is the modern ESM equivalent of `if (require.main === module)`
const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] === scriptPath) { // <-- REPLACE THE OLD IF-CHECK
  ingestData()
    .then(() => {
        console.log("Script finished, closing connection.");
        // Optional: you might have a function to close the DB connection here
        process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { ingestData };