const { RTM } = AgoraRTM;
let rtm;
var options = {
    appid: null,
    uid: null,
    token: null
};

var isLoggedIn = false;

var users = [];

let mainChannel = "BiddingRootChannel"; // All users will join this root channel to receive RTM events

var currentAuctionItem = {
  id: generateUUID(), // Generate a UUID for the new poll
  majorRevision: -1,
  auctionName: "(Example) Testing Auction Title",
  startingPrice: 0,
  currentBid: 0,
  highestBidder: "User1",
  lastUpdatedTimeStamp: Math.floor(Date.now() / 1000) // Current timestamp in seconds
};

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
              // $("#sectionSubscribe").show();  // Show subscribe section after login 

              // Refresh poll
              renderPoll();
              $('#sectionPoll').show(); //
              $('#createPollBtn').show(); 
            }
      
          } catch (error) {
            $('#login').text('Login'); 
            console.error(error);
          } 
    }else { 
        agoraLogoutRTM();

        $('#login').text('Login'); // Change button text back to 'Login'
        $('#sectionPoll').hide(); // hide poll section 
        $('#createPollBtn').hide();
    }
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
    // rtm.addEventListener("message", handleRTMMessageEvent);
    rtm.addEventListener("presence", handleRTMPresenceEvent);
    rtm.addEventListener("storage", handleRTMMetaDataEvent)
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

async function sendBidPrice(bidPrice) { 
  if (currentAuctionItem.majorRevision > 0) { 
    if(bidPrice < currentAuctionItem.currentBid) { 
      // Submitted bid price lower than current bid price
      return false 
    }

    const metaDataItems = [
      {
        key : "auctionName", value : auctionName
      },
      {
        key : "currentBid", value : bidPrice.toString()
      },
      {
        key : "highestBidder", value : options.uid,
      }, 
      {
        key : "lastUpdatedTimeStamp", value : Math.floor(Date.now() / 1000).toString(),
      }
    ];
  
    const metaOptions = { 
      majorRevision : await agoraFetchMajorRevision(),
      addTimeStamp : true,
      addUserId : true
    }
  
    try {
      const result = await rtm.storage.updateChannelMetadata(channelName, "MESSAGE", metaDataItems, metaOptions);
      console.log(result);
      return true
    } catch (status) {
      console.log(status);
      return false
    }

  }
}

async function agoraPublishNewAuction(auctionName, staringPrice) { 
  const metaDataItems = [
    {
      key : "auctionName", value : auctionName
    },
    {
      key : "startingPrice", value : staringPrice.toString(),
    },
    {
      key : "currentBid", value : staringPrice.toString()
    },
    {
      key : "highestBidder", value : options.uid,
    }, 
    {
      key : "lastUpdatedTimeStamp", value : Math.floor(Date.now() / 1000).toString(),
    }
  ];

  const metaOptions = { 
    majorRevision : await agoraFetchMajorRevision(),
    addTimeStamp : true,
    addUserId : true
  }

  try {
    const result = await rtm.storage.setChannelMetadata(mainChannel, "MESSAGE", metaDataItems, metaOptions);
    console.log(result);
  } catch (status) {
    console.log(status);
  }
}

async function agoraFetchMajorRevision() {
  try {
    const result = await rtm.storage.getChannelMetadata(mainChannel, "MESSAGE");
    console.log(result);
    return result.majorRevision
  } catch (status) {
      console.log(status);
      return 0 
  }
}

async function agoraDeleteAuctionStorage() {
  const metaDataItems = [
    {
      key : "auctionName",
    },
    {
      key : "startingPrice",
    },
    {
      key : "currentBid",
    },
    {
      key : "highestBidder",
    }, 
    {
      key : "lastUpdatedTimeStamp",
    }
  ];

  const metaOptions = { 
    data: metaDataItems,
    majorRevision : await agoraFetchMajorRevision(),
  }

  try {
      const result = await rtm.storage.removeChannelMetadata(channelName, "MESSAGE", metaOptions);
      console.log(result);
  } catch (status) {
      console.log(status);
  }
}

function UpdateAuctionFromRemoteUsers(metadataItems, majorRevision) {
  // When auction is updated
  
  // if let auctionName = metadataItems.first(where: {$0.key == "auctionName"})?.value, let auctionStartingPrice = Int(metadataItems.first(where: {$0.key == "startingPrice"})?.value ?? "0") {
  //     print("UpdateAuction name \(auctionName) starting \(auctionStartingPrice)")
  //     let auctionName : String = auctionName
  //     let startPrice : Int = auctionStartingPrice
  //     let currentBid : Int = Int(metadataItems.first(where: {$0.key == "currentBid"})?.value ?? "0") ?? startPrice
  //     let highestBidder : String = metadataItems.first(where: {$0.key == "highestBidder"})?.value ?? ""
  //     let lastUpdatedTimeStamp : Int = Int(metadataItems.first(where: {$0.key == "timeIntervalSince1970"})?.value ?? "0") ?? 0
      
  //     currentAuctionItem = CustomAuctionItem(majorRevision: majorRevision, auctionName: auctionName, startingPrice: startPrice, currentBid: currentBid, highestBidder: highestBidder, lastUpdatedTimeStamp: lastUpdatedTimeStamp)
  // }
  
}



function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
  });
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

function handleRTMMetaDataEvent(event) { 
  const channelType = event.channelType; // Which channel type it is, Should be "STREAM", "MESSAGE" or "USER".
  const channelName = event.channelName; // Which channel does this event come from
  const publisher = event.publisher; // Who trigger this event
  const storageType = event.storageType; // Which category the event is, should be 'USER'、'CHANNEL'
  const action = event.eventType; // Which action it is ,should be one of "SNAPSHOT"、"SET"、"REMOVE"、"UPDATE" or "NONE"
  const data = event.data; // 'USER_METADATA' or 'CHANNEL_METADATA' payload
  const timestamp = event.timestamp; // Event timestamp
}
// window.onload = renderPoll;
