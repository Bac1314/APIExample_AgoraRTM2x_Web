const { RTM } = AgoraRTM;

let rtm;

var options = {
    appid: null,
    uid: null,
    token: null
};


var isLoggedIn = false;

var channels = []

var selectedChannel = "Selected Channel";

$("#login").click(async function (e) {
    e.preventDefault();
    // $("#join").attr("disabled", true);

    if(!isLoggedIn) { 
        try {
            // options.channel = $("#channel").val();
            options.uid = $("#uid").val();
            options.appid = $("#appid").val();
            options.token = $("#token").val();
      
            // Check if any field is empty
            if (!options.uid || !options.appid) {
              alert("Please fill in all the fields: UID, and AppID.");
            }
            else { 
              $('#login').text('Logging in'); 

              await setupRTM();
              await loginRTM();
            }
      
          } catch (error) {
            $('#login').text('Login'); 
            console.error(error);
          } 
            // finally {
            //   $("#leave").attr("disabled", false);
            // }
    }else { 
        logoutRTM();
    }
});

const setupRTM = async () => {
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

const loginRTM = async () => {

  // Log in the RTM server.
  try {
      const result = await rtm.login({  token: options.token == null ? options.appid : options.token });
      console.log(result);
      isLoggedIn = true;
      $('#login').text('Logout'); 
      $("#chat-container").show(); 
    } catch (status) {
      alert("Login RTM failed " + status);
      console.log(status); 
    }
}

const logoutRTM = () => {
  // Log out from the RTM server.
  try {
      const result = rtm.logout(); // Call the logout method
      console.log(result);
      isLoggedIn = false; // Update the login status
      $('#login').text('Login'); // Change button text back to 'Login'
      $("#chat-container").hide(); // Show if input is not empty

      channels.length = 0 // Reset the array
      selectedChannel = "Selected Channel"; 
  } catch (status) {
    alert("Logout RTM failed " + status);
      console.log(status);
  }
};


const subscribeChannel = async (channelName) => { 
  try {
      const result = await rtm.subscribe(channelName);
      console.log(result);
    } catch (status) {
      alert("Subscribe to " + channelName + " failed " + status);
      console.log(status);
    }
}

const unSubscribeChannel = async (channelName) => { 
  try {
      const result = await rtm.unSubscribeChannel(channelName);
      console.log(result);
    } catch (status) {
      // alert("UnSubscribe to " + channelName + " failed " + status);
      console.log(status);
    }
}

const publishMessage = async (message) => {
  // const payload = { type: "text", message: message };
  // const publishMessage = JSON.stringify(payload);
  const publishOptions = { channelType: 'MESSAGE'}
  try {
    const result = await rtm.publish(selectedChannel, message, publishOptions);

    // Add to local view
    // addMessageToChat(message, "local");

  } catch (status) {
    alert("Publish Message failed " + status);
    console.log(status);
  }
}

// Render the channel list
function renderChannelsList() {
  const channelListElement = document.getElementById('channel-list');
  channelListElement.innerHTML = ''; // Clear previous content

  channels.forEach(channel => {
      const channelItem = document.createElement('div');
      channelItem.className = 'channel-item';

      // Check if this channel is the selected one
      if (channel.channelName === selectedChannel) {
          channelItem.classList.add('selected-channel'); // Use classList.add
      } else {
          channelItem.classList.remove('selected-channel'); // Use classList.remove
      }
      
      channelItem.textContent = `${channel.channelName} #${channel.users.length}`;
      channelItem.onclick = function() {
        loadChannelMessages(channel.channelName);
      }; // on click listener
      channelListElement.appendChild(channelItem);
  });
}

// Load the target channel messages
function loadChannelMessages(targetChannel) {

  selectedChannel = targetChannel;
  $('#selectedChannel').val(targetChannel); 

  // Rerender channel list to show selected channel
  renderChannelsList();
  
  $('#chat-box').empty(); // Clear previous messages

  const channelFound = channels.find(channel => channel.channelName === targetChannel);

  channelFound.messages.forEach(customMessage => {
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

// MARK: BUTTON EVENT LISTENERS
$("#sendButton").click(function () {
  const message = $("#messageInput").val().trim();

  if (message !== "") {
    publishMessage(message); // Publish the message asynchronously
    $("#messageInput").val(""); // Clear the input field after sending
  }
});

$("#subscribeBtn").click(async function() {
  try { 
    let channelName = $("#channelInput").val();

    console.log("Subscribing channelName " + channelName);

    if (channelName) { 
      // Subscribe to channel
      await subscribeChannel(channelName);

      // Create custom channel
      const customChannel = new CustomRTMChannel(channelName, [], []);
      channels.push(customChannel);

      // Clear the input field after subscribing
      $("#channelInput").val(""); 

      // Change target channel name
      $('#selectedChannel').text(channelName); 

      loadChannelMessages(channelName);
      // renderChannelsList();
    }

  } catch (error) {
    console.error(error);
  } 
  
});


// MARK: EVENT LISTENERS

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

    const channelFound = channels.find(channel => channel.channelName === channelName);

    if (channelFound) { 
      const customMessage = new CustomRTMMessage(message, publisher);
      channelFound.messages.push(customMessage);

      loadChannelMessages(channelName);
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

    console.log(`Bac's Received message from ${publisher}: ${action} ${snapshot}`);

    // const chnIndex = channels.findIndex(u => u.channelName === channelName);
    const channelFound = channels.find(channel => channel.channelName === channelName);

    const user = new CustomRTMUser(channelType, channelName, publisher, states);

    switch (action) {
        case 'REMOTE_JOIN':
            // Add user to the array
            if (channelFound) { 
              channelFound.users.push(user);
            }
            
            // users.push(user);
            break;
        case 'REMOTE_LEAVE':
            // Remove user from the array (assuming publisher is unique)


            if (channelFound) { 
              const userIndex = channelFound.users.findIndex(u => u.publisher === publisher);
              if (userIndex !== -1) {
                channelFound.users.splice(userIndex, 1);
              }
            }

            break;
        case 'REMOTE_STATE_CHANGED':
            // Update user state if they already exist

            if (channelFound) { 
              const userFound = channelFound.users.find(user => user.publisher === publisher);

              if (userFound) {
                userFound.states = stateChanged; // Update the state
              }
            }
            break;

        case 'SNAPSHOT':
            // // Clear the current users array
            // users.length = 0; // Reset the array

            // Populate the users array from the snapshot
            if (channelFound) { 

              channelFound.users.length = 0; // Reset the users

              snapshot.forEach(userSnapshot => {

                console.log("Bac's usersnapshot " + userSnapshot);
                const user = new CustomRTMUser(
                    channelType,
                    channelName,
                    userSnapshot.userId,
                    userSnapshot.states
                );
                channelFound.users.push(user);
              });

            }

            break;

        // Handle other actions as needed
        default:
            console.log(`Unhandled action: ${action}`);
            break;
    }

    renderChannelsList(); // Update the display

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
}


//   window.onload = setupRTM;

