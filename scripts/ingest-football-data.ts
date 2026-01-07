
import fs from "fs";
import path from "path";
import { getMongoCollection } from "../lib/mongodb";
import { pipeline } from "@xenova/transformers";

// Types based on the JSON structure we observed
interface Score {
    ht: number[];
    ft: number[];
}

interface Match {
    round: string;
    date: string;
    time: string;
    team1: string;
    team2: string;
    score: Score;
}

interface SeasonData {
    name: string;
    matches: Match[];
}

const DB_NAME = process.env.MONGODB_DB_NAME || "sportsrag";
const COLLECTION_NAME = "football_matches";
const DATA_DIR = path.join(process.cwd(), "data", "football-json");

// Filter for recent seasons to keep it manageable initially
const TARGET_SEASONS = ["2023-24", "2024-25"];

async function main() {
    console.log("Starting ingestion...");

    // Initialize embedder
    console.log("Loading embedding model...");
    const embedder = await pipeline("feature-extraction", "Xenova/all-mpnet-base-v2");

    const collection = await getMongoCollection(DB_NAME, COLLECTION_NAME);

    // Create vector index if it doesn't exist (Atlas Search needs manual setup usually, but we can standard index the metadata)
    // For vector search, we usually need an Atlas Vector Search Index defined in the UI. 
    // For now, we just insert data.

    // Recursively find files
    const files: string[] = [];

    function scanDir(dir: string) {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            if (item.isDirectory()) {
                // Only scan target seasons or generic folders
                if (TARGET_SEASONS.some(s => fullPath.includes(s))) {
                    scanDir(fullPath);
                }
            } else if (item.isFile() && item.name.endsWith(".json")) {
                files.push(fullPath);
            }
        }
    }

    scanDir(DATA_DIR);
    console.log(`Found ${files.length} JSON files to process.`);

    let totalMatches = 0;

    for (const file of files) {
        console.log(`Processing ${file}...`);
        try {
            const content = fs.readFileSync(file, "utf-8");
            const data: SeasonData = JSON.parse(content);

            if (!data.matches) continue;

            const docs = [];

            for (const match of data.matches) {
                // Skip matches without scores (future matches)
                if (!match.score?.ft) continue;

                const date = match.date;
                const team1 = match.team1;
                const team2 = match.team2;
                const score1 = match.score.ft[0];
                const score2 = match.score.ft[1];
                const round = match.round;
                const seasonName = data.name;

                const text = `${seasonName} - ${round}: ${team1} vs ${team2} on ${date}. Final Score: ${score1}-${score2}.`;

                // Generate embedding
                const output = await embedder(text, { pooling: "mean", normalize: true });
                const embedding = Array.from(output.data);

                docs.push({
                    text,
                    metadata: {
                        season: seasonName,
                        date,
                        team1,
                        team2,
                        score: `${score1}-${score2}`,
                        round
                    },
                    embedding
                });
            }

            if (docs.length > 0) {
                await collection.insertMany(docs);
                totalMatches += docs.length;
                console.log(`Inserted ${docs.length} matches from ${path.basename(file)}`);
            }

        } catch (err) {
            console.error(`Error processing ${file}:`, err);
        }
    }

    console.log(`Ingestion complete. Total matches inserted: ${totalMatches}`);
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
