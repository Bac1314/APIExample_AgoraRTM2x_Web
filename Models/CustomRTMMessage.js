class CustomRTMMessage {
    constructor(message, publisher, customMessageType = 'message') {
        this.message = message;
        this.publisher = publisher;
        this.customMessageType = customMessageType; // 'message' or 'presence' etc 
    }
}