class AI_Message {
    // Constructor method for initializing properties
    constructor(message, gesture) {
        this.message = message;
        this.gesture = gesture;
    }
}

var processing_status = null;
let processingSpeak = false;

var substring_1 = "prisoners of war";
var substring_2 = "liberation";
var substring_3 = "wayfinding";
var substring_4 = "where is the ";  // Prefix for asking to wayfind to somewhere eg, "where is the Museum Shop"

let botMessages = {};   // Dictionary to store all preset bot messages
botMessages["start_msg"] = new AI_Message("Hello! Welcome to the Changi Chapel Museum. How can I help you today?", "G05");
botMessages["greeting_msg"] = new AI_Message("Hi! Let me know if you have any questions, you can input your questions into the input box, or by using the \"Speak to AI\" button");
botMessages["premade_tour_response"] = new AI_Message("Here is a tour you might be interested in!", "G02");
botMessages["default_msgs"] = [new AI_Message("I am not sure what you have sent, please try again."),
                                new AI_Message("I don't quite understand what you are saying, please try again.")
                                ];
botMessages["prompt_msgs"] = new AI_Message("Let me know if you require any further help!", "G02");
botMessages["followup_prompt"] = new AI_Message("Here are some follow up questions you might be interested to ask!", "G02");
botMessages["tour_setup_msgs"] = new AI_Message("Did I get your tour preferences correctly? If it is please click on the proceed with tour button.", "G04");
botMessages["wayfinding_msgs"] = [new AI_Message("Where would you like to head to?"),
                                new AI_Message("This is how to get to your destination", "G04"),
                                new AI_Message("There does not seem to be a destination with that name.")
                                ];

botMessages["processing_msg"] = new AI_Message("Thank you! Please wait while I'm processing your question and I will reply to you shortly");


// GO2 - Left Hand
// GO3 - Right Hand
// G04 - Both Hands
// G05 - Hands together

// LLMs API Settings
// Change these to change the LLMs response
var bot_app = "sgroots"; // Don't change this
var bot_tone = "Succinct"; // Professional, Casual, Enthusiastic, Informational, Funny, Succinct
var bot_format = "Summary"; // Summary, Report, Bullet Points, LinkedIn Post, Email
var bot_language = "English";
var bot_followup = true;

var llm_summarise_api_url = 'https://gramener.com/docsearch/summarize';

// Used to store followup questions
var g_bot_response = null;
var g_follow_up_questions = null;

// To track how many messages have been preloaded
var preloadCount = 0;
var totalMessages = 0;

let startedChat = false;

// To track whether the user is in the wayfinding mode
let wayfindingMode = false;

const chatBody = document.getElementById('chat-history-container');
const userInput = document.getElementById('input');

const USER_BUBBLE = 'message user';
const BOT_BUBBLE = 'message bot'

const now = new Date();
const dateString = now.toLocaleDateString();
const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// To store the destination for wayfinding
var destination = "";

function countDictionary() {
    // Loop through the dictionary
    for (const key in botMessages) {
        if (botMessages.hasOwnProperty(key)) {
            const value = botMessages[key];
            if (Array.isArray(value)) {
                // If the value is an array, loop through its elements
                value.forEach(async (item, index) => {
                    totalMessages++;
                });
            } else {
                totalMessages++;
            }
        }
    }
}

function preloadTest() {
    // Multi Gesture preload
    let preloadArr = []; // Initialize an empty array
    let obj;

    // Loop through the dictionary to create array of objects to preload
    for (const key in botMessages) {
        if (botMessages.hasOwnProperty(key)) {
            const value = botMessages[key];
            if (Array.isArray(value)) {
                // If the value is an array, loop through its elements
                value.forEach(async (item, index) => {
                    obj = {text: item.message, gst: item.gesture};
                    preloadArr.push(obj);
                });
            } else {
                obj = {text: value.message, gst: value.gesture};
                preloadArr.push(obj);
            }
        }
    }

    // Preload the array
    AI_PLAYER.preload(preloadArr);
}

