

var cheerio = require('cheerio');
var Promise = require("bluebird");
var request = Promise.promisify(require('request'));
var _ = require('underscore');

// var Twit = Promise.promisifyAll(require('twit'));

var Twit = require('twit');
Promise.promisifyAll(Twit.prototype);

// var Twit = require('twit');


var url = 'http://www.huffingtonpost.com';
var url2 = 'http://www.huffingtonpost.com/2014/08/20/obama-james-foley_n_5695270.html';
var url3 = 'http://www.huffingtonpost.com/2014/08/20/us-hostages-syria_n_5696419.html';
var url4 = 'http://www.nytimes.com/2014/08/21/world/middleeast/us-commandos-tried-to-rescue-foley-and-other-hostages.html?hp&action=click&pgtype=Homepage&version=LedeSum&module=first-column-region&region=top-news&WT.nav=top-news';


var CUSTOMER_KEY = '6AVqBLxtOZkWeWgcdsdXMLLTN';
var CUSTOMER_SECRET = 'Y30LpiAdtq4cT2Ubvt4xrd5Kno34gGr9Jnary9wQcdxd2nnGgO';
var ACCESS_TOKEN = '2565195049-8iLsJY5PmaSWkZDVoMjXuoGZhBub0YUiiDgH7XY';
var ACCESS_SECRET = 'QbJlCawyvg1XBgs8RDndXOiSxadaQpALkMuYl9jbQRYuZ';


var createTwitterObject = function() {

	var Twitter = new Twit({
		consumer_key: CUSTOMER_KEY,
		consumer_secret: CUSTOMER_SECRET,
		access_token: ACCESS_TOKEN,
		access_token_secret: ACCESS_SECRET
	});

	return Twitter;
};

var displayIfExists = function(termDisplay, termValue) {
	if(termValue !== undefined && termValue !== '' && termValue !== null) {
		console.log(termDisplay + ': ', termValue);
	}
};

var searchTwitterTag = function(rssTag) {

	var twitterObject = createTwitterObject();

	var hashTag = convertRssTagHashtag(rssTag);

	// console.log('Converted hashtag: ', hashTag);
	// console.log('Methods on the twitterObject: ', _.functions(twitterObject));
	// console.log('Twit: ', Twit);

	// var twitterGet = Promise.promisify(twitterObject.get, twitterObject);
	// Promise.promisify(twitterObject.get);
	var twitterPromise = twitterObject.getAsync('search/tweets', {q:hashTag, count:1}).spread(function(data, res, error) {
		// console.log('Data: ', data);
		// console.log('Error: ', error);

		// console.log('Data type: ', typeof(data));
		// console.log('Data keys: ', Object.keys(data));
		// console.log('Data keys statuses: ', Object.keys(data.statuses));

		if(data.search_metadata.count > 0) {
			// console.log('Hashtag found: ', hashTag);

			var internalTweetData = data.statuses[0];
			
			if(internalTweetData !== undefined) {

				console.log('\n\nTweet: ', internalTweetData.text);
				console.log('hashtag: ', hashTag);

				displayIfExists('Source', internalTweetData.source);
				// console.log('Source: ', internalTweetData.source);

				var userTweetData = internalTweetData.user;

				displayIfExists('User', userTweetData.name);
				// console.log('User: ', userTweetData.name);

				displayIfExists('Screen name', userTweetData.screen_name);
				// console.log('Screen name: ', userTweetData.screen_name);

				displayIfExists('Description', userTweetData.description);
				// console.log('Description: ', userTweetData.description);

				displayIfExists('Place', userTweetData.location);
				// console.log('Place: ', userTweetData.location);

				displayIfExists('Time-zone', userTweetData.time_zone);

				displayIfExists('Utc-offset', userTweetData.utc_offset);

				displayIfExists('Geo-enabled', userTweetData.geo_enabled)
				// console.log('Time-zone: ', userTweetData.time_zone);
				// console.log('type of data.statuses: ', typeof(internalTweetData));
				// console.log('keys of data.statuses: ', Object.keys(internalTweetData));
				// console.log('Keys of user: ', Object.keys(userTweetData));

				return Promise.resolve(hashTag);

			}
			else {
				console.log('\n\nTweet undefined for hashtag: ', hashTag);
				return Promise.resolve('');
			}

		}
		else {
			// console.log('Hashtag not found: ', hashTag);
			return Promise.resolve('');
		}
	});

	// console.log('twitterPromise: ', twitterPromise);

	return twitterPromise.then(function(data) {

		// console.log('Data 2: ', data);
	
		return Promise.resolve(data);
	});


	// twitterObject.get('search/tweets', {q:hashTag, count:1}, function(error, data, res) {

	// 	console.log('Searching twitter for: ', hashTag);

	// 	if(data.search_metadata.count > 0) {
	// 		console.log('Hashtag found: ', hashTag);
	// 		return hashTag;
	// 	}
	// 	else {
	// 		console.log('Hashtag not found: ', hashTag);
	// 		return '';
	// 	}
	// });

};

