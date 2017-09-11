var Meme = function() {
  this.Url  = '';
  this.Owner = '';
};

Meme.prototype = {
	isOwner: function(username) {
		if(this.Owner == username) return true;
	}
}

// Return Meme
module.exports = Meme;