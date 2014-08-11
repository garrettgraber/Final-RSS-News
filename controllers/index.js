
var parser = require('parse-rss');
var xmlParser = require('xml2json');
var fs = require('fs');

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

	populateFeeds: function() {
		var temp = getFeedList(rssFileList);


		console.log('rss object: ', temp);

		var tempRssUrl = temp.feedTest[0];

		console.log('tempRssUrl: ', tempRssUrl);

		queryFeed(tempRssUrl);

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

var queryFeed = function(rssUrl) {

	var rssData = parser(rssUrl, function(error, result) {
		if(error) {
			return null;
		}
		else {
			// console.log('result on the parser read: ', result);
			var rssData = result;

			console.log('No error on the feed side!');

			// console.log('rssData type: ', typeof(rssData));

			// console.log('rssData keys: ', Object.keys(rssData));
			var rssDataFirst = rssData['0'];

			var tempFeedObject = new FeedTotalObject({
				metaTitle: rssDataFirst.meta.title,
				metaLink: rssDataFirst.meta.link,
				metaDate: rssDataFirst.meta.date
			});

			for(var key in Object.keys(rssData)) {

				var rssDataTemp = rssData[key];

				// console.log('rssDataTemp type: ', typeof(rssDataTemp));


				// var rssDataJson = xmlParser.toJson(rssDataTemp);
				var rssDataJson = rssDataTemp;
				// console.log('rssDataJson: ', rssDataJson);

				// console.log('rssDataJson type: ', typeof(rssDataJson));
				// console.log('rssDataJson length: ', rssDataJson.length);
				// console.log('rssDataJson keys: ', Object.keys(rssDataJson));

				// console.log('rssDataJson title: ', rssDataJson.title);
				// console.log('rssDataJson date: ', rssDataJson.date);
				// console.log('rssDataJson pubDate: ', rssDataJson.pubdate);
				// console.log('rssDataJson pubDate2: ', rssDataJson.pubDate);
				// console.log('rssDataJson summary: ', rssDataJson.summary);
				// console.log('rssDataJson description: ', rssDataJson.description);

				// console.log('rssDataJson link: ', rssDataJson.guid);
				// console.log('rssDataJson tags: ', rssDataJson.categories);


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

				// console.log('rssData meta: ', rssDataJson.meta);

				// console.log('Meta title: ', rssDataJson.meta.title);
				// console.log('Meta date: ', rssDataJson.meta.date);
				// console.log('Meta link: ', rssDataJson.meta.link);
				// console.log('Meta keys: ', Object.keys(rssDataJson.meta));
			}

			// console.log('tempFeedObject entry 1: ', tempFeedObject.entries[7]);


			tempFeedObject.info();

			// console.log('tempFeedObject total entries: ', tempFeedObject.entries.length);
			// console.log('tempFeedObject title: ', tempFeedObject.title);
			// console.log('tempFeedObject link: ', tempFeedObject.link);
			// console.log('tempFeedObject date:', tempFeedObject.date);
			
			return tempFeedObject;
		}
	});


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
		console.log('fileOutParsed: ', fileOutParsed);
		var rssFeedUse = fileOutParsed.filter(function(value) {
			return value !== '';
		});
		fileOutParsed.forEach(function(value) {
			rssDirectoryObj[ filename ] = rssFeedUse;
		});
		var rssFeedTemp = rssFeedTemp.concat(rssFeedUse);
		console.log('rssFeedUse: ', rssFeedUse);
		console.log('rssObject: ', rssDirectoryObj);

	}
	return rssDirectoryObj;
};


module.exports = indexController;