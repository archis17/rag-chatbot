// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { retrieveRelevantDocs } from "@/lib/retrieval";
import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";

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
    const { messages } = await req.json() as { messages: { role: string; content: string }[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const latestMessage = messages[messages.length - 1];
    const chatHistory = messages.slice(0, -1);

    const topDocs = await retrieveRelevantDocs(latestMessage.content, 3);
    const contextText = topDocs.map(d => d.text).join("\n");

    const prompt = PromptTemplate.fromTemplate(RAG_TEMPLATE);
    const formattedPrompt = await prompt.format({
      context: contextText,
      chat_history: formatChatHistory(chatHistory),
      input: latestMessage.content,
    });

    const llm = new ChatGroq({
      model: "llama3-70b-8192",
      temperature: 0.3,
      apiKey: process.env.GROQ_API_KEY,
    });

    const response = await llm.invoke([
      { role: "system", content: "You are a helpful sports chatbot." },
      { role: "user", content: formattedPrompt },
    ]);

    return NextResponse.json({ response: response.content });
  } catch (err: unknown) {
    let errorMessage = "An unexpected error occurred.";
    if (err instanceof Error) errorMessage = err.message;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
