const { RTM } = AgoraRTM;
let rtm;

// Configuration options
var options = {
    appid: null,
    uid: null,
    token: null
};

var isLoggedIn = false;
var users = [];

// Channel name that all users join to participate in auctions
let mainChannel = "BiddingRootChannel";

// Auction item data structure matching iOS implementation
var currentAuctionItem = {
    id: generateUUID(),
    majorRevision: -1,
    auctionName: "Charizard PSA 10",
    startingPrice: 100,
    currentBid: 100,
    highestBidder: "",
    lastUpdatedTimeStamp: Math.floor(Date.now() / 1000)
};

// MARK: DOM Ready
$(document).ready(function() {
    // Load saved credentials if available
    loadSavedCredentials();
    updateUIWithCurrentAuction();
});

// MARK: BUTTON EVENT LISTENERS
$("#login").click(async function (e) {
    e.preventDefault();

    if(!isLoggedIn) { 
        try {
            options.uid = $("#uid").val();
            options.appid = $("#appid").val();
            options.token = $("#token").val();
      
            if (!options.uid || !options.appid) {
                alert("Please fill in all the fields: UID, and AppID.");
                return;
            }

            $('#login').text('Setting up...');
            await agoraSetupRTM();

            $('#login').text('Logging in...');
            await agoraLoginRTM();

            $('#login').text('Subscribing channel...');
            await agoraSubscribeChannel(mainChannel);

            $('#login').text('Loading auction...');
            await loadCurrentAuction();

            $('#login').text('Logout');
            $('#sectionAuction').show();
            
            // Save credentials for convenience
            saveCredentials();
            
        } catch (error) {
            $('#login').text('Login');
            console.error("Login failed:", error);
            alert("Login failed: " + error.message);
        } 
    } else { 
        await agoraLogoutRTM();
        $('#login').text('Login');
        $('#sectionAuction').hide();
    }
});

$("#placeBidBtn").click(async function () {
    const bidInput = $("#bid-input").val();
    if (!bidInput || isNaN(bidInput)) {
        showBidStatus("Please enter a valid bid amount", "error");
        return;
    }

    const bidAmount = parseFloat(bidInput);
    const success = await placeBid(bidAmount);
    
    if (success) {
        $("#bid-input").val('');
        showBidStatus("Bid placed successfully!", "success");
    }
});

$("#quickBidBtn").click(async function () {
    const quickBidAmount = currentAuctionItem.currentBid + 10;
    const success = await placeBid(quickBidAmount);
    
    if (success) {
        showBidStatus("Quick bid placed successfully!", "success");
    }
});

$("#createAuctionBtn").click(async function () {
    const auctionName = $("#new-auction-name").val();
    const startingPrice = parseInt($("#new-starting-price").val());

    if (!auctionName || !startingPrice || startingPrice < 1) {
        alert("Please enter a valid auction name and starting price");
        return;
    }

    const success = await createNewAuction(auctionName, startingPrice);
    if (success) {
        $("#new-auction-name").val('');
        $("#new-starting-price").val('');
        showBidStatus("New auction created!", "success");
    }
});

$("#endAuctionBtn").click(async function () {
    if (confirm("Are you sure you want to end the current auction?")) {
        await endCurrentAuction();
    }
});

// MARK: AGORA RTM FUNCTIONS
async function agoraSetupRTM() {
    try {
        rtm = new RTM(options.appid, options.uid);
        
        // Setup Event Listeners
        rtm.addEventListener("presence", handleRTMPresenceEvent);
        rtm.addEventListener("storage", handleRTMStorageEvent);
        rtm.addEventListener("linkState", handleRTMLinkStateEvent);
        
        console.log("RTM client initialized successfully");
        
    } catch (error) {
        throw new Error("RTM setup failed: " + error.message);
    }
}

async function agoraLoginRTM() {
    try {
        const result = await rtm.login({ token: options.token || undefined });
        console.log("RTM login successful:", result);
        isLoggedIn = true;
    } catch (error) {
        throw new Error("RTM login failed: " + error.message);
    }
}

