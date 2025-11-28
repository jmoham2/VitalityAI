import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center h-screen space-y-6">
      <h1 className="text-4xl font-bold">Welcome to VitalityAI</h1>

      <div className="flex space-x-4">
        <Link href="/onboarding">
          <Button>Get Started</Button>
        </Link>

        <Link href="/chat">
          <Button variant="outline">Talk to Vita</Button>
        </Link>
      </div>
    </main>
  );
}
