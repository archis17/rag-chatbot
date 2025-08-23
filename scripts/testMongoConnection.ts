import { getMongoCollection } from "../lib/mongodb";

async function testConnection() {
  try {
    const collection = await getMongoCollection("sportsrag", "documents");
    const doc = await collection.findOne({});
    console.log("✅ Connected and queried documents collection!");
    console.log("Sample document:", doc);
  } catch (error) {
    console.error("❌ Connection or query failed:");
    console.error(error);
  }
}

testConnection();
