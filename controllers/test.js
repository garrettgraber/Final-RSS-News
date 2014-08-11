

var parser = require('parse-rss');
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


var rssFeedList3  = queryFeedlist(rssFileList);
console.log('rssFeedList3: ', rssFeedList3);