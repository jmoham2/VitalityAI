"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Apple, Beef, Wheat, Droplets } from "lucide-react";

export default function NutritionDashboard() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [macros, setMacros] = useState<any>({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fats: 65,
    fiber: 30,
    water: 2500
  });

  useEffect(() => {
    const storedInfo = localStorage.getItem("vita_user_info");
    if (storedInfo) {
      const info = JSON.parse(storedInfo);
      setUserInfo(info);
      calculateMacros(info);
    }
  }, []);

  const calculateMacros = (info: any) => {
    // Simple BMR Calculation (Mifflin-St Jeor)
    let bmr = 10 * info.weight + 6.25 * info.height - 5 * info.age;
    if (info.gender === "female") {
      bmr -= 161;
    } else {
      bmr += 5;
    }

    // Activity Multiplier (Assuming Moderate for now if not specified)
    const tdee = bmr * 1.375; 

    // Adjust for Goal
    let targetCalories = tdee;
    if (info.goal?.toLowerCase().includes("lose")) {
      targetCalories -= 500;
    } else if (info.goal?.toLowerCase().includes("gain")) {
      targetCalories += 500;
    }

    // Macro Split (40/30/30 roughly)
    const protein = (targetCalories * 0.3) / 4;
    const fats = (targetCalories * 0.3) / 9;
    const carbs = (targetCalories * 0.4) / 4;

    setMacros({
      calories: Math.round(targetCalories),
      protein: Math.round(protein),
      fats: Math.round(fats),
      carbs: Math.round(carbs),
      fiber: 30, // General recommendation
      water: Math.round(info.weight * 35) // approx 35ml per kg
    });
  };

  if (!userInfo) return null;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-green-800">
            <Apple className="w-5 h-5" />
            Nutrition Targets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-green-100">
            <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Daily Calories</p>
            <p className="text-4xl font-bold text-green-600">{macros.calories}</p>
            <p className="text-xs text-gray-400 mt-1">kcal / day</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MacroCard 
              icon={<Beef className="w-4 h-4 text-red-500" />}
              label="Protein"
              value={`${macros.protein}g`}
              color="bg-red-500"
            />
            <MacroCard 
              icon={<Wheat className="w-4 h-4 text-yellow-500" />}
              label="Carbs"
              value={`${macros.carbs}g`}
              color="bg-yellow-500"
            />
            <MacroCard 
              icon={<Droplets className="w-4 h-4 text-blue-500" />}
              label="Fats"
              value={`${macros.fats}g`}
              color="bg-blue-500"
            />
            <MacroCard 
              icon={<Apple className="w-4 h-4 text-green-500" />}
              label="Fiber"
              value={`${macros.fiber}g`}
              color="bg-green-500"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MacroCard({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-1">
      <div className="flex items-center gap-1 text-gray-600 text-xs font-medium">
        {icon}
        {label}
      </div>
      <p className="text-lg font-bold text-gray-800">{value}</p>
      <div className={`h-1 w-full rounded-full ${color} opacity-20 mt-1`}>
        <div className={`h-full w-2/3 rounded-full ${color}`} />
      </div>
    </div>
  );
}
