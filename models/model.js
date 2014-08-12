var mongoose = require('mongoose');


var FeedSchema = mongoose.Schema({

	name: String,
	title: String,
	link: String,
	date: String,
	entries: []

});


FeedSchema.methods.addEntry = function(entryObject) {

	this.entries.push(entryObject);

	// if(!this.title) {
	// 	this.title = entryObject.metaTitle;
	// }
	// if(!this.link) {
	// 	this.link = entryObject.metaLink;
	// }
	// if(!this.date) {
	// 	this.date = entryObject.metaDate;
	// }
};

FeedSchema.methods.info = function() {

	console.log('Feed Title: ', this.title);
	console.log('Feed Link: ', this.link);
	console.log('Feed Date: ', this.date);
	console.log('Feed Number of Entries: ', this.entries.length);
};

var Feed = mongoose.model('Feed', FeedSchema);

module.exports = Feed;