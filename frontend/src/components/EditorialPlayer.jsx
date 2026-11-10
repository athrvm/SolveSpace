import { useEffect, useRef, useState } from 'react';
import { Maximize, Minimize, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from 'lucide-react';
import './EditorialPlayer.css';

const formatTime = seconds => {
  const time = Math.floor(Number.isFinite(seconds) ? seconds : 0);
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  return `${hours ? `${hours}:` : ''}${hours ? String(minutes).padStart(2, '0') : minutes}:${String(time % 60).padStart(2, '0')}`;
};

export default function EditorialPlayer({ src, poster }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const updateFullscreen = () => setFullscreen((document.fullscreenElement || document.webkitFullscreenElement) === playerRef.current);
    const startNativeFullscreen = () => setNativeFullscreen(true);
    const endNativeFullscreen = () => setNativeFullscreen(false);
    document.addEventListener('fullscreenchange', updateFullscreen);
    document.addEventListener('webkitfullscreenchange', updateFullscreen);
    video.addEventListener('webkitbeginfullscreen', startNativeFullscreen);
    video.addEventListener('webkitendfullscreen', endNativeFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreen);
      document.removeEventListener('webkitfullscreenchange', updateFullscreen);
      video.removeEventListener('webkitbeginfullscreen', startNativeFullscreen);
      video.removeEventListener('webkitendfullscreen', endNativeFullscreen);
    };
  }, []);

  const togglePlayback = async () => {
    const video = videoRef.current;
    setNotice('');
    if (!video.paused) { video.pause(); return; }
    try {
      if (video.ended) video.currentTime = 0;
      await video.play();
    } catch (err) {
      if (err.name !== 'AbortError') setNotice('Playback could not start. Please try again.');
    }
  };

  const seek = time => {
    const video = videoRef.current;
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    video.currentTime = Math.max(0, Math.min(video.duration, time));
    setCurrentTime(video.currentTime);
  };

  const toggleFullscreen = async () => {
    setNotice('');
    try {
      if (document.fullscreenElement === playerRef.current) await document.exitFullscreen();
      else if (document.webkitFullscreenElement === playerRef.current) document.webkitExitFullscreen();
      else if (playerRef.current.requestFullscreen) await playerRef.current.requestFullscreen();
      else if (playerRef.current.webkitRequestFullscreen) playerRef.current.webkitRequestFullscreen();
      else if (videoRef.current.webkitEnterFullscreen) {
        // Video-only fullscreen cannot display our sibling HTML controls.
        videoRef.current.controls = true;
        setNativeFullscreen(true);
        videoRef.current.webkitEnterFullscreen();
      }
      else setNotice('Fullscreen is not supported in this browser.');
    } catch {
      videoRef.current.controls = false;
      setNativeFullscreen(false);
      setNotice('Fullscreen could not open. Please try again.');
    }
  };

  const handleKeyDown = event => {
    // Leave native keyboard controls on buttons, sliders and the speed selector intact.
    if (event.target !== event.currentTarget) return;
    if ([' ', 'k', 'ArrowLeft', 'ArrowRight', 'm', 'f'].includes(event.key)) event.preventDefault();
    if (event.key === ' ' || event.key === 'k') togglePlayback();
    if (event.key === 'ArrowLeft') seek(videoRef.current.currentTime - 10);
    if (event.key === 'ArrowRight') seek(videoRef.current.currentTime + 10);
    if (event.key === 'm') videoRef.current.muted = !videoRef.current.muted;
    if (event.key === 'f') toggleFullscreen();
  };

  return (
    <section ref={playerRef} className={`editorial-player${fullscreen ? ' is-fullscreen' : ''}`} aria-label="Editorial video player" tabIndex={0} onKeyDown={handleKeyDown}>
      <div className="editorial-player-screen">
        <video
          ref={videoRef} src={src} poster={poster} preload="metadata" playsInline controls={nativeFullscreen}
          aria-label="Problem editorial"
          onPlay={() => setPlaying(true)}
          onPause={() => { setPlaying(false); setBuffering(false); }}
          onEnded={() => { setPlaying(false); setBuffering(false); }}
          onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)}
          onDurationChange={event => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
          onWaiting={() => setBuffering(true)}
          onPlaying={() => setBuffering(false)}
          onCanPlay={() => setBuffering(false)}
          onSeeked={() => setBuffering(false)}
          onVolumeChange={event => { setVolume(event.currentTarget.volume); setMuted(event.currentTarget.muted); }}
          onRateChange={event => setRate(event.currentTarget.playbackRate)}
          onError={() => { setError('This video could not be loaded. Please try again.'); setBuffering(false); setPlaying(false); }}
        />
        {buffering && !error && <div className="editorial-player-buffering" role="status"><span className="loading loading-spinner" /><span className="sr-only">Buffering video…</span></div>}
        {error && <div className="editorial-player-error" role="alert"><p>{error}</p><button type="button" onClick={() => { setError(''); setNotice(''); videoRef.current.load(); }}>Try again</button></div>}
      </div>
      <div className="editorial-player-controls">
        <div className="editorial-player-timeline">
          <input type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration)} disabled={!duration || !!error} onChange={event => seek(Number(event.target.value))} aria-label="Seek video" aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`} />
          <span className="editorial-player-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
        <div className="editorial-player-transport" role="group" aria-label="Playback controls">
          <button type="button" disabled={!duration || !!error} onClick={() => seek(videoRef.current.currentTime - 10)} aria-label="Rewind 10 seconds" title="Rewind 10 seconds"><RotateCcw size={22} /><span>10s</span></button>
          <button type="button" className="editorial-player-play" disabled={!!error} onClick={togglePlayback} aria-label={playing ? 'Pause' : 'Play'} title={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" />}</button>
          <button type="button" disabled={!duration || !!error} onClick={() => seek(videoRef.current.currentTime + 10)} aria-label="Forward 10 seconds" title="Forward 10 seconds"><RotateCw size={22} /><span>10s</span></button>
        </div>
        <div className="editorial-player-options">
          <div className="editorial-player-volume">
            <button type="button" onClick={() => { const video = videoRef.current; if (video.muted || video.volume === 0) { video.muted = false; if (!video.volume) video.volume = 1; } else video.muted = true; }} aria-label={muted || volume === 0 ? 'Unmute' : 'Mute'} title={muted || volume === 0 ? 'Unmute' : 'Mute'}>{muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>
            <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={event => { videoRef.current.volume = Number(event.target.value); videoRef.current.muted = false; }} aria-label="Volume" aria-valuetext={`${Math.round((muted ? 0 : volume) * 100)}%`} />
          </div>
          <select value={rate} onChange={event => { videoRef.current.playbackRate = Number(event.target.value); }} aria-label="Playback speed" title="Playback speed">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => <option key={speed} value={speed}>{speed}×</option>)}
          </select>
          <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} title={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>{fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}</button>
        </div>
        {notice && <p className="editorial-player-notice" role="status">{notice}</p>}
      </div>
    </section>
  );
}