async function agoraLogoutRTM() {
    try {
        if (rtm && isLoggedIn) {
            await rtm.logout();
            console.log("RTM logout successful");
        }
        isLoggedIn = false;
        users = [];
        updateUsersDisplay();
    } catch (error) {
        console.error("RTM logout failed:", error);
        isLoggedIn = false;
    }
}

async function agoraSubscribeChannel(channelName) {
    try {
        const result = await rtm.subscribe(channelName);
        console.log("Subscribed to channel:", channelName, result);
    } catch (error) {
        throw new Error("Subscribe to " + channelName + " failed: " + error.message);
    }
}

// MARK: AUCTION MANAGEMENT FUNCTIONS
async function loadCurrentAuction() {
    try {
        const result = await rtm.storage.getChannelMetadata(mainChannel, "MESSAGE");
        console.log("Loaded auction metadata:", result);
        
        if (result && result.data && result.data.length > 0) {
            updateAuctionFromMetadata(result.data, result.majorRevision);
        } else {
            console.log("No existing auction found, using default");
            updateUIWithCurrentAuction();
        }
        
    } catch (error) {
        console.log("No existing auction data, starting fresh:", error.message);
        updateUIWithCurrentAuction();
    }
}

async function createNewAuction(auctionName, startingPrice) {
    const metadataItems = [
        { key: "auctionName", value: auctionName },
        { key: "startingPrice", value: startingPrice.toString() },
        { key: "currentBid", value: startingPrice.toString() },
        { key: "highestBidder", value: "" },
        { key: "lastUpdatedTimeStamp", value: Math.floor(Date.now() / 1000).toString() }
    ];

    const options = {
        majorRevision: -1,
        addTimeStamp: true,
        addUserId: true
    };

    try {
        const result = await rtm.storage.setChannelMetadata(mainChannel, "MESSAGE", metadataItems, options);
        console.log("New auction created:", result);
        
        // Update local state
        currentAuctionItem = {
            id: generateUUID(),
            majorRevision: result.majorRevision || 0,
            auctionName: auctionName,
            startingPrice: startingPrice,
            currentBid: startingPrice,
            highestBidder: "",
            lastUpdatedTimeStamp: Math.floor(Date.now() / 1000)
        };
        
        updateUIWithCurrentAuction();
        return true;
        
    } catch (error) {
        console.error("Failed to create auction:", error);
        alert("Failed to create auction: " + error.message);
        return false;
    }
}

async function placeBid(bidAmount) {
    // Validation
    if (bidAmount <= currentAuctionItem.currentBid) {
        showBidStatus("Bid must be higher than current bid of $" + currentAuctionItem.currentBid, "error");
        return false;
    }

    if (currentAuctionItem.highestBidder === options.uid) {
        showBidStatus("You are already the highest bidder", "error");
        return false;
    }

    try {
        // Get current major revision for atomic update
        const majorRevision = await getCurrentMajorRevision();
        
        const metadataItems = [
            { key: "currentBid", value: bidAmount.toString() },
            { key: "highestBidder", value: options.uid },
            { key: "lastUpdatedTimeStamp", value: Math.floor(Date.now() / 1000).toString() }
        ];

        const updateOptions = {
            majorRevision: majorRevision,
            addTimeStamp: true,
            addUserId: true
        };

        const result = await rtm.storage.updateChannelMetadata(mainChannel, "MESSAGE", metadataItems, updateOptions);
        console.log("Bid placed successfully:", result);
        return true;
        
    } catch (error) {
        console.error("Failed to place bid:", error);
        showBidStatus("Failed to place bid: " + error.message, "error");
        return false;
    }
}

