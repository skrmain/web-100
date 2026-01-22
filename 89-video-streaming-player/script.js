document.addEventListener("DOMContentLoaded", () => {
  // 1. Elements
  const videoContainer = document.getElementById("video-container");
  const video = document.getElementById("video");
  const controls = document.getElementById("controls");
  const loader = document.getElementById("loader");

  // Buttons
  const playBtn = document.getElementById("play-btn");
  const muteBtn = document.getElementById("mute-btn");
  const volumeSlider = document.getElementById("volume-slider");
  const speedSelect = document.getElementById("speed-select");
  const pipBtn = document.getElementById("pip-btn");
  const fullscreenBtn = document.getElementById("fullscreen-btn");

  // Time & Progress
  const timeDisplay = document.getElementById("current-time");
  const totalTimeDisplay = document.getElementById("total-time");
  const timelineContainer = document.getElementById("timeline-container");
  const progressBar = document.getElementById("progress-bar");
  const bufferBar = document.getElementById("buffer-bar");
  const thumb = document.getElementById("thumb");
  const hoverPreview = document.getElementById("hover-preview");

  // 2. State
  let isDragging = false;
  let wasPausedBeforeDrag = false;
  let idleTimer;

  // 3. Icons (SVG Paths)
  const icons = {
    play: "M8 5v14l11-7z",
    pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
    volumeOn:
      "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",
    volumeMute:
      "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z",
  };

  // 4. Helpers - Time Formatting Engine
  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      // HH:MM:SS
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    } else {
      // MM:SS
      return `${m}:${s.toString().padStart(2, "0")}`;
    }
  }

  function updateIcon(btn, pathData) {
    btn.querySelector("path").setAttribute("d", pathData);
  }

  // 5. Playback Logic
  function togglePlay() {
    if (video.paused) {
      video.play();
      updateIcon(playBtn, icons.pause);
    } else {
      video.pause();
      updateIcon(playBtn, icons.play);
    }
  }

  // 6. Timeline & Scrubbing Logic (The "Very Hard" Part)

  // Updates UI based on video time (called by 'timeupdate')
  function updateProgressUI() {
    // If user is scrubbing, DO NOT update the progress bar from video state
    if (isDragging) return;

    const percentage = (video.currentTime / video.duration) * 100;
    progressBar.style.width = `${percentage}%`;
    thumb.style.left = `${percentage}%`;
    timeDisplay.textContent = formatTime(video.currentTime);

    updateBuffer();
  }

  // Calculates buffered segments
  function updateBuffer() {
    if (video.duration > 0) {
      for (let i = 0; i < video.buffered.length; i++) {
        if (
          video.buffered.start(i) <= video.currentTime &&
          video.buffered.end(i) >= video.currentTime
        ) {
          const bufferedEnd = video.buffered.end(i);
          const bufferPercent = (bufferedEnd / video.duration) * 100;
          bufferBar.style.width = `${bufferPercent}%`;
          break;
        }
      }
    }
  }

  // Handling the Scrub Interaction
  function handleTimelineUpdate(e) {
    const rect = timelineContainer.getBoundingClientRect();
    // Clamping x to be within the timeline width
    const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
    const percentage = x / rect.width;

    if (isDragging) {
      // Visual update only
      progressBar.style.width = `${percentage * 100}%`;
      thumb.style.left = `${percentage * 100}%`;

      // Calculate hypothetical time for display, but don't seek video yet (performance)
      const targetTime = percentage * video.duration;
      timeDisplay.textContent = formatTime(targetTime);
    }

    return percentage; // Return for final seek
  }

  // Hover Preview Logic
  timelineContainer.addEventListener("mousemove", (e) => {
    const rect = timelineContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(Math.max(0, x), rect.width) / rect.width;

    const previewTime = percentage * video.duration;
    hoverPreview.textContent = formatTime(previewTime);

    // Position tooltip
    hoverPreview.style.left = `${x}px`;
    hoverPreview.style.display = "block";
  });

  timelineContainer.addEventListener("mouseleave", () => {
    hoverPreview.style.display = "none";
  });

  // Drag Start
  timelineContainer.addEventListener("mousedown", (e) => {
    isDragging = true;
    timelineContainer.classList.add("dragging");
    wasPausedBeforeDrag = video.paused;
    video.pause(); // Pause while scrubbing for smoother UI

    // Immediate jump on click
    handleTimelineUpdate(e);
  });

  // Drag Move (Global)
  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      handleTimelineUpdate(e);
    }
    resetIdleTimer(); // Keep controls visible while dragging
  });

  // Drag End (Global)
  document.addEventListener("mouseup", (e) => {
    if (isDragging) {
      isDragging = false;
      timelineContainer.classList.remove("dragging");

      // Final seek calculation
      const rect = timelineContainer.getBoundingClientRect();
      const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
      const percentage = x / rect.width;

      video.currentTime = percentage * video.duration;

      if (!wasPausedBeforeDrag) {
        video.play();
      }
    }
  });

  // 7. Video Events
  video.addEventListener("click", togglePlay);
  playBtn.addEventListener("click", togglePlay);

  video.addEventListener("timeupdate", updateProgressUI);

  video.addEventListener("loadedmetadata", () => {
    totalTimeDisplay.textContent = formatTime(video.duration);
  });

  video.addEventListener("waiting", () => loader.classList.remove("hidden"));
  video.addEventListener("playing", () => loader.classList.add("hidden"));

  // Volume
  volumeSlider.addEventListener("input", (e) => {
    video.volume = e.target.value;
    video.muted = e.target.value === "0";
    updateVolumeIcon();
  });

  muteBtn.addEventListener("click", () => {
    video.muted = !video.muted;
    if (video.muted) {
      video.volume = 0; // standard UI behavior
      volumeSlider.value = 0;
    } else {
      video.volume = 1;
      volumeSlider.value = 1;
    }
    updateVolumeIcon();
  });

  function updateVolumeIcon() {
    if (video.muted || video.volume === 0) {
      updateIcon(muteBtn, icons.volumeMute);
    } else {
      updateIcon(muteBtn, icons.volumeOn);
    }
  }

  // Advanced Controls
  speedSelect.addEventListener("change", (e) => {
    video.playbackRate = parseFloat(e.target.value);
  });

  pipBtn.addEventListener("click", () => {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else if (document.pictureInPictureEnabled) {
      video.requestPictureInPicture();
    }
  });

  fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      videoContainer.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });

  // 8. Idle/Cinema Mode Logic
  function resetIdleTimer() {
    controls.classList.remove("hide");
    videoContainer.style.cursor = "default";
    clearTimeout(idleTimer);

    if (!video.paused) {
      idleTimer = setTimeout(() => {
        controls.classList.add("hide");
        videoContainer.style.cursor = "none";
      }, 3000);
    }
  }

  videoContainer.addEventListener("mousemove", resetIdleTimer);
  video.addEventListener("play", resetIdleTimer);
  video.addEventListener("pause", () => {
    clearTimeout(idleTimer);
    controls.classList.remove("hide"); // Always show when paused
  });

  // 9. Keyboard Shortcuts
  document.addEventListener("keydown", (e) => {
    // Ignore if user is typing in an input (not likely here, but good practice)
    if (document.activeElement.tagName === "INPUT") return;

    const key = e.key.toLowerCase();

    switch (key) {
      case " ":
      case "k":
        e.preventDefault(); // prevent scroll
        togglePlay();
        break;
      case "f":
        fullscreenBtn.click();
        break;
      case "m":
        muteBtn.click();
        break;
      case "arrowright":
        video.currentTime = Math.min(video.currentTime + 10, video.duration);
        break;
      case "arrowleft":
        video.currentTime = Math.max(video.currentTime - 10, 0);
        break;
    }
  });
});