function checkForFinishedPreloading() {
    console.log("Checking if preloaded finish against " + totalMessages + " items ...");
    if (preloadCount >= totalMessages) {
        console.log("Finished preloading all " + preloadCount + " messages");
        // Uncommented since switched to using videos
        // speak(botMessages["start_msg"].message, botMessages["start_msg"].gesture);
    }
}

function suggestTour() {
    
}

function tourFinalSpeech() {
    speak(botMessages["tour_setup_msgs"].message, botMessages["tour_setup_msgs"].gesture);
}

function tourSetupSpeak(stage) {
    console.log("tourSetupSpeak: " + botMessages["tour_setup_msgs"][stage]);
    speak(botMessages["tour_setup_msgs"][stage].message, botMessages["tour_setup_msgs"][stage].gesture);
}

function beginChat() {
    if (!startedChat) {
        console.log("Beginning chat");
        botMessage(botMessages["greeting_msg"].message, botMessages["greeting_msg"].gesture, false);
        startedChat = true;
    }
}

function sendMessage() {
    console.log("Sending message to bot");
    
    const message = userInput.value.trim();
    if (message === '') return;

    // Add user message

    createMsgBubble(USER_BUBBLE, message);

    createProcessingStatusText();
    processing_status.innerHTML = `<span>Retrieving Answer...</span><div class="message-time">${dateString} ${timeString}</div>`;
    chatBody.appendChild(processing_status);

    userInput.value = '';

    // Scroll to the bottom
    chatBody.scrollTop = chatBody.scrollHeight;

    botResponse(message);
}

function sendMessageFromSpeech(message){
    console.log("Sending message to bot");

    // Add user message
    const userMessage = document.createElement('div');
    userMessage.className = 'message user';
    userMessage.innerHTML = `<span>${message}</span><div class="message-time">${dateString} ${timeString}</div>`;
    chatBody.appendChild(userMessage);

    createProcessingStatusText();
    processing_status.innerHTML = `<span>Retrieving Answer...</span><div class="message-time">${dateString} ${timeString}</div>`;
    chatBody.appendChild(processing_status);

    userInput.value = '';

    // Scroll to the bottom
    chatBody.scrollTop = chatBody.scrollHeight;

    botResponse(message);
}

// Takes in response from user input and replies based on input
// Takes in a bool 'prompt' for whether to prompt the user for more input
function botResponse(response) 
{
    var bot_reply = null;
    var prompt = true;
    var lowerCase_response = response.toLowerCase();
    var code = null;
    if (!wayfindingMode) {
        if (lowerCase_response.includes(substring_4)) {
            wayfindingMode = true;
            var destination = extractLocationFromInput(lowerCase_response);
            code = checkDestinations(destination);
            if (code == null) {
                bot_reply = botMessages['wayfinding_msgs'][2];
            } else {
                bot_reply = botMessages['wayfinding_msgs'][1];
            }
            prompt = false;
        } else if (includeString(response, 'wayfinding')) {
            bot_reply = botMessages['wayfinding_msgs'][0];
            wayfindingMode = true;
            prompt = false;
        } else {
            // bot_reply = getRandomElement(botMessages["default_msgs"]);
            var response = postAPI(response);
            prompt = false;
        }
    } else {
        code = checkDestinations(response.toLowerCase());
        if (code == null) {
            bot_reply = botMessages['wayfinding_msgs'][2];
        } else {
            bot_reply = botMessages['wayfinding_msgs'][1];
        }
        prompt = false;
    }

    if (bot_reply != null) {
        setTimeout(() => {

            showRecordBtn(true);
            showTalkBtn(false);
            showProcessingBtn(false);

            speak(bot_reply.message, bot_reply.gesture);

            var botMessageDiv = createMsgBubble(BOT_BUBBLE, bot_reply.message);

            const botSpan = botMessageDiv.querySelector('span');
            // After typing finishes, swap to HTML with bold formatting
            botSpan.innerHTML = bot_reply.message.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')

            if (prompt == true) {
                var prompt_msg = botMessages["prompt_msgs"];
                botMessage(prompt_msg.message, prompt_msg.gesture, false);
            }
            if (wayfindingMode && code != null) {
                console.log("Opening wayfinding map");
                openWayfinding();
                // Handle messages from the iframe to update the URL
                window.addEventListener('message', (event) => {
                    if (event.data.type === 'app-loaded') {
                        console.log("Iframe has loaded!");
                        setDestination(code);
                        wayfindingMode = false;
                    }
                });
            }

            processing_status?.remove();
            processing_status = null;

            // Scroll to the bottom
            chatBody.scrollTop = chatBody.scrollHeight;
        });
    }

    showTalkBtn();
}

