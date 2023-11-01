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
        const {execSync, exec, spawnSync, spawn} = require("child_process");
        const process = require("process");
        const stream = require("stream");
        let result = '';
        let failed = false;
        try {
            let command = args.join(' ').replaceAll("\`\`\`js", "").replaceAll("\`\`\`py", "").replaceAll("\`\`\`", "").replaceAll("\\n", "");
            let py = command.includes("#py")||command.includes("# py");
            let cargsindex = command.split("\n").findIndex(x => x.startsWith("#args")||x.startsWith("# args")||x.startsWith("//args")||x.startsWith("// args"));
            let cargs = command.split("\n")[cargsindex].replace("# args ", "").replace("#args ", "").replace("// args ", "").replace("//args ", "").split(";");
            console.log(cargs);
            console.log(py);
            console.log('\n');
            console.log(`${message.author.username}:`);
            //console.log(command);
            /*if (py) {
                command = JSON.stringify(command);
                let r = JSON.stringify(`exec(${command})`);
                console.log(r);
                command = `require("child_process").execSync(\`python3.11 -c ${r}\`).toString()`;
            }*/
            console.log(command);
            console.log('\n');
            let b = btoa(command);
            let k = require("randomstring").generate();
            let k2 = require("randomstring").generate();
            let runner;
            let type;
            if (py) {
                runner = "python3.11";
                type = "py";
            } else {
                runner = "node";
                type = "js";
            }
            global.y = "";
            const pr = exec(`proot-distro login ubuntu --isolated -- eval 'echo "${b}" > ${k2}.txt && echo "$(base64 --decode ${k2}.txt)" > ${k}.${type} && ${runner} ${k}.${type} && rm -rf ${k}.${type} ${k2}.txt'`, (error, stdout, stderr) => {
                if (!!error) {
                    throw error;
                }
                console.log("stdout: "+stdout.toString());
                global.y += stdout.toString();
            });
            pr.stdout.on('error', (error) => console.log("error caught: ", error));
            pr.stderr.on('error', (error) => console.log("error caught: ", error));
            pr.stdin.on('error', (error) => console.log("error caught: ", error));
            for (let i of cargs) {
                console.log(i);
                pr.stdin.write(i+"\n");
            }
            pr.stdin.end();
            result = global.y;
            result = result.toString().replaceAll("\\n", "").replaceAll("\n", "");
            //console.log(result.length);
            if (!1/*result.length === 0*/) {
                //console.log("doing eval instead");
                if(!py){command = require("uglify-js").minify(command, 
                    {
                    compress: {
                        expression: true
                    },
                    mangle: {
                        eval: true,
                        toplevel: true
                    }
                }
                );
                //console.log(command.error);
                command = command.code;
                //console.log(command);
                }if(!py){
                command = `console.log(eval(${JSON.stringify(command)}))`} else {command = `print(eval(${JSON.stringify(command)}))`}
                command = command.replaceAll("\\n", "").replaceAll("\n", "");
                //console.log(command);
                b = btoa(command);
                result = execSync(`proot-distro login ubuntu --isolated -- eval 'echo "${b}" > ${k2}.txt && echo "$(base64 --decode ${k2}.txt)" > ${k}.${type} && ${runner} ${k}.${type} && rm -rf ${k}.${type} ${k2}.txt'`);
                result = result.toString().replaceAll("\\n", "").replaceAll("\n", "");
                //console.log(result);
            }
            //execSync(`proot-distro login ubuntu --isolated -- eval 'rm ${k}.js && rm ${k2}.txt'`);
            //result = a;
            /*if (result.length === 0) {
                console.log("changing result");
                result = execSync(`proot-distro login ubuntu -- node -e "console.log(${command})"`);
                result = result.toString().replaceAll("\\n", "").replaceAll("\n", "");
            }
            console.log(result.length);
            console.log(command)*/
        } catch (err) {
            //let regex2 = new RegExp(`/.*Error: .*/`);
            //let regex = /.*Error: .*/;
            //result = regex.exec((err.message + "").toString())[0];
            console.log(err.message);
            if (!(err.message + "").split(".")[1]) {
                result = "error happened somewhere but i cant find it lol";
            } else {
                result = (err.message + "").split("/root/")[1];
            }
            //result = err.message;
        
            /*console.log(
                regex.exec((err.message + "").toString())[0]
                );*/
            /*console.log(Object.getOwnPropertyNames(err));
            console.error("logging debug data:")
            console.error();*/
            //result = "lmao you did a error somewhere nerd :nerdclown: :haha:"
            failed = true;

            /*if (err.stack) {
                result = `${err.stack}`;
            }*/
        }
        message.reply(`${failed ? 'epic fucking fail loser skill issue\n' : ''}\`\`\`${failed ? result : JSON.stringify(result)}\`\`\``);
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
