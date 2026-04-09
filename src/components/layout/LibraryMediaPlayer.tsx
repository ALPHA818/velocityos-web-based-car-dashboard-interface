import React from 'react';
import ReactPlayer from 'react-player/lazy';

interface LibraryMediaPlayerProps {
  url: string;
  playing: boolean;
  volume: number;
  onReady: () => void;
  onProgress: (progress: { played: number }) => void;
  onDuration: (duration: number) => void;
}

export function LibraryMediaPlayer({
  url,
  playing,
  volume,
  onReady,
  onProgress,
  onDuration,
}: LibraryMediaPlayerProps) {
  return (
    <div className="hidden">
      <ReactPlayer
        url={url}
        playing={playing}
        volume={volume}
        onReady={onReady}
        onProgress={onProgress}
        onDuration={onDuration}
        width="0"
        height="0"
        {...({} as Record<string, never>)}
      />
    </div>
  );
}