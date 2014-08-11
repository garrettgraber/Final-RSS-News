
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

var queryFeed = function(rssUrl) {

	var rssData = parser(rssUrl, function(error, result) {
		if(error) {
			return null;
		}
		else {
			// console.log('result on the parser read: ', result);
			var rssData = result;

			console.log('No error on the feed side!');

			console.log('rssData type: ', typeof(rssData));

			console.log('rssData length: ', rssData.length);
			// console.log('rssData keys: ', Object.keys(rssData));

			var rssDataTemp = rssData['0'];

			console.log('rssDataTemp type: ', typeof(rssDataTemp));


			// var rssDataJson = xmlParser.toJson(rssDataTemp);
			var rssDataJson = rssDataTemp;
			// console.log('rssDataJson: ', rssDataJson);

			console.log('rssDataJson type: ', typeof(rssDataJson));
			console.log('rssDataJson length: ', rssDataJson.length);
			console.log('rssDataJson keys: ', Object.keys(rssDataJson));

			console.log('rssDataJson title: ', rssDataJson.title);
			console.log('rssDataJson date: ', rssDataJson.date);
			console.log('rssDataJson pubDate: ', rssDataJson.pubdate);
			console.log('rssDataJson pubDate2: ', rssDataJson.pubDate);
			console.log('rssDataJson summary: ', rssDataJson.summary);
			console.log('rssDataJson description: ', rssDataJson.description);

			console.log('rssDataJson link: ', rssDataJson.guid);
			console.log('rssDataJson tags: ', rssDataJson.categories);

			return result;
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