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
  pauseVideo(introVideo_element);
  pauseVideo(visitedVideo_element);
  pauseVideo(agegroupVideo_element);
  pauseVideo(interestsVideo_element);
  pauseVideo(durationVideo_element);
  pauseVideo(resultsVideo_element);
  pauseVideo(idleVideo_element);

  //Play idle video
  playVideo(idleVideo_element);
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
  // wrapper.classList.remove("hidden"); // Show Avatar
}

init();

introVideo_element.addEventListener('ended', () => {
  playVideo(idleVideo_element)
})

visitedVideo_element.addEventListener('ended', () => {
  playVideo(idleVideo_element)
})

agegroupVideo_element.addEventListener('ended', () => {
  playVideo(idleVideo_element)
})

interestsVideo_element.addEventListener('ended', () => {
  playVideo(idleVideo_element)
})

durationVideo_element.addEventListener('ended', () => {
  playVideo(idleVideo_element)
})

resultsVideo_element.addEventListener('ended', () => {
  playVideo(idleVideo_element)
})

idleVideo_element.addEventListener('ended', () => {
  playVideo(idleVideo_element)
})