// Takes in a message to be sent by the bot
let flagTriggered = false;
// Takes in a message to be sent by the bot
function botMessage(setMessage, gesture, delay) {
    if(delay)
    {
        registerNextSpeak(setMessage.toString());
        setTimeout(() => {
            // Event listener for early trigger
            function flagHandler() {
                flagTriggered = true;
                console.log(Error, "Flag triggered");
                document.removeEventListener("AICLIPSET_PLAY_STARTED", flagHandler); // Clean up
            }
        
            document.addEventListener("AICLIPSET_PLAY_STARTED", flagHandler)
    
            new Promise((resolve) => {
                // Check for 7 seconds timeout
                const timeout = setTimeout(() => {
                    console.log(Error, "Timeout return");
                    document.removeEventListener("AICLIPSET_PLAY_STARTED", flagHandler);
                    showBotMessage();
                    resolve();
                }, 7000);
    
                // Check every 300ms
                const interval = setInterval(() => {
                    if(flagTriggered){
                        console.log(Error, "flag return");
                        flagTriggered = false;
                        clearTimeout(timeout);
                        clearInterval(interval);
                        showBotMessage();
                        document.removeEventListener("AICLIPSET_PLAY_STARTED", flagHandler); // Clean up
                        resolve();
                    }
                }, 300);
            });
    
            function showBotMessage(){
                showRecordBtn();

                var botMessageDiv = createMsgBubble(BOT_BUBBLE, setMessage);

                const botSpan = botMessageDiv.querySelector('span');
                // After typing finishes, swap to HTML with bold formatting
                botSpan.innerHTML = setMessage.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    
                processing_status?.remove();
                processing_status = null;
    
                if (g_follow_up_questions != null) {
                    const followupMessageElement = createMsgBubble(BOT_BUBBLE, "");
                    const followupSpan = followupMessageElement.querySelector('span');
    
                    let header = document.createElement("p");
                    //**Add avatar talking**
                    header.textContent = "Some common follow-up questions:";
                    header.style.fontWeight = "bold"; // Make header bold
                    followupSpan.append(header);
                    
                    // Loop through follow-up questions and create bullet points
                    g_follow_up_questions.forEach(question => {
                        let li = document.createElement("li");
                        li.textContent = question;
                        followupSpan.appendChild(li);
                    });
                    console.log("Follow up questions found, sending follow up question...");
                    //botMessage(g_follow_up_questions[0]);
                    g_follow_up_questions = null;
                }
    
                // Scroll to the bottom
                chatBody.scrollTop = chatBody.scrollHeight;
            }
        }, 5500);
    }
    else
    {
        speak(setMessage.toString(), gesture);
        showRecordBtn();

        var botMessageDiv = createMsgBubble(BOT_BUBBLE, setMessage);
        const botSpan = botMessageDiv.querySelector('span');
        // After typing finishes, swap to HTML with bold formatting
        botSpan.innerHTML = setMessage.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

        processing_status?.remove();
        processing_status = null;

        if (g_follow_up_questions != null) {
            const followupMessageElement = createMsgBubble(USER_BUBBLE, "");
            const followupSpan = followupMessageElement.querySelector('span');

            let header = document.createElement("p");
            //**Add avatar talking**
            header.textContent = "Some common follow-up questions:";
            header.style.fontWeight = "bold"; // Make header bold
            followupSpan.append(header);
            
            // Loop through follow-up questions and create bullet points
            g_follow_up_questions.forEach(question => {
                let li = document.createElement("li");
                li.textContent = question;
                followupSpan.appendChild(li);
            });
            console.log("Follow up questions found, sending follow up question...");
            //botMessage(g_follow_up_questions[0]);
            g_follow_up_questions = null;
        }

        // Scroll to the bottom
        chatBody.scrollTop = chatBody.scrollHeight;
    }
}

