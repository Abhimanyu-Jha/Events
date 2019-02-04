const express=require('express');
const app=express();

const fs= require('fs');
const fileUpload = require('express-fileupload');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const webpush = require('web-push');

const authRoutes = require('./routes/auth-routes');
const dashboardRoutes = require('./routes/dashboard-routes');
const passportSetup = require('./config/passport-setup')
const keys = require('./config/keys')
const cookieSession =require('cookie-session');
const passport = require('passport');

var getConnection = require('./db_pool');

//GOOGLE OAUTH THINGS
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(keys.google.clientID);
const fetch = require('node-fetch');

// const authCheck = (req,res,next)=>{
// 	if(!req.user){
// 		res.redirect('/auth/login');
// 	}else if(!req.user.superuser==1){
// 		res.redirect('/auth/login');
// 	}else{
// 		next();
// 	}
// }

//send encrypted cookie to browser
app.use(cookieSession({
	secure:false,
	overwrite: false,
	maxAge : 24*60*60*1000, // in miliseconds
	keys: [keys.session.cookieKey]
}));

//initialize passport
// app.use(passport.initialize());
// app.use(passport.session());


app.set('view engine','ejs');

var urlencodedParser = bodyParser.urlencoded({ extended: false });


getConnection(function(err, con){
		if (err) {
			throw err;
		}
		console.log('Connected to DB using #1 con from pool');
		//Now do whatever you want with this connection obtained from the pool
});


//DELETE OLD EVENTS
function deleteOldEvents(){
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; //January is 0!
	var yyyy = today.getFullYear();

	var hh = today.getHours();
	var min= today.getMinutes();
	var ss = today.getSeconds();

	if(dd<10){
		dd='0'+dd;
	} 
	if(mm<10){
		mm='0'+mm;
	}
	if(min<10){
		min='0'+min;
	}
	var curr_date = yyyy+'-'+mm+'-'+dd;
	var curr_time = hh+':'+min+':'+ss;
	var curr_date_time= curr_date+' '+curr_time;
// console.log('Current Date Time > '+curr_date_time);

	getConnection(function(err, con){
		if (err) {
			// throw err;
			return;			
		}
		// console.log('Connected to DB');

		//Now do whatever you want with this connection obtained from the pool

		sql="SELECT * FROM event_data WHERE date < '"+curr_date_time+"' ;";
		con.query(sql,function(err,result){
			if (err) {
				console.log('oops');
				con.release();
				return;
			};
			var i=0;
			imgpaths=[];
			while(i<result.length) {
				imgpaths.push(result[i].img)
				i++;
			}
			// console.log(imgpaths)

			sql="DELETE FROM event_data WHERE date < '"+curr_date_time+"' ;"
			con.query(sql, function() {
				con.release();
				// console.log('Old Events Deleted');

				// ALSO DELETE OLD PIXXXXXXXXX
				rootdir=__dirname;
				i=0;
				while(i<imgpaths.length){
					fs.unlink(rootdir+'/images/'+imgpaths[i],(err)=>{
					if(err) throw err;
					});
					i++;
				}
			
			});

		});
	});




}
setInterval(deleteOldEvents,1000);

function validateUser(json,req){
	
};


//SERVING STATIC CONTENT
app.use('/css',express.static('css'));
app.use('/js',express.static('js'));
app.use('/images',express.static('images'));
app.use('/icons',express.static('css'));
app.use('/',express.static(__dirname));
app.use(bodyParser.json());


