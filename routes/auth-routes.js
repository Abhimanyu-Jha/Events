const router = require('express').Router();
// const passport =require('passport');
const bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
//GOOGLE OAUTH THINGS
const keys = require('../config/keys')
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(keys.google.clientID);
const fetch = require('node-fetch');
var getConnection = require('../db_pool');



const authCheck = (req,res,next)=>{
	if(req.session.user){
		club=req.session.user.club
		res.redirect('/dashboard/'+club);
	}
	else{
		next();
	}
}
//auth logi
router.get('/login',authCheck,(req,res)=>{
	rootdir=__dirname;
	rootdir=rootdir.substring(0,rootdir.length -7);
	res.sendFile(rootdir+'/login.html');
});



// GET BASIC PROFILE INFO FROM GOOGLE LOGIN
// AND SIGN THEM IN
router.post('/signIn',urlencodedParser,function(req, res1) {
	// res1.send({Message:'Received ID Token from client succesfully'});
	
	id_token=req.body.id_token
	// console.log(id_token);

	//TIME TO CHECK INTEGRITY OF TOKEN RECEIVED
	fetch('https://oauth2.googleapis.com/tokeninfo?id_token='+id_token)
    .then((res,err) =>{
    	req.session.user=null;
    	if (res.ok) {
    		return res.json();
    	}else{
    		throw err;
    	}
    })
    .then(json => {
    	// NOW CHECK json.aud==app client ID
    	if (json.aud==keys.google.clientID) {
    		//Assign session variable if id in database
    		var sql1= "SELECT * FROM users WHERE user_id = "+json.sub;
			//VALIDATE USER AND GENERATE SESSION
			getConnection(function(err, con){
				if (err) {
						throw err;
					}
					//Now do whatever you want with this connection obtained from the pool
					con.query(sql1, function (err, result) {
						con.release();	
					    if (err) throw err;
					    // console.log(result);
					    if(result.length!=0){
					    	console.log("************************");
					    	console.log('Welcome user > ' + result[0].username+ ' ('+result[0].club+')');
					    	console.log("************************");

					    	//GENEREATE SESSION 
					    	req.session.user=result[0];
					    	console.log('req.session.user')
					    	console.log(req.session.user);
					    	// req.session.save();
					    	// res.json(req.session.user);
							console.log('Redirecting now');

					    	res1.json({'authorised':'yes'});

					  //   	req.session.user = 'user';
							// req.session.save()
							// res1.send('req.session.user');
					    }else{

					  		console.log('************************');
					  		console.log('You are not authorised!!');
					  		console.log('************************');
					  		res1.json({'authorised':'no'});

					    }
					});	
			});
    	}else{
    		console.log('Client ID of token is different');
    	}
    	
    	
    }).catch(err=>{
    	console.log(err);
    });
});

router.get('/signOut',(req,res)=>{
	req.session=null;
	// console.log(req.session.user);
	console.log('signOut route called');
	// res.end();
	res.redirect('/')
});

router.get('/logout',(req,res)=>{
	req.session=null;
	// console.log(req.session.user);
	console.log('signOut route called');
	// res.end();
	res.redirect('/')
});


module.exports= router;