const config  = require('./config');
const restify = require('restify');
const https   = require('https');
const app     = restify.createServer({name:'fb-app'});
 
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
const VALIDATION_TOKEN = config.validationToken;

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = config.pageAccessToken;

// URL where the app is running (include protocol). Used to point to scripts and 
// assets located at this address. 
const SERVER_URL = config.serverURL;



// for Facebook verification
app.get('/webhook/', function (req, res, next) {
    console.log('req', req);
    console.log('params', req.params);
    if (req.params.query['hub.verify_token'] === 'narvar_verification_token') {
        res.send(req.params.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
  console.error("Missing config values");
  process.exit(1);
}