function postAPI(message) {
    console.log("posting API...");

    const payload = {
        "app": bot_app,
        "q": message + ". Summarise in 2 short sentences",
        "context": "Add context from matches. Use the format:\n\nDOC_ID: 1\nTITLE: (title)\n(page_content)\n\nDOC_ID: 2\nTITLE: ...\n...",
        "Followup": bot_followup,
        "Tone": bot_tone,
        "Format": bot_format,
        "Language": bot_language
    };

    // Make API call
    fetch(llm_summarise_api_url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        // Handle response
        if (response.ok) {
            return response.json(); // Parse JSON response
        } else {
            throw new Error('Network response was not ok ' + response.statusText);
        }
    })
    .then(data => {
        console.log('Success:', data);

        // Safely extract message content
        let messageContent = data.choices?.[0]?.message?.content || "No content available";

        // Remove follow-up questions header and inline references like [[1](#1)]
        messageContent = messageContent.replace(/\*\*Follow-up questions:\*\*/i, '').trim();
        messageContent = messageContent.replace(/\[\[\d+\]\(#\d+\)\]/g, '').trim();

        // Extract follow-up questions (optional, if present)
        const followUpQuestions = messageContent.match(/- \[.*?\]/g)?.map(question => question.slice(3, -1)) || [];

        // Remove follow-up questions from the main content
        if (followUpQuestions.length > 0) {
            const splitIndex = messageContent.indexOf('- ['); // Find where follow-up starts
            messageContent = messageContent.substring(0, splitIndex).trim(); // Keep only the main content
        }

        // Output results
        console.log("Cleaned Message Content:", messageContent);
        console.log("Follow-Up Questions:", followUpQuestions);

        // Send the message
        if (messageContent == "") {
            messageContent = getRandomElement(botMessages['default_msgs']).message;
        }
        else{
            speak(botMessages["processing_msg"].message, botMessages["processing_msg"].gesture);
            processingSpeak=true;
        }

        processing_status.innerHTML = `<span>Processing the answer...</span><div class="message-time">${dateString} ${timeString}</div>`;

        // Send the message
        botMessage(messageContent, "", true);

        g_bot_response = messageContent;
        g_follow_up_questions = followUpQuestions;

        // setTimeout - botMessage
        // if user havent inputted anything in 20 seconds
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function createMsgBubble(userID, message) {
    const botMessageDiv = document.createElement('div');
    botMessageDiv.className = userID;
    botMessageDiv.innerHTML = `<span>${message}</span><div class="message-time">${dateString} ${timeString}</div>`;
    chatBody.appendChild(botMessageDiv);
    return botMessageDiv;
}

function extractLocationFromInput(input) {
    if (input.toLowerCase().startsWith(substring_4)) {
        return input.slice(substring_4.length).trim();
    }
    return null; // Return null if the format doesn't match
}

function getRandomElement(arr) {
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
}

function includeString(source, keyword) {
    var L_src = source.toLowerCase();
    var L_key = keyword.toLowerCase();
    return (L_src.includes(L_key));
}

function createProcessingStatusText(){
    processing_status = document.createElement('div');
    processing_status.className = 'message user';
    processing_status.id = 'processing_status';
    return processing_status;
}