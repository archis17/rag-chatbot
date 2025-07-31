import * as path from "path";
import { config } from "dotenv";

// This loads .env.local from your project root
config({ path: path.resolve(process.cwd(), ".env.local") });



// Now import your actual test/retrieval logic!
import { retrieveRelevantDocs } from "../lib/retrieval";

async function test() {
  const results = await retrieveRelevantDocs("Who won the Copa America?");
  console.log("Retrieved documents:");
  for (const doc of results) {
    console.log(`- ${doc.text} (Category: ${doc.metadata.category})`);
  }
  process.exit(0);
}

test();
