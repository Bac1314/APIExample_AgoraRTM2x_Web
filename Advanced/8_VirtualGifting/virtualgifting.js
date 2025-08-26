const { RTM } = AgoraRTM;

let rtm;

var options = {
    appid: null,
    uid: null,
    token: null
};

var isLoggedIn = false;

var users = [];
var gifts = []

let mainChannel = "VirtualGiftingRootChannel"; // All users will join this root channel to receive RTM events
let customGiftType = "giftMessage"

const giftAssets = [
  { name: "yougo", file: "yougo.png" },
  { name: "flower1", file: "flower1.png" },
  { name: "flowers2", file: "flowers2.png" },
  { name: "present", file: "present.png" },
  { name: "gold1", file: "gold1.png" },
  { name: "gold2", file: "gold2.png" },
  { name: "heart1", file: "heart1.png" },
  { name: "fireworks1", file: "fireworks1.png" }
];

// MARK: BUTTON EVENT LISTENERS
$("#login").click(async function (e) {
    e.preventDefault();

    if(!isLoggedIn) { 
        try {
            options.uid = $("#uid").val();
            options.appid = $("#appid").val();
            options.token = $("#token").val();
      
            // Check if any field is empty
            if (!options.uid || !options.appid) {
              alert("Please fill in all the fields: UID, and AppID.");
            }
            else { 
                $('#login').text('Setting up...'); 
                await agoraSetupRTM(); // Init RTM, setup event listeners

                $('#login').text('Logging in...'); 
                await agoraLoginRTM(); // Login to RTM 

                $('#login').text('Subscribing channel...'); 
                await agoraSubscribeChannel(mainChannel); // Subscribe to root channel events 

                $('#login').text('Logout'); 
                $('#main').show(); 
            }
      
          } catch (error) {
            $('#login').text('Login'); 
            console.error(error);
          } 
    }else { 
        agoraLogoutRTM();

        $('#login').text('Login'); // Change button text back to 'Login'
        $('#main').hide(); 
    }
});


$("#sendButton").click(function () {
  const message = $("#messageInput").val().trim();

  if (message !== "") {
    agoraPublishMessage(message); // Publish the message asynchronously
    $("#messageInput").val(""); // Clear the input field after sending
  }
});


// On page load, render gifts
$(document).ready(function() {
  renderGiftList();
  $("#gift-list").on("click", ".gift-img-btn", function() {
    const giftName = $(this).data("gift");
    animateGift(giftName);
    agoraPublishGiftMessage(giftName);
  });
});

// MARK: AGORA FUNCTIONS
async function agoraSetupRTM() {
    // Initialize the RTM client.
    try {
      rtm = new RTM(options.appid, options.uid);
    } catch (status) {
      alert("Setup RTM failed " + status);
      console.log(status);
    }

    // Setup Event Listeners
    rtm.addEventListener("message", handleRTMMessageEvent);
    rtm.addEventListener("presence", handleRTMPresenceEvent);
    rtm.addEventListener("linkState", handleRTMLinkStateEvent);

  }

async function agoraLoginRTM() {

  // Log in the RTM server.
  try {
      const result = await rtm.login({  token: options.token == null ? options.appid : options.token });
      console.log(result);
      isLoggedIn = true;
    } catch (status) {
      alert("Login RTM failed " + status);
      console.log(status); 
    }
}

function agoraLogoutRTM() {
  // Log out from the RTM server.
  try {
      const result = rtm.logout(); // Call the logout method
      console.log(result);
      isLoggedIn = false; // Update the login status
  } catch (status) {
    alert("Logout RTM failed " + status);
      console.log(status);
  }
};


async function agoraSubscribeChannel(channelName) { 
  try {
      const result = await rtm.subscribe(channelName);
      console.log(result);
    } catch (status) {
      alert("Subscribe to " + channelName + " failed " + status);
      console.log(status);
    }
}

async function agoraUnSubscribeChannel(channelName) { 
  try {
      const result = await rtm.unSubscribeChannel(channelName);
      console.log(result);
    } catch (status) {
      console.log(status);
    }
}

async function agoraPublishGiftMessage(giftName) {
//   const newGift = {
//     id: generateUUID(),
//     userID: options.uid,
//     gift: giftName,
//     timestamp: Math.floor(Date.now() / 1000)
//   };
//   const newGiftJsonString = JSON.stringify(newGift);
  const publishOptions = {
    customType: customGiftType,
    channelType: 'MESSAGE'
  };
  try {
    await rtm.publish(mainChannel, giftName, publishOptions);
  } catch (status) {
    alert("Publish Message failed " + status);
    console.log(status);
  }
}

// Helper to get asset path
function getGiftAssetPath(file) {
  return "../../Assets/" + file;
}

// Render gift selection grid
function renderGiftList() {
  const $giftList = $("#gift-list");
  $giftList.empty();
  giftAssets.forEach(gift => {
    $giftList.append(`
      <button class="gift-img-btn" data-gift="${gift.name}">
        <img src="${getGiftAssetPath(gift.file)}" alt="${gift.name}" title="${gift.name}">
      </button>
    `);
  });
}

