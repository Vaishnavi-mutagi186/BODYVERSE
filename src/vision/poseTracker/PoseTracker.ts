import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { LandmarkSmoother } from '../smoothing/OneEuroFilter';
import type { Point3D } from '../smoothing/OneEuroFilter';

export interface PoseTrackerCallbacks {
  onPose?: (landmarks: Point3D[], timestamp: number) => void;
  onTrackingLost?: (isLost: boolean) => void;
  onError?: (err: Error) => void;
}

export class PoseTracker {
  private landmarker: PoseLandmarker | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private smoother = new LandmarkSmoother();
  private isRunning = false;
  private lastDetectionTime = 0;
  private trackingLost = false;
  private callbacks: PoseTrackerCallbacks = {};
  private rVFCId: number | null = null;
  private animFrameId: number | null = null;

  public async initialize(video: HTMLVideoElement, callbacks: PoseTrackerCallbacks): Promise<void> {
    this.videoElement = video;
    this.callbacks = callbacks;

    try {
      // 1. Resolve WASM assets (try local first, fallback to CDN)
      let visionWasm;
      try {
        visionWasm = await FilesetResolver.forVisionTasks('/wasm');
      } catch (err) {
        console.warn('Local WASM fallback to CDN:', err);
        visionWasm = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm');
      }

      // 2. Initialize PoseLandmarker with GPU delegate and CPU fallback
      try {
        this.landmarker = await PoseLandmarker.createFromOptions(visionWasm, {
          baseOptions: {
            modelAssetPath: '/models/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      } catch (gpuErr) {
        console.warn('GPU delegate failed, falling back to CPU:', gpuErr);
        this.landmarker = await PoseLandmarker.createFromOptions(visionWasm, {
          baseOptions: {
            modelAssetPath: '/models/pose_landmarker_lite.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      }

      // 3. Start Camera Video Stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      this.videoElement.srcObject = stream;
      await new Promise<void>((resolve) => {
        this.videoElement!.onloadedmetadata = () => {
          this.videoElement!.play();
          resolve();
        };
      });

      this.isRunning = true;
      this.startDetectionLoop();
    } catch (err: unknown) {
      if (this.callbacks.onError) {
        this.callbacks.onError(err as Error);
      }
      throw err;
    }
  }

  private startDetectionLoop(): void {
    const processFrame = (now: DOMHighResTimeStamp) => {
      if (!this.isRunning || !this.videoElement || !this.landmarker) return;

      if (this.videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        // Run detection ~30fps
        const minInterval = 30; // ms
        if (now - this.lastDetectionTime >= minInterval) {
          try {
            const results = this.landmarker.detectForVideo(this.videoElement, now);

            if (results.landmarks && results.landmarks.length > 0) {
              const rawLandmarks = results.landmarks[0] as Point3D[];
              const smoothed = this.smoother.smooth(rawLandmarks, now);

              this.lastDetectionTime = now;
              if (this.trackingLost) {
                this.trackingLost = false;
                if (this.callbacks.onTrackingLost) this.callbacks.onTrackingLost(false);
              }

              if (this.callbacks.onPose) {
                this.callbacks.onPose(smoothed, now);
              }
            } else {
              // Check tracking loss (>500ms)
              if (!this.trackingLost && now - this.lastDetectionTime > 500) {
                this.trackingLost = true;
                if (this.callbacks.onTrackingLost) this.callbacks.onTrackingLost(true);
              }
            }
          } catch (detErr) {
            console.error('Detection frame error:', detErr);
          }
        }
      }

      // Loop using requestVideoFrameCallback or rAF
      if ('requestVideoFrameCallback' in this.videoElement) {
        this.rVFCId = (this.videoElement as HTMLVideoElement & { requestVideoFrameCallback: (cb: (now: number) => void) => number }).requestVideoFrameCallback(
          (ts) => processFrame(ts)
        );
      } else {
        this.animFrameId = requestAnimationFrame((ts) => processFrame(ts));
      }
    };

    if ('requestVideoFrameCallback' in this.videoElement!) {
      this.rVFCId = (this.videoElement as HTMLVideoElement & { requestVideoFrameCallback: (cb: (now: number) => void) => number }).requestVideoFrameCallback(
        (ts) => processFrame(ts)
      );
    } else {
      this.animFrameId = requestAnimationFrame((ts) => processFrame(ts));
    }
  }

  public stop(): void {
    this.isRunning = false;

    if (this.videoElement) {
      if (this.rVFCId !== null && 'cancelVideoFrameCallback' in this.videoElement) {
        (this.videoElement as HTMLVideoElement & { cancelVideoFrameCallback: (id: number) => void }).cancelVideoFrameCallback(this.rVFCId);
      }
      if (this.animFrameId !== null) {
        cancelAnimationFrame(this.animFrameId);
      }

      if (this.videoElement.srcObject) {
        const stream = this.videoElement.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        this.videoElement.srcObject = null;
      }
    }

    if (this.landmarker) {
      this.landmarker.close();
      this.landmarker = null;
    }
    this.smoother.reset();
  }
}
