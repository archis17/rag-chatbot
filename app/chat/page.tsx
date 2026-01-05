
import Chat from '../../components/Chat';
import UserManager from '../../components/UserManager';
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

export default function ChatPage() {
    return (
        <main className="min-h-screen bg-gray-50">
            <UserManager />
            <SignedIn>
                <div className="max-w-4xl mx-auto py-8 px-4">
                    <h1 className="text-3xl font-bold mb-6 text-gray-800">Chat with AI</h1>
                    <Chat />
                </div>
            </SignedIn>
            <SignedOut>
                <RedirectToSignIn />
            </SignedOut>
        </main>
    );
}
