const { RTM } = AgoraRTM;

let rtm;

var options = {
    appid: null,
    uid: null,
    token: null
};

var isLoggedIn = false;

var users = [];

let mainChannel = "PollRootChannel"; // All users will join this root channel to receive RTM events
let customPollQuestionType = "pollquestion"
let customPollResultType = "pollresult"
let defaultPollTime = 15

var currentAuctionItem = {
  id: generateUUID(), // Generate a UUID for the new poll
  majorRevision: -1,
  auctionName: "(Example) Auction Title",
  startingPrice: 0,
  currentBid: 0,
  highestBidder: "User1",
  lastUpdatedTimeStamp: Math.floor(Date.now() / 1000) + defaultPollTime // Current timestamp in seconds
};

let selectedAnswer = "";
let timerInterval;

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


$("#sendButton").click(function () {
  const message = $("#messageInput").val().trim();

  if (message !== "") {
    agoraPublishMessage(message); // Publish the message asynchronously
    $("#messageInput").val(""); // Clear the input field after sending
  }
});

// Event delegation for dynamically created elements
$('#pollOptions').on('click', '.poll-option', async function() {
  const key = $(this).data('key');

  if (Math.floor(Date.now() / 1000) < currentPoll.timestamp) {
    if (selectedAnswer == "") { 
      selectedAnswer = key;
      $('.poll-option').removeClass('selected');
      $('.check-button').prop('disabled', true); // Disable all buttons
      $(`.poll-option[data-key="${key}"]`).addClass('selected');
      $(`.poll-option[data-key="${key}"] .check-button`).prop('disabled', false); // Enable the selected button
      $(`.poll-option[data-key="${key}"] .check-button`).text("✔️"); // Add check icon
  
      // Publish answer
      if (selectedAnswer) {
        await agoraPublishPollResponse(selectedAnswer);
      }
    }

  }
  
});


$("#createPollBtn").click(function () {
  $('#pollModal').show();
});

// Handle form submission
$('#pollForm').on('submit', async function(event) {
  event.preventDefault(); // Prevent the default form submission

  // Get the poll question and options
  var question = $('#pollNewQuestion').val();

  // Initialize an empty options object
  var options = {};

  // Collect options and their initial vote counts
  options[$('#pollOption1').val()] = 0;
  options[$('#pollOption2').val()] = 0;
  if ($('#pollOption3').val()) {
      options[$('#pollOption3').val()] = 0;
  }
  if ($('#pollOption4').val()) {
      options[$('#pollOption4').val()] = 0;
  }

  console.log("You created poll " + question + " options " + options)
  await agoraPublishPollQuestion(question, options);

  // Close the modal after submitting
  $('#pollModal').hide();

  // Optionally, reset the form
  $(this).trigger('reset');
});


$('.close').on('click', function(event) {
  $('#pollModal').hide();
});

// When the user clicks anywhere outside of the modal, close it
$(window).on('click', function(event) {
  var modal = $('#pollModal');

  if ($(event.target).is(modal)) {
      modal.hide();
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

async function agoraPublishPollQuestion(pollQuestion, pollOptions) {
  // Create a new CustomPoll object
  const newPoll = {
    id: generateUUID(), // Generate a UUID for the new poll
    question: pollQuestion,
    options: pollOptions,
    sender: options.uid,
    totalUsers: users.length,
    totalSubmission: 0,
    timestamp: Math.floor(Date.now() / 1000) + defaultPollTime  // Current timestamp in seconds
  };

  // Convert the object to a JSON string
  const newPollJsonString = JSON.stringify(newPoll);

  // Message Options 
  const publishOptions = {
    customType: customPollQuestionType, // Optional, user-defined field
    channelType: 'MESSAGE'  // Optional, specify the channel type if needed
  };

  // Publish the poll
  try {
    const result = await rtm.publish(mainChannel, newPollJsonString, publishOptions);

  } catch (status) {
    alert("Publish Message failed " + status);
    console.log(status);
  }
}

async function agoraPublishPollResponse(pollAnswer) {
  // Message Options 
  const publishOptions = {
    customType: customPollResultType, // Optional, user-defined field
    channelType: 'MESSAGE'  // Optional, specify the channel type if needed
  };

  // Publish the poll
  try {
    const result = await rtm.publish(mainChannel, pollAnswer, publishOptions);

  } catch (status) {
    alert("Publish Message failed " + status);
    console.log(status);
  }
}

// MARK: Other functions
function renderPoll() {

  selectedAnswer = "";

  $('#pollQuestion').text(currentPoll.question);
  $('#userCount').text(`# Users: ${currentPoll.totalUsers}`);
  $('#submissionCount').text(`# Submissions: ${currentPoll.totalSubmission}`);
  $('#pollSender').text(`From: ${currentPoll.sender}`);

  $('#pollOptions').empty(); // This will remove all options from the select element

  $.each(currentPoll.options, function(key, value) {
      $('#pollOptions').append(`
          <div class="poll-option" data-key="${key}">
              <button class="check-button">o</button>
              <span>${key}</span>
          </div>
      `);
  });

  startTimer();
}


function startTimer() {
  const $timerElement = $('#pollTimer');
  timerInterval = setInterval(function() {
    const remainingTime = Math.max(0, currentPoll.timestamp - Math.floor(Date.now() / 1000));
    $timerElement.text(remainingTime > 0 ? `${remainingTime}s` : "Finished");

      if (remainingTime <= 0) {
          clearInterval(timerInterval);
          showResults();
      }
  }, 100);
}

function showResults() {
  $('#pollOptions').empty(); // Clear options

  $.each(currentPoll.options, function(key, value) {
    const totalVotes = Object.values(currentPoll.options).reduce((a, b) => a + b, 0);
    
    // Calculate percentage, defaulting to 0 if totalVotes is 0
    const percentage = totalVotes > 0 ? (value / totalVotes) * 100 : 0;

 
    // Append options with a class and data attribute
    $('#pollOptions').append(`
      <div class="poll-option" data-key="${key}">
        ${key}: ${percentage.toFixed(2)}%
      </div>
    `);

    if (key == selectedAnswer) { 
      $(`.poll-option[data-key="${key}"]`).addClass('selected');
    }
  });
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
      if (customType == customPollQuestionType) { 
        const newPoll = JSON.parse(message);
        currentPoll = newPoll;
        renderPoll();
      }else if (customType == customPollResultType) { 
           // Check if the answer is a valid option
        if (currentPoll.options[message] !== undefined) {
          // Increment the count for the selected option
          currentPoll.options[message] += 1;
          currentPoll.totalSubmission += 1;
          
          console.log(`${publisher} answered '${message}'`);
          $('#submissionCount').text(`# Submissions: ${currentPoll.totalSubmission}`);
        } 
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

// window.onload = renderPoll;