//SERVING HTML PAGES
app.get('/',function(req,res){
	res.sendFile(__dirname +'/index.html')
});
// BASIC PROFILE INFO FROM GOOGLE LOGIN
app.post('/auth/profile',urlencodedParser,function(req, res) {
	res.send({Message:'Received ID Token from client succesfully'});
	
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
					    	console.log(req.session);
					    	// res.redirect('/dashboard/'+req.session.user.club);
					    }else{

					  		console.log('************************');
					  		console.log('You are not authorised!!');
					  		console.log('************************');
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




//SERVING JSON DB DATA
app.get('/data',function(req,res){ //ADD authCheck MIDDLEWARE
	// console.log(req.session);
	getConnection(function(err, con){
		if (err) {
			throw err;
			return;
		}
		// console.log('Connection for /data opened');
		//Now do whatever you want with this connection obtained from the pool
		con.query("SELECT * FROM event_data", function (err, result, fields) {
		    if (err){
		    	con.release()
		    	throw err;
		    }
		    con.release();
		    var today = new Date();
			var dd = today.getDate();
			var mm = today.getMonth()+1; //January is 0!
			var yyyy = today.getFullYear();

			var hh = today.getHours();
			var min= today.getMinutes();
			var ss = today.getSeconds();

			function twodigit(x){
				if(x<10){
					x='0'+x;
				}
				return x
			};

			mm= twodigit(mm);
			dd= twodigit(dd);
			hh= twodigit(hh);
			min= twodigit(min);
			ss= twodigit(ss);
			var curr_date = dd+'-'+mm+'-'+yyyy;
			var curr_time = hh+':'+min+':'+ss;
			var curr_date_time= curr_date+' '+curr_time;

		    console.log('['+curr_date_time+']','Data Requested');

		    // console.log(result[0]);
		    // data=[initialEventinfo];
		    data=[];
			var i=0;
			while(i<result.length){
				var Eventinfo={
					created: result[i].created,
				    key: result[i].event_key,
				    title: result[i].title,
				    date: result[i].date,
				    description:result[i].description,
				    img: result[i].img,
				    club: result[i].club,
				    venue: result[i].venue

				};			
				data.push(Eventinfo);
				i++;
			};
			//Now order objects in data by 'date' i.e. data[i].date before sending
			var i;
			var len=data.length;
			for (i = 0; i < data.length; i++){
				for(j=0; j<len-1; j++){
					if (data[j].date>data[j+1].date){
						var temp=data[j+1];
						data[j+1] = data[j];
						data[j] = temp;
					}
				}
				len--;
			}

			res.send(data);
    	});
    	
	});	  
});


app.get('/knowmore/:key',function(req,res){
	if(req.params.key == 'undefined'){
		res.status(400).sendFile(__dirname+'/404.html');
		return;
	}
	getConnection(function(err, con){
		if (err) {
			con.release()
			throw err;
		}
		// console.log('Connected to DB');
		//Now do whatever you want with this connection obtained from the pool
		con.query("SELECT * FROM event_data where event_key="+req.params.key, function (err, result, fields) {
			if (err) {
				con.release();
				throw err;
			}
		    if (!result[0]) {
		    	console.log('404');
		    	res.status(400).sendFile(__dirname+'/404.html');
		    	return;
		    	// throw err;
		    }
	    	con.release();
	    	data=[];
		    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
			    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
			  edate=new Date(result[0].date);
			  dayName = edate.toString().split(' ')[0];
			  monthName= monthNames[edate.getMonth()];
			  d= edate.getDate();
			  function nth(d) {
			    if(d>3 && d<21) return 'th'; 
			    switch (d % 10) {
			          case 1:  return "st";
			          case 2:  return "nd";
			          case 3:  return "rd";
			          default: return "th";
			      }
			  }
			  function formatAMPM(date) {
			    var hours = date.getHours();
			    var minutes = date.getMinutes();
			    var ampm = hours >= 12 ? 'pm' : 'am';
			    hours = hours % 12;
			    hours = hours ? hours : 12; // the hour '0' should be '12'
			    minutes = minutes < 10 ? '0'+minutes : minutes;
			    var strTime = hours + ':' + minutes + '' + ampm;
			    return strTime;
			  }
			  time=formatAMPM(edate);

			  edate=dayName+' '+monthName+' '+d+nth(d)+' '+time;
			var i=0;
			var data={
					created: result[i].created,
				    key: result[i].event_key,
				    title: result[i].title,
				    date: edate,
				    gdate: result[i].date,
				    description:result[i].description,
				    img: result[i].img,
				    club: result[i].club,
				    venue: result[i].venue
				};
	
			res.render('knowmore',{key: req.params.key, data});
			});
		
	});
});
// app.get('/login',authCheck,function(req,res){

// 	res.sendFile(__dirname +'/dashboard.html')
// });









//FORM SUBMIT

// USE THIS FOR UPLOADING ON SERVER
app.use(fileUpload());
app.post('/upload', urlencodedParser,function(req, res) {
	console.log(req.user.club,' added an event');
	if (!req.files)
		return res.status(400).send('No files were uploaded.');
    	getConnection(function(err, con){
			if (err) {
				con.release();
				throw err;
			}
			//Now do whatever you want with this connection obtained from the pool
		
	    	con.query("SELECT * FROM event_data", function (err, result, fields) {
			    if (err){
			    	con.release();
			    	throw err;
			    		
			    } 
			    
			    if(result.length==0){
			    	console.log('DB is empty, resetting AUTO_INCREMENT')
			    	con.query('ALTER TABLE event_data AUTO_INCREMENT = 1;',(err)=>{
			    		if (err) {
			    			con.release();
			    			throw err;	
			    		}
			    		
			    	})
			    	var key=1;
			    }else{
			    	// console.log('The last record is');
			    	// console.log(result[result.length-1]);
			   		prevkey=result[result.length-1].event_key;
			    	var key=prevkey+1;
			    }
			    
			
				// console.log('key is '+key);
				event_image=req.files.event_image;
			
				filename=req.files.event_image.name;
				extension=filename.slice(filename.indexOf('.'));
				// console.log(filename);
				// console.log(extension);
				event_image.mv(__dirname+'/images/'+key+extension, function(err) {
			    	if (err)
			      		return res.status(500).send(err);
			 
			     	res.redirect('../');
				});
			
			
				// var key=1;
			
			
			  	var sql= "INSERT INTO event_data VALUES ?";
			  	var details=req.body;
			  	event_name=details.event_name;
			  	event_time=details.event_time;
			  	event_date=details.event_date;
			  
			 	event_date_time=event_date+' '+event_time

			  	event_desc=details.event_desc;
			  	event_imgpath=key+extension;
			  	event_venue=details.event_venue;

				var today = new Date();
				var dd = today.getDate();
				var mm = today.getMonth()+1; //January is 0!
				var yyyy = today.getFullYear();

				var hh = today.getHours();
				var min= today.getMinutes();
				var ss = today.getSeconds();

				if(dd<10){
				dd='0'+dd;
				} 
				if(mm<10){
				mm='0'+mm;
				}
				var curr_date = yyyy+'-'+mm+'-'+dd;
				var curr_time = hh+':'+min+':'+ss;
				var curr_date_time= curr_date+' '+curr_time;
				// var club =details.club;

				if(!req.user.superuser==1){
					club=req.user.club
				}else{
					club =details.club
				}
			  	

			 	var values=[[,event_name,event_date_time,event_desc,event_imgpath,curr_date_time,event_venue,club]];

			    con.query(sql, [values], function (err, result) {
			    	if (err) {
			    		con.release();
			    		throw err;
			    	}
			    	console.log("Event Added");
			    	newkey=result.insertId;
			    	values=[newkey+extension,newkey];
			    	con.query("UPDATE event_data SET img =? WHERE `event_key` = ?",values,(err)=>{
			    		if (err) {
			    			con.release();
			    			throw err;
			    		}
			    		
			    	});
			    	fs.rename(__dirname+"/images/"+key+extension,__dirname+"/images/"+newkey+extension,(err)=>{
			    		if (err) throw err;

						//	************************************************
						//	SEND NOTIFICATION
						//	************************************************

						const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
					    edate=new Date(event_date_time);
					  	dayName = edate.toString().split(' ')[0];
					  	monthName= monthNames[edate.getMonth()];
					  	d= edate.getDate();
					  	function nth(d) {
						    if(d>3 && d<21) return 'th'; 
						    switch (d % 10) {
						          case 1:  return "st";
						          case 2:  return "nd";
						          case 3:  return "rd";
						          default: return "th";
						    }
						}
					    function formatAMPM(date) {
						    var hours = date.getHours();
						    var minutes = date.getMinutes();
						    var ampm = hours >= 12 ? 'pm' : 'am';
						    hours = hours % 12;
						    hours = hours ? hours : 12; // the hour '0' should be '12'
						    minutes = minutes < 10 ? '0'+minutes : minutes;
						    var strTime = hours + ':' + minutes + '' + ampm;
						    return strTime;
					    }
					    time=formatAMPM(edate);

					    edate=dayName+' '+monthName+' '+d+nth(d)+' '+time;

						const payload = JSON.stringify({
							title: "Event "+event_name+' by '+club,
							options:{
								body: 'New Event on '+edate+' \nVenue: '+event_venue,
								icon: 'icons/events.png',
								badge: 'icons/monochrome1.png',
								vibrate: [500,110,500,110], // STAR WARS
								actions: [
							        {
							          action: "knowmore",
							          title: 'Know More'					         
							        }
							      ],
							    data: {event_key: newkey}
							}
						});

						con.query('SELECT * FROM subscriptions', (err,result,fields)=>{
							con.release();
							// console.log(result[0].subscription_obj);
							i=0;
							while(i<result.length){
								subscription = JSON.parse(result[i].subscription_obj);
								webpush.sendNotification(subscription,payload).catch(err=> console.error('webpush err'));
								i++;
							}
							
						});
			    	});
			    });
			});
			
		});

});

// USE THIS FOR UPDATING ON SERVER
app.post('/update', urlencodedParser,function(req, res){
	console.log(req.user.club,' updated an event');
	if (!req.files){
		console.log('Image not specified');
	}
    else{
    	var details=req.body;
    	event_key= details.event_key;
    	//Get old image name (whose key is event_key)
    	//and store it in old_imgpath
    	getConnection(function(err, con){
			if (err) {
				con.release();
				throw err;
			}
			//Now do whatever you want with this connection obtained from the pool
			con.query('SELECT * FROM event_data WHERE `event_key`='+event_key+';',(err,result,fields)=>{
				if (err) {
					con.release();
					throw err;
				}
			old_imgpath=result[0].img;
			// console.log(details);
			event_name=details.event_name;
			event_time=details.event_time;
			event_date=details.event_date;
			//date validation
			
			event_date_time=event_date+' '+event_time
			event_desc=details.event_desc;
			event_venue=details.event_venue; 

			if(req.files.event_image){
				//if new image uploaded remove old one.
				fs.unlink(__dirname+'/images/'+old_imgpath,(err)=>{
					if(err) throw err;
				});
				event_image=req.files.event_image;
				filename= req.files.event_image.name;
				extension=filename.slice(filename.indexOf('.'));
				event_imgpath=event_key+extension;
				// console.log(event_imgpath);

				event_image.mv(__dirname+'/images/'+event_imgpath, function(err) {
					if (err)
				    	retures.status(500).send(err);
				 
				    // res.redirect('../');
				});	
			}else{
				event_imgpath=old_imgpath;
			}
			var today = new Date();
			var dd = today.getDate();
			var mm = today.getMonth()+1; //January is 0!
			var yyyy = today.getFullYear();

			var hh = today.getHours();
			var min= today.getMinutes();
			var ss = today.getSeconds();

			if(dd<10){
			dd='0'+dd;
			} 
			if(mm<10){
			mm='0'+mm;
			}
			var curr_date = yyyy+'-'+mm+'-'+dd;
			var curr_time = hh+':'+min+':'+ss;
			var curr_date_time= curr_date+' '+curr_time;
			var club =details.club;
			event_desc = event_desc.replace(/'/gi,"\'");
			
			var sql= "UPDATE `event_data` SET title = ?, img = ?, date= ?,description= ?, created=?, venue= ?, club= ? WHERE `event_key` = ?";

			//var sql ="UPDATE event_data SET description = '"+event_desc+"' WHERE event_key = '"+event_key+"';"
			var values=[event_name,event_imgpath,event_date_time,event_desc,curr_date_time,event_venue,club, event_key];
			con.query(sql,values, function (err, result) {
			    if (err){
			    	con.release();
			    	throw err;

			    }
			    console.log("Event Updated");
			    //	************************************************
				//	SEND NOTIFICATION
				//	************************************************

				const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
				    edate=new Date(event_date_time);
				  	dayName = edate.toString().split(' ')[0];
				  	monthName= monthNames[edate.getMonth()];
				  	d= edate.getDate();
				  	function nth(d) {
					    if(d>3 && d<21) return 'th'; 
					    switch (d % 10) {
					          case 1:  return "st";
					          case 2:  return "nd";
					          case 3:  return "rd";
					          default: return "th";
					    }
					}
				    function formatAMPM(date) {
					    var hours = date.getHours();
					    var minutes = date.getMinutes();
					    var ampm = hours >= 12 ? 'pm' : 'am';
					    hours = hours % 12;
					    hours = hours ? hours : 12; // the hour '0' should be '12'
					    minutes = minutes < 10 ? '0'+minutes : minutes;
					    var strTime = hours + ':' + minutes + '' + ampm;
					    return strTime;
				    }
				    time=formatAMPM(edate);

				    edate=dayName+' '+monthName+' '+d+nth(d)+' '+time;

				const payload = JSON.stringify({
					title: event_name+' by '+club+" has been updated.",
					options:{
						body: 'There has been some change(s) in '+event_name+' by '+club+'. Visit the event page to know more.',
						icon: '/icons/events.png',
						badge: '/icons/monochrome1.png',
						vibrate: [500,110,500,110,450,110,200,110,170,40,450,110,200,110,170,40,500], // STAR WARS
						actions: [
				        {
				          action: "knowmore",
				          title: 'Know More'					         
				        }
						],
						data: {event_key: event_key}
					}	
				});

				con.query('SELECT * FROM subscriptions', (err,result,fields)=>{
					con.release()
					// console.log(result[0].subscription_obj);
					i=0;
					while(i<result.length){
						subscription = JSON.parse(result[i].subscription_obj);
						webpush.sendNotification(subscription,payload).catch(err=> console.error('webpush err'));
						i++;
					}
				});
			    res.redirect('../dashboard/view');
			});
		});
		// con.release(); // FIXME This can also potentially error. We're executing more stuff after we get results from the query which precedes this, and they make use of the connection. This is executed immidiately after the query is issued and doesn't wait for it to return. CBA to fix it rn, node callback hell :(
		});
    	
    	
    }
});




// Setting up routes
app.use('/auth',authRoutes);
app.use('/dashboard',dashboardRoutes);










//PUSH NOTIFS

const publicVapidKey = keys.vapid.publicVapidKey;
const privateVapidKey = keys.vapid.privateVapidKey;

webpush.setVapidDetails('mailto:test@test.com',publicVapidKey,privateVapidKey);

//subscribe route
app.post('/subscribe',(req,res)=>{
	//Get subscription object
	//Add to Database sub obj for each user
	const subscription = req.body;
	getConnection(function(err, con){
		if (err) {
			throw err;
		}
		//Now do whatever you want with this connection obtained from the pool
		con.query('INSERT INTO subscriptions (subscription_obj) VALUES ?',[[[JSON.stringify(subscription)]]],(err)=>{
			if (err) {
				throw err;
			}
			con.release();
		});
	});
	
	console.log('Subscription added');
	//Resource created
	res.status(201).json({});

	//Create Payload
	const payload = JSON.stringify({
		title: "Welcome To Events",
		options:{
   			body: 'You have succesfully subscribed to push notifications',
    		icon: 'icons/events.png',
    		badge: '/icons/monochrome1.png'
    	}
	});

	// pass object into sendNotificaton
	webpush.sendNotification(subscription,payload).catch(err=> console.error('webpush err'));
});
//unsubscribe route
app.post('/unsubscribe',(req,res)=>{

	const subscription = req.body;
	getConnection(function(err, con){
		if (err) {
			throw err;
		}
		//Now do whatever you want with this connection obtained from the mysql_pool
		con.query('DELETE FROM subscriptions WHERE subscription_obj =?',[[[JSON.stringify(subscription)]]],(err)=>{
			if (err) {
				throw err;
			}
			con.release();
		});
	});
	
	// console.log(subscription);
	console.log('Subscription deleted')

});


app.post('/add_coordinator', urlencodedParser,function(req, res) {

	var sql= "INSERT INTO users VALUES ?";
	var details=req.body;
	user_name=details.cc_name;
	club =details.club;
	superuser=details.superuser;
	user_id=details.user_id;
	if (superuser==1){
		club='admin'
	}

	var values=[[,user_id,user_name,club,superuser]];
	getConnection(function(err, con){
		if (err) {
			throw err;
		}
		//Now do whatever you want with this connection obtained from the pool
		con.query(sql, [values], function (err, result) {
			if (err) throw err;
			console.log("Coordinator Added");
			res.redirect('/dashboard/admin');
			con.release();
		});	
		
	});
	
	
});












// 404 if no other route
app.use(function (req, res) {
  res.status(404).sendFile(__dirname+'/404.html');
})

const ip = require("ip"); // gets local IP
var port = process.env.PORT || 8000

app.listen(port, function() {
	console.log('Running now on ' + ip.address() + ":" + port);
});