async function endCurrentAuction() {
    try {
        const majorRevision = await getCurrentMajorRevision();
        
        const metadataItems = [
            { key: "auctionName" },
            { key: "startingPrice" },
            { key: "currentBid" },
            { key: "highestBidder" },
            { key: "lastUpdatedTimeStamp" }
        ];

        const options = {
            majorRevision: majorRevision
        };

        await rtm.storage.removeChannelMetadata(mainChannel, "MESSAGE", metadataItems, options);
        
        // Reset to default auction
        currentAuctionItem = {
            id: generateUUID(),
            majorRevision: -1,
            auctionName: "Charizard PSA 10",
            startingPrice: 100,
            currentBid: 100,
            highestBidder: "",
            lastUpdatedTimeStamp: Math.floor(Date.now() / 1000)
        };
        
        updateUIWithCurrentAuction();
        showBidStatus("Auction ended successfully", "success");
        
    } catch (error) {
        console.error("Failed to end auction:", error);
        alert("Failed to end auction: " + error.message);
    }
}

async function getCurrentMajorRevision() {
    try {
        const result = await rtm.storage.getChannelMetadata(mainChannel, "MESSAGE");
        return result.majorRevision || 0;
    } catch (error) {
        console.log("Could not get major revision, using 0:", error.message);
        return 0;
    }
}

// MARK: UI UPDATE FUNCTIONS
function updateAuctionFromMetadata(metadataItems, majorRevision) {
    console.log("Updating auction from metadata:", metadataItems);
    
    const auctionName = getMetadataValue(metadataItems, "auctionName") || currentAuctionItem.auctionName;
    const startingPrice = parseInt(getMetadataValue(metadataItems, "startingPrice")) || currentAuctionItem.startingPrice;
    const currentBid = parseInt(getMetadataValue(metadataItems, "currentBid")) || startingPrice;
    const highestBidder = getMetadataValue(metadataItems, "highestBidder") || "";
    const lastUpdatedTimeStamp = parseInt(getMetadataValue(metadataItems, "lastUpdatedTimeStamp")) || Math.floor(Date.now() / 1000);

    currentAuctionItem = {
        id: currentAuctionItem.id,
        majorRevision: majorRevision,
        auctionName: auctionName,
        startingPrice: startingPrice,
        currentBid: currentBid,
        highestBidder: highestBidder,
        lastUpdatedTimeStamp: lastUpdatedTimeStamp
    };

    updateUIWithCurrentAuction();
}

function getMetadataValue(metadataItems, key) {
    const item = metadataItems.find(item => item.key === key);
    return item ? item.value : null;
}

function updateUIWithCurrentAuction() {
    $("#auction-name").text(currentAuctionItem.auctionName);
    $("#starting-price").text(currentAuctionItem.startingPrice);
    $("#bid-amount").text("$" + currentAuctionItem.currentBid);
    
    if (currentAuctionItem.highestBidder) {
        $("#highest-bidder").text("by " + currentAuctionItem.highestBidder);
    } else {
        $("#highest-bidder").text("by No bidders yet");
    }
    
    const timeAgo = getTimeAgo(currentAuctionItem.lastUpdatedTimeStamp);
    $("#last-updated").text("Updated " + timeAgo);
    
    // Update bid input placeholder
    const nextBid = currentAuctionItem.currentBid + 1;
    $("#bid-input").attr("placeholder", "Min: $" + nextBid).attr("min", nextBid);
}

function updateUsersDisplay() {
    $("#user-count").text(users.length);
    const usersList = $("#users-list");
    usersList.empty();
    
    users.forEach(user => {
        const userElement = $(`<span class="user-badge">${user.publisher}</span>`);
        usersList.append(userElement);
    });
}

function showBidStatus(message, type) {
    const statusDiv = $("#bid-status");
    statusDiv.removeClass("success error").addClass(type);
    statusDiv.text(message).show();
    
    setTimeout(() => {
        statusDiv.hide();
    }, 3000);
}

