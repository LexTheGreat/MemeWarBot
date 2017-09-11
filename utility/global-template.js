// RENAME ME TO global.js!

var ConsoleLib = require("./consolelib");
var NConsole = new ConsoleLib();

var Global = function() {
	this.lib = {
		Express: require('express'),
		Moment: require('moment'),
		bodyParser: require('body-parser'),
		TelegramBot: require('node-telegram-bot-api'),
		Database: require("./database")
	};

	this.App = {};
	this.Bot = {};
	this.Database = {}
	
	this.apiToken = 'Replace me!';

	this.Setup = false;
};

Global.prototype = {
	setupServer: function(folder, port) {
		if (this.Setup)
			return;
		
		this.App = new this.lib.Express()
		this.App.use(this.lib.bodyParser.json());
		this.App.use(this.lib.bodyParser.urlencoded({
			extended: true
		}));
		
		this.Bot = new this.lib.TelegramBot(this.apiToken, {polling: true});
		this.Database = new this.lib.Database();
		
		this.Database.open("data.db");
		
		// We are receiving updates at the route below!
		this.App.post(`/bot${this.apiToken}`, (req, res) => {
			this.Bot.processUpdate(req.body);
			res.sendStatus(200);
		});
		this.App.listen(3000, function() {
			NConsole.writeLine("listening to 3000..");
		});

		this.Setup = true;
	},
	getApp: function() {
		return this.App;
	}
}

module.exports = Global;