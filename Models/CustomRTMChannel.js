class CustomRTMChannel {
    constructor(channelName, users = null, messages = null) {
        this.channelName = channelName; // The channel name
        this.messages = messages || []; // Initialize messages as an empty array if null
        this.users = users || []; // Initialize users as an empty array if null
    }
}