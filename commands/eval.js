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
            const command = JSON.stringify(args.join(' '))
            console.log('\n');
            console.log(`${message.author.username}:`);
            //console.log(command);
            console.log(command);
            console.log('\n');
            result = execSync(`proot-distro login ubuntu -- bash -c 'node -e ${command}'`).toString().replaceAll("\\n", "").replaceAll("\n", "");
            result = result.toString().replaceAll("\\n", "").replaceAll("\n", "");
            if (result.length === 0) {
                console.log("changing result");
                result = execSync(`proot-distro login ubuntu -- bash -c 'node -e "console.log(${command})"'`);
                result = result.toString().replaceAll("\\n", "").replaceAll("\n", "");
            }
            console.log(result.length);
            console.log(command)
        } catch (err) {
            let result = "the j";// + ":" + err.message;
            console.log(Object.keys(err));
            //result = "lmao you did a error somewhere nerd :nerdclown: :haha:"
            failed = true;

            /*if (err.stack) {
                result = `${err.stack}`;
            }*/
        }
        message.reply(`${failed ? '❌ - epic fucking fail loser\n' : ''}\`\`\`\n${failed ? result : JSON.stringify(result)}\`\`\``);
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
