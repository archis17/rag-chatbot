// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getMongoCollection } from "@/lib/mongodb";
import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand,
  RetrieveAndGenerateType,
} from "@aws-sdk/client-bedrock-agent-runtime";

// Initialize Bedrock Client (Region from env or default)
const bedrockClient = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
  }
});

// Named export for POST method
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { messages } = await req.json() as { messages: { role: string; content: string }[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const latestMessage = messages[messages.length - 1];

    // Check for Knowledge Base ID
    const kbId = process.env.BEDROCK_KB_ID;
    if (!kbId) {
      return NextResponse.json({ error: "Server Configuration Error: BEDROCK_KB_ID is missing." }, { status: 500 });
    }

    // Call Bedrock RetrieveAndGenerate
    // We send the current message. Session management can be handled by Bedrock if we pass sessionId, 
    // but for simplicity and stateless REST, we might rely on the context provided or just single-turn RAG for now, 
    // OR we can try to map our chat history to Bedrock's expectations if supported.
    // RetrieveAndGenerate is primarily for FAQs/Question answering against the KB.

    const command = new RetrieveAndGenerateCommand({
      input: {
        text: latestMessage.content,
      },
      retrieveAndGenerateConfiguration: {
        type: RetrieveAndGenerateType.KNOWLEDGE_BASE,
        knowledgeBaseConfiguration: {
          knowledgeBaseId: kbId,
          modelArn: process.env.BEDROCK_MODEL_ARN || "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
        },
      },
    });

    const bedrockResponse = await bedrockClient.send(command);
    const responseText = bedrockResponse.output?.text || "I'm sorry, I couldn't find an answer in the knowledge base.";

    // Persist messages to MongoDB
    const dbName = process.env.MONGODB_DB_NAME || "sportsrag";
    type ChatMessage = { role: "user" | "assistant"; content: string; timestamp: number };
    type ChatDoc = { userId: string; createdAt: Date; messages: ChatMessage[] };
    const collection = await getMongoCollection<ChatDoc>(dbName, "chats");

    const now = Date.now();
    const toSave: ChatMessage[] = [
      { role: "user", content: latestMessage.content, timestamp: now },
      { role: "assistant", content: responseText, timestamp: now },
    ];

    await collection.updateOne(
      { userId },
      {
        $setOnInsert: { userId, createdAt: new Date() },
        $push: { messages: { $each: toSave } },
      },
      { upsert: true }
    );

    return NextResponse.json({ response: responseText });

  } catch (err: unknown) {
    console.error("Chat API Error:", err);
    let errorMessage = "An unexpected error occurred.";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

