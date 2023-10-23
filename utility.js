class CommandUtility {
    constructor() {
        this.state = {};
    }

    request(value) {
        return this.state[value];
    }
}

module.exports = CommandUtility;