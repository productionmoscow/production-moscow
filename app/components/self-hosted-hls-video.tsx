"use client";

/* eslint-disable jsx-a11y/media-has-caption -- archived portfolio sources do not include caption files */
import { useEffect, useRef, useState } from "react";

export default function SelfHostedHlsVideo({ src, title }: { src: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let active = true;
    let destroy: (() => void) | undefined;

    async function attachPlayer() {
      setError(false);

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        return;
      }

      const { default: Hls } = await import("hls.js");
      if (!active) return;

      if (!Hls.isSupported()) {
        setError(true);
        return;
      }

      const player = new Hls({ enableWorker: true });
      destroy = () => player.destroy();
      player.loadSource(src);
      player.attachMedia(video);
      player.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal && active) setError(true);
      });
    }

    attachPlayer().catch(() => {
      if (active) setError(true);
    });

    return () => {
      active = false;
      destroy?.();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [src]);

  return <div className="self-hosted-video">
    <video ref={videoRef} controls playsInline preload="metadata" aria-label={title} />
    {error ? <p className="self-hosted-video-error" role="status">Не получилось загрузить видео. Попробуйте обновить страницу.</p> : null}
  </div>;
}
