// Points:
// Visitor Services : s_790338f0134aeba7
// Musuem Shop : s_844cbb0fb67ee5bc 
// Changi Fortress : s_f3a6c0b32a9e0119
// Fallen Fortress : s_a3eb1f899cd66b51
// The Interned : s_2cddc378c5705861
// Life as a Prisoner of War : s_7415bd6c7b509015
// Resilience in Adversity : s_dd8ac8e5fe2a47a5
// Creativity in Adversity : s_f43736f8faf68892
// Liberation : s_cd48575f926b1082
// Legacies : s_abf9c6030b640486



let destinations = {};   // Dictionary to store all destinations
destinations['Visitor Services'] = 's_790338f0134aeba7';
destinations['Museum Shop'] = 's_844cbb0fb67ee5bc';
destinations['Changi Fortress'] = 's_f3a6c0b32a9e0119';
destinations['Fallen Fortress'] = 's_a3eb1f899cd66b51';
destinations['The Interned'] = 's_2cddc378c5705861';
destinations['Life as a Prisoner of War'] = 's_7415bd6c7b509015';
destinations['Resilience in Adversity'] = 's_dd8ac8e5fe2a47a5';
destinations['Creativity in Adversity'] = 's_f43736f8faf68892';
destinations['Liberation'] = 's_cd48575f926b1082';
destinations['Legacies'] = 's_abf9c6030b640486';

const iframe = document.getElementById('wayfinding-iframe');

function openWayfinding() {
    document.getElementById('wayfinding-modal').classList.remove('hidden');
    iframe.src = "https://app.mappedin.com/map/67ac618c9fc903000bb2dd3e?floor=m_0d8f2cd769eec5ad&you-are-here=1.36230888%2C103.97411405%2Cm_0d8f2cd769eec5ad";
}

function closeWayfinding() {
    document.getElementById('wayfinding-modal').classList.add('hidden');
}

function checkDestinations(stringName) {
    for (const key in destinations) {
        if(includeString(stringName, key)) {
            console.log("Found destination in wayfinding");
            return destinations[key];    // Return the key of the location if there is a match
        }
    }
    console.log("Unable to find destination in wayfinding");
    return null;
}

function setDestination(destination) {
    console.log("Setting destination to: " + destination);
    iframe.contentWindow.postMessage({
        type: 'set-state',
        payload: {
            state: '/directions', // or '/'
            floor: 'm_0d8f2cd769eec5ad',
            location: destination,
            departure: 's_844cbb0fb67ee5bc'
        }
    }, "https://app.mappedin.com/map/67ac618c9fc903000bb2dd3e?floor=m_0d8f2cd769eec5ad&you-are-here=1.36230888%2C103.97411405%2Cm_0d8f2cd769eec5ad");
}