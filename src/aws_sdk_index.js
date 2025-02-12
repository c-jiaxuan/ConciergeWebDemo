
//import ===
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

//UI define ===
const transcribedText = document.getElementById("AILiveInputTextVoice");
const wrapper = document.getElementById("AIPlayerWrapper");
const inputText = document.getElementById('input_text')
const inputVoice = document.getElementById('input_voice')
const arrInputs = [inputText, inputVoice]
arrInputs.forEach(element => {
  element.addEventListener("change", (event) => {
    arrInputs.forEach(e => {
      if (e.checked) {
        const inputMode = (e == inputText) ? INPUT_MODE.TEXT : INPUT_MODE.VOICE
        appCtlr.updateInputMode(inputMode)
      }
    })
  });
});


//LLM === 
const llmModelId = "anthropic.claude-3-sonnet-20240229-v1:0" //the model you set
class LLMChatbot {
  constructor() {
    this.llmClient = new BedrockRuntimeClient({
      region: 'the_region_you_set',
      credentials: {
        accessKeyId: 'your_access_key_id ',
        secretAccessKey: 'your_secret_access_key',
      }
    })
  }

  //invoke model and send
  sendMsg = async (userMessage) => {
    if (!userMessage || userMessage.trim().length < 1) {
      console.warn('No Message To Send. Return!')
      return
    }

    const payload = {
      anthropic_version: "bedrock-2023-05-31", //your version
      max_tokens: 1000, //your token setting
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: userMessage }],
        },
      ],
    };

    // Invoke Claude with the payload and wait for the response.
    const command = new InvokeModelCommand({
      contentType: "application/json",
      body: JSON.stringify(payload),
      modelId: llmModelId,
    });
    const apiResponse = await this.llmClient.send(command);

    // Decode and return the response(s)
    const decodedResponseBody = new TextDecoder().decode(apiResponse.body);
    /** @type {MessagesResponseBody} */
    const responseBody = JSON.parse(decodedResponseBody);
    return responseBody.content[0].text;
  }
}

class Transcriber {
  async startTranscribe() {
    console.log('startTranscribe')
    try {
      const { startRecording } = await import("./libs/transcribeClient.js");
      await startRecording('en-US', this.onTranscriptionDataReceived)

      return true
    } catch (error) {
      alert("An error occurred while recording: " + error.message);
      await this.stopTranscribe();
      //TODO show error popup

      return false
    }
  };

  onTranscriptionDataReceived(data) {
    appCtlr.updateTranscribingText(data)
  };

  async stopTranscribe() {
    console.log('stopTranscribe')
    const { stopRecording } = await import("./libs/transcribeClient.js");
    stopRecording();
  };
}

//AppController === 
const APP_STATE = Object.freeze({
  AI_NONE: -1,
  AI_INIT: 0,
  AI_SPEAKING_GREET: 1,
  IDLE: 2, //No transc, No llm. No ai speaking. 
  TRANSCRIBING: 3,
  LLM_RESPONDING: 4,
  AI_SPEAKING_LLM: 5,
})

const INPUT_MODE = Object.freeze({
  TEXT: 0,
  VOICE: 1
})

class AppController {
  constructor() {
    this.state = APP_STATE.NONE

    this.aiPlayerInit = false
    this.llmInit = false
    this.transcribeInit = false

    this.transcribingText = ''
    this.transcribeIntervalID = null
    this.transcribeLastUpdateTime = -1

    this.inputMode = INPUT_MODE.TEXT
  }

  getState = () => {
    return this.state
  }

  getInputMode = () => {
    return this.inputMode
  }

  onAIPlayerInit = () => {
    this.aiPlayerInit = true
    this.checkAndUpdateInitState()
  }

  onLLMInit = () => {
    this.llmInit = true
    this.checkAndUpdateInitState()
  }

  onTranscribeInit = () => {
    this.transcribeInit = true
    this.checkAndUpdateInitState()
  }

