import React, { useRef, useEffect } from 'react';
import type { Point3D } from '../vision/smoothing/OneEuroFilter';

interface CameraSkeletonOverlayProps {
  landmarks: Point3D[] | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  width?: number;
  height?: number;
  activeGesture?: string | null;
  trackingLost?: boolean;
}

const CONNECTIONS: [number, number][] = [
  // Shoulders
  [11, 12],
  // Left arm
  [11, 13],
  [13, 15],
  // Right arm
  [12, 14],
  [14, 16],
  // Torso
  [11, 23],
  [12, 24],
  [23, 24],
  // Left leg
  [23, 25],
  [25, 27],
  // Right leg
  [24, 26],
  [26, 28],
];

export const CameraSkeletonOverlay: React.FC<CameraSkeletonOverlayProps> = ({
  landmarks,
  videoRef,
  width = 240,
  height = 180,
  activeGesture,
  trackingLost,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw mirrored video background
    if (videoRef.current && videoRef.current.readyState >= 2) {
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.globalAlpha = 0.85;
      ctx.drawImage(videoRef.current, 0, 0, width, height);
      ctx.restore();
    } else {
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Draw Skeleton
    if (landmarks && landmarks.length >= 25 && !trackingLost) {
      ctx.save();
      // Mirror skeleton to match video
      ctx.translate(width, 0);
      ctx.scale(-1, 1);

      // Draw bones
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;

      CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];

        if (start && end && (start.visibility ?? 1) > 0.35 && (end.visibility ?? 1) > 0.35) {
          ctx.beginPath();
          ctx.moveTo(start.x * width, start.y * height);
          ctx.lineTo(end.x * width, end.y * height);
          ctx.stroke();
        }
      });

      // Draw joints
      landmarks.forEach((pt, idx) => {
        if ([0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26].includes(idx)) {
          if ((pt.visibility ?? 1) > 0.35) {
            ctx.beginPath();
            ctx.arc(pt.x * width, pt.y * height, 4, 0, Math.PI * 2);
            ctx.fillStyle = idx === 15 || idx === 16 ? '#f43f5e' : '#a855f7';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });

      ctx.restore();
    }

    // 3. Draw active gesture badge
    if (activeGesture) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.fillRect(0, height - 24, width, 24);
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(activeGesture, width / 2, height - 7);
    }

    // 4. Tracking lost alert
    if (trackingLost) {
      ctx.fillStyle = 'rgba(244, 63, 94, 0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('STEP BACK INTO FRAME', width / 2, height / 2);
    }
  }, [landmarks, videoRef, width, height, activeGesture, trackingLost]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-cyan-400/40 shadow-xl shadow-black/60 bg-black/80">
      <canvas ref={canvasRef} width={width} height={height} className="block" />
      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
        AI VISION • 30FPS
      </div>
    </div>
  );
};
