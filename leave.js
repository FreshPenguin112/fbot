const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Iterate over all guilds the bot is in
  client.guilds.cache.forEach(guild => {
    // Leave the guild
    guild.leave()
      .then(() => console.log(`Left guild: ${guild.name}`))
      .catch(error => console.error(`Error leaving guild ${guild.name}:`, error));
  });
});

client.login('MTEzOTkzMTAwNTM2OTcyMDg3Mg.G62FBs.UgJem9PJBvlhxckRqsUeB6BU2VafilDbS-XdtM');
