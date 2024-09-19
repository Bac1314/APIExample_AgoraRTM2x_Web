const { RTM } = AgoraRTM;

let rtm;

var options = {
    appid: null,
    channel: null,
    uid: null,
    token: null
};

var isLoggedIn = false;

var users = []

$("#join-form").submit(async function (e) {
    e.preventDefault();
    // $("#join").attr("disabled", true);

    if(!isLoggedIn) { 
        try {
            options.channel = $("#channel").val();
            options.uid = $("#uid").val();
            options.appid = $("#appid").val();
            options.token = $("#token").val();
      
            // Check if any field is empty
            if (!options.channel || !options.uid || !options.appid) {
              alert("Please fill in all the fields: Channel, UID, and AppID.");
            }
            else { 
              $('#login').text('Logging in'); 

              await setupRTM();
              await loginRTM();
              await subscribeChannel(options.channel);
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
      console.log("Error");
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

const publishMessage = async (message) => {
  // const payload = { type: "text", message: message };
  // const publishMessage = JSON.stringify(payload);
  const publishOptions = { channelType: 'MESSAGE'}
  try {
    const result = await rtm.publish(options.channel, message, publishOptions);

    // Add to local view
    // addMessageToChat(message, "local");

  } catch (status) {
    console.log(status);
  }
}

// Function to add message to chat view (assumes jQuery)
function addMessageToChat(text, sender) {

    const messageContainer = $("<div></div>").addClass("message");
    const senderNameElement = $("<div></div>").addClass("sender-name").text(sender);
    const messageElement = $("<div></div>").text(text);

    // Append sender's name and message
    messageContainer.append(senderNameElement);
    messageContainer.append(messageElement);

    if (sender === options.uid) {
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
}


// MARK: BUTTON EVENT LISTENERS
$("#sendButton").click(function () {
  const message = $("#messageInput").val().trim();

  if (message !== "") {
    publishMessage(message); // Publish the message asynchronously
    $("#messageInput").val(""); // Clear the input field after sending
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

    addMessageToChat(message, publisher);

    
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

    const user = new RTMUser(channelType, channelName, publisher, states);

    switch (action) {
        case 'REMOTE_JOIN':
            // Add user to the array
            users.push(user);
            break;
        case 'REMOTE_LEAVE':
            // Remove user from the array (assuming publisher is unique)
            const index = users.findIndex(u => u.publisher === publisher);
            if (index !== -1) {
                users.splice(index, 1);
            }
            break;
        case 'REMOTE_STATE_CHANGED':
            // Update user state if they already exist
            const existingUser = users.find(u => u.publisher === publisher);
            if (existingUser) {
                existingUser.states = stateChanged; // Update the state
            }
            break;

        case 'SNAPSHOT':
            // Clear the current users array
            users.length = 0; // Reset the array

            // Populate the users array from the snapshot
            snapshot.forEach(userSnapshot => {

                console.log("Bac's usersnapshot " + userSnapshot);
                const user = new RTMUser(
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

    $('#userCount').text('#'+users.length + " users"); // Change '#5' to whatever value you want

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

