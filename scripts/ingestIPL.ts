import fs from "fs";
import { parse } from "csv-parse/sync";
import { getMongoCollection } from "../lib/mongodb";
import { pipeline, FeatureExtractionPipeline } from "@xenova/transformers";

// ===== Types =====

interface IPLMatchRow {
  id: string;
  season: string;
  city: string;
  date: string;
  team1: string;
  team2: string;
  venue: string;
  winner: string;
  [key: string]: string; // allow extra fields
}

interface IPLDeliveryRow {
  match_id: string;
  inning: string;
  over: string;
  ball: string;
  batsman: string;
  bowler: string;
  batsman_runs: string;
  total_runs: string;
  player_dismissed?: string;
  [key: string]: string | undefined;
}

interface Doc {
  text: string;
  metadata: Record<string, string | number | boolean | null>;
  embedding: number[];
}

// ===== Utility to Clean Metadata =====

function cleanMetadata<T extends object>(row: T): Record<string, string | number | boolean | null> {
  const meta: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(row)) {
    meta[key] = value === undefined ? null : value;
  }
  return meta;
}

// ===== CSV Loader =====

function loadCSV<T>(csvPath: string): T[] {
  const raw = fs.readFileSync(csvPath, "utf8");
  return parse(raw, { columns: true, skip_empty_lines: true }) as T[];
}

// ===== Main Ingestion =====

async function main() {
  const embedder: FeatureExtractionPipeline = await pipeline("feature-extraction", "Xenova/all-mpnet-base-v2");

  // --- Matches ---
  const matchCollection = await getMongoCollection<Doc>("sportsrag", "ipl_matches");
  const matches = loadCSV<IPLMatchRow>("./data/matches.csv");
  for (const match of matches) {
    const text = `IPL ${match.season}: ${match.team1} vs ${match.team2} at ${match.venue}, ${match.city}, on ${match.date}. Winner: ${match.winner}.`;
    const metadata = cleanMetadata(match);
    const embResult = await embedder(text, { pooling: "mean", normalize: true });
    const embedding = Array.from(embResult.data as Float32Array);

    const doc: Doc = { text, metadata, embedding };
    await matchCollection.insertOne(doc);
  }
  console.log(`✅ Inserted ${matches.length} matches`);

  // --- Deliveries ---
  const delivCollection = await getMongoCollection<Doc>("sportsrag", "ipl_deliveries");
  const deliveries = loadCSV<IPLDeliveryRow>("./data/deliveries.csv");
  for (const delivery of deliveries) {
    const text = `Match ${delivery.match_id}, Inning ${delivery.inning}, Over ${delivery.over}, Ball ${delivery.ball}: ${delivery.bowler} to ${delivery.batsman}, runs: ${delivery.total_runs}, batsman runs: ${delivery.batsman_runs}, wicket: ${delivery.player_dismissed ?? "None"}.`;
    const metadata = cleanMetadata(delivery);
    const embResult = await embedder(text, { pooling: "mean", normalize: true });
    const embedding = Array.from(embResult.data as Float32Array);

    const doc: Doc = { text, metadata, embedding };
    await delivCollection.insertOne(doc);
  }
  console.log(`✅ Inserted ${deliveries.length} deliveries`);
}

main().catch(console.error);
