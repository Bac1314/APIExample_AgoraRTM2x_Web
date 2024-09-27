const { RTM } = AgoraRTM;

let rtm;

var options = {
    appid: null,
    channel: null,
    uid: null,
    token: null,
    frienduid: null
};

var isLoggedIn = false;

var users = []

// MARK: BUTTON EVENT LISTENERS
$("#login").click(async function (e) {
    e.preventDefault();
    // $("#join").attr("disabled", true);

    if(!isLoggedIn) { 
        try {
            options.channel = null 
            options.frienduid = $("#frienduid").val();
            options.uid = $("#uid").val();
            options.appid = $("#appid").val();
            options.token = $("#token").val();
      
            // Check if any field is empty
            if (!options.frienduid || !options.uid || !options.appid) {
              alert("Please fill in all the fields: friend UID, UID, and AppID.");
            }
            else { 
              $('#login').text('Logging in'); 

              await setupRTM();
              await loginRTM();
            //   await subscribeChannel(options.channel);

            $('#userCount').text(options.frienduid); // show friend uid in top of chatbox

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

$("#sendButton").click(function () {
  const message = $("#messageInput").val().trim();

  if (message !== "") {
    publishMessage(message); // Publish the message asynchronously
    $("#messageInput").val(""); // Clear the input field after sending
  }
});

// Event listener for input changes
$('#frienduid').on('blur', function() {
    options.frienduid = $(this).val(); // Update the local variable
    $('#userCount').text(options.frienduid); // show friend uid in top of chatbox

});


// AGORA FUNCTIONS 
async function setupRTM() {
    // Initialize the RTM client.
    try {
      rtm = new RTM(options.appid, options.uid);
    } catch (status) {
        alert("Setup RTM failed " + status);
        console.log(status);
    }

    // Setup Event Listeners
    rtm.addEventListener("message", handleRTMMessageEvent);
    // rtm.addEventListener("presence", handleRTMPresenceEvent);
    rtm.addEventListener("linkState", handleRTMLinkStateEvent);

  }

async function loginRTM() {

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

function logoutRTM() {
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

async function publishMessage(message) {
  // const payload = { type: "text", message: message };
  // const publishMessage = JSON.stringify(payload);
  const publishOptions = { channelType: 'USER'}
  try {
    const result = await rtm.publish(options.frienduid, message, publishOptions);

    // Add to local view
    addMessageToChat(message, options.uid); // P2P requires you to do it here, instead of from the event callback

  } catch (status) {
    alert("Publish Message failed " + status);
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

