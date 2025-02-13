// Points:
// Ancient Religions : s_a1acdf56a6b24425
// Asian Christian Art : s_97e685c0cf208a90
// Chinese Ceramics : s_8c7762afdb1bcb66
// Chinese Scholar : s_db002ef85259aad4
// Contemporary Space : s_5d0a6c1c18060579
// Demonstration Room : s_51698db2eb3f8315
// Discovery Room : s_0c8f8526e28ba398
// Empress Restaurant : s_e0a2bbd8f5b770bf
// Event Space : s_00bd271a3104f4f4
// Exhibit 2 : s_39ce5d9fef113311
// Foyer: Islamic : s_13fdaeb3dbd071c1
// Gift Shop : s_3f57889230b17cc6
// Islamic Art : s_1c02d9f72d97d43b
// Lobby : s_0bee131bd0b7e6c5
// Main Exhibit (Tang Shipwreck) : s_28d387456e1c2c01
// Ngee Ann Auditorium : s_872083c7dd73e959
// Ngee Ann Auditorium Foyer : s_157796ceca161dae
// Nursing Room : s_1e57b36bf9d022fc
// Performing Arts : s_babbb8505ac78765
// Prive Cafe : s_b9e1ec9e34ac3c88
// River Terrace (Event Space) : s_dc8c2ff535758fe2
// Rover Room (Event Space) : s_843a1b0071c43bdc
// Special Exhibitions : s_e2fc4f9211bcc155
// Toilet - Basement : s_907d3456d904777a
// Toilet - Level 1-1 : s_7e7217155ac800c7
// Toilet - Level 1-2 : s_9b4b0ff715685217
// Toilet - Level 2-1 : s_5d0a6c1c18060579
// Toilet - Level 2-2 : s_005e149ffec08138

let destinations = {};   // Dictionary to store all destinations
destinations['Ancient Religions'] = 's_a1acdf56a6b24425';
destinations['Asian Christian Art'] = 's_97e685c0cf208a90';
destinations['Chinese Ceramics'] = 's_8c7762afdb1bcb66';
destinations['Chinese Scholar'] = 's_db002ef85259aad4';
destinations['Contemporary Space'] = 's_5d0a6c1c18060579';
destinations['Demonstration Room'] = 's_51698db2eb3f8315';
destinations['Discovery Room'] = 's_0c8f8526e28ba398';
destinations['Empress Restaurant'] = 's_e0a2bbd8f5b770bf';
destinations['Event Space'] = 's_00bd271a3104f4f4';
destinations['Exhibit 2'] = 's_39ce5d9fef113311';
destinations['Foyer: Islamic'] = 's_13fdaeb3dbd071c1';
destinations['Gift Shop'] = 's_3f57889230b17cc6';
destinations['Islamic Art'] = 's_1c02d9f72d97d43b';
destinations['Tang Shipwreck'] = 's_28d387456e1c2c01';
destinations['Ngee Ann Auditorium'] = 's_872083c7dd73e959';
destinations['Ngee Ann Auditorium Foyer'] = 's_157796ceca161dae';
destinations['Nursing Room'] = 's_1e57b36bf9d022fc';
destinations['Performing Arts'] = 's_babbb8505ac78765';
destinations['Prive Cafe'] = 's_b9e1ec9e34ac3c88';
destinations['River Terrace'] = 's_dc8c2ff535758fe2';
destinations['Rover Room'] = 's_843a1b0071c43bdc';
destinations['Special Exhbitions'] = 's_e2fc4f9211bcc155';


const iframe = document.getElementById('wayfinding-iframe');

function openWayfinding() {
    document.getElementById('wayfinding-modal').classList.remove('hidden');
    iframe.src = "https://app.mappedin.com/map/67615045c7f99e000b403591?floor=m_40c34582186970e3&you-are-here=1.28717193%2C103.85180152%2Cm_40c34582186970e3";
}

function closeWayfinding() {
    document.getElementById('wayfinding-modal').classList.add('hidden');
}

function checkDestinations(stringName) {
    for (const key in destinations) {
        if(includeString(stringName, key)) {
            return destinations[key];    // Return the key of the location if there is a match
        }
    }
    return null;
}

function setDestination(destination) {
    console.log("Setting destination to: " + destination);
    iframe.contentWindow.postMessage({
        type: 'set-state',
        payload: {
            state: '/directions', // or '/'
            floor: 'm_734fce878e7c55eb',
            location: destination,
            departure: 's_0bee131bd0b7e6c5'
        }
    }, "https://app.mappedin.com/map/67615045c7f99e000b403591?floor=m_40c34582186970e3&you-are-here=1.28717193%2C103.85180152%2Cm_40c34582186970e3");
}