  checkAndUpdateInitState = () => {
    if (this.state == APP_STATE.NONE) {
      if (this.aiPlayerInit && this.llmInit && this.transcribeInit) {
        this.startFirstGreeting()
      }
    }
  }

  startFirstGreeting = () => {
    if (this.updateAppState(APP_STATE.AI_SPEAKING_GREET)) {
      addBotMessageLogAndSendText('Nice to meet you. Please ask me what you want to know.')
    }
  }

  onFirstGreetingComplete = () => {
    //do nothing
  }

  onNomalSpeakingComplete = () => {
    if (this.inputMode == INPUT_MODE.TEXT) {
      //do nothing
    } else {
      this.updateAppState(APP_STATE.IDLE, true)
    }
  }

  startTranscribe = async () => {
    if (this.updateAppState(APP_STATE.TRANSCRIBING)) {
      transcriber.startTranscribe()

      return true
    }

    return false
  }

  updateTranscribingText = (data) => {
    console.log('appCtlr updateTranscribingText', data, 'appState', this.state)
    if (this.state == APP_STATE.TRANSCRIBING) {
      this.transcribingText += data
      transcribedText.value = this.transcribingText
    } else {
      console.warn('updateTranscribingText but not "TRANSCRIBING" state. ignore')
    }
  }

  onTranscribeComplete = async () => {
    console.log('onTranscribeComplete text', this.transcribingText)
    const userMessage = this.transcribingText

    transcriber.stopTranscribe()
    this.transcribingText = ''

    this.updateAppState(APP_STATE.IDLE, true)

    await this.trySendMsgToLLM(userMessage)
  }

  async trySendMsgToLLM(userMessage) {
    console.log('trySendMsgToLLM text', userMessage)
    
    if (this.updateAppState(APP_STATE.LLM_RESPONDING)) {
      addUserMessageLog(userMessage)

      let textResp = await llmChatbot.sendMsg(userMessage)      
      console.log('llm text resp:', textResp)
      
      if (textResp) {
        //speak llm result. Over 50 chars, then split the sentence to synthsize!
        let target = ""
        if (textResp.length > 100) {
          const arr = textResp.split(/[.!?]/)
          arr.forEach((element) => {
            if (target.length + element.length < 100) {
              target += element
            }
          })
        } else {
          target = textResp
        }
        if (this.updateAppState(APP_STATE.AI_SPEAKING)) {
         addBotMessageLogAndSendText(target)
        } else {
          AI_PLAYER.stopSpeak()
          this.updateAppState(APP_STATE.IDLE, true)  
        }
      } else {
        this.updateAppState(APP_STATE.IDLE, true)
      }
    } else {
      console.log('trySendMsgToLLM cannot change to llm_responding')
    }
  }

  updateAppState(newState, isForce) {
    if (isForce) {
      this.state = newState
    } else {
      if ((this.state == APP_STATE.AI_SPEAKING_LLM || this.state == APP_STATE.LLM_RESPONDING) 
         && newState == APP_STATE.TRANSCRIBING) {
        return false
      } else {
        this.state = newState
      }
    }
    
    return true
  }

  updateInputMode(newMode) {
    this.inputMode = newMode

    const text = document.getElementById('AILiveTextInputChat')
    const voice = document.getElementById('AILiveVoiceInput')
    if (this.inputMode == INPUT_MODE.TEXT) {
      text.style.display = 'flex'
      voice.style.display = 'none'
    } else {
      text.style.display = 'none'
      voice.style.display = 'flex'
    }

    transcriber.stopTranscribe()
    AI_PLAYER.stopSpeak()

    if (this.inputMode == INPUT_MODE.VOICE) {
      this.updateAppState(APP_STATE.IDLE)
    }
  }
}

//Controller instaces
const appCtlr = new AppController()
const llmChatbot = new LLMChatbot()
const transcriber = new Transcriber()

appCtlr.onLLMInit()
appCtlr.onTranscribeInit()

