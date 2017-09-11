/* Basic Requires */
const axios = require('axios')
var async = require("async");

/* Custom Requires */
var GlobalObject = require("./utility/global");
var User = require('./objects/user');
var Meme = require('./objects/meme');
var ConsoleLib = require("./utility/consolelib");

var Global = new GlobalObject();
var NConsole = new ConsoleLib();

/* Main Program */

NConsole.writeLine("===================");
NConsole.writeLine("Server Starting");
Global.setupServer();

Global.Bot.on('message', msg => {
	
	if (msg.document != null) {
		var doc = msg.document;
		var userID = msg.from.id;
		var Username = msg.from.username;
		var chatId = msg.chat.id;
		if (doc.file_name == "giphy.mp4") {
			var file_id = doc.file_id;
			Global.Database.isNew(userID, function(userIsNew) {
				if (!userIsNew) {
					Global.Database.isNewMeme(file_id, function(isNewMeme, cost, ownerid) {
						if(isNewMeme) {
							Global.Bot.sendMessage(chatId, `@${Username} Ooo Nice gif! I'll take it! +1`);
							Global.Database.newMeme(file_id, userID);
						} else {
							var foundUser = false;
							var ownerUsername = "";
							Global.Database.getUsers(function(list) {
								async.each(list, function(userObject, next) {
									if (userObject.uID == ownerid && !foundUser) {
										foundUser = true;
										ownerUsername = userObject.Username;
									}
									next()
								}, function(err) {
									Global.Bot.sendMessage(chatId, `@${Username}\nMemeID: ${file_id}\nOwner: @${ownerUsername}\nValue: ${cost}`);
								});
							});
							
						}
					});
				} else { Global.Bot.sendMessage(chatId, `@${Username} Ooo Nice gif! You are not registed so I can't look at it.!`) }
			});
		}
	}
	
	//NConsole.writeLine(msg);
});

Global.Bot.onText(/^(\/help|\/help@MemeWarBot)$/, (msg) => {
	var chatId = msg.chat.id;
	var UserID = msg.from.id;
	var Username = msg.from.username;
	NConsole.writeLine(`/help [${chatId},${UserID},${Username}]`);
	Global.Bot.sendMessage(chatId, "=Commands=\n/help - show this!\n/register - register your uid with the bot!\n/update - update your username with the system!\n/score [user] - show your score, optional user.\n/leaderboard - top 5 memers!");
});

Global.Bot.onText(/^(\/update|\/update@MemeWarBot)$/, (msg) => {
	var chatId = msg.chat.id;
	var UserID = msg.from.id;
	var Username = msg.from.username;
	NConsole.writeLine(`/update [${chatId},${UserID},${Username}]`);
	Global.Database.isNew(UserID, function(userIsNew) {
		if(!userIsNew) {
			Global.Bot.sendMessage(chatId, `Updated user ${Username} with ID: ${UserID}...`)
			Global.Database.updateUsername(UserID,Username)
		} else {
			Global.Bot.sendMessage(chatId, `@${Username} You are not registered!`);
		}
	});
});

Global.Bot.onText(/^(\/register|\/register@MemeWarBot)$/, (msg) => {
	var chatId = msg.chat.id;
	var UserID = msg.from.id;
	var Username = msg.from.username;
	NConsole.writeLine(`/register [${chatId},${UserID},${Username}]`);
	Global.Database.isNew(UserID, function(userIsNew) {
		if(userIsNew) {
			Global.Bot.sendMessage(chatId, `Registered user ${Username} with ID: ${UserID}...`)
			Global.Database.newUser(UserID, Username);
		} else {
			Global.Bot.sendMessage(chatId, `@${Username} You are already registered!`);
		}
	});
});

