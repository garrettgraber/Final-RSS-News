
var parser = require('parse-rss');
var xmlParser = require('xml2json');
var fs = require('fs');
var mongoose = require('mongoose');
var Q = require('q');
var Twit = require('twit');


var Feed = require('../models/model.js');

// var rssFileList = ['feedTest', 'feedTest2'];

var rssFileList = ['feedTest', 'feedTest2'];

var CUSTOMER_KEY = '6AVqBLxtOZkWeWgcdsdXMLLTN';
var CUSTOMER_SECRET = 'Y30LpiAdtq4cT2Ubvt4xrd5Kno34gGr9Jnary9wQcdxd2nnGgO';
var ACCESS_TOKEN = '2565195049-8iLsJY5PmaSWkZDVoMjXuoGZhBub0YUiiDgH7XY';
var ACCESS_SECRET = 'QbJlCawyvg1XBgs8RDndXOiSxadaQpALkMuYl9jbQRYuZ';

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

	queryAndStoreFeeds: function() {

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

var createTwitterObject = function() {

	var Twitter = new Twit({
		consumer_key: CUSTOMER_KEY,
		consumer_secret: CUSTOMER_SECRET,
		access_token: ACCESS_TOKEN,
		access_token_secret: ACCESS_SECRET
	});

	return Twitter;
};

//Specifically made to be used with promises. Use them now before it is too late.
var searchTwitterHashtag = function(rssTag, twitterObject) {

	console.log('Searching twitter...');

	var hashTag = convertRssTagHashtag(rssTag);

	console.log('Converted hashtag: ', hashTag);

	var deferred = Q.defer();
	
	twitterObject.get('search/tweets', {q:hashTag, count:1}, function(error, data, res) {
		if(data.search_metadata.count > 0) {
			console.log('Hashtag found: ', hashTag);
			deferred.resolve( hashTag );
		}
		else {
			deferred.resolve( '' );
		}
	});

	return deferred.promise;

};

var searchTwitterTag = function(rssTag, twitterObject) {

	console.log('Searching twitter...');

	var hashTag = convertRssTagHashtag(rssTag);

	console.log('Converted hashtag: ', hashTag);
	
	twitterObject.get('search/tweets', {q:hashTag, count:1}, function(error, data, res) {
		if(data.search_metadata.count > 0) {
			console.log('Hashtag found: ', hashTag);
		}
		else {
			console.log('Hashtag not found: ', hashTag);
		}
	});
};

var foo = function(rssTagArray) {

	var TwitterObject = createTwitterObject();

	for(var i=0; i < rssTagArray.length; i++) {
		searchTwitterTag(rssTagArray[ i ], TwitterObject);
	}
};


//inObject needs to be an object with mongoose schema. Is specifically built for promises!
var saveObjectDBase = function(inObject) {

	var deferred = Q.defer();

	inObject.save(function(error){

		if(error) {
			deferred.resolve(0);
		}
		else {
			deferred.resolve(1);
		}

	});
	return deferred.promise;

};

//Specifically made to use promises. Go async mother fuckers, while there is still time.
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

var queryAllFeeds = function(rssList, fileName) {

	var Twitter = new Twit({
		consumer_key: CUSTOMER_KEY,
		consumer_secret: CUSTOMER_SECRET,
		access_token: ACCESS_TOKEN,
		access_token_secret: ACCESS_SECRET
	});

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
			// console.log('\nvalue' + tempIValue + ' entries: ', Object.keys(tempFeedObjectRaw).length);			
			var tempFeedObjectRawFirst = tempFeedObjectRaw['0'];
			console.log('title: ', tempFeedObjectRawFirst.meta.title);
			console.log('link: ', tempFeedObjectRawFirst.meta.link);
			console.log('date: ', tempFeedObjectRawFirst.meta.date);

			var tempFeedObject = new Feed({
				section: fileName,
				title: tempFeedObjectRawFirst.meta.title,
				link: tempFeedObjectRawFirst.meta.link,
				date: tempFeedObjectRawFirst.meta.date
			});

			console.log('Feed Object created');
	
			for(var keyEntry in tempFeedObjectRaw) {

				var rssDataJson = tempFeedObjectRaw[keyEntry];

				var rssCategoryArray = rssDataJson.categories;
				
				// console.log('Tag array: ', rssCategoryArray);

				var tempEntryObject = new FeedEntry({
					title: rssDataJson.title,
					date: rssDataJson.data,
					pubdate: rssDataJson.pubdate,
					pubDate: rssDataJson.pubDate,
					summary: rssDataJson.summary,
					description: rssDataJson.description,
					link: rssDataJson.guid,
					tags: rssCategoryArray,
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

		var saveObjectPromisesArray = [];

		for(var i=0; i < masterFeedSaveList.length; i++) {
			saveObjectPromisesArray.push( saveObjectDBase(masterFeedSaveList[ i ]) );
		}

		Q.all( saveObjectPromisesArray ).spread(function(saveResult) {

			var saveCounter = 0;

			for(var i=0; i < arguments.length; i++) {
				var saveStatus = arguments[ i ];
				saveCounter += saveStatus;
			}

			console.log('Number saved: ', saveCounter);

			(masterFeedSaveList.length === saveCounter) ? console.log('All feeds stored for this section: ', fileName) : console.log('Problem storing feeds stored for this section: ', fileName);

		}).dome();

		console.log('queryFeed has worked');

	}).done();
	


};



var convertRssTagHashtag = function(rssTag) {

	var rssEdited = '';
	var rssParens = rssTag.indexOf('(');

	if(rssTag.indexOf('(') > -1) {
		rssEdited = rssTag.slice(0, rssParens);
	}
	else {
		rssEdited = rssTag;
	}

	var rssTagArray = rssEdited.split(' ');

	var rssTagArray = rssTagArray.filter(function(element) {
		return element !== '';
	});

	var rssTagFinal = rssTagArray.join('');
	var rssTagFinal = rssTagFinal.toLowerCase();
	var rssTagFinal = '#' + rssTagFinal;

	return rssTagFinal;

};

var createFeedObject = function(feedObjectRaw, fileName) {

	console.log('createFeedObject function has fired');
	var rssDataFirst = feedObjectRaw['0'];
	var tempFeedObject = new Feed({
		section: feedName,
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