// Animate gift floating up
function animateGift(giftName) {
  const gift = giftAssets.find(g => g.name === giftName);
  if (!gift) return;
  const img = document.createElement("img");
  img.src = getGiftAssetPath(gift.file);
  img.className = "gift-float";
  img.alt = giftName;
  document.body.appendChild(img);
  setTimeout(() => img.remove(), 1600);
}

function appendReceivedGift(giftName, sender) {
  const gift = giftAssets.find(g => g.name === giftName);
  if (!gift) return;
  const $msgBox = $("#gift-messages");
  const $giftMsg = $(`
    <div class="gift-message-row" style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
      <img src="${getGiftAssetPath(gift.file)}" alt="${giftName}" title="${giftName}" style="width:32px;height:32px;">
      <span><b>${sender}</b> sent a <i>${giftName}</i></span>
    </div>
  `);
  $msgBox.append($giftMsg);
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
  });
}

// MARK: AGORA EVENT LISTENERS
function handleRTMMessageEvent(event) {
    const channelType = event.channelType; // Which channel type it is, Should be "STREAM", "MESSAGE" or "USER".
    const channelName = event.channelName; // Which channel does this message come from
    const topic = event.topicName; // Which Topic does this message come from, it is valid when the channelType is "STREAM".
    const messageType = event.messageType; // Which message type it is, Should be "STRING" or "BINARY".
    const customType = event.customType; // User defined type
    const publisher = event.publisher; // Message publisher
    const message = event.message; // Message payload
    const timestamp = event.timestamp; // Event timestamp

    // Handle the message here (e.g., log it, update UI, etc.)
    console.log(`Bac's Received message from ${publisher}: ${message}`);

    // In RTM Web, Local user will also receive their own message, local UI is handled somewhere else
    if (channelType == "MESSAGE") { 
        if (customType == customGiftType) { 

            const newGift = {
                id: generateUUID(),
                userID: publisher,
                gift: message,
                timestamp: Math.floor(Date.now() / 1000)
            };
            // const newGift = JSON.parse(message);
            gifts.push(newGift);
            animateGift(newGift.gift); // Animate on receive
            appendReceivedGift(newGift.gift, publisher); // <-- Add this line
        }
    }
    
}

function handleRTMPresenceEvent(event) {
    const action = event.eventType; // Which action it is ,should be one of 'SNAPSHOT'、'INTERVAL'、'JOIN'、'LEAVE'、'TIMEOUT、'STATE_CHANGED'、'OUT_OF_SERVICE'.
    const channelType = event.channelType; // Which channel type it is, Should be "STREAM", "MESSAGE" or "USER".
    const channelName = event.channelName; // Which channel does this event come from
    const publisher = event.publisher; // Who trigger this event
    const states = event.stateChanged; // User state payload, only for stateChanged event
    const interval = event.interval; // Interval payload, only for interval event
    const snapshot = event.snapshot; // Snapshot payload, only for snapshot event
    const timestamp = event.timestamp; // Event timestamp

    console.log(`Bac's Presence message from ${publisher}: ${action} ${snapshot}`);

    // const chnIndex = channels.findIndex(u => u.channelName === channelName);
    const userFound = users.find(customUser => customUser.publisher === publisher);
    const userIndex = users.findIndex(customUser => customUser.publisher === publisher);

    switch (action) {
        case 'REMOTE_JOIN':
            // Add user to the array
            if (userFound) { 
              return;
            }else { 
              const newUser = new CustomRTMUser(channelType, channelName, publisher, states);
              users.push(newUser);
            }

            
            break;
        case 'REMOTE_LEAVE':
            // Remove user from the array (assuming publisher is unique)
            if (userIndex !== -1) {
              users.splice(userIndex, 1);
            }
            break;
        case 'REMOTE_STATE_CHANGED':
            // Update user state if they already exist
            if (userFound) {
              userFound.states = stateChanged; // Update the state
            }
            break;

        case 'SNAPSHOT':
            // Populate the users array from the snapshot

            users.length = 0; // Reset the users

            snapshot.forEach(userSnapshot => {

              console.log("Bac's usersnapshot " + userSnapshot);
              const user = new CustomRTMUser(
                  channelType,
                  channelName,
                  userSnapshot.userId,
                  userSnapshot.states
              );
              users.push(user);
            });

            break;

        // Handle other actions as needed
        default:
            console.log(`Unhandled action: ${action}`);
            break;
    }
}

function handleRTMLinkStateEvent(event) { 
    const currentState = event.currentState;
    const previousState = event.previousState;
    const serviceType = event.serviceType;
    const operation = event.operation;
    const reason = event.reason;
    const affectedChannels = event.affectedChannels;
    const unrestoredChannels = event.unrestoredChannels;
    const timestamp = event.timestamp;
    const isResumed = event.isResumed;

    $('#rtmlinkstate').text(currentState);
}

