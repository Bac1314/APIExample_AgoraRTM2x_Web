class CustomRTMUser {
    constructor(channelType, channelName, publisher, states = null) {
        this.channelType = channelType; // 'STREAM', 'MESSAGE', or 'USER'
        this.channelName = channelName; // The channel name
        this.publisher = publisher; // The publisher of the event
        this.states = states; // User state payload, only for stateChanged event
    }
}