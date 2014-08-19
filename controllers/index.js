
var parser = require('parse-rss');
var xmlParser = require('xml2json');
var fs = require('fs');
var mongoose = require('mongoose');
var Q = require('q');
var Twit = require('twit');

var badRSSList = [];
var masterSaveCounter = 0;


var Feed = require('../models/model.js');

// var rssFileList = ['feedTest', 'feedTest2'];

// var rssFileList = ['feedTest', 'feedTest2'];

var rssFileList = [ 
	'EuropeFeeds',
	'AfricaFeeds',
	'MiddleEastFeeds',
	'AsiaFeeds',
	'WorldFeeds',
	'TopStoriesFeeds',
	'USFeeds'
];

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
	},

	searchTwitterArray : function(hashTagArray) {

		var deferred = Q.defer();
		var promiseArray = [];

		var TwitterObject = createTwitterObject();

		for(var i=0; i < hashTagArray.length; i++) {
			promiseArray.push( searchTwitterHashtag( hashTagArray[i], TwitterObject ) );
		}

		var promiseTwitter = Q.allSettled( promiseArray );

		promiseTwitter.then(

			function(hashTagResults) {

				var tempHashTagArray = [];

				console.log('hashTagResults: ', hashTagResults);

				for(var i=0; i < hashTagResults.length; i++) {

					var hashTagObject = hashTagResults[i];
					console.log('hashTagObject: ', hashTagObject);
					var hashTagValue = hashTagObject.value;
					console.log('hashTagValue: ', hashTagValue);
					tempHashTagArray.push(hashTagValue)
				}

				console.log('hashtag array: ', tempHashTagArray);
				deferred.resolve(tempHashTagArray);
			},

			function(error) {
				deferred.reject(error);
			}).done();

		return deferred.promise;

	}

};


var FeedEntry = function(feedJsonData) {

	this.hashTags = [];

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

		console.log('Entry object is being added');

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

	var hashTag = convertRssTagHashtag(rssTag);

	// console.log('Converted hashtag: ', hashTag);

	var deferred = Q.defer();
	
	twitterObject.get('search/tweets', {q:hashTag, count:1}, function(error, data, res) {
		if(data.search_metadata.count > 0) {
			console.log('Hashtag found: ', hashTag);
			deferred.resolve( hashTag );
		}
		else {
			console.log('Hashtag not found: ', hashTag);
			deferred.resolve( '' );
		}
	});

	return deferred.promise;

};

var searchTwitterTag = function(rssTag, twitterObject) {

	var hashTag = convertRssTagHashtag(rssTag);

	// console.log('Converted hashtag: ', hashTag);
	
	twitterObject.get('search/tweets', {q:hashTag, count:1}, function(error, data, res) {
		if(data.search_metadata.count > 0) {
			console.log('Hashtag found: ', hashTag);
			return hashTag;
		}
		else {
			console.log('Hashtag not found: ', hashTag);
			return '';
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
			console.log('bad rss parse: ', rssUrl);

			badRSSList.push(rssUrl);
			// deferred.reject(new Error(error));
			deferred.resolve({});
		}
		else {
			// console.log('result: ', result);
			console.log('good rss parse:', rssUrl);
			deferred.resolve(result);
		}

	});
	return deferred.promise;
};




