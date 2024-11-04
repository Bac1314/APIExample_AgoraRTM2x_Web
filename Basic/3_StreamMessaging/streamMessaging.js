const { RTM } = AgoraRTM;

let rtm;
let agoraStreamChannel;

var options = {
    appid: null,
    uid: null,
    token: null, 
    rtctoken: null
};
var isLoggedIn = false;
var streamChannelName = "ChannelA"
var selectedTopic = "selectedTopic";
var topics = [];


// MARK: BUTTON EVENT LISTENERS
$("#login").click(async function (e) {
    e.preventDefault();

    if(!isLoggedIn) { 
        try {
            options.uid = $("#uid").val();
            options.appid = $("#appid").val();
            options.token = $("#token").val();
            options.rtctoken = $("#rtctoken").val();
      
            // Check if any field is empty
            if (!options.uid || !options.appid || !options.token || !options.rtctoken) {
              alert("Please fill in all the fields: UID, AppID, rtm token, and rtc token");
            }
            else { 
              $('#login').text('Logging in'); 

              await agoraSetupRTM();
              await agoraLoginRTM();
              await agoraJoinStreamChannel();

              $('#login').text('Logout'); 
              $("#sectionSubscribe").show();  // Show subscribe section after login 
            }
      
          } catch (error) {
            $('#login').text('Login'); 
            console.error(error);
          } 
    }else { 
        agoraLogoutRTM();

        $('#login').text('Login'); // Change button text back to 'Login'
        $("#sectionSubscribe").hide(); // hide subscribe section 
        $("#sectionMessages").hide(); // hide messages section
    }
});

$("#sendButton").click(function () {
  const message = $("#messageInput").val().trim();

  if (message !== "") {
    agoraPublishMessage(message); // Publish the message asynchronously
    $("#messageInput").val(""); // Clear the input field after sending
  }
});

