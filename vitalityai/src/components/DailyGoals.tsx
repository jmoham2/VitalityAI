"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, RefreshCw } from "lucide-react";

type Goal = {
  id: string;
  text: string;
  completed: boolean;
};

export default function DailyGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState("");
  const [recommendedGoals, setRecommendedGoals] = useState<string[]>([]);
  const [hitMacros, setHitMacros] = useState<boolean | null>(null);


  const refreshRecommendations = () => {
    const allRecommendations = [
      "Drink 8 glasses of water",
      "Walk 10,000 steps",
      "Eat 5 servings of vegetables",
      "Sleep 8 hours",
      "Do 30 mins of cardio",
      "Meditate for 10 mins",
      "No sugar for today",
      "Stretch for 15 mins",
      "Eat a high protein breakfast",
      "Read 10 pages of a book",
      "Take a 15 min walk",
      "Call a friend",
      "Organize your desk",
      "Try a new healthy recipe",
      "Do 20 pushups"
    ];
    
    // Pick 3 random ones
    const shuffled = allRecommendations.sort(() => 0.5 - Math.random());
    setRecommendedGoals(shuffled.slice(0, 3));
  };

  useEffect(() => {
    // Load saved goals
    const saved = localStorage.getItem("vita_daily_goals");
    if (saved) {
      setGoals(JSON.parse(saved));
    }

    refreshRecommendations();
  }, []);

  useEffect(() => {
    localStorage.setItem("vita_daily_goals", JSON.stringify(goals));
  }, [goals]);

  const addGoal = () => {
    if (!newGoal.trim()) return;
    const goal: Goal = {
      id: Date.now().toString(),
      text: newGoal,
      completed: false,
    };
    setGoals([...goals, goal]);
    setNewGoal("");
  };

  const toggleGoal = (id: string) => {
    setGoals(goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  };

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const addRecommended = (text: string) => {
    const goal: Goal = {
      id: Date.now().toString(),
      text: text,
      completed: false,
    };
    setGoals([...goals, goal]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Daily Goals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              className="flex-1 border p-2 rounded-md text-sm"
              placeholder="Add a goal..."
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addGoal()}
            />
            <Button size="sm" onClick={addGoal}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {goals.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No goals set for today.</p>
            )}
            {goals.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={goal.completed} 
                    onCheckedChange={() => toggleGoal(goal.id)}
                    id={`goal-${goal.id}`}
                  />
                  <label 
                    htmlFor={`goal-${goal.id}`}
                    className={`text-sm ${goal.completed ? "line-through text-gray-400" : ""}`}
                  >
                    {goal.text}
                  </label>
                </div>
                <button onClick={() => deleteGoal(goal.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm text-gray-500">Recommended for You</CardTitle>
          <Button variant="ghost" size="sm" onClick={refreshRecommendations} title="Get different goals" className="h-8 px-2 text-gray-500">
            <RefreshCw className="w-3 h-3 mr-1" />
            <span className="text-xs">Refresh</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {recommendedGoals.map((rec, i) => (
            <div key={i} className="flex items-center justify-between text-sm bg-blue-50 p-2 rounded-md">
              <span>{rec}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 text-blue-600"
                onClick={() => addRecommended(rec)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-2">Daily Macros Check</h3>

        <p className="text-xs text-muted-foreground mb-3">
          Did you hit your daily macros today?
          </p>

          {hitMacros === true && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <span className="text-lg">{"\u2B50"}</span>
              <span>
                Good job hitting your daily macros!{" "}
                {"\u2B50"}
                </span>
                </div>
              )}

          {hitMacros === false && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
              <span className="text-lg">💪</span>
              <span>
                Don't worry! You still have time. Focus on getting that last meal or snack in. Every gram counts!
              </span>
            </div>
          )}

          <div className="flex gap-2 mb-2">
            <Button
            size="sm"
            className="text-xs"
            onClick={() => setHitMacros(true)}
            >
              Yes, I did
              </Button>

            <Button
            size="sm"
            className="text-xs"
            variant="outline"
            onClick={() => setHitMacros(false)}
            >
              Not yet
              </Button>
          </div>

          </Card>
    </div>
  );
}
