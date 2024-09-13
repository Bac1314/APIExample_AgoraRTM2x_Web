const { RTM } = AgoraRTM;

let rtm;

var options = {
    appid: null,
    channel: null,
    uid: null,
    token: null
};

var isLoggedIn = false;

$("#join-form").submit(async function (e) {
    e.preventDefault();
    // $("#join").attr("disabled", true);

    if(!isLoggedIn) { 
        try {
            options.channel = $("#channel").val();
            options.uid = $("#uid").val();
            options.appid = $("#appid").val();
            options.token = $("#token").val();
      
            
            await setupRTM();
            await loginRTM();
            await subscribeChannel(options.channel);
      
          } catch (error) {
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

    // rtm.addEventListener("message", event => {
    //     console.log(`Bac's Received message from ${event.publisher}: ${event.message}`);
    //     showMessage(event.publisher, event.message);
    //   });

  }

  const loginRTM = async () => {

    // Log in the RTM server.
    try {
        const result = await rtm.login({  token: options.token == null ? options.appid : options.token });
        console.log(result);
        isLoggedIn = true;
        $('#login').text('Logout'); 
      } catch (status) {
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
    } catch (status) {
        console.log(status);
    }
};


  const subscribeChannel = async (channelName) => { 
    try {
        const result = await rtm.subscribe(channelName);
        console.log(result);
      } catch (status) {
        console.log(status);
      }
  }

  const publishMessage = async (message) => {
    const payload = { type: "text", message: message };
    const publishMessage = JSON.stringify(payload);
    const publishOptions = { channelType: 'MESSAGE'}
    try {
      const result = await rtm.publish(msChannelName, publishMessage, publishOptions);
      showMessage(userId, publishMessage);
      console.log(result);
    } catch (status) {
      console.log(status);
    }
  }

  const showMessage = (user, msg) => {
    // Get text from the text box.
    const inputText = textInput.value;
    const newText = document.createTextNode(user + ": " + msg);
    const newLine = document.createElement("br");
    textDisplay.appendChild(newText);
    textDisplay.appendChild(newLine);
  }


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

    console.log(`Bac's Received message from ${publisher}: ${action}`);

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

