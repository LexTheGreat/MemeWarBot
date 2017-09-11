var ConsoleLib = require("./consolelib");
var User = require('../objects/user');
var Meme = require('../objects/meme');
var NConsole = new ConsoleLib();
var sqlite3 = require("sqlite3").verbose();
var FileSystem = require("fs");
var async = require("async");
var db = "";

var Database = function() {
	
};

Database.prototype = {
	open: function(file) {
		var status = "";
		var exists = FileSystem.existsSync(file);

		if(!exists) {
			NConsole.writeLine("Creating Database...");
			FileSystem.openSync(file, "w");
		} else {
			NConsole.writeLine("Opening Database...");
		}

		db = new sqlite3.Database(file);

		db.serialize(function() {
			if(!exists) {
				NConsole.writeLine("Creating table...");
				db.run("CREATE TABLE Users (uID TEXT, Username TEXT, Access INT)");
				db.run("CREATE TABLE Memes (file_id TEXT, OwnerID TEXT, Cost INT)");
				db.run("CREATE TABLE Sales (file_id TEXT, Seller TEXT, Price INT)");
			}
		});
	},
	close: function() {
		if(typeof db != "string") {
			NConsole.writeLine("Closed Database.");
			db.close();
			db = "";
		}
	},
	sellMeme: function(file_id, sellerid, price) {
	},
	// Returns False! Fix something else
	isNew: function(uID, callback) {
		if(typeof db != "string") {
			db.serialize(function() {
				var isUsernew = true;
				db.each("SELECT * FROM Users", function(err, row) {
					if(row.uID == uID && isUsernew) {
						isUsernew = false;
						return;
					}
				}, function(err, cntx) {
					callback(isUsernew);
				});
			});
		}
	},
	isNewMeme: function(file_id, callback) {
		if(typeof db != "string") {
			db.serialize(function() {
				var isMemenew = true;
				var cost = 0
				var ownerid = ""
				db.each("SELECT * FROM Memes", function(err, row) {
					if(row.file_id == file_id && isMemenew) {
						isMemenew = false;
						cost = row.Cost;
						ownerid = row.OwnerID
					}
				}, function(err, cntx) {
					callback(isMemenew, cost, ownerid);
				});
			});
		}
	},
	loadUser: function(uID, callback) {
		if(typeof db != "string") {
			db.serialize(function() {
				var User = new User();
				db.each("SELECT * FROM Users", function(err, row) {
					if(row.uID == uID) {
						User.uID = uID;
						User.Username = row.Username;
						User.Access = row.Access;
					}
				}, function(err, cntx) {
					callback(User)
				});
				
			});
		}
	},
	saveUser: function(User) {
		this.isNew(User.uID, function(userIsNew) {
			if(userIsNew) {
				// No Save!
			} else {
				db.serialize(function() {
					db.run("UPDATE Users SET Username = " + User.Username + ", Access = " + User.Access + " WHERE uID = '" + User.uID + "'");
				});
			}
		});
	},
	newUser: function(uID, Username) {
		db.serialize(function() {
			db.run("INSERT INTO Users (uID, Username, Access) VALUES ('" + uID + "','" + Username + "', 0)");
		});
	},
	newMeme: function(file_id, Username) {
		db.serialize(function() {
			db.run("INSERT INTO Memes (file_id, OwnerID, Cost) VALUES ('" + file_id + "','" + Username + "', 1)");
		});
	},
	getUsers: function(callback) {
		var list = [];
		var thisself = this;
		db.each("SELECT * FROM Users", function(err, row) {
			list.push({uID: row.uID, Username: row.Username, Access: row.Access});
		}, function(err, cntx) {
			callback(list);
		}); 
	},
	updateUsername: function(uid, username) {
		db.serialize(function() {
			db.run("UPDATE Users SET Username='" + username + "' WHERE uID='" + uid + "';");
		});
	},
	setValue: function(file_id, value) {
		db.serialize(function() {
			db.run("UPDATE Memes SET Cost=" + value + " WHERE file_id='" + file_id + "';");
		});
	},
	checkScore: function(uID, Username, callback) {
		var thisself = this
		if(typeof db != "string") {
			db.serialize(function() {
				var Score = -1;
				
				if (uID != null) {
					db.each("SELECT * FROM Memes", function(err, row) {
						if(row.OwnerID == uID) {
							if (Score == -1)
								Score = 1;
							
							Score += row.Cost;
						}
					}, function(err, cntx) {
						callback(Score);
					}); 
				} else {
					thisself.getUsers(function(list) {
						async.each(list, function(userObject, next) {
							if (userObject.Username == Username) {
								uID = userObject.uID;
							}
							next()
						}, function(err) {
							db.each("SELECT * FROM Memes", function(err, row) {
								if(row.OwnerID == uID) {
									if (Score == -1)
										Score = 0;
									
									Score += row.Cost;
								}
							}, function(err, cntx) {
								callback(Score);
							});
						});
					});
				}
			});
		}
	}
}

module.exports = Database;