//AIPlayer ===
const AI_PLAYER = new AIPlayer(wrapper);
const DATA = { appId: "", clientToken: "", verifiedToken: "", tokenExpire: 0, maxTextLength: 70 };

let isAIInit = false
let isAudioPreviewInit = false

// const appId = 'deepbrain.io'
// const userKey = 'bb872cb0-c6da-4c32-b68d-15ff95679837'
const authServer = 'https://account.deepbrain.io'

//TODO: set config for KB such as midServer, authServer, resourceServer, backendServer
AI_PLAYER.setConfig({
  authServer: authServer,
  // midServer: 'https://devmid.deepbrainai.io',
  midServer: 'https://aimid.deepbrain.io',
  // backendServer: "http://aih.aifc-int-dev.kbstar.com/backend",
  // resourceServer: "http://aih.aifc-int-dev.kbstar.com/resource",
  useWebSocket: false,
  // socketIoURL : '../../socket.io.js',
  isWebsocketLogOn: false,
  enableCustomVoice: false,
  logLevel: 0,
  isSkipBackmotion: false,
  enableSpeechSplit: false,
  // enablePersistantSpeechCache: false,
  // enableBGImgDB: false,
  // enableSpeechSplit: false,
  // audioPrevEncodeType: wav|mp3,
  // enableResumeWithReoladVideo: false,
  // resumeWithReloadVideoTimeLimit: 12 * 1000,
  // restAPITimeout: 7000,
  // audioPrevTimeout: 30000
  // drawFPS: 1000/16
})

//init All ===
async function initSample() {
  closePop();
  initAIPlayerEvent();
  initUI();
  await generateClientToken();
  await generateVerifiedToken();

  if (!DATA.appId || !DATA.verifiedToken) return;
  await startAI();
}

// =========================== AIPlayer Setup ================================ //
async function generateClientToken() {
  const result = await makeRequest(
    "GET",
    "/api/generateJWT"
    // `${authServer}/api/aihuman/generateClientToken?appId=${appId}&userKey=${userKey}`
  );
  console.log("generateClientToken:", result);

  if (result?.appId && result?.token) {
    DATA.clientToken = result.token;
    DATA.appId = result.appId;
  } else {
    console.log("generateClientToken Error:", result);
    showPop("generateClientToken Error", result?.aiError?.message);
  }
}

async function generateVerifiedToken() {
  if (!DATA.appId || !DATA.clientToken) return;

  const result = await AI_PLAYER.generateToken({
    appId: DATA.appId,
    token: DATA.clientToken,
  });
  if (result?.succeed) {
    DATA.verifiedToken = result.token;
    DATA.tokenExpire = result.tokenExpire;
    DATA.defaultAI = result.defaultAI;
  } else {
    console.log("generateVerifiedToken Error:", result);
    showPop("generateVerifiedToken Error", result?.aiError?.message);
    DATA.verifiedToken = "";
  }
}

// if token is expired, get refresh clientToken, verifiedToken
async function refreshTokenIFExpired() {
  const afterExpired = moment().unix() + 60 * 60; // compare expire after 1 hour. set the time as your token refresh policy
  if (!DATA.tokenExpire || DATA.tokenExpire <= afterExpired) {
    await generateVerifiedToken();

    if (!DATA.verifiedToken) {
      // if clientToken is expired, get clientToken again
      await generateClientToken();
      await generateVerifiedToken();
    }
  }
}

async function startAI() {
  if (!DATA.appId || !DATA.verifiedToken) return;
  await refreshTokenIFExpired();
  initUI();

  await AI_PLAYER.init({
    aiName: DATA.defaultAI.ai_name,
    size: 1.0,
    left: 0,
    top: 0,
    speed: 1.0,
  });
}

