// Buffer to store and track which video element is being played
var playingVideo = null;

var introVideo_element      = document.getElementById('AI-intro-video');
var visitedVideo_element    = document.getElementById('AI-visited-video');
var agegroupVideo_element   = document.getElementById('AI-agegroup-video');
var interestsVideo_element  = document.getElementById('AI-interests-video');
var durationVideo_element   = document.getElementById('AI-duration-video');
var resultsVideo_element    = document.getElementById('AI-results-video');
var idleVideo_element       = document.getElementById('AI-idle-video');

document.getElementById("start-button").addEventListener("click", function() {
  playVideo(introVideo_element)
});

function init()
{
  //Load all the video elements
  introVideo_element.load();
  visitedVideo_element.load();
  agegroupVideo_element.load();
  interestsVideo_element.load();
  durationVideo_element.load();
  resultsVideo_element.load();
  idleVideo_element.load();

  //Pause all the video elements
  // pauseVideo(introVideo_element);
  // pauseVideo(visitedVideo_element);
  // pauseVideo(agegroupVideo_element);
  // pauseVideo(interestsVideo_element);
  // pauseVideo(durationVideo_element);
  // pauseVideo(resultsVideo_element);
  // pauseVideo(idleVideo_element);

  //Play idle video
  //playVideo(idleVideo_element);
  showVideo("AI-idle-video");
}

function showVideo(videoId) {
  console.log("Showing video...");
  // Hide all videos first
  document.querySelectorAll(".premadeVideo").forEach(video => {
      video.style.display = "none";
      video.style.width = "0vw";
      video.style.height = "0vh";
      video.pause(); // Pause other videos
  });

  // Show and play the selected video
  let video = document.getElementById(videoId);
  if (video) {
      video.style.display = "block";
      video.style.width = "100vw";
      video.style.height = "100vh";
      video.play();
  }
}

// Plays a video and sets the size of the video element to the AvatarSize
function playVideo(videoToPlay)
{
  // wrapper.classList.add("hidden"); // Show Avatar
  //Check if has current video
  //If yes => pause that video + resize
  if(playingVideo != null)
  {
    pauseVideo(playingVideo);
  }
  //If no => do nothing

  //Play next video + resize
  if(videoToPlay != null)
  {
    //wrapper.classList.add("hiddenVideo"); // Hide Avatar
    videoToPlay.play();
    videoToPlay.style.width = "100vw";
    videoToPlay.style.height = "100vh";
  }

  //Update current playing video
  playingVideo = videoToPlay;
}

function startDemo () {

}

// Pause a video and reduce it's size to 0px
function pauseVideo(videoToPause) {
  if (videoToPause != null) {
    videoToPause.pause();
    videoToPause.currentTime = 0;
    videoToPause.style.width = '0px';
    videoToPause.style.height = '0px';
  }
}

function showAvatar() {
  //Pause all the video elements
  pauseVideo(introVideo_element);
  pauseVideo(visitedVideo_element);
  pauseVideo(agegroupVideo_element);
  pauseVideo(interestsVideo_element);
  pauseVideo(durationVideo_element);
  pauseVideo(resultsVideo_element);
  pauseVideo(idleVideo_element);
}

init();

introVideo_element.addEventListener('ended', () => {
  showVideo('AI-idle-video');
})

visitedVideo_element.addEventListener('ended', () => {
  showVideo('AI-idle-video');
})

agegroupVideo_element.addEventListener('ended', () => {
  showVideo('AI-idle-video');
})

interestsVideo_element.addEventListener('ended', () => {
  showVideo('AI-idle-video');
})

durationVideo_element.addEventListener('ended', () => {
  showVideo('AI-idle-video');
})

resultsVideo_element.addEventListener('ended', () => {
  showVideo('AI-idle-video');
})

idleVideo_element.addEventListener('ended', () => {
  showVideo('AI-idle-video');
})