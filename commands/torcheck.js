// a simple bot owner only command that gives info on the tor status(if tor is working, and the ip address ONLY if tor is working to hide the bot owners real ip)
const {execSync} = require("child_process");
var failed = false;
var result = "";
class Command {
    constructor() {
        this.name = "torcheck";
        this.description = "admin";
        this.attributes = {
            unlisted: true,
            admin: true,
            numberConversion: 'off',
        };
    }

    run(message, args, util) {
        let json = execSync("docker exec eval-runner sh -c 'curl https://check.torproject.org/api/ip'").toString()
        json = JSON.parse(json);
        message.reply(`Tor Enabled: ${json.IsTor}, IP Address: ${json.IsTor ? String(json.IP) : "hidden for privacy purposes"}`);
    }
    invoke(message, args, util) {
        try {
            this.run(message, args, util);
        } catch (err) {
            message.reply('erm, error? 👉👈');
            console.log(err);
        }
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;
