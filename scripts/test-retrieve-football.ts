
import { retrieveRelevantDocs } from "../lib/retrieval";

async function main() {
    const query = "Who won the match between Man City and Arsenal in 2024?";
    console.log(`Querying: "${query}"`);

    try {
        const docs = await retrieveRelevantDocs(query, 3);
        console.log("Top results:");
        docs.forEach((doc, i) => {
            console.log(`\n${i + 1}. ${doc.text}`);
            console.log(`   (Metadata: ${JSON.stringify(doc.metadata)})`);
        });
    } catch (error) {
        console.error("Retrieval failed:", error);
    }
}

main().catch(console.error);
