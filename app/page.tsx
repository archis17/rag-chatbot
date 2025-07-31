// app/page.tsx or pages/index.tsx
import Chat from "@/components/Chat";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Chat />
    </main>
  );
}
