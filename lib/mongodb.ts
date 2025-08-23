
import "dotenv/config";
import { MongoClient, Collection, Db, Document } from "mongodb";

// --- Validate environment variable ---
const rawUri = process.env.MONGODB_ATLAS_URI;
if (!rawUri) {
  throw new Error("MONGODB_ATLAS_URI is not defined in environment variables.");
}
const uri: string = rawUri;

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

/**
 * Connects to MongoDB Atlas (singleton)
 */
async function connectToDatabase(dbName: string): Promise<Db> {
  if (cachedDb && cachedClient) {
    // Connection already established, reuse it
    // console.log(`[MongoDB] Reusing existing connection: ${dbName}`);
    return cachedDb;
  }

  // console.log("[MongoDB] Connecting to Atlas...");
  const client = new MongoClient(uri);
  await client.connect();
  // console.log("[MongoDB] Successfully connected to Atlas cluster.");

  const db = client.db(dbName);
  // console.log(`[MongoDB] Using database: ${dbName}`);

  cachedClient = client;
  cachedDb = db;

  return db;
}

/**
 * Get a MongoDB collection with typing support.
 * 
 * @param dbName - Your database name
 * @param collectionName - The collection you want
 */
export async function getMongoCollection<T extends Document = Document>(
  dbName: string,
  collectionName: string
): Promise<Collection<T>> {
  const db = await connectToDatabase(dbName);
  // console.log(`[MongoDB] Accessing collection: ${collectionName}`);
  return db.collection<T>(collectionName);
}
