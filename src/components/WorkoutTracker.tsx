import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Pose, Results, POSE_CONNECTIONS } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { checkExerciseForm, type Exercise } from "../lib/poseDetection";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

export function WorkoutTracker() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workout = useQuery(api.workouts.getCurrentWorkout);
  const [reps, setReps] = useState(0);
  const updateReps = useMutation(api.workouts.updateReps);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [isGoodForm, setIsGoodForm] = useState(false);
  
  const exerciseStateRef = useRef({ isDown: false, lastAngle: 0 });

  useEffect(() => {
    if (!workout || !webcamRef.current || !canvasRef.current) return;

    const pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults((results: Results) => {
      if (!canvasRef.current) return;

      const ctx = canvasRef.current.getContext('2d')!;
      ctx.save();
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Draw the video frame
      ctx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

      // Draw the pose landmarks with transparency
      if (results.poseLandmarks) {
        ctx.globalAlpha = 0.3; // Make lines semi-transparent
        drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS,
          { color: '#00FF00', lineWidth: 2 });
        drawLandmarks(ctx, results.poseLandmarks,
          { color: '#FF0000', lineWidth: 1, radius: 2 });
        ctx.globalAlpha = 1.0; // Reset transparency
      }
      ctx.restore();

      // Check exercise form
      const { didComplete, angle, isGoodForm: goodForm } = checkExerciseForm(
        results,
        workout.exercise as Exercise,
        exerciseStateRef.current
      );

      setCurrentAngle(Math.round(angle));
      setIsGoodForm(goodForm);

      if (didComplete) {
        setReps((prev) => {
          const newReps = prev + 1;
          updateReps({ workoutId: workout._id, completedReps: newReps });
          return newReps;
        });
      }
    });

    const camera = new Camera(webcamRef.current.video!, {
      onFrame: async () => {
        if (webcamRef.current?.video) {
          await pose.send({ image: webcamRef.current.video });
        }
      },
      width: 1280,
      height: 720
    });

    camera.start();

    return () => {
      camera.stop();
      pose.close();
    };
  }, [workout]);

  useEffect(() => {
    if (workout && reps >= workout.targetReps) {
      toast.success("Congratulations! Workout completed!");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  }, [reps, workout]);

  if (!workout) return null;

  return (
    <div className="space-y-4">
      <div className="relative max-w-5xl mx-auto">
        <Webcam
          ref={webcamRef}
          className="w-full rounded-lg"
          mirrored
          width={1280}
          height={720}
          style={{ display: 'none' }}
        />
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg"
          width={1280}
          height={720}
        />
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full">
          {reps} / {workout.targetReps} reps
        </div>
        <div className={`absolute bottom-4 right-4 px-3 py-1 rounded-full ${
          isGoodForm ? 'bg-green-500/50' : 'bg-red-500/50'
        } text-white`}>
          Form: {isGoodForm ? 'Good' : 'Adjust'} ({currentAngle}°)
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold capitalize">
          {workout.exercise.replace(/_/g, " ")}
        </h2>
        <p className="text-gray-600">
          {isGoodForm 
            ? "Great form! Keep going!" 
            : "Adjust your form to match the exercise"}
        </p>
      </div>
    </div>
  );
}