var searchTagList = function(inArray) {

	var hashTagMaster = [];


	for(var i=0; i < inArray.length; i++) {
		var tempPromise = searchTwitterTag(inArray[ i ]);
		hashTagMaster.push(tempPromise);

		// tempPromise.then(function(data) {
		// 	console.log('Hashtag found search function: ', data);

		// });
	}

	for(var i=0; i < hashTagMaster.length; i++) {
		var tempPromise = hashTagMaster[ i ];
		tempPromise.then(function(data) {

			if(data === '') {
				data = 'not found by api';
			}
			console.log('Hashtag found search function: ', data);
		});
	}
}



var htmlFromPage = function(inUrl) {

	return request(inUrl).then(function(result) {
		
		var response = result[0];
    	var body = result[1];
    	// console.log('body: ', body);

    	console.log('\n\nPage parse status: ', response.statusCode);
    	return Promise.resolve(body);
	});

};

var findRootUrl = function(url) {
	var urlStart = url.indexOf('http://');
	var urlEnd = url.indexOf('.com');
	var urlRoot = url.slice(urlStart + 7, urlEnd + 4);
	console.log('urlRoot: ', urlRoot);
	return urlRoot;
};

var findhashTags = function(url) {

	htmlFromPage(url).then(function(result) {


		// console.log(result);
		$ = cheerio.load(result);

		var urlRoot = findRootUrl(url);

		var titleFound = $('title').text();

		var metaTagsFoundKeyword = $('meta[name="keywords"]').attr('content');
		var metaTagsFoundNewsKeywords = $('meta[name="news_keywords"]').attr('content');


		console.log('metaTagsFoundKeyword: ', metaTagsFoundKeyword);
		console.log('metaTagsFoundNewsKeywords: ', metaTagsFoundNewsKeywords);

		if(urlRoot === 'www.huffingtonpost.com') {

			var metaTagsFound = $('meta[name="sailthru.tags"]').attr('content');
			var metaTagsList = metaTagsFound.split(',')


			
			var tagsFound = $('.bottom-tags').find('a');
			// find('.group');
			// console.log('tagsFound: ', tagsFound);
			console.log('tagsFound length: ', tagsFound.length);
			console.log('tagsFound type: ', typeof(tagsFound));

			var tagListOnPage = [];

			for(var i=0; i < tagsFound.length; i++) {
				var tempCheerioObject = tagsFound[i];
				// console.log('tempCheerioObject: ', tempCheerioObject); 
				var tagOnpage = tempCheerioObject.children[0].data;

				tagListOnPage.push(tagOnpage);
				// console.log('tempCheerioObject: ', tempCheerioObject);
				// var tagValue = tempCheerioObject.text();
				// console.log('tagValue: ', tagValue);

			}
		}

		else {

			if(metaTagsFoundNewsKeywords !== undefined) {
				var metaTagsList = metaTagsFoundNewsKeywords.split(',');
			}
			if(metaTagsFoundKeyword !== undefined) {
				var metaTagsList = metaTagsFoundKeyword.split(',');
			}
		}

		


		// var aTags = tagsFound.find('a').text();

		// console.log('A tags: ', aTags);
		console.log('title: ', titleFound);
		console.log('title length: ', titleFound.length);

		if(tagListOnPage !== undefined) {
			console.log('Tags found: ', tagListOnPage);
			searchTagList(tagListOnPage);
		}
		if(metaTagsList !== undefined) {
			console.log('metaTagsFound: ', metaTagsFound);
			searchTagList(metaTagsList);
		}


	});

};

var convertRssTagHashtag = function(rssTag) {

	var rssEdited = '';
	var rssParens = rssTag.indexOf('(');

	(rssTag.indexOf('(') > -1)? rssEdited = rssTag.slice(0, rssParens) :  rssEdited = rssTag;

	if(rssEdited[0] === ',') {
		rssEdited = rssEdited.slice(1, rssEdited.length);
	}

	if(rssEdited[ rssEdited.length - 1 ] === ',') {
		rssEdited = rssEdited.slice(0, rssEdited.length - 1);
	}

	var rssTagArray = rssEdited.split(' ');

	var rssTagArray = rssTagArray.filter(function(element) {
		return element !== '';
	});

	var rssTagFinal = rssTagArray.join('');
	// var rssTagFinal = rssTagFinal.toLowerCase();
	var rssTagFinal = '#' + rssTagFinal;

	if(rssTagFinal.length > 140) {
		rssTagFinal = '';
	}
	
	return rssTagFinal;

};

if(process.argv.length >= 3) {
	// var tempTag = process.argv[2];

	var firstValue = process.argv[2];

	if( (firstValue.indexOf('http://') > -1) || (firstValue.indexOf('https://') > -1) ) {
		findhashTags(firstValue);
	}
	else {

		var tempTagArray = process.argv.slice(2, process.argv.length);

		searchTagList(tempTagArray);

		// findhashTags(url5);
	}

	// var twitterPromise = searchTwitterTag(tempTag);
	// twitterPromise.then(function(data) {
	// 	console.log('Data found: ', data);
	// });
}
else {
	findhashTags(url3);
}


module.exports = {'convertRssTagHashtag':convertRssTagHashtag, 'searchTwitterTag':searchTwitterTag};
