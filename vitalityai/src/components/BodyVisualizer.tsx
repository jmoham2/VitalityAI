"use client";

import React, { useState, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator, Download } from "lucide-react";
import * as THREE from "three";

const Label = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <label className={`block font-medium ${className}`}>{children}</label>
);

// Helper to capture screenshot
const ScreenshotHandler = ({ captureRef }: { captureRef: any }) => {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    captureRef.current = () => {
      gl.render(scene, camera);
      return gl.domElement.toDataURL("image/png");
    };
  }, [gl, scene, camera, captureRef]);
  return null;
};

function RealisticHuman({ weight, height, bodyFat, gender }: { weight: number; height: number; bodyFat: number, gender: string }) {
  // Load standard models from local public folder
  // Xbot = Male, Michelle = Female
  const modelUrl = gender === "female" 
    ? "/models/Xbot.glb"
    : "/models/Man.glb";
    
  const { scene } = useGLTF(modelUrl);
  const modelRef = useRef<THREE.Group>(null);

  // Clone scene to avoid modifying cached model for other instances
  const clone = React.useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    if (!modelRef.current) return;

    // 1. Height Scaling
    // Base height of these models is approx 1.8m (180cm)
    const targetHeight = height / 100; // convert cm to m
    const heightScale = targetHeight / 1.8;

    // 2. Width/Weight Scaling
    // Base weight approx 75kg for 1.8m male
    // We approximate width based on BMI deviation
    const hM = height / 100;
    const bmi = weight / (hM * hM);
    const baseBmi = 22; // Normal BMI
    
    // If BMI is higher, we widen the model. 
    const widthFactor = Math.sqrt(bmi / baseBmi); 
    
    // 3. Body Fat Adjustment
    // Higher body fat = wider waist/hips relative to shoulders
    // We use a more aggressive multiplier (1.2) to make changes clearly visible
    const fatScale = 1 + ((bodyFat - 20) / 100) * 1.2; 

    // Apply Scales
    // Y-axis is height. X and Z are width/depth.
    modelRef.current.scale.set(
      heightScale * widthFactor * fatScale, 
      heightScale, 
      heightScale * widthFactor * fatScale
    );

    // Traverse to hide robot joints or change material
    clone.traverse((child: any) => {
      if (child.isMesh) {
        // Replace robot material with skin material
        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color("#d3d3d3"), // Light Grey
          roughness: 0.5, 
          metalness: 0.1,
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

  }, [height, weight, bodyFat, clone]);

  return <primitive object={clone} ref={modelRef} position={[0, -0.9 * (height/180), 0]} />;
}

export default function BodyVisualizer({ userInfo }: { userInfo: any }) {
  const [bodyFat, setBodyFat] = useState(20);
  const [bmi, setBmi] = useState(0);
  const [showCalculator, setShowCalculator] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Calculator State
  const [neck, setNeck] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState(""); 
  
  const captureRef = useRef<() => string>(null);

  useEffect(() => {
    if (userInfo) {
      const hM = userInfo.height / 100;
      const bmiValue = userInfo.weight / (hM * hM);
      setBmi(parseFloat(bmiValue.toFixed(1)));
      
      // Load saved body fat if exists
      const savedFat = localStorage.getItem("vita_body_fat");
      if (savedFat) {
        setBodyFat(parseFloat(savedFat));
      }

      // Load saved calculator inputs
      const savedCalc = localStorage.getItem("vita_body_calc");
      if (savedCalc) {
        const parsed = JSON.parse(savedCalc);
        setNeck(parsed.neck || "");
        setWaist(parsed.waist || "");
        setHip(parsed.hip || "");
      }
      
      setIsLoaded(true);
    }
  }, [userInfo]);

  // Save body fat whenever it changes (only after initial load)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("vita_body_fat", bodyFat.toString());
    }
  }, [bodyFat, isLoaded]);

  // Save calculator inputs whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("vita_body_calc", JSON.stringify({ neck, waist, hip }));
    }
  }, [neck, waist, hip, isLoaded]);

  const calculateBodyFat = () => {
    if (!userInfo || !neck || !waist) return;
    const h = parseFloat(userInfo.height);
    const n = parseFloat(neck);
    const w = parseFloat(waist);
    const hp = parseFloat(hip || "0");
    
    let bf = 0;
    
    if (userInfo.gender === "female") {
       // Navy Method for Women: 163.205 * log10(waist + hip - neck) - 97.684 * log10(height) - 78.387
       if (w + hp > n) {
         bf = 163.205 * Math.log10(w + hp - n) - 97.684 * Math.log10(h) - 78.387;
       }
    } else {
       // Navy Method for Men
       if (w > n) {
         bf = 86.010 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76;
       }
    }
    
    if (bf > 0) {
      setBodyFat(Math.max(5, Math.min(50, Math.round(bf))));
      setShowCalculator(false);
    }
  };

  const handleSaveImage = () => {
    if (captureRef.current) {
      const data = captureRef.current();
      const link = document.createElement('a');
      link.download = 'vitality-body-model.png';
      link.href = data;
      link.click();
    }
  };

  if (!userInfo) return null;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>3D Body Visualizer ({userInfo.gender === "female" ? "Female" : "Male"})</CardTitle>
          <Button variant="outline" size="icon" onClick={handleSaveImage} title="Save Image">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="flex-1 min-h-[300px] bg-gradient-to-b from-gray-50 to-gray-200 rounded-xl overflow-hidden border relative">
          <Canvas camera={{ position: [0, 1, 2.5], fov: 50 }} shadows>
            <ambientLight intensity={0.7} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} castShadow intensity={1} />
            <pointLight position={[-10, 5, 10]} intensity={0.5} />
            
            <React.Suspense fallback={null}>
              <RealisticHuman 
                weight={parseFloat(userInfo.weight)} 
                height={parseFloat(userInfo.height)} 
                bodyFat={bodyFat}
                gender={userInfo.gender || "male"}
              />
            </React.Suspense>
            
            <OrbitControls enableZoom={true} minDistance={1.5} maxDistance={5} target={[0, 1, 0]} />
            <ScreenshotHandler captureRef={captureRef} />
          </Canvas>
          
          <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur px-2 py-1 rounded text-xs font-mono">
            BMI: {bmi}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500">Body Type Estimate</Label>
              <select 
                className="w-full mt-1 p-2 text-sm border rounded-md bg-white"
                value={
                  bodyFat < (userInfo.gender === "female" ? 18 : 12) ? "athletic" : 
                  bodyFat < (userInfo.gender === "female" ? 24 : 18) ? "fitness" : 
                  bodyFat < (userInfo.gender === "female" ? 31 : 25) ? "average" : "heavy"
                }
                onChange={(e) => {
                  const isFemale = userInfo.gender === "female";
                  switch(e.target.value) {
                    case "athletic": setBodyFat(isFemale ? 16 : 10); break;
                    case "fitness": setBodyFat(isFemale ? 21 : 15); break;
                    case "average": setBodyFat(isFemale ? 28 : 22); break;
                    case "heavy": setBodyFat(isFemale ? 35 : 30); break;
                  }
                }}
              >
                <option value="athletic">Athletic</option>
                <option value="fitness">Fitness</option>
                <option value="average">Average</option>
                <option value="heavy">Heavy</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Body Fat %</Label>
              <div className="flex gap-2 mt-1">
                <Input 
                  type="number" 
                  value={bodyFat} 
                  onChange={(e) => setBodyFat(Number(e.target.value))}
                  className="h-9"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-9 w-9 shrink-0"
                  onClick={() => setShowCalculator(!showCalculator)}
                  title="Calculate Precise %"
                >
                  <Calculator className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {showCalculator && (
            <div className="bg-slate-50 p-3 rounded-lg border space-y-3 animate-in slide-in-from-top-2">
              <p className="text-xs font-medium text-slate-700">Calculate Body Fat (Navy Method)</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px]">Neck (cm)</Label>
                  <Input 
                    type="number" 
                    className="h-8 text-xs" 
                    placeholder="38"
                    value={neck}
                    onChange={(e) => setNeck(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Waist (cm)</Label>
                  <Input 
                    type="number" 
                    className="h-8 text-xs" 
                    placeholder="85"
                    value={waist}
                    onChange={(e) => setWaist(e.target.value)}
                  />
                </div>
                {userInfo.gender === "female" && (
                  <div className="col-span-2">
                    <Label className="text-[10px]">Hip (cm)</Label>
                    <Input 
                      type="number" 
                      className="h-8 text-xs" 
                      placeholder="95"
                      value={hip}
                      onChange={(e) => setHip(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <Button size="sm" className="w-full h-7 text-xs" onClick={calculateBodyFat}>
                Update Model
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}