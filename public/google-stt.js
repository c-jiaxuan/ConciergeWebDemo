// socket for google tts
const socket = io("https://aichat.deepbrainai.io", {
  transports: ["websocket"],
});

let isFinal = true;

// recording
let bufferSize = 2048,
  context,
  processor,
  input,
  globalStream;

let removeLastSentence = true,
  streamStreaming = false,
  googleSttText = "";

// audioStream constraints
const constraints = { audio: true, video: false };

initSocketEvent();

showRecordBtn();

// =========================== STT Callback ================================ //

function initSocketEvent() {
  socket.on("connect", function (data) {});

  socket.on("speechData", function (data) {
    const dataFinal = undefined || data.results[0].isFinal;

    if (dataFinal === false) {
      if (removeLastSentence) googleSttText = "";
      removeLastSentence = true;
    } else if (dataFinal === true && isFinal) {
      isFinal = false;

      googleSttText = "";
      googleSttText = capitalize(addTimeSettingsFinal(data));

      removeLastSentence = false;
      stopRecording(true);
    }
  });
}

// =========================== STT Setup & Function ================================ //

// recording by using Google STT and Web API
function startRecognize() {
  showTalkBtn();

  startRecording();
}

function endRecognize(hasUserInput) {
  stopRecording(hasUserInput);

  if(!hasUserInput){
    showRecordBtn();
  }
}

/* Web API with google tts start */
function startRecording(_stringArray) {
  console.log("Start record user voice");

  socket.emit("startGoogleCloudStream", { phrases: _stringArray || [] }); //init socket Google Speech Connection
  streamStreaming = true;

  // Web API initx
  context = new (window.AudioContext || window.webkitAudioContext)({
    // if Non-interactive, use 'playback' or 'balanced' // https://developer.mozilla.org/en-US/docs/Web/API/AudioContextLatencyCategory
    latencyHint: "interactive",
  });

  processor = context.createScriptProcessor(bufferSize, 1, 1);
  processor.connect(context.destination);
  context.resume();

  const handleSuccess = function (stream) {
    globalStream = stream;
    input = context.createMediaStreamSource(stream);
    input.connect(processor);
    processor.onaudioprocess = function (e) {
      microphoneProcess(e);
    };
  };

  // Older browsers might not implement mediaDevices at all, so we set an empty object first
  if (navigator.mediaDevices === undefined) navigator.mediaDevices = {};

  // Some browsers partially implement mediaDevices. We can't just assign an object
  // with getUserMedia as it would overwrite existing properties.
  // Here, we will just add the getUserMedia property if it's missing.
  if (navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      // First get ahold of the legacy getUserMedia, if present
      const getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;

      // Some browsers just don't implement it - return a rejected promise with an error
      // to keep a consistent interface
      if (!getUserMedia)
        return Promise.reject(
          new Error("getUserMedia is not implemented in this browser")
        );

      // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
      return new Promise(function (resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(handleSuccess)
    .catch(function (err) {
      console.log("media devices err", err);
    });
}

function stopRecording(hasUserInput) {
  if(!hasUserInput) return;

  console.log("Stop record user voice");

  if (!streamStreaming) return;
  streamStreaming = false;

  if (socket) socket.emit("endGoogleCloudStream", "");

  const track = globalStream?.getTracks() ? globalStream.getTracks()[0] : false;
  if (track) track.stop();

  if (input && processor) input.disconnect(processor);
  if (processor && context.destination)
    processor.disconnect(context.destination);
  if (context)
    context.close().then(function () {
      input = null;
      processor = null;
      context = null;
    });

  const userVoiceInput = googleSttText?.trim();
  console.log(userVoiceInput);

  //Send recognized text to chatbot
  if(userVoiceInput != "")
  {
    sendMessageFromSpeech(userVoiceInput);
    //Update UI to processing
    showProcessingBtn();
  }
  else
  {
    showRecordBtn();
  }

  //Set the recording to be done
  isFinal = true;
}

function microphoneProcess(e) {
  const left = e.inputBuffer.getChannelData(0);
  const left16 = downsampleBuffer(left, 44100, 16000);

  socket.emit("binaryData", left16);
}

function capitalize(s) {
  if (s.length < 1) return s;

  return s.charAt(0).toUpperCase() + s.slice(1);
}

function downsampleBuffer(buffer, sampleRate, outSampleRate) {
  if (outSampleRate == sampleRate) return buffer;
  if (outSampleRate > sampleRate)
    throw "downsampling rate show be smaller than original sample rate";

  const sampleRateRatio = sampleRate / outSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Int16Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < result.length) {
    let nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0,
      count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }

    result[offsetResult] = Math.min(1, accum / count) * 0x7fff;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }

  return result.buffer;
}

function addTimeSettingsFinal(speechData) {
  return speechData.results[0].alternatives[0].transcript;
}

// =========================== UI ================================ //
function showRecordBtn(){
  $("#speak-button-container").css("display", "block");
  $("#listening-button-container").css("display", "none");
  $("#processing-button-container").css("display", "none");
}

function showTalkBtn(){
  $("#listening-button-container").css("display", "block");
  $("#speak-button-container").css("display", "none");  
  $("#processing-button-container").css("display", "none");
}

function showProcessingBtn(){
  $("#processing-button-container").css("display", "block");
  $("#speak-button-container").css("display", "none");  
  $("#listening-button-container").css("display", "none");
}