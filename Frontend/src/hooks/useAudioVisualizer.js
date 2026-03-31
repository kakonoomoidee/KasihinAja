import { useState, useEffect } from "react";

/**
 * Custom hook to generate real-time waveform heights from a microphone stream.
 *
 * @param {MediaStream|null} stream The active audio stream to analyze.
 * @param {number} [barCount=40] The number of waveform bars to calculate.
 * @returns {number[]} An array of calculated height percentages.
 */
export function useStreamVisualizer(stream, barCount = 40) {
  const [waveHeights, setWaveHeights] = useState(Array(barCount).fill(10));

  useEffect(() => {
    if (!stream) {
      const timer = setTimeout(() => setWaveHeights(Array(barCount).fill(10)), 0);
      return () => clearTimeout(timer);
    }

    let audioCtx;
    let analyser;
    let source;
    let animationId;

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const renderFrame = () => {
        analyser.getByteFrequencyData(dataArray);
        const step = Math.floor(dataArray.length / barCount);
        const newHeights = [];

        for (let i = 0; i < barCount; i++) {
          const value = dataArray[i * step] || 0;
          const percent = Math.max(10, (value / 255) * 100);
          newHeights.push(percent);
        }

        setWaveHeights(newHeights);
        animationId = requestAnimationFrame(renderFrame);
      };

      renderFrame();
    } catch {
      const timer = setTimeout(() => setWaveHeights(Array(barCount).fill(10)), 0);
      return () => clearTimeout(timer);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (audioCtx && audioCtx.state !== "closed") audioCtx.close();
    };
  }, [stream, barCount]);

  return waveHeights;
}

/**
 * Custom hook to generate real-time waveform heights from an HTML audio element.
 *
 * @param {React.RefObject} audioRef A React ref attached to the audio element.
 * @param {boolean} isPlaying Indicates whether the audio is currently playing.
 * @param {number} [barCount=40] The number of waveform bars to calculate.
 * @returns {number[]} An array of calculated height percentages.
 */
export function useElementVisualizer(audioRef, isPlaying, barCount = 40) {
  const [waveHeights, setWaveHeights] = useState(Array(barCount).fill(10));

  useEffect(() => {
    if (!isPlaying || !audioRef.current) {
      const timer = setTimeout(() => setWaveHeights(Array(barCount).fill(10)), 0);
      return () => clearTimeout(timer);
    }

    let audioCtx;
    let analyser;
    let source;
    let animationId;

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;

      if (!audioRef.current._sourceNode) {
        audioRef.current._sourceNode = audioCtx.createMediaElementSource(audioRef.current);
      }
      source = audioRef.current._sourceNode;
      
      source.connect(analyser);
      analyser.connect(audioCtx.destination);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const renderFrame = () => {
        analyser.getByteFrequencyData(dataArray);
        const step = Math.floor(dataArray.length / barCount);
        const newHeights = [];

        for (let i = 0; i < barCount; i++) {
          const value = dataArray[i * step] || 0;
          const percent = Math.max(10, (value / 255) * 100);
          newHeights.push(percent);
        }

        setWaveHeights(newHeights);
        animationId = requestAnimationFrame(renderFrame);
      };

      renderFrame();
    } catch {
      const timer = setTimeout(() => setWaveHeights(Array(barCount).fill(10)), 0);
      return () => clearTimeout(timer);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isPlaying, audioRef, barCount]);

  return waveHeights;
}