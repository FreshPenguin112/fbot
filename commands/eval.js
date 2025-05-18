const {execSync} = require("child_process");
var failed = false;
var result = "";
class Command {
    constructor() {
        this.name = "eval";
        this.description = "admin";
        this.attributes = {
            unlisted: true,

            numberConversion: 'off',
        };
    }

    main(message, args, util) {
        let command = args.join(' ').replaceAll("\`\`\`js", "").replaceAll("\`\`\`py", "").replaceAll("\`\`\`", "").replaceAll("\\n", "");
        let py = command.includes("#py")||command.includes("# py");
        if(py){command=command.replace("#py ", "").replace("# py ", "").replace("#py", "").replace("# py", "");}
        let local = command.startsWith("local") && message.author.id == 712497713043734539
        if(local)command=command.replace("local", "")
            let cargsindex = command.split("\n").findIndex(x => x.startsWith("#args")||x.startsWith("# args")||x.startsWith("//args")||x.startsWith("// args"));
        let cargs = "";
        if (cargsindex !== -1) {
            cargs = command.split("\n")[cargsindex].replace("# args ", "").replace("#args ", "").replace("// args ", "").replace("//args ", "").split(";");
            let cargs2 = "";
            for (let i of cargs) {
                cargs2 += i+"\n";
            };
            cargs = cargs2;
        };
        console.log('\n');
        console.log(`${message.author.username}:`);
        //console.log(command);
        /*if (py) {
         *  command = JSON.stringify(command);
         *  let r = JSON.stringify(`exec(${command})`);
         *  console.log(r);
         *  command = `require("child_process").execSync(\`python3.11 -c ${r}\`).toString()`;
    }*/
        console.log(command);
        console.log('\n');
        let b = btoa(command);
        let k = require("randomstring").generate();
        let k2 = require("randomstring").generate();
        let runner;
        let type;
        if (py) {
            runner = "python3";
            type = "py";
        } else {
            runner = "node";
            type = "js";
        }
        let debug = process.argv.includes("--debug");
        //console.log(debug);
        let debugcode = `rsync -a --delete --exclude=/tmp/ --exclude=/proc/ --exclude=/sys/ --exclude=/dev/ / /tmp/root_backup && diff -qr / /tmp/root_backup | grep -q . && rsync -a --delete /tmp/root_backup/ /`
        result = local ? eval(command) : execSync(`docker exec eval-runner sh -c 'echo "${b}" > ${k2}.txt && echo "$(base64 --decode ${k2}.txt)" > ${k}.${type} && ${runner} ${k}.${type}${debug ? " && " + debugcode : ""}'`,{input:cargs,timeout:30000});
        result = result.toString().replaceAll("\\n", "").replaceAll("\n", "");
        //console.log(result.length);
        if (result.length === 0) {
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
                result = execSync(`docker exec eval-runner sh -c 'echo "${b}" > ${k2}.txt && echo "$(base64 --decode ${k2}.txt)" > ${k}.${type} && ${runner} ${k}.${type}${debug ? " && " + debugcode : ""}'`,{input:cargs,timeout:30000});
                result = result.toString().replaceAll("\\n", "").replaceAll("\n", "");
                //console.log(result);

        }
    }

    run(message, args, util) {
        let id = 983171763972218970;
        let id2 = 1285035732595114014;
        //console.log(message.guild.id != id);
        //console.log(message.channel.id == id2);
        try {
            if(process.argv.includes("--lock")) {
                if(message.channel.id != id2) {
                    //console.log("bad");
                    result = "bot is currently locked down and can only be used in fresh's private testing server(most likely for debugging purposes)";
                } else {
                    var codeblock = true;
                    this.main(message, args, util);
                }
            } else {
                    if (!([id2, 1038251459843723274].includes(parseInt(message.channel.id)))) {
                        var codeblock = false;
                        result = "This command can only be used in <#1038251459843723274>";
                    } else {
                        var codeblock = true;
                        this.main(message, args, util);
                    }
                }
        } catch (err) {
            //let regex2 = new RegExp(`/.*Error: .*/`);
            //let regex = /.*Error: .*/;
            //result = regex.exec((err.message + "").toString())[0];
            console.log(err.message);
            /*if (!(err.message + "").split(".")[1]) {
                result = "error happened somewhere but i cant find it lol";
            } else {
                result = err.message;
            }*/
            result = err.message;
        
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
        console.log(String(result));
        message.reply(`${failed ? 'epic fucking fail loser skill issue\n' : ""}${codeblock ? "\`\`\`" + String(result) + "\`\`\`" : result}`);
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
