//This Controller deals with all functionalities of user sign up

function userController () {
    
    var hostUrl = {};
    var user = {};
	

	// FB Messenger sign up
	this.signup = function (req, res, next) {
		
        var smsPackage  = req.params;
        
        callSmsAPI(smsPackage);
        
        return res.send({'SMS Request Details':req.params});
	};


    /////////////////////////////////////////////////////////////////////////////
    // PRIVATE METHODS                                                         //
    /////////////////////////////////////////////////////////////////////////////
    
   
    // Narvar SMS API
    function callSmsAPI(trackingData) {
        
      var retailerName = trackingData.retailer;    
        
      request({
        uri: hostURL + '/sms/' + retailerName + '/signup/',
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

module.exports = new userController();