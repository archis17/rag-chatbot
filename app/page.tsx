import Chat from '../components/Chat';
import UserManager from '../components/UserManager';
import type { Metadata } from 'next';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import GoatsGrid from '../components/GoatsGrid';

export const metadata: Metadata = {
  title: 'Sports AI Assistant - RAG Chatbot',
  description: 'Get instant answers about sports, teams, players, and matches with our AI-powered assistant',
  keywords: 'sports, AI, chatbot, football, basketball, tennis, Olympics, stats',
};

export default function Home() {
  return (
    <main>
      <UserManager />
      {/* Top Bar */}
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-fuchsia-600" />
        <div className="absolute inset-0 -z-10 opacity-30" style={{backgroundImage:'radial-gradient(circle at 20% 10%, rgba(255,255,255,0.3), transparent 25%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.25), transparent 30%), radial-gradient(circle at 40% 80%, rgba(255,255,255,0.2), transparent 25%)'}} />
        <div className="max-w-6xl mx-auto px-6 py-20 text-white">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            The Ultimate Sports AI
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/90 max-w-2xl">
            Explore legendary moments, compare GOATs, and get instant insights across football, basketball, tennis and more.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <SignedIn>
              <a href="#chat" className="bg-white text-gray-900 px-5 py-3 rounded-xl font-medium hover:bg-white/90 transition">
                Start chatting
              </a>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-white text-gray-900 px-5 py-3 rounded-xl font-medium hover:bg-white/90 transition">
                  Sign in to start
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </section>

      {/* GOATs Gallery */}
      <section className="max-w-6xl mx-auto px-6 -mt-16 relative z-10">
        <GoatsGrid
          items={[
            { name: 'Lionel Messi', sport: 'Football', src: '/images/messi.jpg' },
            { name: 'Cristiano Ronaldo', sport: 'Football', src: '/images/ronaldo.jpg' },
            { name: 'Michael Jordan', sport: 'Basketball', src: '/images/jordan.jpg' },
            { name: 'Serena Williams', sport: 'Tennis', src: '/images/serena.jpg' },
            { name: 'Usain Bolt', sport: 'Athletics', src: '/images/bolt.jpg' },
            { name: 'Sachin Tendulkar', sport: 'Cricket', src: '/images/sachin.jpg' },
            { name: 'Roger Federer', sport: 'Tennis', src: '/images/federer.jpg' },
            { name: 'Muhammad Ali', sport: 'Boxing', src: '/images/ali.jpg' },
          ]}
        />
      </section>
      <SignedIn>
        <div id="chat" className="mt-10">
          <Chat />
        </div>
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