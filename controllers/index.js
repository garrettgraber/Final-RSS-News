
var parser = require('parse-rss');
var xmlParser = require('xml2json');
var fs = require('fs');
var mongoose = require('mongoose');
var Q = require('q');


var Feed = require('../models/model.js');

// var rssFileList = ['feedTest', 'feedTest2'];

var rssFileList = ['feedTest', 'feedTest2'];

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

	},

	serverStartTest: function() {

		Feed.find({}).exec(function(error, result) {

			if(error) {
				console.log('Error finding dbase');
			}
			else {
				if(Object.keys(result).length === 0) {

					var rssDirectoryObjTemp = getFeedList(rssFileList);

					for(var key in rssDirectoryObjTemp) {

						var rssUrlListTemp = rssDirectoryObjTemp[key];
						console.log('key: ', key);
						console.log('rssUrlListTemp: ', rssUrlListTemp);
						queryAllFeeds(rssUrlListTemp, key);

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

var queryAllFeeds = function(rssList, fileName) {

	var promisesArray = [];

	for(var i=0; i , i < rssList.length; i++) {

		// var promisesArray = [queryFeed(tempRSS), queryFeed(tempRSS2)];
		promisesArray.push( queryFeed(rssList[ i ]) );

	}

	// Q.all([queryFeed(tempRSS), queryFeed(tempRSS2)]).spread(function(val1, val2) {

	Q.all( promisesArray ).spread(function(feed1) {

		console.log('\nNumber of feeds found: ', arguments.length);
		console.log('fileName: ', fileName);

		var masterFeedSaveList = [];
		var feedObjectCreatedStatus = false;


		for(var i=0; i < arguments.length; i++) {
			var tempFeedObjectRaw = arguments[ i ];

			var tempIValue = i + 1;
			console.log('\nvalue' + tempIValue + ' entries: ', Object.keys(tempFeedObjectRaw).length);			



			// console.log('tempFeedObjectRaw keys: ', Object.keys(tempFeedObjectRaw));
			// console.log('Feed title: ', tempFeedObjectRaw.title);

			var tempFeedObjectRawFirst = tempFeedObjectRaw['0'];

			// console.log('tempFeedObjectRawFirst: ', tempFeedObjectRawFirst);

			console.log('tripped the wire');
			console.log('title: ', tempFeedObjectRawFirst.meta.title);
			console.log('link: ', tempFeedObjectRawFirst.meta.link);
			console.log('date: ', tempFeedObjectRawFirst.meta.date);

			var tempFeedObject = new Feed({
				name: fileName,
				title: tempFeedObjectRawFirst.meta.title,
				link: tempFeedObjectRawFirst.meta.link,
				date: tempFeedObjectRawFirst.meta.date
			});

			console.log('Feed Object created');
		

	
			// var tempFeedObject = createFeedObject(tempFeedObjectRaw, fileName);

			// console.log('tempFeedObject:', tempFeedObject);

			for(var key in tempFeedObjectRaw) {

				var rssDataJson = tempFeedObjectRaw[key];

				var tempEntryObject = new FeedEntry({
					title: rssDataJson.title,
					date: rssDataJson.data,
					pubdate: rssDataJson.pubdate,
					pubDate: rssDataJson.pubDate,
					summary: rssDataJson.summary,
					description: rssDataJson.description,
					link: rssDataJson.guid,
					tags: rssDataJson.categories,
					metaTitle: rssDataJson.meta.title,
					metaDate: rssDataJson.meta.date,
					metaLink: rssDataJson.meta.link
				});


				tempFeedObject.addEntry(tempEntryObject);
				// tempFeedObject.info();


			}

			masterFeedSaveList.push(tempFeedObject);
			console.log('tempFeedObject entries: ', tempFeedObject.entries.length);

		}

		console.log('queryFeed has worked');
		console.log('masterFeedSaveList length: ', masterFeedSaveList.length);
	}).done();

};

var queryFeed = function(rssUrl) {

	var deferred = Q.defer();
	console.log('queryFeed has fired');


	parser(rssUrl, function(error, result) {

		if(error) {
			console.log('bad rss parse');
			// deferred.reject(new Error(error));
			deferred.resolve({});
		}
		else {
			// console.log('result: ', result);
			console.log('good rss parse');
			deferred.resolve(result);
		}

	});
	return deferred.promise;
};

var createFeedObject = function(feedObjectRaw, fileName) {

	console.log('createFeedObject function has fired');
	var rssDataFirst = feedObjectRaw['0'];
	var tempFeedObject = new Feed({
		name: feedName,
		title: rssDataFirst.meta.title,
		link: rssDataFirst.meta.link,
		date: rssDataFirst.meta.date
	});
	console.log('tempFeedObject: ', tempFeedObject);
	return tempFeedObject;
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