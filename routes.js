module.exports = function(app) {
    

    var message   = require('./controllers/messageController');
    var user      = require('./controllers/userController');
    
	
	// Hello world tests
    app.get('/', function(req, res, next) {
		return res.send("NARVAR FB MESSENGER REST API - RUNNING");
	});
    
    app.get('/hello', function(req, res, next) {
		return res.send("NARVAR FB MESSENGER REST API - RUNNING");
	});
    
    // FB Authentication    
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

    // BE Narvar FB Sign up
    app.post('/signup', user.signup);
    
    // FB Send Message
    app.post('/message', message.sendMessage); 
    
    // FB Receive Messages
    app.post('/webhook', message.getMessage); 
    
};