import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function ExerciseForm() {
  const [exercise, setExercise] = useState("bicep_curls");
  const [targetReps, setTargetReps] = useState(10);
  const createWorkout = useMutation(api.workouts.createWorkout);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createWorkout({ exercise, targetReps });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Exercise</label>
        <select
          value={exercise}
          onChange={(e) => setExercise(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="bicep_curls">Bicep Curls</option>
          <option value="shoulder_press">Shoulder Press</option>
          <option value="squats">Squats</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Target Reps</label>
        <input
          type="number"
          value={targetReps}
          onChange={(e) => setTargetReps(parseInt(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Start Workout
      </button>
    </form>
  );
}
