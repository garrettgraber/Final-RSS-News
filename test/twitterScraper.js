

var cheerio = require('cheerio');
var Promise = require("bluebird");
var request = Promise.promisify(require('request'));

var Twit = Promise.promisifyAll(require('twit'));

// var Twit = require('twit');


var url = 'http://www.huffingtonpost.com';

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

var searchTwitterTag = function(rssTag) {

	var twitterObject = createTwitterObject();

	var hashTag = convertRssTagHashtag(rssTag);

	console.log('Converted hashtag: ', hashTag);
	
	var twitterPromise = twitterObject.get('search/tweets', {q:hashTag, count:1});

	twitterPromise.then(function(data) {

		console.log('Searching twitter for: ', hashTag);

		if(data.search_metadata.count > 0) {
			console.log('Hashtag found: ', hashTag);
			return Promise.resolve(hashTag);
		}
		else {
			console.log('Hashtag not found: ', hashTag);
			return Promise.resolve('');
		}
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



var htmlFromPage = function(inUrl) {

	return request(inUrl).then(function(result) {
		
		var response = result[0];
    	var body = result[1];

    	console.log(response.statusCode);
    	return Promise.resolve(body);
	});

};

var findhashTags = function(url) {

	htmlFromPage(url).then(function(result) {
		console.log(result);
		$ = cheerio.load(result);
		var titleFound = $('title').text();
		var tagsFound = $('.follow bottom-tags');
		console.log('title: ', titleFound);
		console.log()
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


module.exports = {'convertRssTagHashtag':convertRssTagHashtag, 'searchTwitterTag':searchTwitterTag};