// Matches "/score [whatever]"
Global.Bot.onText(/^(\/score (.+)|\/score@MemeWarBot (.+))/, (msg, match) => {
	var chatId = msg.chat.id;
	var UserID = msg.from.id;
	var Username = msg.from.username;
	
	var resp = match[2];
	NConsole.writeLine(`/score [${resp}] [${chatId},${UserID},${Username}]`);
	
	Global.Bot.sendMessage(chatId, `@${Username}, I'm loading this request!`).then(function(response) {
		var msgID = response.message_id;
		// Get resp score
		Global.Database.checkScore(null, resp, function(score) {
			if (score == -1) { Global.Bot.editMessageText(`@${Username}, ${resp} does not own any gifs!`, { chat_id: chatId, message_id: msgID }); return; }
							
			NConsole.writeLine(`/score [${resp}] [${chatId},${UserID},${Username}] -> [${score}]`);
			Global.Bot.editMessageText(`@${Username}, ${resp} score is ${score}!`, { chat_id: chatId, message_id: msgID });
		});
	});
});

// Matches "/score" or score@memewarbot
Global.Bot.onText(/^(\/score|\/score@MemeWarBot)$/, (msg, match) => {
	var chatId = msg.chat.id;
	var UserID = msg.from.id;
	var Username = msg.from.username;
	NConsole.writeLine(`/score [${chatId},${UserID},${Username}]`);
	Global.Bot.sendMessage(chatId, `@${Username}, I'm loading this request!`).then(function(response) {
		console.log(response)
		var msgID = response.message_id;
		// Get resp score
		Global.Database.checkScore(UserID, null, function(score) {
			if (score == -1) { Global.Bot.editMessageText(`@${Username}, you do not own any gifs!`, { chat_id: chatId, message_id: msgID }); return; }
							
			NConsole.writeLine(`/score [${chatId},${UserID},${Username}] -> [${score}]`);
			Global.Bot.editMessageText(`@${Username}, your score is ${score}!`, { chat_id: chatId, message_id: msgID });
		});
	});
});

// Matches "/leaderboard"
Global.Bot.onText(/^(\/leaderboard|\/leaderboard@MemeWarBot)$/, (msg, match) => {
	var chatId = msg.chat.id;
	var UserID = msg.from.id;
	var Username = msg.from.username;
	NConsole.writeLine(`/leaderboard [${chatId},${UserID},${Username}]`);
	
	var leaderboard = [];
	
	Global.Database.getUsers(function(list) {
		async.each(list, function(userObject, next) {
			Global.Database.checkScore(userObject.uID, null, function(score) {
				leaderboard.push({Username: userObject.Username, Score: score });
				next()
			});
		}, function(err) {
			NConsole.writeLine(`/leaderboard [${chatId},${UserID},${Username}] -> [leaderboard]`);
			
			leaderboard = leaderboard.sort(sortLeaderBoardObject)
			
			var message = ""
			for (var i = 0, len = leaderboard.length; i < len; i++) {
				if (i < 5) {
					message = message + `<b>#${i+1}</b> ${leaderboard[i].Username}: ${leaderboard[i].Score}\n`
				}
			}
			Global.Bot.sendMessage(chatId, message, {parse_mode:"HTML"});
		});
	});
});

// Matches "/modscore [id] [score]"
Global.Bot.onText(/^\/setvalue (.+)/, (msg, match) => {
	var chatId = msg.chat.id;
	var UserID = msg.from.id;
	var Username = msg.from.username;
	var resp = match[1];
	
	var hasaccess = false;
	
	Global.Database.getUsers(function(list) {
		async.each(list, function(userObject, next) {
			if (userObject.uID == UserID && userObject.Access >= 1) {
				hasaccess = true;
			}
			next()
		}, function(err) {
			if (hasaccess) {
				var args = resp.split(" ");
				NConsole.writeLine(`/setvalue [${args[0]},${args[1]}] [${chatId},${UserID},${Username}]`);
				if (args.count = 2) {
					var memeid = args[0];
					var value = args[1];
					Global.Bot.sendMessage(chatId, `@${Username} Set value of ${memeid} to ${value}!`);
					Global.Database.setValue(memeid, value);
				} else {
					Global.Bot.sendMessage(chatId, "Missing arguments!");
				}
			} else {
				Global.Bot.sendMessage(chatId, "Invaild Access!");
			}
		});
	});
});

NConsole.writeLine("Server Setup");
NConsole.writeLine("===================");

function sortLeaderBoardObject(a,b) {
  if (a.Score < b.Score)
    return 1;
  if (a.Score > b.Score)
    return -1;
  return 0;
}