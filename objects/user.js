var User = function() {
	this.uID = '';
	this.Username = '';
	this.Access = 0;
};

User.prototype = {
	isMod: function() {
		if(this.Access >= 1) return true;
	},
	isAdmin: function() {
		if(this.Access >= 2) return true;
	},
	isDev: function() {
		if(this.Access >= 3) return true;
	}
}

// Return User
module.exports = User;