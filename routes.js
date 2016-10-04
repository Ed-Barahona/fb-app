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
    

    // BE Narvar FB Sign up
    app.post('/signup', user.signup);
    
    // FB Send Message
    app.post('/message', message.sendMessage); 
    
    // FB Receive Messages
    app.post('/webhook', message.getMessage); 
    
};