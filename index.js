require('dotenv').config();

(async () => {
    const fs = require("fs");
    const nodeprocess = require('process');
    const discord = require("discord.js");
    const commandUtility = new (require("./utility.js"))();
    const client = new discord.Client({
        intents: [
            Object.values(discord.Intents.FLAGS).reduce((acc, p) => acc | p, 0)
        ],
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

    await client.login("MTEzOTkzMTAwNTM2OTcyMDg3Mg.G9tz8c.1IuPyYe4AkfaaPQUS01-BVlfG5LWApE8GyjByg").catch((e) => {
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
