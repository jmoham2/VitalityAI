"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/components/ui/toast-notification";

export default function OnboardingPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    age: "",
    height: "",
    weight: "",
    gender: "male",
    goal: "",
    activity: "",
    sleep: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("vita_user_info");
    if (saved) {
      try {
        setForm(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved info", e);
      }
    }
  }, []);

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleGuest = () => {
    const guestInfo = {
      age: "N/A",
      height: "N/A",
      weight: "N/A",
      gender: "male",
      goal: "General Health",
      activity: "Moderate",
      sleep: "7",
    };
    localStorage.setItem("vita_user_info", JSON.stringify(guestInfo));
    router.push("/chat");
  };

  const handleSubmit = async () => {
    const userId = "TEMP_USER_ID"; // replace with real auth value later

    try {
      // Check if db is a valid Firestore instance (it might be {} if config is missing)
      // Also check if doc is safe to call
      if (db && typeof db.app !== 'undefined') {
        await setDoc(doc(db, "users", userId), {
          onboarding: form,
          createdAt: new Date(),
        });
      } else {
        console.warn("Firestore not configured, saving to localStorage instead.");
        localStorage.setItem("vita_user_info", JSON.stringify(form));
      }
      
      showToast("Information saved successfully!", "success");
      router.push("/chat");
    } catch (error) {
      console.error("Error saving onboarding info:", error);
      // Fallback to local storage if Firestore fails
      localStorage.setItem("vita_user_info", JSON.stringify(form));
      showToast("Information saved locally!", "info");
      router.push("/chat");
    }
  };

  return (
    <div className="flex justify-center mt-12 mb-12">
      <Card className="p-8 w-full max-w-lg space-y-6 shadow-lg border border-gray-200">
        <h1 className="text-2xl font-semibold text-center">
          Tell Vita About You 💬
        </h1>

        <Input
          placeholder="Age"
          name="age"
          value={form.age}
          onChange={handleChange}
        />
        <Input
          placeholder="Height (cm)"
          name="height"
          value={form.height}
          onChange={handleChange}
        />
        <Input
          placeholder="Weight (kg)"
          name="weight"
          value={form.weight}
          onChange={handleChange}
        />
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Gender</label>
          <div className="flex gap-4">
            <Button 
              type="button"
              variant={form.gender === "male" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setForm({...form, gender: "male"})}
            >
              Male
            </Button>
            <Button 
              type="button"
              variant={form.gender === "female" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setForm({...form, gender: "female"})}
            >
              Female
            </Button>
          </div>
        </div>

        <Input
          placeholder="Your main goal (e.g., Lose weight)"
          name="goal"
          value={form.goal}
          onChange={handleChange}
        />
        <Input
          placeholder="Daily activity level"
          name="activity"
          value={form.activity}
          onChange={handleChange}
        />
        <Input
          placeholder="Average sleep hours"
          name="sleep"
          value={form.sleep}
          onChange={handleChange}
        />

        <div className="space-y-3">
          <Button className="w-full" onClick={handleSubmit}>
            Continue
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGuest}>
            Try as Guest
          </Button>
        </div>
      </Card>
    </div>
  );
}