// =========================== AIPlayer Callback ================================ //
function initAIPlayerEvent() {
  //@deprecated : do not use any more!!!
  AI_PLAYER.onAIPlayerError = function (err) {
  };

  //@deprecated : do not use any more!!!
  AI_PLAYER.onAIPlayerStateChanged = async function (state, detail = "") {
  };

  AI_PLAYER.onAIPlayerLoadingProgressed = function (result) {
    $("#AIPlayerStateText").text(
      `AI Resource Loading... ${result.loading || 0}%`
    );
    console.log(`AI Resource Loading... ${result.loading || 0}%`);
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
    AI_RECONNECT_ATTEMPT: 15,
    AI_RECONNECT_FAILED: 16,
    AI_VISIBILITY_SHOW_COMPLETE: 17,
    AI_VISIBILITY_HIDDEN_COMPLETE: 18,
    UNKNOWN: -1,
  });

  const AIPlayerState = Object.freeze({
    NONE: 0,
    INITIALIZE: 1,
    IDLE: 2,
    PLAY: 3,
    PAUSE: 4,
    RELEASE: 5,
  });

  let curAIState = AIPlayerState.NONE;
  AI_PLAYER.onAIPlayerEvent = function (aiEvent) {
    let typeName = "";
    switch (aiEvent.type) {
      case AIEventType.AIPLAYER_STATE_CHANGED:
        typeName = "AIPLAYER_STATE_CHANGED";
        let newAIState = AI_PLAYER.getState();
        if (
          curAIState == AIPlayerState.INITIALIZE &&
          newAIState == AIPlayerState.IDLE
        ) {
          $("#aiList").removeAttr("disabled");
          $("#AIPlayerStateText").text("AI initialization completed.");

          isAIInit = true
          console.log("AI initialization completed.");

          appCtlr.onAIPlayerInit()
        }
        curAIState = newAIState;
        break;
      case AIEventType.AI_CONNECTED:
        typeName = "AI_CONNECTED";
        $("#AIPlayerStateText").text("AI Connected.");
        break;
      case AIEventType.RES_LOAD_STARTED:
        typeName = "RES_LOAD_STARTED";
        $("#AIPlayerStateText").text("AI Resource loading started.");
        $("#aiList").attr("disabled", "disabled");
        break;
      case AIEventType.RES_LOAD_COMPLETED:
        typeName = "RES_LOAD_COMPLETED";
        $("#AIPlayerStateText").text("AI Resource loading completed.");
        break;
      case AIEventType.AICLIPSET_PLAY_PREPARE_STARTED:
        typeName = "AICLIPSET_PLAY_PREPARE_STARTED";
        $("#AIPlayerStateText").text("AI started preparation to speak.");
        break;
      case AIEventType.AICLIPSET_PLAY_PREPARE_COMPLETED:
        typeName = "AICLIPSET_PLAY_PREPARE_COMPLETED";
        $("#AIPlayerStateText").text("AI finished preparation to speak.");
        break;
      case AIEventType.AICLIPSET_PRELOAD_STARTED:
        typeName = "AICLIPSET_PRELOAD_STARTED";
        $("#AIPlayerStateText").text("AI started preparation to preload.");
        break;
      case AIEventType.AICLIPSET_PRELOAD_COMPLETED:
        typeName = "AICLIPSET_PRELOAD_COMPLETED";
        $("#AIPlayerStateText").text("AI finished preparation to preload.");
        break;
      case AIEventType.AICLIPSET_PLAY_STARTED:
        typeName = "AICLIPSET_PLAY_STARTED";
        $("#AIPlayerStateText").text("AI started speaking.");
        break;
      case AIEventType.AICLIPSET_PLAY_COMPLETED:
        typeName = "AICLIPSET_PLAY_COMPLETED";
        $("#AIPlayerStateText").text("AI finished speaking.");

        if (appCtlr.getState() == APP_STATE.AI_SPEAKING_GREET) {
          appCtlr.onFirstGreetingComplete()
        } else {
          appCtlr.onNomalSpeakingComplete()
        }
        break;
      case AIEventType.AI_DISCONNECTED:
        typeName = "AI_DISCONNECTED";
        $("#AIPlayerStateText").text(
          "AI Disconnected. Please wait or reconnect"
        );
        break;
      case AIEventType.AICLIPSET_PRELOAD_FAILED:
        typeName = "AICLIPSET_PRELOAD_FAILED";
        $("#AIPlayerStateText").text("AI preload failed.");
        break;
      case AIEventType.AICLIPSET_PLAY_FAILED:
        typeName = "AICLIPSET_PLAY_FAILED";
        $("#AIPlayerStateText").text("AI play failed.");
        break;
      case AIEventType.AICLIPSET_PLAY_BUFFERING:
        typeName = "AICLIPSET_PLAY_BUFFERING";
        $("#AIPlayerStateText").text("AI is buffering.");
        break;
      case AIEventType.AICLIPSET_RESTART_FROM_BUFFERING:
        typeName = "AICLIPSET_RESTART_FROM_BUFFERING";
        $("#AIPlayerStateText").text("AI is restarted from buffering.");
        break;
      case AIEventType.AI_RECONNECT_ATTEMPT:
        typeName = "AI_RECONNECT_ATTEMPT";
        $("#AIPlayerStateText").text("AI is reconnecting.");
        break;
      case AIEventType.AI_RECONNECT_FAILED:
        typeName = "AI_RECONNECT_FAILED";
        $("#AIPlayerStateText").text(
          "AI is failed to reconnect. Please try to call 'reconnect(callback)'"
        );
        break;
      case AIEventType.AI_VISIBILITY_SHOW_COMPLETE:
        typeName = "AI_VISIBILITY_SHOW_COMPLETE";
        $("#AIPlayerStateText").text("AI is shown complete.");

        //resume after this event!
        if (isAudioPreviewInit) { //for audio mode 
          AI_PLAYER.resumeAudioPreview()
        }
        if (isAIInit) { //for mov mode 
          AI_PLAYER.resume()
        }
        break
      case AIEventType.AI_VISIBILITY_HIDDEN_COMPLETE:
        typeName = "AI_VISIBILITY_HIDDEN_COMPLETE";
        $("#AIPlayerStateText").text("AI is hidden complete.");
        break
      case AIEventType.UNKNOWN:
        typeName = "UNKNOWN";
        break;
    }

    console.log("onAIPlayerEvent:", aiEvent.type, typeName, "clipSet:", aiEvent.clipSet);
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
    let codeName = "UNKNOWN_ERR";
    if (aiError.code >= AIErrorCode.RESERVED_ERR) {
      codeName = "RESERVED_ERR";
    } else if (aiError.code >= AIErrorCode.AICLIPSET_PLAY_ERR) {
      codeName = "AICLIPSET_PLAY_ERR";
    } else if (aiError.code >= AIErrorCode.AICLIPSET_PRELOAD_ERR) {
      codeName = "AICLIPSET_PRELOAD_ERR";
    } else if (aiError.code >= AIErrorCode.INVALID_AICLIPSET_ERR) {
      codeName = "INVALID_AICLIPSET_ERR";
    } else if (aiError.code >= AIErrorCode.AI_INIT_ERR) {
      codeName = "AI_INIT_ERR";
    } else if (aiError.code >= AIErrorCode.AI_RES_ERR) {
      codeName = "AI_RES_ERR";
    } else if (aiError.code >= AIErrorCode.AI_SERVER_ERR) {
      codeName = "AI_SERVER_ERR";
    } else if (aiError.code >= AIErrorCode.AI_API_ERR) {
      codeName = "AI_API_ERR";
    } else if (aiError.code > AIErrorCode.UNKNOWN_ERR) {
      //0 ~ 9999
      codeName = "BACKEND_ERR";

      if (aiError.code == 1402) {
        //invalid or token expired
        refreshTokenIFExpired();
      }
    }

    console.log("onAIPlayerErrorV2", aiError.code, codeName, aiError.message);
    showPop(codeName, "code:" + aiError.code + " message:" + aiError.message);
  };
}