var queryAllFeeds = function(rssList, fileName) {

	var TwitterObject = createTwitterObject();
	var promisesArrayRaw = [];

	console.log('before the rss promise array');

	for(var i=0; i , i < rssList.length; i++) {
		promisesArrayRaw.push( queryFeed(rssList[ i ]) );
	}

	console.log('after the rss promise array');

	var rssPromiseArray = Q.all( promisesArrayRaw );

	console.log('found the rss feeds: ', rssPromiseArray);

	rssPromiseArray.then(function(feedsArray) {
		console.log('\nNumber of feeds found: ', feedsArray.length);
		console.log('fileName: ', fileName);

		var masterFeedSaveList = [];
		var feedObjectCreatedStatus = false;

		for(var i=0; i < feedsArray.length; i++) {
			var tempFeedObjectRaw = feedsArray[ i ];
			var tempIValue = i + 1;
			var tempFeedObjectRawFirst = tempFeedObjectRaw['0'];
			console.log('title: ', tempFeedObjectRawFirst.meta.title);
			console.log('link: ', tempFeedObjectRawFirst.meta.link);
			console.log('date: ', tempFeedObjectRawFirst.meta.date);

			var tempFeedObject = new Feed({
				section: fileName,
				title: tempFeedObjectRawFirst.meta.title,
				link: tempFeedObjectRawFirst.meta.link,
				date: tempFeedObjectRawFirst.meta.date,
				tagStatus: false
			});

			console.log('Feed Object created');
	
			var entryCounter = 0;

			for(var keyEntry in tempFeedObjectRaw) {

				entryCounter++;

				if(entryCounter < 21) {

					var rssDataJson = tempFeedObjectRaw[keyEntry];
					var rssCategoryArray = rssDataJson.categories;

					if(rssCategoryArray.length > 0) {

						tempFeedObject.tagStatus = true;

						var tempTagArray = [];

						for(var tempKey in rssCategoryArray) {
							var tempTag = rssCategoryArray[tempKey];
							tempTagArray.push(tempTag);
						}

					}

					else {

						tempTagArray = [];
					}

					// console.log('tag keys: ', Object.keys(rssCategoryArray));

					// console.log('tag keys: ', tempTagArray );




					// var promiseArray = [];

					// for(var j=0; j < rssCategoryArray.length; j++) {
					// 	promiseArray.push( searchTwitterHashtag( rssCategoryArray[ j ], TwitterObject ) );
					// }

					var summaryUseIndex = rssDataJson.summary.indexOf('<');
					var summaryUse = rssDataJson.summary.slice(0, summaryUseIndex);

					var descriptionUseIndex = rssDataJson.summary.indexOf('<');
					var descriptionUse = rssDataJson.description.slice(0, descriptionUseIndex);

					var currentIndex = tempFeedObject.entries.length;

					var tempEntryObject = new FeedEntry({
						title: rssDataJson.title,
						date: rssDataJson.data,
						pubdate: rssDataJson.pubdate,
						pubDate: rssDataJson.pubDate,
						summary: summaryUse,
						description: descriptionUse,
						link: rssDataJson.guid,
						tags: tempTagArray,
						entryNumber: currentIndex,
						metaTitle: rssDataJson.meta.title,
						metaDate: rssDataJson.meta.date,
						metaLink: rssDataJson.meta.link,
					});

					tempFeedObject.addEntry(tempEntryObject);

					// if(rssCategoryArray.length > 0) {

					// 	var promiseTwitter = Q.allSettled( promiseArray );

					// 	var promiseKeys = promiseTwitter.keys();
					// 	// console.log('Promise keys: ', promiseKeys);

					// 	promiseTwitter.then(function(hashTagResults) {

					// 		var tempHashTagArray = [];

					// 		console.log('hashTagResults: ', hashTagResults);

					// 		for(var i=0; i <  hashTagResults.length; i++) {

					// 			var hashTagObject = hashTagResults[ i ];
					// 			var hashTagValue = hashTagObject.value;
					// 			console.log('hashTagValue: ', hashTagValue);
					// 			tempHashTagArray.push(hashTagValue);
					// 		}

					// 		console.log('hashtag array: ', tempHashTagArray);

					// 		tempEntryObject.hashTags = tempHashTagArray;

					// 		tempFeedObject.addEntry(tempEntryObject);

					// 	}).done();
					
					// }

					// else {
					// 	tempFeedObject.addEntry(tempEntryObject);
					// }

				}

				else {

					console.log('breaking the loop');
					break;
				}

			}

			masterFeedSaveList.push(tempFeedObject);
			console.log('tempFeedObject entries: ', tempFeedObject.entries.length);

		}

		var tempFeedObject = masterFeedSaveList[0];
		console.log('Section: ', tempFeedObject.section);
		console.log('Title: ', tempFeedObject.title);
		console.log('masterFeedSaveList length: ', masterFeedSaveList.length);
		console.log('tempFeedObject number of entries: ', tempFeedObject.entries.length);
		console.log('Length of masterFeedSaveList: ', masterFeedSaveList.length);

		var saveObjectPromisesArray = [];
		console.log('At the save point');

		for(var i=0; i < masterFeedSaveList.length; i++) {
			saveObjectPromisesArray.push( saveObjectDBase(masterFeedSaveList[ i ]) );
		}

		Q.all( saveObjectPromisesArray ).then(function(saveResult) {

			var saveCounter = 0;

			for(var i=0; i < saveResult.length; i++) {
				var saveStatus = saveResult[ i ];
				saveCounter += saveStatus;
			}

			(masterFeedSaveList.length === saveCounter) ? console.log('All feeds stored for this section: ', fileName) : console.log('Problem storing feeds stored for this section: ', fileName);
			console.log('Number saved: ', saveCounter);

			masterSaveCounter += saveCounter;


		}).then(function(blah) {
			console.log('Total saved: ', masterSaveCounter);

		}).done();

	}).then(function(blah) {
		console.log('queryAndStoreFeeds is finished');
		console.log('bad RSS List', badRSSList);
		twitterSearchDbase();
	}).done();
};

// var searchTwitter(hashTag) {


// };
var twitterSearchDbase = function() {

	Feed.find({}, function(error, result) {

		if(!error) {

			console.log('Length of dbase: ', result.length);

			console.log('Dbase keys: ', Object.keys(result));

			for(var key in result) {
				var newsSection = result[key];
				console.log('temp whatever section: ', newsSection.section);
				console.log('temp whatever title: ', newsSection.title);

			}

		// 	console.log('dbase type: ', typeof(result));
		// 	console.log('dbase keys: ', Object.keys(result));

		// 	if(Object.keys(result).length > 0) {

		// 		for(key in result) {
		// 			var sectionObject = result[key];
		// 			console.log('key: ', key);
		// 			console.log('type of feed: ', typeof(sectionObject));
		// 			// console.log('feed keys: ', sectionObject);

		// 			for(feedKey in sectionObject) {

		// 				var feedObject = sectionObject[feedKey];
		// 				console.log('key: ', feedKey);
		// 				consoel.log('type of feed: ', typeof(feedObject));
		// 			}
		// 		}

		// 	}
		}

	});

};




var turnTagsToHashTags = function(tempFeedObject) {

	var tempFeedObjectEntries = tempFeedObject.entries;

	for(var i=0; i < tempFeedObjectEntries.length; i++) {



	}


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