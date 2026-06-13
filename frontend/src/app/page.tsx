import { AuthGate } from "@/components/AuthGate";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">
      <AuthGate />
    </div>
  );
}
