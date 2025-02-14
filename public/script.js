const wrapper = document.getElementById('AIPlayerWrapper');
const authServer = 'https://account.aistudios.com';
const AI_PLAYER = new AIPlayer(wrapper);
const appId = 'conciergewebdemo.onrender.com';
const userKey = '8e7123a9-7b87-4dfc-a520-df0a812cf535';

AI_PLAYER.setConfig({
  authServer: authServer,
  midServer: 'https://aimid.deepbrain.io/',
  // resourceServer: 'https://resource.deepbrainai.io',
  // backendServer: 'https://backend.deepbrainai.io',
});

const DATA = {};

initSample();

async function initSample() {
  initAIPlayerEvent();
  await generateClientToken();
  await generateVerifiedToken();

  await AI_PLAYER.init({
    aiName: "M000320746_BG00007441H_light",
    size: 1.0,
    left: 0,
    top: 0,
    speed: 1.0,
  });
}

// =========================== AIPlayer Setup ================================ //

async function generateClientToken() {
  const result = await makeRequest(
    'GET',
    `${authServer}/api/aihuman/generateClientToken?appId=${appId}&userKey=${userKey}`,
  );

  if (result?.succeed) {
    DATA.clientToken = result.token;
    DATA.appId = result.appId;
  } else {
    console.log('generateClientToken Error:', JSON.stringify(result));
  }
}

async function generateVerifiedToken() {
  const result = await AI_PLAYER.generateToken({ appId: DATA.appId, token: DATA.clientToken });

  if (result?.succeed) {
    DATA.verifiedToken = result.token;
    DATA.tokenExpire = result.tokenExpire;
    DATA.defaultAI = result.defaultAI;
  } else {
    console.log('generateVerifiedToken Error: ' + JSON.stringify(result));
  }
}

// if token is expired, get refresh clientToken, verifiedToken
async function refreshTokenIFExpired() {
  const afterExpired = moment().unix() + 60 * 60; // compare expire after 1 hour
  if (!DATA.tokenExpire || DATA.tokenExpire <= afterExpired) {
    await generateVerifiedToken();

    if (!DATA.verifiedToken) {
      // if clientToken is expired, get clientToken again
      await generateClientToken();
      await generateVerifiedToken();
    }
  }
}

// =========================== AIPlayer Callback ================================ //

