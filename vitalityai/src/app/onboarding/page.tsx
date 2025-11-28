"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function OnboardingPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    age: "",
    height: "",
    weight: "",
    goal: "",
    activity: "",
    sleep: "",
  });

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    const userId = "TEMP_USER_ID"; // replace with real auth value later

    await setDoc(doc(db, "users", userId), {
      onboarding: form,
      createdAt: new Date(),
    });

    router.push("/dashboard");
  };

  return (
    <div className="flex justify-center mt-12">
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

        <Button className="w-full" onClick={handleSubmit}>
          Continue
        </Button>
      </Card>
    </div>
  );
}
