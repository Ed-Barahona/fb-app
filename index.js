const config  = require('./config');
const restify = require('restify');
const https = require('https');
const app     = restify.createServer({name:'REST-api'});
 
app.use(restify.fullResponse());
app.use(restify.bodyParser());
app.use(restify.queryParser());
 
app.listen(config.port, function() {
	console.log('server listening on port number', config.port);
});

var routes = require('./routes')(app);


// App Secret can be retrieved from the App Dashboard
const APP_SECRET = config.appSecret;

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = 'narvar_verification_token';//config.validationToken;

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = 'EAAFIWilTObMBANPZAivvPYx0OsDZCbGHLjyBJUU4hcuqLzWRetNPJN6WqY8ZAgMnZB51BqZCXjVQL3k14l9ADMZBPIOSGC4MxsgKDFinc4vJ6JJmZANklUmLACPvpBZCSTNEMEdi3kFFhKlVf5fDloPSQ2NZClgE52ApW44xNI6EaY1vLBaBlmFEB';//config.pageAccessToken;

// URL where the app is running (include protocol). Used to point to scripts and 
// assets located at this address. 
const SERVER_URL = config.serverURL;



if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
  console.error("Missing config values");
  process.exit(1);
}



// Facebook Webhook
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'narvar_verification_token') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});
