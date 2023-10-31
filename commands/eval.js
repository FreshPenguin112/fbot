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
            let command = args.join(' ').replaceAll("\`\`\`js", "").replaceAll("\`\`\`py", "").replaceAll("\`\`\`", "");
            let py = command.startsWith("#py")||command.startsWith("# py");
            console.log('\n');
            console.log(`${message.author.username}:`);
            //console.log(command);
            console.log(command);
            console.log('\n');
            let b = btoa(command);
            let k = require("randomstring").generate();
            let k2 = require("randomstring").generate();
            //result = execSync(`proot-distro login ubuntu --isolated -- eval 'echo "${b}" > ${k2}.txt && echo "$(base64 --decode ${k2}.txt)" > ${k}.js && node ${k}.js && rm -rf ${k}.js ${k2}.txt'`);
            //result = result.toString().replaceAll("\\n", "").replaceAll("\n", "");
            //console.log(result.length);
            if (!0) {
                //console.log("doing eval instead");
                if (!py){
                command = require("uglify-js").minify(command, 
                    {
                    compress: {
                        expression: true
                    },
                    mangle: {
                        eval: true,
                        toplevel: true
                    }
                    });
                command = command.code;
                
                } else {
                command = b;
                //command = execSync(`proot-distro login ubuntu --isolated -- eval 'echo "${b}" > ${k2}_${k} && echo "base64 --decode ${k2}_${k}" > ${k} && pyminify ${k} && rm -rf ${k2}_${k} ${k}`
                }
                //console.log(command.error);
                //command = command.code;
                //console.log(command);
                if (py) {
                command = `import base64, io
                           from contextlib import redirect_stdout
                           stdout = io.StringIO()
                           x = base64.b64decode
                           print(exec(x(command)))`
                }
                else {
                command = `console.log(eval(${JSON.stringify(command)}))`
                }
                command = command.replaceAll("\\n", "").replaceAll("\n", "");
                //console.log(command);
                b = btoa(command);
                let c = `proot-distro login ubuntu --isolated -- eval 'echo "${b}" > ${k2} && echo "$(base64 --decode ${k2})" > ${k} && node ${k} && rm -rf ${k} ${k2}'`
                if (py) {
                c = c.replace("node", "python3.11");
                result = execSync(c);
                result = result.toString().replaceAll("\\n", "").replaceAll("\n", "");
                //console.log(result);
                }
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
            if (!(err.message + "").split("/root/")[1]) {
                result = "error happened somewhere but i cant find it lol";
            } else {
                result = (err.message + "").split("/root/")[1]
            }
            console.log(err.message);
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