// =========================== AIPlayer Function ================================ //

// =========================== UI ================================ //
function initUI() {
  //Nothing 
}

async function addBotMessageLogAndSendText(text, gst) {
  addBotMessageLog(text)

  await refreshTokenIFExpired();
  AI_PLAYER.send({ text, gst });
}

function addBotMessageLog(text, image) {
  const log = document.createElement("div");
  log.className = "message-log-bot-container";
  log.style = "display: flex; margin: 5px 70px 5px 5px";

  let htmlStr = "";
  htmlStr += '<img style="height:25px" src="https://playchat-files.s3.ap-northeast-2.amazonaws.com/5ac32b78bbe3d7e01fe5b252/bot-icon.png">\n';
  htmlStr += `<div style="background-color: grey; border-radius: 10px; padding: 0.3vmax; font-size: 0.8vmax;">${text}</div>`;
  if (image) htmlStr += `<img class="message-log-image" src="${image}">`;
  htmlStr += "</div>";

  log.innerHTML = htmlStr;

  $("#AILiveMessageLog").append(log);
  adjustScroll();
}

function addUserMessageLog(text) {
  const log = document.createElement("div");
  log.className = "message-log-user-container";
  log.style = "display: flex; flex-direction: row-reverse; margin: 5px 5px 5px 70px";

  let htmlStr = "";
  htmlStr += '<img style="height:25px" class="message-log-icon-image" src="https://playchat-files.s3.ap-northeast-2.amazonaws.com/5ac32b78bbe3d7e01fe5b252/user-icon.png">\n';
  htmlStr += `<div style="background-color: grey; border-radius: 10px; padding: 0.3vmax; font-size: 0.8vmax;">${text}</div>`;

  log.innerHTML = htmlStr;

  $("#AILiveMessageLog").append(log);
  adjustScroll();

  document.getElementById('AILiveInputText').value = ''
}

