/* jshint node: true, devel: true */
'use strict';

const 
  bodyParser = require('body-parser'),
  config     = require('config'),
  crypto     = require('crypto'),
  express    = require('express'),
  https      = require('https'),  
  request    = require('request'),
  os         = require("os"),
  hostname   = os.hostname();


var app = express();

app.set('port', process.env.PORT || 5000);
app.set('view engine', 'ejs');
app.use(bodyParser.json({ verify: verifyRequestSignature }));
app.use(express.static('public'));



// App Credentials
const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ? 
  process.env.MESSENGER_APP_SECRET :
  config.get('appSecret');

const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
  (process.env.MESSENGER_VALIDATION_TOKEN) :
  config.get('validationToken');

const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
  (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
  config.get('pageAccessToken');

const SERVER_URL = (process.env.SERVER_URL) ?
  (process.env.SERVER_URL) :
  config.get('serverURL');

// Check for credentials and exit if not available
if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
  console.error("Missing config values");
  process.exit(1);
}

/*
 * FB validation token
 *
 */
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === VALIDATION_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }  
});

/*
 * FB validation token
 *
 */
app.get('/validate', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === VALIDATION_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }  
});


/*
 * All callbacks for Messenger are POST-ed to this webhook
 *
 */
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
        } else if (messagingEvent.read) {
          receivedMessageRead(messagingEvent);
        } else if (messagingEvent.account_linking) {
          receivedAccountLink(messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });

    // Assume all went well.
    //
    // Send back a 200, within 20 seconds, to let FB know we've 
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }
});


/*
 * Narvar Tracking API's all are POST'ed and forward the tracking message to FB
 */
app.post('/message', function (req, res) {
    var data            = req.body;
    var trackingMessage = req.body;
    
    if(trackingMessage){
        sendTrackingMessage(trackingMessage);
        res.status(200).send({'message':data,'status':'Tracking message forwarded to messenger','code':200}); 
    } else {
        res.status(403).send({'message':data,'status':'Error with your tracking message','code':403}); 
    }
});


app.post('/tracking/image', function (req, res) {
    var data            = req.body;
    var trackingMessage = req.body;
    
    if(trackingMessage){
        sendTrackingImage(trackingMessage);
        res.status(200).send({'message':data,'status':'Tracking message forwarded to messenger','code':200}); 
    } else {
        res.status(403).send({'message':data,'status':'Error with your tracking message','code':403}); 
    }
});


app.post('/tracking/message', function (req, res) {
    var data            = req.body;
    var trackingMessage = req.body;
    
    if(trackingMessage){
        sendTrackingMessage(trackingMessage);
        res.status(200).send({'message':data,'status':'Tracking message forwarded to messenger','code':200}); 
    } else {
        res.status(403).send({'message':data,'status':'Error with your tracking message','code':403}); 
    }
});



/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL. 
 * 
 */
app.get('/authorize', function(req, res) {
  var accountLinkingToken = req.query.account_linking_token;
  var redirectURI = req.query.redirect_uri;

  // Authorization Code should be generated per user. This will 
  // be passed to the Account Linking callback.
  var authCode = "1234567890";

  // Redirect users to this URI on successful login
  var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

  res.render('authorize', {
    accountLinkingToken: accountLinkingToken,
    redirectURI: redirectURI,
    redirectURISuccess: redirectURISuccess
  });
});

