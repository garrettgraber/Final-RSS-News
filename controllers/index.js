
var parser = require('parse-rss');
var xmlParser = require('xml2json');
var fs = require('fs');
var mongoose = require('mongoose');

var Feed = require('../models/model.js');

// var rssFileList = ['feedTest', 'feedTest2'];

var rssFileList = ['feedTest'];

var indexController = {
	index: function(req, res) {
		res.render('index');
	},


	queryFeedlist: function() {

		var rssFeedTemp = [];

		for(var  i=0; i < rssFileList.length; i++) {

			var filename = rssFileList[ i ];
			var fileOut = fs.readFileSync('./feed_files/' + filename  + '.txt', 'utf8');
			var fileOutParsed = fileOut.split('\n');
			var rssFeedUse = fileOutParsed.filter(function(value) {
				return value !== '';
			});
			var rssFeedTemp = rssFeedTemp.concat(rssFeedUse);
			console.log('rssFeedUse: ', rssFeedUse);

		}
		return rssFeedTemp;
	},

	serverStart: function() {

		Feed.find({}).exec(function(error, result) {

			if(error) {
				console.log('Error finding in dbase');
			}
			else {

				if(Object.keys(result).length === 0) {

					var rssDirectoryObjTemp = getFeedList(rssFileList);

					// console.log('rss object: ', rssDirectoryObjTemp);

					var tempRssUrl = rssDirectoryObjTemp.feedTest[0];
					// console.log('tempRssUrl: ', tempRssUrl);
					// console.log('rssDirectoryObjTemp keys: ', Object.keys(rssDirectoryObjTemp));
					// console.log('rssDirectoryObjTemp: ', rssDirectoryObjTemp);


					for(var key in rssDirectoryObjTemp) {

						var rssUrlListTemp = rssDirectoryObjTemp[key];
						console.log('key: ', key);
						console.log('rssUrlListTemp: ', rssUrlListTemp);
						saveFeedDbase(rssUrlListTemp, key);

					}


				}
			}

		});

	}

};


var FeedEntry = function(feedJsonData) {

	for(var key in feedJsonData) {

		this[key] = feedJsonData[key];

	}

};

var FeedTotalObject = function(metaDataObject) {

	this.entries = [];

	this.title = metaDataObject.metaTitle;
	this.link = metaDataObject.metaLink;
	this.date = metaDataObject.metaDate;

	this.addEntry = function(entryObject) {
		this.entries.push(entryObject);

		if(!this.title) {
			this.title = entryObject.metaTitle;
		}
		if(!this.link) {
			this.link = entryObject.metaLink;
		}
		if(!this.date) {
			this.date = entryObject.metaDate;
		}
	};

	this.info = function() {

		console.log('Feed Title: ', this.title);
		console.log('Feed Link: ', this.link);
		console.log('Feed Date: ', this.date);
		console.log('Feed Number of Entries: ', this.entries.length);
	};

};

var saveFeedDbase = function(rssUrlList, feedName) {

	var errorCount = 0;
	var saveCount = 0;
	var feedObjectCreatedStatus = false;

	for(var i=0; i < rssUrlList.length; i++) {

		var rssUrlInit = rssUrlList[ i ];

		console.log('rssUrl: ', rssUrlInit);
		console.log('i: ', i);

		(function(i){

		var rssUrl = rssUrlList[ i ];

		parser(rssUrl, function(error, result) {

			console.log('callback ran', i, feedName, rssUrl);

			if(error) {
				console.log('Error parsing: ', rssUrl);
			}
			else {
				// console.log('result on the parser read: ', result);

				var rssData = result;

				console.log('No error on the feed side: ', rssUrl);

				if(feedObjectCreatedStatus === false) {

					feedObjectCreatedStatus = true;
					var rssDataFirst = rssData['0'];

					console.log('tripped the wire');

					var tempFeedObject = new Feed({
						name: feedName,
						title: rssDataFirst.meta.title,
						link: rssDataFirst.meta.link,
						date: rssDataFirst.meta.date
					});

					console.log('Feed Object created');
				}

				for(var key in Object.keys(rssData)) {

					var rssDataTemp = rssData[key];

					var rssDataJson = rssDataTemp;
	
					var tempEntryObject = new FeedEntry({
						title: rssDataJson.title,
						date: rssDataJson.data,
						pubdate: rssDataJson.pubdate,
						pubDate: rssDataJson.pubDate,
						summary: rssDataJson.summary,
						description: rssDataJson.description,
						link: rssDataJson.link,
						tags: rssDataJson.categories,
						metaTitle: rssDataJson.meta.title,
						metaDate: rssDataJson.meta.date,
						metaLink: rssDataJson.meta.link
					});


					tempFeedObject.addEntry(tempEntryObject);

				}

				tempFeedObject.info();

				tempFeedObject.save(function(error){

					if(error) {
						errorCount++;
						console.log('Error writting to the database. Total Erorrs: ', errorCount);

					}
					else {
						saveCount++;
						console.log('Object saved. Total saved: ', saveCount);

					}

				});

			}

		});

	})(i);

	}
	// console.log('rssData: ', rssData);
	// return rssData;
};

var getFeedList = function(fileList) {

	var rssFeedTemp = [];
	var rssDirectoryObj = {};

	for(var  i=0; i < fileList.length; i++) {

		var filename = fileList[ i ];
		var fileOut = fs.readFileSync('./feed_files/' + filename  + '.txt', 'utf8');
		var fileOutParsed = fileOut.split('\n');
		// console.log('fileOutParsed: ', fileOutParsed);
		var rssFeedUse = fileOutParsed.filter(function(value) {
			return value !== '';
		});
		fileOutParsed.forEach(function(value) {
			rssDirectoryObj[ filename ] = rssFeedUse;
		});
		var rssFeedTemp = rssFeedTemp.concat(rssFeedUse);
		// console.log('rssFeedUse: ', rssFeedUse);
		// console.log('rssObject: ', rssDirectoryObj);

	}
	return rssDirectoryObj;
};


module.exports = indexController;