function initAIPlayerEvent() {
  // TODO: AIPlayer error handling
  AI_PLAYER.onAIPlayerError = function (err) {
    // err => string || { succeed: false, errorCode: 1400, error: "...", description: "...", detail: "..." }
    // console.log('on AIPlayer Error: ', err);
  };

  // TODO: AIPlayer Loading State Change Handling
  AI_PLAYER.onAIPlayerStateChanged = function (state) {
    if (state === 'playerLoadComplete') {
      const customVoice = AI_PLAYER.findCustomVoice("amazon/en-US/Female_Danielle");

      // Set custom voice will cause issues with the AI speaking
      const isSuccess = AI_PLAYER.setCustomVoice(customVoice); 
      console.log(isSuccess ? "Successfully set custom voice" : "Unsuccessful in setting custom voice");
      const customVoice_check = AI_PLAYER.getCustomVoice();
      if (customVoice_check == null) {
        console.log("custom voice is not set");
      }

      // preloadAllMessages();
      countDictionary();
      preloadTest();
    }
  };

  //AIEvent & callback
  const AIEventType = Object.freeze({
    RES_LOAD_STARTED: 0,
    RES_LOAD_COMPLETED: 1,
    AICLIPSET_PLAY_PREPARE_STARTED: 2,
    AICLIPSET_PLAY_PREPARE_COMPLETED: 3,
    AICLIPSET_PRELOAD_STARTED: 4,
    AICLIPSET_PRELOAD_COMPLETED: 5,
    AICLIPSET_PRELOAD_FAILED: 6,
    AICLIPSET_PLAY_STARTED: 7,
    AICLIPSET_PLAY_COMPLETED: 8,
    AICLIPSET_PLAY_FAILED: 9,
    AI_CONNECTED: 10,
    AI_DISCONNECTED: 11,
    AICLIPSET_PLAY_BUFFERING: 12,
    AICLIPSET_RESTART_FROM_BUFFERING: 13,
    AIPLAYER_STATE_CHANGED: 14,
    UNKNOWN: -1,
  });

  AI_PLAYER.onAIPlayerEvent = function (aiEvent) {
    let typeName = '';
    switch (aiEvent.type) {
      case AIEventType.AIPLAYER_STATE_CHANGED:
        typeName = 'AIPLAYER_STATE_CHANGED';
        break;
      case AIEventType.AI_CONNECTED:
        typeName = 'AI_CONNECTED';
        break;
      case AIEventType.RES_LOAD_STARTED:
        typeName = 'RES_LOAD_STARTED';
        break;
      case AIEventType.RES_LOAD_COMPLETED:
        typeName = 'RES_LOAD_COMPLETED';
        break;
      case AIEventType.AICLIPSET_PLAY_PREPARE_STARTED:
        typeName = 'AICLIPSET_PLAY_PREPARE_STARTED';
        // $('#AIPlayerStateText').text('AI started preparation to speak.');
        break;
      case AIEventType.AICLIPSET_PLAY_PREPARE_COMPLETED:
        typeName = 'AICLIPSET_PLAY_PREPARE_COMPLETED';
        // $("#AIPlayerStateText").text("AI finished preparation to speak.");
        break;
      case AIEventType.AICLIPSET_PRELOAD_STARTED:
        typeName = 'AICLIPSET_PRELOAD_STARTED';
        preloadFlag = false; // Set preloadFlag to False, to signal that server is not open
        console.log("AIEventType.AICLIPSET_PRELOAD_STARTED => preloadFlag state: " + preloadFlag);
        // $("#AIPlayerStateText").text("AI started preparation to preload.");
        break;
      case AIEventType.AICLIPSET_PRELOAD_COMPLETED:
        typeName = 'AICLIPSET_PRELOAD_COMPLETED';
        preloadFlag = true; // Set preloadFlag to True, to signal that server is open
        console.log("AIEventType.AICLIPSET_PRELOAD_COMPLETED => preloadFlag state: " + preloadFlag);
        preloadCount++;
        checkForFinishedPreloading();
        // $("#AIPlayerStateText").text("AI finished preparation to preload.");
        break;
      case AIEventType.AICLIPSET_PLAY_STARTED:
        typeName = 'AICLIPSET_PLAY_STARTED';
        // $("#AIPlayerStateText").text("AI started speaking.");
        break;
      case AIEventType.AICLIPSET_PLAY_COMPLETED:
        typeName = 'AICLIPSET_PLAY_COMPLETED';
        //$("#AIPlayerStateText").text("AI finished speaking.");
        break;
      case AIEventType.AI_DISCONNECTED:
        typeName = 'AI_DISCONNECTED';
        // $("#AIPlayerStateText").text("AI Disconnected. Please wait or reconnect");
        break;
      case AIEventType.AICLIPSET_PRELOAD_FAILED:
        typeName = 'AICLIPSET_PRELOAD_FAILED';
        // $("#AIPlayerStateText").text("AI preload failed.");
        break;
      case AIEventType.AICLIPSET_PLAY_FAILED:
        typeName = 'AICLIPSET_PLAY_FAILED';
        // $("#AIPlayerStateText").text("AI play failed.");
        break;
      case AIEventType.AICLIPSET_PLAY_FAILED:
        typeName = 'AICLIPSET_PLAY_FAILED';
        // $("#AIPlayerStateText").text("AI play failed.");
        break;
      case AIEventType.AICLIPSET_PLAY_BUFFERING:
        typeName = 'AICLIPSET_PLAY_BUFFERING';
        // $("#AIPlayerStateText").text("AI is buffering.");
        break;
      case AIEventType.AICLIPSET_RESTART_FROM_BUFFERING:
        typeName = 'AICLIPSET_RESTART_FROM_BUFFERING';
        // $("#AIPlayerStateText").text("AI is restarted from buffering.");
        break;
      case AIEventType.UNKNOWN:
        typeName = 'UNKNOWN';
        break;
    }

    console.log('onAIPlayerEvent:', aiEvent.type, typeName, 'clipSet:', aiEvent.clipSet);
    return;
  };

  //AIError & callback
  const AIErrorCode = Object.freeze({
    AI_API_ERR: 10000,
    AI_SERVER_ERR: 11000,
    AI_RES_ERR: 12000,
    AI_INIT_ERR: 13000,
    INVALID_AICLIPSET_ERR: 14000,
    AICLIPSET_PRELOAD_ERR: 15000,
    AICLIPSET_PLAY_ERR: 16000,
    RESERVED_ERR: 17000,
    UNKNOWN_ERR: -1,
  });

  AI_PLAYER.onAIPlayerErrorV2 = function (aiError) {
    let codeName = 'UNKNOWN_ERR';
    if (aiError.code >= AIErrorCode.RESERVED_ERR) {
      codeName = 'RESERVED_ERR';
    } else if (aiError.code >= AIErrorCode.AICLIPSET_PLAY_ERR) {
      codeName = 'AICLIPSET_PLAY_ERR';
    } else if (aiError.code >= AIErrorCode.AICLIPSET_PRELOAD_ERR) {
      codeName = 'AICLIPSET_PRELOAD_ERR';
    } else if (aiError.code >= AIErrorCode.INVALID_AICLIPSET_ERR) {
      codeName = 'INVALID_AICLIPSET_ERR';
    } else if (aiError.code >= AIErrorCode.AI_INIT_ERR) {
      codeName = 'AI_INIT_ERR';
    } else if (aiError.code >= AIErrorCode.AI_RES_ERR) {
      codeName = 'AI_RES_ERR';
    } else if (aiError.code >= AIErrorCode.AI_SERVER_ERR) {
      codeName = 'AI_SERVER_ERR';
    } else if (aiError.code >= AIErrorCode.AI_API_ERR) {
      codeName = 'AI_API_ERR';
    } else if (aiError.code > AIErrorCode.UNKNOWN_ERR) {
      //0 ~ 9999
      codeName = 'BACKEND_ERR';

      if (aiError.code == 1402) {
        //invalid or token expired
        refreshTokenIFExpired();
      }
    }

    console.log('onAIPlayerErrorV2', aiError.code, codeName, aiError.message);
  };
}

