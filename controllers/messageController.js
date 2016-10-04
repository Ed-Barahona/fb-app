//This Controller deals with all functionalities of Messages

function messageController () {

	

    
  // Send New Message
  this.sendMessage = function (req, res, next) {
     
     //pageAccessToken       = req.params.PAGE_ACCESS_TOKEN;

     //var recipientID       = req.params.recipient.id;
     var trackingMessage   = req.params;
      
     var message = req.params;
      
     //sendTrackingMessage(trackingMessage);
     //return res.sendStatus(200);
     return res.send({'message':message,'status':'successfully sent'}); 
      
      
  };  
    
  // Receive FB Messages
  this.getMessage = function (req, res, next) {
      //var data = req.body;
      var data = req.params.body;

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
    };
    
    /////////////////////////////////////////////////////////////////////////////
    // PRIVATE METHODS                                                         //
    /////////////////////////////////////////////////////////////////////////////
    
    // User Opt-In
    function receivedAuthentication(trackingInfo){
        console.log('Authentication Event', trackingInfo);
        // Call Narvar BE API
        var retailerName = trackingInfo.optin.ref.retailer_name;
        
        callNarvarAPI(trackingInfo, retailerName);
    };
    
    
    // Echo back received message
    function receivedMessage(event) {
      var senderID = event.sender.id;
      var recipientID = event.recipient.id;
      var timeOfMessage = event.timestamp;
      var message = event.message;

      console.log("Received message for user %d and page %d at %d with message:", 
        senderID, recipientID, timeOfMessage);
      console.log(JSON.stringify(message));

      var messageId = message.mid;

      // You may get a text or attachment but not both
      var messageText = message.text;
      var messageAttachments = message.attachments;

      if (messageText) {

        // If we receive a text message, check to see if it matches any special
        // keywords and send back the corresponding example. Otherwise, just echo
        // the text we received.
        switch (messageText) {
          case 'image':
            sendImageMessage(senderID);
            break;

          case 'button':
            sendButtonMessage(senderID);
            break;

          case 'generic':
            sendGenericMessage(senderID);
            break;

          case 'receipt':
            sendReceiptMessage(senderID);
            break;

          default:
            sendTextMessage(senderID, messageText);
        }
      } else if (messageAttachments) {
        sendTextMessage(senderID, "Message with attachment received");
      }
    }
    
    // Send Tracking Message
    function sendTrackingMessage(trackingMessage) {
        
      var recipientId = trackingMessage.recipient_id,
          trackingUrl = trackingMessage.tracking_url,
          imageUrl    = trackingMessage.image_url;
        
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
                subtitle: "Tracking Your Package",
                item_url: trackingUrl,               
                image_url: imageUrl,
                buttons: [{
                  type: "web_url",
                  url: trackingUrl,
                  title: "Track Your Shipment"
                }, {
                  type: "postback",
                  title: "Call Postback",
                  payload: "Payload for first bubble",
                }]
              }]
            }
          }
        }
      };  

      callSendAPI(messageData);
    }
    
    // Create Message
    function sendTextMessage(recipientId, messageText) {
      var messageData = {
        recipient: {
          id: recipientId
        },
        message: {
          text: messageText
        }
      };

      callSendAPI(messageData);
    }
    
    // FB Send API
    function callSendAPI(messageData) {
      request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: messageData

      }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var recipientId = body.recipient_id;
          var messageId = body.message_id;

          console.log("Successfully sent generic message with id %s to recipient %s", 
            messageId, recipientId);
        } else {
          console.error("Unable to send message.");
          console.error(response);
          console.error(error);
        }
      });  
    }
    
    // Narvar Sign Up API
    function callNarvarAPI(trackingData, retailerName) {
        
      //var retailerName = trackingData.retailer;    
        
      request({
        uri: hostURL + '/fbmessenger/' + retailerName + '/signup/',
        method: 'POST',
        json: trackingData

      }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            
          console.log("Successfully signed up", 
            trackingData);
        } else {
          console.error("Unable to sign up.");
          console.error(response);
          console.error(error);
        }
      });  
    }


return this;

};

module.exports = new messageController();