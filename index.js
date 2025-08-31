require('dotenv').config();
//require('child_process').execSync(`docker run --rm -d --network host --env ALL_PROXY=socks5h://127.0.0.1:9050 eval-runner`)
(async () => {
    const fs = require("fs");
    const { execSync } = require("child_process");
    const nodeprocess = require('process');
    if (process.argv.includes("--restart-container") || process.argv.includes("-r")) {
        try {
            // Stop and remove existing containers
            execSync("docker stop eval-runner || :", { stdio: "inherit" });
            execSync("docker stop tor-router || :", { stdio: "inherit" });
            execSync("docker rm tor-router || :", { stdio: "inherit" });
            execSync("docker rm eval-runner || :", { stdio: "inherit" });

            // Start Tor container in daemon mode with transparent SOCKS
            execSync("docker run -d --dns 127.0.0.1 --name tor-router -v ./torrc:/etc/tor/torrc:ro osminogin/tor-simple", { stdio: "inherit" });

            let isRunning = false;
            const startTime = Date.now();

            while (true) {
                const status = execSync("docker inspect --format '{{.State.Health.Status}}' tor-router")
                .toString()
                .trim();
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;

                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.write(`Waiting for tor-router to start... ${minutes}m ${seconds}s`);

                if (status === "healthy") {
                    isRunning = true;
                    break;
                }

                execSync("sleep 1");
            }

            process.stdout.write("\n");

            if (!isRunning) {
                throw new Error("tor-router failed to start");
            }


            process.stdout.write("\n");

            if (!isRunning) {
                throw new Error("tor-router failed to start");
            }

            // Run app container using Tor container's network namespace
            execSync(
                "docker run -id --network container:tor-router --cap-add=NET_ADMIN --name eval-runner eval-runner:latest ",
                { stdio: "inherit" }
            );

            console.log("[+] eval-runner started successfully through Tor");
        } catch (err) {
            console.error("Error restarting containers:", err);
        }
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
    await client.login(process.env.TOKEN).catch((e) => {
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
                    const isAdmin = message.author.id == 712497713043734539; //my discord user id
                    if (!isAdmin) {
                        message.reply("Only the bot owner can run this command.");
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
