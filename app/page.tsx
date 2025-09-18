import Chat from '../components/Chat';
import UserManager from '../components/UserManager';
import type { Metadata } from 'next';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: 'Sports AI Assistant - RAG Chatbot',
  description: 'Get instant answers about sports, teams, players, and matches with our AI-powered assistant',
  keywords: 'sports, AI, chatbot, football, basketball, tennis, Olympics, stats',
};

export default function Home() {
  return (
    <main>
      <UserManager />
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">Sports RAG Chatbot</div>
        <div>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal" />
          </SignedOut>
        </div>
      </div>
      <SignedIn>
        <Chat />
      </SignedIn>
      <SignedOut>
        <div className="h-[70vh] flex items-center justify-center">
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-semibold">Sign in to start chatting</h2>
            <SignInButton mode="modal" />
          </div>
        </div>
      </SignedOut>
    </main>
  );
}