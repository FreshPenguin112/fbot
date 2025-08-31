require('dotenv').config();
//require('child_process').execSync(`docker run --rm -d --network host --env ALL_PROXY=socks5h://127.0.0.1:9050 eval-runner`)
(async () => {
    const fs = require("fs");
    const { execSync } = require("child_process");
    const nodeprocess = require('process');
    if (nodeprocess.argv.includes("--restart-container") || nodeprocess.argv.includes("-r")) {    
        execSync("docker stop eval-runner || :");
        execSync("docker stop tor-router || :");
        execSync("docker rm tor-router || :");
        execSync("docker rm eval-runner || :");
        execSync("docker run -d --name tor-router flungo/tor-router", {stdio:"inherit"});
        execSync("docker run --rm -d -it --network host --env ALL_PROXY=socks5h://127.0.0.1:9050 --name eval-runner eval-runner:latest", {stdio:"inherit"});
    }
    const discord = require("discord.js");
    const commandUtility = new (require("./utility.js"))();
    const client = new discord.Client({
        intents: new discord.Intents(32767),
        partials: [
            "REACTION",
            "CHANNEL"
        ]
    });

    // stop it from fuckin crashing after som stupid discord error
    nodeprocess.on('uncaughtException', function (err) {
        console.log('\n');
        console.log('---------------------');
        console.log('Error!');
        console.log(err);
        console.log('---------------------');
        console.log('\n');
    });

    client.on('ready', () => {
        console.log(client.user.tag + " is online")
    });
    global.client=client
    await client.login("MTEzOTkzMTAwNTM2OTcyMDg3Mg.GYL9lJ.QuoldOHilPvYyRlUQZVvAcOPBmsrnW9XnExwSM").catch((e) => {
        console.error('Login Error;', e);
    });

    const state = {
        commands: {}
    };

    commandUtility.state = state;

    // set status
    client.on('ready', () => {
        fs.readdir('./commands', (err, files) => {
            if (err) {
                throw err;
            }

            for (const fileName of files) {
                if (fileName.endsWith('.js')) {
                    const module = require(`./commands/${fileName}`);
                    const command = new module();
                    state.commands[command.name] = command;
                    console.log('Registered', command.name);
                    if (typeof command.setClient === "function") {
                        // this function exists so run it
                        command.setClient(client);
                    }
                }
            }
        });
    });
    client.on('messageCreate', async (message)=>{
    if (message.content.startsWith("fr!")) {
            // this is perhaps a command
            const split = message.content.split(' ');
            split[0] = split[0].replace('fr!', '');
            if (split[0] in state.commands) {
                const commandName = split[0];
                const command = state.commands[commandName];
                // if this is an admin command, return if we not admin
                if (command.attributes.admin === true) {
                    // check admin state
                    const isAdmin = message.member._roles.includes(message.guild.roles.cache.get('1038234739708006481').id)
                        || message.member._roles.includes(message.guild.roles.cache.get('1081053191602450552').id);
                    if (!isAdmin) {
                        message.reply("Only developers can run this command.");
                        return;
                    }
                }

                split.shift();
                // create args array because i want numbors to be real number
                // UNLESS command says "dont do that stupid fucking idiot"
                if (command.attributes.numberConversion === 'off') {
                    // use command NOW
                    command.invoke(message, split, commandUtility);
                    return;
                }

                // ok convert stuff
                const args = split.map(argument => {
                    if (isNaN(Number(argument))) {
                        return String(argument);
                    }
                    return Number(argument);
                });
                // use command now
                command.invoke(message, args, commandUtility);
            }
        }});
    })();
