import { Results } from "@mediapipe/pose";

export type Exercise = "bicep_curls" | "shoulder_press" | "squats";

interface ExerciseState {
  isDown: boolean;
  lastAngle: number;
}

export function checkExerciseForm(results: Results, exercise: Exercise, state: ExerciseState): { 
  didComplete: boolean; 
  angle: number;
  isGoodForm: boolean;
} {
  const landmarks = results.poseLandmarks;
  if (!landmarks) return { didComplete: false, angle: 0, isGoodForm: false };

  switch (exercise) {
    case "bicep_curls":
      return checkBicepCurl(landmarks, state);
    case "shoulder_press":
      return checkShoulderPress(landmarks, state);
    case "squats":
      return checkSquat(landmarks, state);
    default:
      return { didComplete: false, angle: 0, isGoodForm: false };
  }
}

function checkBicepCurl(landmarks: any[], state: ExerciseState) {
  // Right arm landmarks
  const shoulder = landmarks[12];
  const elbow = landmarks[14];
  const wrist = landmarks[16];

  if (shoulder.visibility < 0.7 || elbow.visibility < 0.7 || wrist.visibility < 0.7) {
    return { didComplete: false, angle: 0, isGoodForm: false };
  }

  const angle = calculateAngle(
    { x: shoulder.x, y: shoulder.y },
    { x: elbow.x, y: elbow.y },
    { x: wrist.x, y: wrist.y }
  );

  const isGoodForm = angle > 50 && angle < 160;
  let didComplete = false;

  // Check if arm is down (extended)
  if (!state.isDown && angle > 150) {
    state.isDown = true;
  }
  // Check if completed a rep (went down and came up)
  else if (state.isDown && angle < 70) {
    state.isDown = false;
    didComplete = true;
  }

  state.lastAngle = angle;
  return { didComplete, angle, isGoodForm };
}

function checkShoulderPress(landmarks: any[], state: ExerciseState) {
  const shoulder = landmarks[12];
  const elbow = landmarks[14];
  const wrist = landmarks[16];

  if (shoulder.visibility < 0.7 || elbow.visibility < 0.7 || wrist.visibility < 0.7) {
    return { didComplete: false, angle: 0, isGoodForm: false };
  }

  const angle = calculateAngle(
    { x: shoulder.x, y: shoulder.y },
    { x: elbow.x, y: elbow.y },
    { x: wrist.x, y: wrist.y }
  );

  const isGoodForm = angle > 50 && angle < 180;
  let didComplete = false;

  // Check if arms are down
  if (!state.isDown && angle < 90) {
    state.isDown = true;
  }
  // Check if completed a rep (went up fully)
  else if (state.isDown && angle > 160) {
    state.isDown = false;
    didComplete = true;
  }

  state.lastAngle = angle;
  return { didComplete, angle, isGoodForm };
}

function checkSquat(landmarks: any[], state: ExerciseState) {
  const hip = landmarks[24];
  const knee = landmarks[26];
  const ankle = landmarks[28];

  if (hip.visibility < 0.7 || knee.visibility < 0.7 || ankle.visibility < 0.7) {
    return { didComplete: false, angle: 0, isGoodForm: false };
  }

  const angle = calculateAngle(
    { x: hip.x, y: hip.y },
    { x: knee.x, y: knee.y },
    { x: ankle.x, y: ankle.y }
  );

  const isGoodForm = angle > 50 && angle < 180;
  let didComplete = false;

  // Check if standing straight
  if (!state.isDown && angle > 160) {
    state.isDown = true;
  }
  // Check if completed a rep (went down and up)
  else if (state.isDown && angle < 90) {
    state.isDown = false;
    didComplete = true;
  }

  state.lastAngle = angle;
  return { didComplete, angle, isGoodForm };
}

function calculateAngle(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  
  return angle;
}
