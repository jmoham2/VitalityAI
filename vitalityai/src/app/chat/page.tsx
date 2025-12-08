import VitaChat from "@/components/VitaChat";
import AnimatedNearbyPlaces from "@/components/AnimatedNearbyPlaces";

export default function ChatPage() {
  return (
    <div className="pt-10">
      <h1 className="text-center text-3xl font-bold mb-6">Chat with Vita</h1>
      <div className="px-4 mb-8">
        <AnimatedNearbyPlaces />
      </div>
      <VitaChat />
    </div>
  );
}
