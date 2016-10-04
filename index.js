var restify = require('restify');
var config  = require('./config');
var logger  = require('morgan');
var app     = restify.createServer({name:'Narvar-Bot'});
    
https             = require('https');
request           = require('request');
pageAccessToken = config.pageAccessToken;
 
app.use(logger('dev'));
app.use(restify.fullResponse());
app.use(restify.bodyParser());
app.use(restify.queryParser());
 
app.listen(process.env.PORT || config.port, function() {
	console.log('server listening on port number', config.port);	
});


var routes = require('./routes')(app);


// App Secret can be retrieved from the App Dashboard
const APP_SECRET = config.appSecret;

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = config.validationToken;

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = config.pageAccessToken;

// URL where the app is running (include protocol). Used to point to scripts and 
// assets located at this address. 
const SERVER_URL = config.serverURL;


// for Facebook verification
app.get('/webhook/', function (req, res, next) {
    if (req.query['hub.verify_token'] === 'narvar_verification_token') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
  console.error("Missing config values");
  process.exit(1);
}