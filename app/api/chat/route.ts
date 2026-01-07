// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getMongoCollection } from "@/lib/mongodb";
import { retrieveRelevantDocs } from "@/lib/retrieval";
import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { webSearchTavily, formatWebResults } from "@/lib/websearch";

// Helper to format chat history
function formatChatHistory(messages: { role: string; content: string }[]) {
  return messages
    .map(m => (m.role === "user" ? "User" : "Assistant") + ": " + m.content)
    .join("\n");
}

const RAG_TEMPLATE = `You are a helpful sports expert assistant. Refer to relevant context to answer questions precisely.
Context:
{context}

Current conversation:
{chat_history}
User: {input}
AI:`;

// Named export for POST method (required in app router)
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
    const chatHistory = messages.slice(0, -1);

    const topDocs = await retrieveRelevantDocs(latestMessage.content, 3);
    let contextText = topDocs.map(d => d.text).join("\n");

    // Optional web search for fresh info
    const enableWeb = (process.env.ENABLE_WEB_SEARCH ?? "false").toLowerCase() === "true";
    if (enableWeb) {
      try {
        const webResults = await webSearchTavily(latestMessage.content, 3);
        const webBlock = formatWebResults(webResults);
        if (webBlock) {
          contextText = `${contextText}\n\n${webBlock}`.trim();
        }
      } catch { }
    }

    const prompt = PromptTemplate.fromTemplate(RAG_TEMPLATE);
    const formattedPrompt = await prompt.format({
      context: contextText,
      chat_history: formatChatHistory(chatHistory),
      input: latestMessage.content,
    });

    const selectedModel = process.env.GROQ_MODEL || "llama-3.1-70b-versatile";

    const llm = new ChatGroq({
      model: selectedModel,
      temperature: 0.5,
      apiKey: process.env.GROQ_API_KEY,
    });

    const response = await llm.invoke([
      { role: "system", content: "You are a helpful sports chatbot." },
      { role: "user", content: formattedPrompt },
    ]);

    // Persist messages to MongoDB
    const dbName = process.env.MONGODB_DB_NAME || "sportsrag";
    type ChatMessage = { role: "user" | "assistant"; content: string; timestamp: number };
    type ChatDoc = { userId: string; createdAt: Date; messages: ChatMessage[] };
    const collection = await getMongoCollection<ChatDoc>(dbName, "chats");

    const now = Date.now();
    const toSave: ChatMessage[] = [
      { role: "user", content: latestMessage.content, timestamp: now },
      { role: "assistant", content: String(response.content), timestamp: now },
    ];

    await collection.updateOne(
      { userId },
      {
        $setOnInsert: { userId, createdAt: new Date() },
        $push: { messages: { $each: toSave } },
      },
      { upsert: true }
    );

    return NextResponse.json({ response: response.content });
  } catch (err: unknown) {
    console.error("Chat API Error:", err);
    let errorMessage = "An unexpected error occurred.";
    let statusCode = 500;
    if (err instanceof Error) {
      errorMessage = err.message;
      const lower = errorMessage.toLowerCase();
      if (
        lower.includes("model_decommissioned") ||
        lower.includes("decommissioned") ||
        lower.includes("model not found") ||
        lower.includes("unknown model")
      ) {
        statusCode = 400;
        errorMessage =
          `The configured Groq model is unavailable or deprecated. ` +
          `Set a supported model via GROQ_MODEL (e.g., \"llama-3.1-70b-versatile\", \"llama-3.1-8b-instant\", or \"deepseek-r1-distill-llama-70b\").`;
      }
    }
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