$("#subscribeBtn").click(async function() {
  try { 
    let topicName = $("#topicInput").val();

    if (topicName) { 
      // Create custom channel, and push it to the list BEFORE subscribe, because Snapshot triggers immediate after subscribe
      const customTopic = new CustomRTMTopic(topicName, [], []);
      topics.push(customTopic);

      // Join topic as publisher
      await agoraJoinTopic(topicName);

      // Subscribe topic to receive messages
      await agoraSubscribeTopic(topicName);

      // Clear the input field after subscribing
      $("#topicInput").val(""); 

      // Change target channel name
      $('#selectedTopic').text(topicName); 

      loadTopicMessages(topicName);
    }

    // If there is channels, show the Messages Section
    if (topics.length > 0) { 
      $("#sectionMessages").show(); // 
    }

  } catch (error) {
    console.error(error);

    let topicName = $("#topicInput").val();

    // If there are errors, remove the channels added above
    const topicIndex = topics.findIndex(customTopic => customTopic.topicName === topicName);
    if (topicIndex !== -1) {
      topicIndex.splice(topicIndex, 1);
    }
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
    rtm.addEventListener("topic", handleRTMTopicEvent);
    rtm.addEventListener("message", handleRTMMessageEvent);
    rtm.addEventListener("presence", handleRTMPresenceEvent);
    rtm.addEventListener("linkState", handleRTMLinkStateEvent);

}

async function agoraJoinStreamChannel(){ 
    const streamOptions ={
      token : options.rtctoken,
      withPresence : true,
      beQuiet : false,
      withMetadata : false,
      withLock : false
  };
  try {
    agoraStreamChannel = await rtm.createStreamChannel(streamChannelName);

    const result = await agoraStreamChannel.join(streamOptions);
    console.log(result);
  } catch (status) {
      console.log(status);
  }
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

      topics.length = 0 // Reset the array
      selectedTopic = "selectedTopic"; 
  } catch (status) {
    alert("Logout RTM failed " + status);
      console.log(status);
  }
};

// Join topic as publisher
async function agoraJoinTopic(topicName) { 
  try {
      const result = await agoraStreamChannel.joinTopic(topicName, null);
      console.log(result);
    } catch (status) {
      alert("Join to " + topicName + " failed " + status);
      console.log(status);
    }
}

// Subscribe topic to receive messages
async function agoraSubscribeTopic(topicName){ 
  try {
    // Randomly subscribe to 64 publishers
    const result = await agoraStreamChannel.subscribeTopic(topicName);

    const topicFound = topics.find(customTopic => customTopic.topicName === topicName);

    if (topicFound) { 
      topicFound.users = result.succeedUsers;
    }else{ 
      console.log("Bac's handleRTMTopicEvent topic NOT found");
    }
  

    console.log(result);
  } catch (status) {
    alert("Subscribe to " + topicName + " failed " + status);
    console.log(status);
  }
}

async function agoraLeaveTopic(topicName) { 
  try {
    const result = await agoraStreamChannel.leaveTopic(topicName);


    console.log(result);
  } catch (status) {
    console.log(status);
  }
}

async function agoraPublishMessage(message) {
  // const payload = { type: "text", message: message };
  // const publishMessage = JSON.stringify(payload);
  try {
    const result = await agoraStreamChannel.publishTopicMessage(selectedTopic, message);
    console.log(result);

    const topicFound = topics.find(customTopic => customTopic.topicName === selectedTopic);

    if (topicFound) { 
      const customMessage = new CustomRTMMessage(message, options.uid);
      topicFound.messages.push(customMessage);

      loadTopicMessages(selectedTopic);
    }else{ 
      console.log("Bac's handleRTMMessageEvent topic NOT found");
    }
  
  } catch (status) {
    alert("Publish Message failed " + status);
    console.log(status);
  }
}


async function agoraSubscribeNewUsers(topicName) { 
  try {
    // Randomly subscribe to 64 publishers
    const result = await agoraStreamChannel.subscribeTopic(topicName);
    console.log(result);
  } catch (status) {
    alert("Subscribe to " + topicName + " failed " + status);
    console.log(status);
  }
}

// Render the channel list
function renderTopicsList() {
  const topicListElement = document.getElementById('topic-list');
  topicListElement.innerHTML = ''; // Clear previous content

  topics.forEach(topic => {
      const topicItem = document.createElement('div');
      topicItem.className = 'topic-item';

      // Check if this channel is the selected one
      if (topic.topicName === selectedTopic) {
        topicItem.classList.add('selected-topic'); // Use classList.add
      } else {
        topicItem.classList.remove('selected-topic'); // Use classList.remove
      }
      
      topicItem.textContent = `${topic.topicName} #${topic.users.length}`;
      topicItem.onclick = function() {
        loadTopicMessages(topic.topicName);
      }; // on click listener
      topicListElement.appendChild(topicItem);
  });
}

// Load the target channel messages
function loadTopicMessages(targetTopic) {

  selectedTopic = targetTopic;
  $('#selectedTopic').val(targetTopic); 

  // Rerender channel list to show selected channel
  renderTopicsList();
  
  $('#chat-box').empty(); // Clear previous messages

  const topicFound = topics.find(topic => topic.topicName === targetTopic);

  topicFound.messages.forEach(customMessage => {
    const messageContainer = $("<div></div>").addClass("message");
    const senderNameElement = $("<div></div>").addClass("sender-name").text(customMessage.publisher);
    const messageElement = $("<div></div>").text(customMessage.message);
  
    // Append sender's name and message
    messageContainer.append(senderNameElement);
    messageContainer.append(messageElement);
  
    if (customMessage.publisher === options.uid) {
        messageContainer.addClass("local-message-alignment");
        messageElement.addClass("local-message-design")
    } else {
        messageContainer.addClass("remote-message-alignment");
        messageElement.addClass("remote-message-design")
    }
  
    // Append the message container to the chat box
    $("#chat-box").append(messageContainer);
  
    // Scroll to the bottom of the chat box
    $("#chat-box").scrollTop($("#chat-box")[0].scrollHeight);
  });

}

// MARK: AGORA EVENT LISTENERS

function handleRTMMessageEvent(event) {
  const channelType = event.channelType; // Which channel type it is, Should be "STREAM", "MESSAGE" or "USER".
  const channelName = event.channelName; // Which channel does this message come from
  const topicName = event.topicName; // Which Topic does this message come from, it is valid when the channelType is "STREAM".
  const messageType = event.messageType; // Which message type it is, Should be "STRING" or "BINARY".
  const customType = event.customType; // User defined type
  const publisher = event.publisher; // Message publisher
  const message = event.message; // Message payload
  const timestamp = event.timestamp; // Event timestamp

  // Handle the message here (e.g., log it, update UI, etc.)
  console.log(`Bac's Received message from ${publisher}: topic: ${topicName} message: ${message}`);

  const topicFound = topics.find(customTopic => customTopic.topicName === topicName);

  if (topicFound) { 
    const customMessage = new CustomRTMMessage(message, publisher);
    topicFound.messages.push(customMessage);

    loadTopicMessages(topicName);
  }else{ 
    console.log("Bac's handleRTMMessageEvent topic NOT found");
  }
  
}


function handleRTMTopicEvent(event) {
    const action = event.evenType; // Which action it is ,should be one of 'SNAPSHOT'、'JOIN'、'LEAVE'.
    const channelName = event.channelName; // Which channel does this event come from
    const publisher = event.userId; // Who trigger this event
    const topicInfos = event.topicInfos; // Topic information payload
    const totalTopics = event.totalTopics; // How many topics
    const timestamp = event.timestamp; // Event timestamp

   console.log("Bac's handleRTMTopicEvent topicInfos " + topicInfos);
   console.log(topicInfos);
   
   // Need to subscribe to new topic publishers
   for (const topicinfo of topicInfos) {
    const topicFound = topics.find(customTopic => customTopic.topicName === topicinfo.topicName);

    if (topicFound) { 
      agoraSubscribeNewUsers(topicinfo.topicName); // Subscribe to new publishers 

      const publisherUserIds = topicinfo.publishers.map(publisher => publisher.publisherUserId);
      topicFound.users = publisherUserIds;

    }else{ 
      console.log("Bac's handleRTMTopicEvent topic NOT found");
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
    const topic = event.topicName; // Which Topic does this message come from, it is valid when the channelType is "STREAM".


    console.log(`Bac's Received message from ${publisher}: ${action} ${snapshot}`);

    const topicFound = topics.find(topic => topic.topicName === topic);

    const user = new CustomRTMUser(channelType, channelName, publisher, states);

    switch (action) {
        case 'REMOTE_JOIN':
            // Add user to the array
            if (topicFound) { 
              topicFound.users.push(user);
            }

            // Subscribe to new users in all topics 
            // agoraSubscribeNewUsers();
            
            break;
        case 'REMOTE_LEAVE':
            // Remove user from the array (assuming publisher is unique)
            if (topicFound) { 
              const userIndex = topicFound.users.findIndex(u => u.publisher === publisher);
              if (userIndex !== -1) {
                topicFound.users.splice(userIndex, 1);
              }
            }

            break;
        case 'REMOTE_STATE_CHANGED':
            // Update user state if they already exist
            if (topicFound) { 
              const userFound = topicFound.users.find(user => user.publisher === publisher);

              if (userFound) {
                userFound.states = stateChanged; // Update the state
              }
            }
            break;

        case 'SNAPSHOT':
            // Populate the users array from the snapshot
            if (topicFound) { 

              topicFound.users.length = 0; // Reset the users

              snapshot.forEach(userSnapshot => {

                console.log("Bac's usersnapshot " + userSnapshot);
                const user = new CustomRTMUser(
                    channelType,
                    channelName,
                    userSnapshot.userId,
                    userSnapshot.states
                );
                topicFound.users.push(user);
              });

            }

            break;

        // Handle other actions as needed
        default:
            console.log(`Unhandled action: ${action}`);
            break;
    }

    renderTopicsList(); // Update the display

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


//   window.onload = setupRTM;

