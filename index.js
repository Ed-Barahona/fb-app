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


/*
 * Use your own validation token. Check that the token used in the Webhook 
 * setup is the same token used here.
 *
 */
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] ===  VALIDATION_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }  
});

  // Receive FB Messages
app.post('/webhook', function (req, res) {
      var data = req.body;

      // Make sure this is a page subscription
      if (data.object == 'page') {
        // Iterate over each entry
        // There may be multiple if batched
        data.entry.forEach(function(pageEntry) {
          var pageID = pageEntry.id;
          var timeOfEvent = pageEntry.time;

          // Iterate over each messaging event
          pageEntry.messaging.forEach(function(messagingEvent) {
            if (messagingEvent.optin) {
              receivedAuthentication(messagingEvent);
            } else if (messagingEvent.message) {
              receivedMessage(messagingEvent);
            } else if (messagingEvent.delivery) {
              receivedDeliveryConfirmation(messagingEvent);
            } else if (messagingEvent.postback) {
              receivedPostback(messagingEvent);
            } else {
              console.log("Webhook received unknown messagingEvent: ", messagingEvent);
            }
          });
        });

        // Assume all went well.
        //
        // You must send back a 200, within 20 seconds, to let us know you've 
        // successfully received the callback. Otherwise, the request will time out.
        res.sendStatus(200);
      }
    });