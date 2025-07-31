// lib/mongodb.ts
import { MongoClient, Collection, Db, Document } from "mongodb";

const rawUri = process.env.MONGODB_ATLAS_URI;
if (!rawUri) {
  throw new Error("MONGODB_ATLAS_URI is not defined in environment variables.");
}
const uri: string = rawUri;


let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function connectToDatabase(dbName: string): Promise<Db> {
  if (cachedDb && cachedClient) {
    return cachedDb;
  }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  cachedClient = client;
  cachedDb = db;
  return db;
}

/**
 * Get a MongoDB collection with typing support
 */
export async function getMongoCollection<T extends Document = Document>(
  dbName: string,
  collectionName: string
): Promise<Collection<T>> {
  const db = await connectToDatabase(dbName);
  return db.collection<T>(collectionName);
}
