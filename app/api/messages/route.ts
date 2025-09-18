import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getMongoCollection } from "@/lib/mongodb";

type ChatMessage = { role: "user" | "assistant"; content: string; timestamp: number };
type ChatDoc = { userId: string; createdAt: Date; messages: ChatMessage[] };

const dbName = process.env.MONGODB_DB_NAME || "sportsrag";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const collection = await getMongoCollection<ChatDoc>(dbName, "chats");
  const doc = await collection.findOne({ userId });
  return NextResponse.json({ messages: doc?.messages ?? [] });
}

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const collection = await getMongoCollection<ChatDoc>(dbName, "chats");
  await collection.updateOne({ userId }, { $set: { messages: [] } }, { upsert: true });
  return NextResponse.json({ ok: true });
}


