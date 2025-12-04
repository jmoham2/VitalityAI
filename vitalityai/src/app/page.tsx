import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center space-y-8">

      <h1 className="text-6xl font-extrabold tracking-tight mb-10">Welcome to VitalityAI</h1>

      <div className="flex space-x-8 mt-6">
        <Link href="/onboarding">
          <Button className="px-12 py-6 text-2xl rounded-2xl shadow-lg hover:scale-110 transition">
            Get Started</Button>
        </Link>

        <Link href="/chat">
          <Button variant="outline"
          className="px-12 py-6 text-2xl rounded-2xl hover:scale-110 transition"
          >
            Talk to Vita</Button>
        </Link>
      </div>
    </main>
  );
}
