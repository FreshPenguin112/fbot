class Command {
    constructor() {
        this.name = "eval";
        this.description = "admin";
        this.attributes = {
            unlisted: true,

            numberConversion: 'off',
        };
    }


    run(message, args, util) {
        const {execSync} = require("child_process");
        let result = '';
        let failed = false;
        try {
            const command = args.join(' ').replace(/[_!#&'*;<>?\[\]^`{|}]/g, '\\$&');
            console.log('\n');
            console.log(`${message.author.username}:`);
            console.log(command);
            console.log('\n');
            result = execSync(`proot-distro login ubuntu -- bash -c 'node -e \"${command}\"'`).toString();
            result = result.replaceAll("\\n", "").replaceAll("\n", "");
            //console.log(result.replaceAll("\n", ""));
        } catch (err) {
            result = String(err);
            failed = true;

            if (err.stack) {
                result = `${err.stack}`;
            }
        }
        message.reply(`${failed ? '❌ - epic fucking fail loser\n' : ''}\`\`\`${failed ? result : JSON.stringify(result)}\`\`\``);
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
