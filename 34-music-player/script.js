/* --- Select DOM Elements --- */
const trackArt = document.getElementById("track-art");
const trackName = document.getElementById("track-name");
const trackArtist = document.getElementById("track-artist");

const playPauseBtn = document.getElementById("playpause-btn");
const nextBtn = document.getElementById("next-btn");
const prevBtn = document.getElementById("prev-btn");

const seekSlider = document.getElementById("seek-slider");
const volumeSlider = document.getElementById("volume-slider");
const currTime = document.getElementById("current-time");
const totalDuration = document.getElementById("total-duration");

/* --- Global Variables --- */
let track_index = 0;
let isPlaying = false;
let updateTimer;

// Create the Audio Element
const curr_track = document.createElement("audio");

/* --- Music List (Dummy Data) --- */
// Using free-to-use placeholder music for demonstration
const track_list = [
  {
    name: "Summer Breeze",
    artist: "Sunny Days",
    image:
      "https://images.unsplash.com/photo-1459749411177-712964916e49?w=300&h=300&fit=crop",
    path: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    name: "Night Drive",
    artist: "Midnight Echo",
    image:
      "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=300&h=300&fit=crop",
    path: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    name: "Electronic Vibe",
    artist: "Tech Beat",
    image:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
    path: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
];

/* --- Loading Logic --- */

function loadTrack(track_index) {
  // Clear previous timer
  clearInterval(updateTimer);
  resetValues();

  // Load new track
  curr_track.src = track_list[track_index].path;
  curr_track.load();

  // Update UI
  trackArt.src = track_list[track_index].image;
  trackName.textContent = track_list[track_index].name;
  trackArtist.textContent = track_list[track_index].artist;

  // Set Interval for progress updates
  updateTimer = setInterval(seekUpdate, 1000);

  // Add event listener for when track ends
  curr_track.addEventListener("ended", nextTrack);

  // Setup MediaSession (OS/Browser Lock Screen Controls)
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track_list[track_index].name,
      artist: track_list[track_index].artist,
      artwork: [
        {
          src: track_list[track_index].image,
          sizes: "300x300",
          type: "image/jpeg",
        },
      ],
    });

    navigator.mediaSession.setActionHandler("play", playTrack);
    navigator.mediaSession.setActionHandler("pause", pauseTrack);
    navigator.mediaSession.setActionHandler("previoustrack", prevTrack);
    navigator.mediaSession.setActionHandler("nexttrack", nextTrack);
  }
}

function resetValues() {
  currTime.textContent = "00:00";
  totalDuration.textContent = "00:00";
  seekSlider.value = 0;
}

/* --- Control Functions --- */

function playpauseTrack() {
  if (!isPlaying) playTrack();
  else pauseTrack();
}

function playTrack() {
  curr_track.play();
  isPlaying = true;

  // Update Icon
  playPauseBtn.innerHTML = '<i class="fas fa-pause-circle fa-4x"></i>';
  // Add rotation animation to art
  trackArt.classList.add("rotate");
}

function pauseTrack() {
  curr_track.pause();
  isPlaying = false;

  playPauseBtn.innerHTML = '<i class="fas fa-play-circle fa-4x"></i>';
  trackArt.classList.remove("rotate");
}

function nextTrack() {
  if (track_index < track_list.length - 1) track_index += 1;
  else track_index = 0;

  loadTrack(track_index);
  playTrack();
}

function prevTrack() {
  if (track_index > 0) track_index -= 1;
  else track_index = track_list.length - 1;

  loadTrack(track_index);
  playTrack();
}

function seekTo() {
  // Calculate position in seconds based on slider percentage
  let seekto = curr_track.duration * (seekSlider.value / 100);
  curr_track.currentTime = seekto;
}

function setVolume() {
  curr_track.volume = volumeSlider.value / 100;
}

/* --- UI Update Logic --- */

function seekUpdate() {
  let seekPosition = 0;

  if (!isNaN(curr_track.duration)) {
    seekPosition = curr_track.currentTime * (100 / curr_track.duration);
    seekSlider.value = seekPosition;

    // Calculate timestamps
    let currentMinutes = Math.floor(curr_track.currentTime / 60);
    let currentSeconds = Math.floor(
      curr_track.currentTime - currentMinutes * 60,
    );
    let durationMinutes = Math.floor(curr_track.duration / 60);
    let durationSeconds = Math.floor(
      curr_track.duration - durationMinutes * 60,
    );

    // Add leading zeros
    if (currentSeconds < 10) {
      currentSeconds = "0" + currentSeconds;
    }
    if (durationSeconds < 10) {
      durationSeconds = "0" + durationSeconds;
    }
    if (currentMinutes < 10) {
      currentMinutes = "0" + currentMinutes;
    }
    if (durationMinutes < 10) {
      durationMinutes = "0" + durationMinutes;
    }

    currTime.textContent = currentMinutes + ":" + currentSeconds;
    totalDuration.textContent = durationMinutes + ":" + durationSeconds;
  }
}

/* --- Event Listeners --- */

playPauseBtn.addEventListener("click", playpauseTrack);
nextBtn.addEventListener("click", nextTrack);
prevBtn.addEventListener("click", prevTrack);

// Seek slider interaction
seekSlider.addEventListener("change", seekTo);

// Volume slider interaction
volumeSlider.addEventListener("input", setVolume);

// Keyboard Shortcuts
document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault(); // Stop scrolling
    playpauseTrack();
  } else if (event.code === "ArrowRight") {
    nextTrack();
  } else if (event.code === "ArrowLeft") {
    prevTrack();
  }
});

/* --- Initialize Player --- */
loadTrack(track_index);