/*
 * Verify that the callback came from Facebook using App Secret
 */
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // Testing logs an error. Production, throw an error
    console.error("Couldn't validate the signature.");
  } else {
    var elements      = signature.split('=');
    var method        = elements[0];
    var signatureHash = elements[1];

    var expectedHash  = crypto.createHmac('sha1', APP_SECRET)
                         .update(buf)
                         .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

/*
 * Opt-In authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point.
 * It is the 'data-ref' field this passes the tiny URL or UUID for Narvar Tracking
 *
 */
function receivedAuthentication(event) {
  var senderID    = event.sender.id;
  var recipientID = event.recipient.id;
  var sessionID   = event.optin.ref;
  var timeOfAuth  = event.timestamp;
  
  console.log('RECIPIENT ID:', recipientID );
  console.log('SENDER ID:', senderID );


  console.log("Received authentication for user %d and page %d with pass " +
    "through param '%s' at %d", senderID, recipientID, passThroughParam, 
    timeOfAuth);

  // When an authentication is received, we'll send a message back to the sender
  // to let them know it was successful.
  callNarvarAPI(senderID, sessionID);
  sendTextMessage(senderID, "Thank you for signing up with Narvar Tracking Updates!: " + senderID);
}

/*
 * Message Event
 *
 * This event is called when a message is sent to Narvar Bot.
 *
 * Echo any text that we get. and trigger message types based on
 * special keywords ('button', 'generic', 'receipt')
 * 
 */
function receivedMessage(event) {
  var senderID      = event.sender.id;
  var recipientID   = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message       = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var isEcho    = message.is_echo;
  var messageId = message.mid;
  var appId     = message.app_id;
  var metadata  = message.metadata;

  // You may get a text or attachment but not both
  var messageText        = message.text;
  var messageAttachments = message.attachments;
  var quickReply         = message.quick_reply;

  if (isEcho) {
    // Just logging message echoes to console
    console.log("Received echo for message %s and app %d with metadata %s", 
      messageId, appId, metadata);
    return;
  } else if (quickReply) {
    var quickReplyPayload = quickReply.payload;
    console.log("Quick reply for message %s with payload %s",
      messageId, quickReplyPayload);

    sendTextMessage(senderID, "Quick reply tapped");
    return;
  }

  if (messageText) {

        sendTextMessage(senderID, messageText);

  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}


/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message.
 *
 */
function receivedDeliveryConfirmation(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var delivery = event.delivery;
  var messageIDs = delivery.mids;
  var watermark = delivery.watermark;
  var sequenceNumber = delivery.seq;

  if (messageIDs) {
    messageIDs.forEach(function(messageID) {
      console.log("Received delivery confirmation for message ID: %s", 
        messageID);
    });
  }

  console.log("All message before %d were delivered.", watermark);
}


/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message. 
 * 
 */
function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  sendTextMessage(senderID, "Postback called");
}

/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * 
 */
function receivedMessageRead(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  // All messages before watermark (a timestamp) or sequence have been seen.
  var watermark = event.read.watermark;
  var sequenceNumber = event.read.seq;

  console.log("Received message read event for watermark %d and sequence " +
    "number %d", watermark, sequenceNumber);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action called.
 * 
 */
function receivedAccountLink(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  var status = event.account_linking.status;
  var authCode = event.account_linking.authorization_code;

  console.log("Received account link event with for user %d with status %s " +
    "and auth code %s ", senderID, status, authCode);
}


    /*
     * Send a text message using the Send API.
     *
     */
    function sendTextMessage(recipientId, messageText) {
      var messageData = {
        recipient: {
          id: recipientId
        },
        message: {
          text: messageText,
          metadata: "DEVELOPER_DEFINED_METADATA"
        }
      };

      callSendAPI(messageData);
    }


    /*
     * Send Narvar Tracking using the Send API.
     *
     */
    function sendTrackingMessage(trackingMessage) {
        
      var recipientId = trackingMessage.recipient_id,
          trackingUrl = trackingMessage.tracking_url,
          imageUrl    = trackingMessage.image_url;
        
      console.log("tracking recipient:", recipientId);
        
      var messageData = {
        recipient: {
          id: recipientId
        },
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              elements: [{
                title: "Narvar Tracking",
                subtitle: "Tracking your package",
                item_url: trackingUrl,               
                image_url: imageUrl,
                buttons: [{
                  type: "web_url",
                  url: trackingUrl,
                  title: "Track Your Shipment"
                }]
              }]
            }
          }
        }
      };  

      callSendAPI(messageData);
    }


/*
 * Send an image using the Send API.
 *
 */
function sendTrackingImage(trackingMessage) {
    
  var recipientId = trackingMessage.recipient_id,
      trackingURL = trackingMessage.tracking_url,
      imageURL    = trackingMessage.image_url;
    
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: imageURL
        }
      }
    }
  };

  callSendAPI(messageData);
}



/*
 * Call the Narvar Sign Up API
 *
 */
function callNarvarAPI(senderID, sessionID) {
 
  var narvarURL = hostname + '/fbmessenger/signup/';
  var trackingData = {
    recipient_id: senderID,
    session_id: sessionID
  };
  
  request({
    uri: narvarURL,
    method: 'POST',
    json: trackingData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        console.log("Successfully sent to Narvar Watchlist");
      } 
    } else {
      console.error("Failed calling Narvar API", response);
    }
  });  
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll 
 * get the message id in a response 
 *
 */
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s", 
          messageId, recipientId);
      } else {
      console.log("Successfully called Send API for recipient %s", 
        recipientId);
      }
    } else {
      console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
    }
  });  
}

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid 
// certificate authority.
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
  console.log('HOST:', hostname);
});

module.exports = app;

