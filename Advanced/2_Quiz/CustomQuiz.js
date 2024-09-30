class CustomQuiz {
    constructor(id, question, options, answer, sender, totalUsers, totalSubmission, timestamp) {
        this.id = id;
        this.question = question; 
        this.options = options;
        this.answer = answer; 
        this.sender = sender; 
        this.totalUsers = totalUsers;
        this.totalSubmission = totalSubmission;
        this.timestamp = timestamp;
    }
}