// =========================== AIPlayer Function ================================ //

async function speak(text, gst) {
  await refreshTokenIFExpired();

  console.log("Gesture: " + gst + " Speaking: ", text);

  AI_PLAYER.send({ text: text, gst: gst });
}

async function preload(clipSet) {
  await refreshTokenIFExpired();

  AI_PLAYER.preload(clipSet);
}

function pause() {
  AI_PLAYER.pause();
}

function resume() {
  AI_PLAYER.resume();
}

function stop() {
  AI_PLAYER.stopSpeak();
}

async function sendPreload(text, gst) {
  // Wait for the flag to be set
  await waitForFlag();

  // Once the flag is set, proceed with the preloading logic
  return new Promise((resolve) => {
    setTimeout(() => {
      // preload({ text, gst }).then();
      AI_PLAYER.preload({ text: text, gst: gst });
      preloadFlag = false; // Set prelaod flag to False, signalling that the server is busy
      console.log("preloadFlag state: " + preloadFlag);
      resolve(); // Signal that the task is complete
      }, 100); // Simulate an asynchronous operation
  });
}

// =========================== ETC ================================ //

// sample Server request function
async function makeRequest(method, url, params) {
  const options = { method, headers: { 'Content-Type': 'application/json; charSet=utf-8' } };

  if (method === 'POST') options.body = JSON.stringify(params || {});

  return fetch(url, options)
    .then((response) => response.json())
    .then((data) => data)
    .catch((error) => {
      console.error('** An error occurred during the fetch', error);
      showPop('Generate Client Token Error', `no client token can be generated.`);
      return undefined;
    });
}

// Buffer to store and track which video element is being played
var playingVideo = null;

var tourVideo_element       = document.getElementById('AI-tour-video');
var introVideo_element      = document.getElementById('AI-intro-video');
var visitedVideo_element    = document.getElementById('AI-visited-video');
var agegroupVideo_element   = document.getElementById('AI-agegroup-video');
var interestsVideo_element  = document.getElementById('AI-interests-video');
var durationVideo_element   = document.getElementById('AI-duration-video');
var resultsVideo_element    = document.getElementById('AI-results-video');
var idleVideo_element       = document.getElementById('AI-idle-video');

function init()
{
  //Load all the video elements
  tourVideo_element.load();
  introVideo_element.load();
  visitedVideo_element.load();
  agegroupVideo_element.load();
  interestsVideo_element.load();
  durationVideo_element.load();
  resultsVideo_element.load();
  idleVideo_element.load();

  //Pause all the video elements
  pauseVideo(tourVideo_element);
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
  pauseVideo(tourVideo_element);
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
 
tourVideo_element.addEventListener('ended', () => {
  playVideo(idleVideo_element)
})

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
