

var parser = require('parse-rss');

var parser2 = require('rssparser');

var Q = require('q');


var fs = require('fs');
var async = require('async');

var rssFileList = ['feedTest', 'feedTest2'];
var rssFeedList = [];
var rssFeedListFinal = [];
var seriesTest = [];
var rssFeed = '';

var queryFeedlist = function(feedList) {

	var rssFeedTemp = [];

	for(var  i=0; i < feedList.length; i++) {

		var filename = feedList[ i ];

		var fileOut = fs.readFileSync('../feed_files/' + filename  + '.txt', 'utf8');

		var fileOutParsed = fileOut.split('\n');
		var rssFeedUse = fileOutParsed.filter(function(value) {
			return value !== '';
		});
		
		var rssFeedTemp = rssFeedTemp.concat(rssFeedUse);

		console.log('rssFeedUse: ', rssFeedUse);

	}

	return rssFeedTemp;

};


var rssUrlList = function(fileList) {

	var rssFeedListTemp = [];


	async.eachSeries(fileList, 

		function(filename, callback) {

			fs.readFile('../feed_files/' + filename  + '.txt', 'utf8', function(error, data) {

				if(error) {
					rssFeed = '';
				}
				else {
					rssFeed = data.split('\n');
					rssFeedUse = rssFeed.filter(function(value) {
						return value !== '';
					});

					// console.log('data after call back complete: ', data);
					// console.log('rssFeedList: ', rssFeed);
					// console.log('rssFeedUse: ', rssFeedUse);

					rssFeedListFinal.concat(rssFeedUse);
					rssFeedListTemp.push(data);
					// rssFeedList.push(rssFeed);
					callback(error);
				}

			});
	
		},

		function(error) {
			if(error) {
				rssFeedListFinal = [];
			}
			else {
				console.log('rssFeedListFinal: ', rssFeedListFinal);
			}
		}

	);

	async.series([

		function(callback){
        	seriesTest.push('one');
        	callback(null, ['one']);
    	},
	    function(callback){
	    	seriesTest.push('two');
	    	console.log(seriesTest);
	        callback(null, ['two']);
	    }

	],

	function(error, results){
		// console.log('results series', results);
	});

	fs.readFile('../feed_files/feedTest.txt', 'utf8', function(error, data) {

		if(error) {
			rssFeed = '';
		}
		else {
			rssFeed = data;
			// console.log('data after call back complete', data);
			// console.log('rssFeedList', rssFeed);
			// rssFeedList.push(rssFeed);
		}

	});


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

//Promise function that queries the dbase async
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

//Promise function that queries the dbase async, lacks proper categories, is faster
var queryFeed2 = function(rssUrl) {

	var deferred = Q.defer();
	console.log('queryFeed2 has fired');

	parser2.parseURL(rssUrl, {}, function(error, result) {
		if(error) {
			console.log('bad rss parse');
			deferred.reject(new Error(error));
		}
		else {
			console.log('good rss parse');
			deferred.resolve(result);
		}
	});
	return deferred.promise;
};


var FeedObject = function(jsonFeedObject) {

};

var saveFeedMongo = function(feedObject) {



};


var tempRSS = 'http://rss.cnn.com/rss/edition_europe.rss';
var tempRSS2 = 'http://www.nytimes.com/services/xml/rss/nyt/Europe.xml';

var rssList = [
	'http://www.theguardian.com/world/europe/roundup/rss',
	'http://www.spiegel.de/international/europe/index.rss',
	'http://www.forbes.com/europe_news/index.xml',
	'http://www.washingtonpost.com/wp-dyn/rss/world/europe/index.xml'
	];

var rssList = rssList.concat([tempRSS, tempRSS2]);

Q.all([queryFeed2(tempRSS), queryFeed2(tempRSS2)]).spread(function(val1, val2) {

	// console.log('val1 :', val1);
	console.log('val1 type: ', val1.type);
	console.log('val1 entry length: ', val1.items.length);
	console.log('val2 type: ', val2.type);
	console.log('val2 entry length: ', val2.items.length);
}).done();

var promisesArray = [];

for(var i=0; i , i < rssList.length; i++) {

	// var promisesArray = [queryFeed(tempRSS), queryFeed(tempRSS2)];
	promisesArray.push( queryFeed(rssList[ i ]) );

}

// Q.all([queryFeed(tempRSS), queryFeed(tempRSS2)]).spread(function(val1, val2) {

Q.all( promisesArray ).spread(function(feed1) {

	console.log('Number of feeds found: ', arguments.length);

	for(var i=0; i < arguments.length; i++) {
		var tempFeedValue = arguments[ i ];
		var tempIValue = i + 1;
		console.log('value' + tempIValue + ' entries: ', Object.keys(tempFeedValue).length);
	}

	console.log('queryFeed has worked');
}).done();