function getTimeAgo(timestamp) {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return "just now";
    if (diff < 3600) return Math.floor(diff / 60) + " minutes ago";
    if (diff < 86400) return Math.floor(diff / 3600) + " hours ago";
    return Math.floor(diff / 86400) + " days ago";
}

// MARK: UTILITY FUNCTIONS
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function saveCredentials() {
    if (typeof(Storage) !== "undefined") {
        localStorage.setItem("agoraAppId", options.appid);
        localStorage.setItem("agoraToken", options.token || "");
        localStorage.setItem("agoraUid", options.uid);
    }
}

function loadSavedCredentials() {
    if (typeof(Storage) !== "undefined") {
        const savedAppId = localStorage.getItem("agoraAppId");
        const savedToken = localStorage.getItem("agoraToken");
        const savedUid = localStorage.getItem("agoraUid");
        
        if (savedAppId) $("#appid").val(savedAppId);
        if (savedToken) $("#token").val(savedToken);
        if (savedUid) $("#uid").val(savedUid);
    }
}

// MARK: AGORA EVENT LISTENERS
function handleRTMPresenceEvent(event) {
    const action = event.eventType;
    const channelType = event.channelType;
    const channelName = event.channelName;
    const publisher = event.publisher;
    const states = event.stateChanged;
    const snapshot = event.snapshot;

    console.log(`Presence event: ${action} from ${publisher}`);

    const userFound = users.find(u => u.publisher === publisher);
    const userIndex = users.findIndex(u => u.publisher === publisher);

    switch (action) {
        case 'REMOTE_JOIN':
            if (!userFound) {
                const newUser = new CustomRTMUser(channelType, channelName, publisher, states);
                users.push(newUser);
                updateUsersDisplay();
            }
            break;
            
        case 'REMOTE_LEAVE':
            if (userIndex !== -1) {
                users.splice(userIndex, 1);
                updateUsersDisplay();
            }
            break;
            
        case 'REMOTE_STATE_CHANGED':
            if (userFound) {
                userFound.states = states;
            }
            break;
            
        case 'SNAPSHOT':
            users.length = 0;
            if (snapshot) {
                snapshot.forEach(userSnapshot => {
                    const user = new CustomRTMUser(
                        channelType,
                        channelName,
                        userSnapshot.userId,
                        userSnapshot.states
                    );
                    users.push(user);
                });
            }
            updateUsersDisplay();
            break;
    }
}

function handleRTMStorageEvent(event) {
    console.log("Storage event received:", event);
    
    const channelType = event.channelType;
    const channelName = event.channelName;
    const publisher = event.publisher;
    const storageType = event.storageType;
    const action = event.eventType;
    const data = event.data;
    const timestamp = event.timestamp;

    if (channelName === mainChannel && storageType === "CHANNEL") {
        if (action === "SNAPSHOT" || action === "SET" || action === "UPDATE") {
            if (data && data.length > 0) {
                // Get the major revision from the event or fetch it
                getCurrentMajorRevision().then(majorRevision => {
                    updateAuctionFromMetadata(data, majorRevision);
                    
                    // Show notification if bid was placed by someone else
                    if (action === "UPDATE" && publisher !== options.uid) {
                        const currentBidValue = getMetadataValue(data, "currentBid");
                        const highestBidder = getMetadataValue(data, "highestBidder");
                        if (currentBidValue && highestBidder) {
                            showBidStatus(`New bid of $${currentBidValue} by ${highestBidder}`, "info");
                        }
                    }
                });
            }
        } else if (action === "REMOVE") {
            // Auction was ended
            showBidStatus("Auction has been ended", "info");
        }
    }
}

function handleRTMLinkStateEvent(event) {
    const currentState = event.currentState;
    $("#rtmlinkstate").text(currentState);
    
    if (currentState === "CONNECTED") {
        $("#auction-status").text("ACTIVE").removeClass("status-disconnected").addClass("status-live");
    } else {
        $("#auction-status").text("DISCONNECTED").removeClass("status-live").addClass("status-disconnected");
    }
}