// Variables to store user inputs
let userExperience = null;
let userAgeGroup = null;
let userInterests = [];
let userTimeSlot = [];

// Handle the first question
function handleExperience(response) {
    userExperience = response;

    // Hide step 1 and show step 2
    document.getElementById('step-1').classList.add('hidden');
    document.getElementById('step-2').classList.remove('hidden');
}

// Handle the age group selection
function handleAgeGroup(ageGroup) {
    userAgeGroup = ageGroup;

    // Hide step 2 and show step 3
    document.getElementById('step-2').classList.add('hidden');
    document.getElementById('step-3').classList.remove('hidden');
}

// Handle interests selection
function handleInterests() {
    const checkboxes = document.querySelectorAll('.interests:checked');
    userInterests = Array.from(checkboxes).map(checkbox => checkbox.value);

    // Hide step 3 and show step 4
    document.getElementById('step-3').classList.add('hidden');
    document.getElementById('step-4').classList.remove('hidden');
}

// Handle time slot selection
function handleTimeSlot() {
    const checkboxes = document.querySelectorAll('.time-slot:checked');
    userTimeSlot = Array.from(checkboxes).map(checkbox => checkbox.value);

    // Hide step 4 and show result
    document.getElementById('step-4').classList.add('hidden');
    document.getElementById('result').classList.remove('hidden');

    // Generate a personalized message
    const message = generateMessage();
    document.getElementById('output-message').innerText = message;
}

// Generate a personalized message based on user inputs
function generateMessage() {
    const interests = userInterests.join(', ') || 'no specific interests';
    const timeSlot = userTimeSlot.join(', ') || 'no specific time slot';

    return `Hello! 
    You have ${userExperience === 'yes' ? 'visited us before' : 'not visited us before'}. 
    As a ${userAgeGroup}, your interests include: \n ${interests}. \n Preferred tour durations: ${timeSlot}. 
    We hope you have a great experience!`;
}

// Back Navigation Functions
function goBackToExperience() {
    document.getElementById('step-2').classList.add('hidden');
    document.getElementById('step-1').classList.remove('hidden');
}
function goBackToAgeGroup() {
    document.getElementById('step-3').classList.add('hidden');
    document.getElementById('step-2').classList.remove('hidden');
}
function goBackToInterests() {
    document.getElementById('step-4').classList.add('hidden');
    document.getElementById('step-3').classList.remove('hidden');
}

// Restart the process
function restart() {
    // Reset variables
    userExperience = null;
    userAgeGroup = null;
    userInterests = [];
    userTimeSlot = [];

    // Reset checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Hide all steps and show step 1
    document.getElementById('result').classList.add('hidden');
    document.getElementById('step-4').classList.add('hidden');
    document.getElementById('step-3').classList.add('hidden');
    document.getElementById('step-2').classList.add('hidden');
    document.getElementById('step-1').classList.remove('hidden');
}

// Start the Guided Tour
function startGuidedTour() {
    document.getElementById('banner-image').classList.add('hidden');
    document.getElementById('landing-screen').classList.add('hidden');
    document.getElementById('step-1').classList.remove('hidden');
    document.getElementById('main-menu-button').classList.remove('hidden');
}

function goToMainMenu() {
    // Reset all variables
    userExperience = null;
    userAgeGroup = null;
    userInterests = [];
    userTimeSlot = [];

    // Reset checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Hide all steps and the result screen
    document.getElementById('step-1').classList.add('hidden');
    document.getElementById('step-2').classList.add('hidden');
    document.getElementById('step-3').classList.add('hidden');
    document.getElementById('step-4').classList.add('hidden');
    document.getElementById('result').classList.add('hidden');

    // Hide AI chat
    document.getElementById('chat-container').classList.add('hidden');

    // Show the landing screen
    document.getElementById('landing-screen').classList.remove('hidden');
    document.getElementById('container').classList.remove('hidden');
    document.getElementById('banner-image').classList.remove('hidden');
    document.getElementById('main-menu-button').classList.add('hidden');
    document.getElementById('user-options').classList.remove('user_options_1');
}

function showChatInterface() {
    console.log("show AI Chat");
    document.getElementById('main-menu-button').classList.remove('hidden');
    document.getElementById('container').classList.add('hidden');
    document.getElementById('banner-image').classList.add('hidden');
    document.getElementById('chat-container').classList.remove('hidden');
    document.getElementById('user-options').classList.add('user_options_1');
}
