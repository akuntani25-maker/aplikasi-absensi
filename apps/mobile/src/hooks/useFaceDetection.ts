import { useState, useCallback, useRef } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import {
  useCameraPermission,
  useCameraDevice,
  useFrameProcessor,
  type Camera,
} from 'react-native-vision-camera';
import { useFaceDetector, type Face } from 'react-native-vision-camera-face-detector';
import { runOnJS } from 'react-native-reanimated';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LivenessChallenge = 'blink' | 'turn_left' | 'turn_right' | 'smile';

export interface FaceState {
  detected: boolean;
  eyeOpenLeft: number;
  eyeOpenRight: number;
  yaw: number;
  pitch: number;
  smile: number;
  boundingBox: { x: number; y: number; width: number; height: number } | null;
}

export type ChallengeStatus =
  | 'waiting'
  | 'detecting'
  | 'challenge'
  | 'passed'
  | 'failed'
  | 'no_face';

export interface FaceDetectionState {
  permission: 'granted' | 'denied' | 'not_determined';
  faceState: FaceState;
  challenge: LivenessChallenge;
  challengeStatus: ChallengeStatus;
  capturedFrame: string | null;
  progress: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BLINK_CLOSED_THRESHOLD = 0.3;
const BLINK_OPEN_THRESHOLD   = 0.7;
const TURN_YAW_THRESHOLD     = 20;
const SMILE_THRESHOLD        = 0.7;
const CHALLENGE_TIMEOUT_MS   = 8000;

const CHALLENGES: LivenessChallenge[] = ['blink', 'turn_left', 'turn_right', 'smile'];

function randomChallenge(): LivenessChallenge {
  return CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)] as LivenessChallenge;
}

const INITIAL_FACE_STATE: FaceState = {
  detected: false,
  eyeOpenLeft: 1,
  eyeOpenRight: 1,
  yaw: 0,
  pitch: 0,
  smile: 0,
  boundingBox: null,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFaceDetection() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');

  const [state, setState] = useState<FaceDetectionState>({
    permission: hasPermission ? 'granted' : 'not_determined',
    faceState: INITIAL_FACE_STATE,
    challenge: randomChallenge(),
    challengeStatus: 'waiting',
    capturedFrame: null,
    progress: 0,
  });

  const eyeWasClosed = useSharedValue(false);
  const timeoutRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraRef    = useRef<Camera>(null);

  // runOnJS callback — called from frame processor worklet
  const handleFaceUpdate = useCallback(
    (fs: FaceState) => {
      setState((prev) => {
        const noFace: FaceDetectionState = { ...prev, faceState: fs, challengeStatus: 'no_face' };
        if (!fs.detected) return noFace;
        if (prev.challengeStatus === 'passed') return { ...prev, faceState: fs };
        const next: FaceDetectionState = {
          ...prev,
          faceState: fs,
          challengeStatus: prev.challengeStatus === 'waiting' ? 'detecting' : prev.challengeStatus,
        };
        return next;
      });
    },
    [],
  );

  const { detectFaces } = useFaceDetector({
    performanceMode: 'fast',
    landmarkMode: 'none',
    classificationMode: 'all',
    contourMode: 'none',
    trackingEnabled: true,
    minFaceSize: 0.15,
  });

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      const faces = detectFaces(frame);
      if (faces.length === 0) {
        eyeWasClosed.value = false;
        runOnJS(handleFaceUpdate)(INITIAL_FACE_STATE);
        return;
      }

      const f = faces[0] as Face;
      const bothClosed =
        (f.leftEyeOpenProbability ?? 1) < BLINK_CLOSED_THRESHOLD &&
        (f.rightEyeOpenProbability ?? 1) < BLINK_CLOSED_THRESHOLD;
      if (bothClosed) eyeWasClosed.value = true;

      const fs: FaceState = {
        detected: true,
        eyeOpenLeft:  f.leftEyeOpenProbability  ?? 1,
        eyeOpenRight: f.rightEyeOpenProbability ?? 1,
        yaw:   f.yawAngle   ?? 0,
        pitch: f.pitchAngle ?? 0,
        smile: f.smilingProbability ?? 0,
        boundingBox: f.bounds
          ? { x: f.bounds.x, y: f.bounds.y, width: f.bounds.width, height: f.bounds.height }
          : null,
      };

      runOnJS(handleFaceUpdate)(fs);
    },
    [detectFaces, handleFaceUpdate],
  );

  // ─── Actions ────────────────────────────────────────────────────────────────

  const askPermission = useCallback(async () => {
    const granted = await requestPermission();
    setState((prev) => ({
      ...prev,
      permission: granted ? 'granted' : 'denied',
      challengeStatus: granted ? 'detecting' : 'waiting',
    }));
    return granted;
  }, [requestPermission]);

  const startChallenge = useCallback(() => {
    eyeWasClosed.value = false;
    const challenge = randomChallenge();
    setState((prev) => ({
      ...prev,
      challenge,
      challengeStatus: 'challenge',
      capturedFrame: null,
      progress: 0,
    }));

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setState((prev) =>
        prev.challengeStatus !== 'passed'
          ? { ...prev, challengeStatus: 'failed', progress: 0 }
          : prev,
      );
    }, CHALLENGE_TIMEOUT_MS);
  }, []);

  /** Capture foto dari kamera → base64 string */
  const capturePhoto = useCallback(async (): Promise<string | null> => {
    if (!cameraRef.current) return null;
    try {
      const photo = await cameraRef.current.takePhoto({ enableShutterSound: false });
      const response = await fetch(`file://${photo.path}`);
      const blob = await response.blob();
      return new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          if (typeof result === 'string') {
            resolve(result.split(',')[1] ?? null);
          } else {
            resolve(null);
          }
        };
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }, []);

  /** Dipanggil dari FaceCameraView saat kondisi liveness terpenuhi */
  const markChallengePassed = useCallback(async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const frame64 = await capturePhoto();
    setState((prev) => ({
      ...prev,
      challengeStatus: 'passed',
      capturedFrame: frame64,
      progress: 1,
    }));
  }, [capturePhoto]);

  /** Cek apakah kondisi challenge terpenuhi — dipanggil dari komponen */
  const checkChallenge = useCallback(
    (fs: FaceState, challenge: LivenessChallenge): boolean => {
      if (!fs.detected) return false;
      switch (challenge) {
        case 'blink':
          return (
            eyeWasClosed.value &&
            fs.eyeOpenLeft > BLINK_OPEN_THRESHOLD &&
            fs.eyeOpenRight > BLINK_OPEN_THRESHOLD
          );
        case 'turn_left':  return fs.yaw < -TURN_YAW_THRESHOLD;
        case 'turn_right': return fs.yaw >  TURN_YAW_THRESHOLD;
        case 'smile':      return fs.smile > SMILE_THRESHOLD;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    eyeWasClosed.value = false;
    setState((prev) => ({
      ...prev,
      faceState: INITIAL_FACE_STATE,
      challenge: randomChallenge(),
      challengeStatus: prev.permission === 'granted' ? 'detecting' : 'waiting',
      capturedFrame: null,
      progress: 0,
    }));
  }, []);

  return {
    device,
    cameraRef,
    frameProcessor,
    state,
    askPermission,
    startChallenge,
    markChallengePassed,
    checkChallenge,
    reset,
  };
}
