import Chat from '../components/Chat';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sports AI Assistant - RAG Chatbot',
  description: 'Get instant answers about sports, teams, players, and matches with our AI-powered assistant',
  keywords: 'sports, AI, chatbot, football, basketball, tennis, Olympics, stats',
};

export default function Home() {
  return (
    <main>
      <Chat />
    </main>
  );
}