function adjustScroll() {
  setTimeout(function () {
    $("#AILiveMessageLog").scrollTop(
      $("#AILiveMessageLog").prop("scrollHeight")
    );
  }, 0);
}

function showPop(title = "Error", content = "Unknown Error") {
  $("#popTitle").html(title);
  $("#popContent").html(content);
  $("#popModel").css("display", "");
}

window.closePop = () => {
  $("#popModel").css("display", "none");
}

window.onTextSendBtnClick = () => {
  console.log('onTextSendBtnClick')
  appCtlr.trySendMsgToLLM(document.getElementById('AILiveInputText').value)
}

window.onStartBtnClick = async () => {
  console.log('startbtn', document.getElementById('StartButton'), document.getElementById('cover_layer'))
  document.getElementById('StartButton').innerText = 'Starting! Please wait...'
  await initSample()
  document.getElementById('cover_layer').style.display = 'none'
}

window.onTranscribeBtnClick = async () => {
  const state = appCtlr.getState()
  if (state == APP_STATE.IDLE) {
    const isStarted = await appCtlr.startTranscribe()
    if (isStarted) {
      document.getElementById('AILiveRecordButton').innerText = 'Send'
      transcribedText.value = 'Please speak now...'
    } else {
      showPop("Can't start trascribe now. Please refresh the page.")
    }
  } else {
    if (state == APP_STATE.TRANSCRIBING) {
      document.getElementById('AILiveRecordButton').innerText = 'Record'
      transcribedText.value = ''

      appCtlr.onTranscribeComplete()
    } else {
      //ignore.. LLM, SPEAK case
    }
  } 
}

// =========================== ETC ================================ //

async function makeRequest(method, url, params) {
  const options = {
    method,
    headers: { "Content-Type": "application/json; charSet=utf-8" },
    // mode: "no-cors",
  };

  if (method === "POST") options.body = JSON.stringify(params || {});

  return fetch(url, options)
    .then((response) => response.json())
    .then((data) => data)
    .catch((error) => {
      console.error("** An error occurred during the fetch", error);
      return undefined;
    });
}