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
    app.get('/webhook', function (req, res) {
        if (req.query['hub.verify_token'] === 'narvar12345') {
          res.send(req.query['hub.challenge']);
        } else {
          res.send('Error, wrong validation token');    
        }
    });

    // BE Narvar FB Sign up
    app.post('/signup', user.signup);
    
    // FB Send Message
    app.post('/message', message.sendMessage); 
    
    // FB Receive Messages
    app.post('/webhook', message.getMessage); 
    
};