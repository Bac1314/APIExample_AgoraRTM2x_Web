class CustomRTMTopic {
    constructor(topicName, users = null, messages = null) {
        this.topicName = topicName; // The topic name
        this.messages = messages || []; // Initialize messages as an empty array if null
        this.users = users || []; // Initialize users as an empty array if null
    }
}