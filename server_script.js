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




const authCheck = (req,res,next)=>{
	if(!req.user){
		res.redirect('/auth/login');
	}else if(!req.user.superuser==1){
		res.redirect('/auth/login');
	}else{
		next();
	}
}

//send encrypted cookie to browser
app.use(cookieSession({
	maxAge : 24*60*60*1000, // in miliseconds
	keys: [keys.session.cookieKey]
}));

//initialize passport
app.use(passport.initialize());
app.use(passport.session());


app.set('view engine','ejs');

var urlencodedParser = bodyParser.urlencoded({ extended: false });

var db_config={
	host: keys.database.ip,
	user: keys.database.user,
	password: keys.database.password,
	database: keys.database.db
};
var con = mysql.createConnection(db_config);

function handleDisconnect(){

	var con = mysql.createConnection(db_config);


	con.connect(function(err) {
		  if (err){
		      console.log('Error Connecting to DB');
		      setTimeout(handleDisconnect,2000);
		      // We introduce a delay before attempting to reconnect,
              // to avoid a hot loop, and to allow our node script to
              // process asynchronous requests in the meantime.
		  }
		  console.log('Connected to DB');
	});

	con.on('error',function(err){
		console.log('DB error',err);
		if (err.code==='PROTOCOL_CONNECTION_LOST') {
			handleDisconnect();
		}else{
			throw err;
		}
	});
}

handleDisconnect()


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


sql="SELECT * FROM event_data WHERE date < '"+curr_date_time+"' ;";
con.query(sql,function(err,result){
	var i=0;
	imgpaths=[];
	while(i<result.length){
		imgpaths.push(result[i].img)
		i++;
	}
	// console.log(imgpaths)

	sql="DELETE FROM event_data WHERE date < '"+curr_date_time+"' ;"
	con.query(sql,function(){
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
})




}
setInterval(deleteOldEvents,1000);

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
// app.get('/test',function(req,res){
// 	res.sendFile(__dirname +'/view_events.html')
// });
// app.get('/hackeve',function(req,res){
// 	res.sendFile(__dirname +'/event_desc.html')
// });
app.get('/knowmore/:key',function(req,res){
	if(req.params.key == 'undefined'){
		res.status(400).sendFile(__dirname+'/404.html');
		return;
	}
	
	con.query("SELECT * FROM event_data where event_key="+req.params.key, function (err, result, fields) {
	    if (!result[0]) {
	    	console.log('404');
	    	res.status(400).sendFile(__dirname+'/404.html');
	    	return;
	    	// throw err;
	    }
	    
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
app.get('/login',function(req,res){
	res.sendFile(__dirname +'/login.html')
});








//FORM SUBMIT

// USE THIS FOR UPLOADING ON SERVER
app.use(fileUpload());
app.post('/upload', urlencodedParser,function(req, res) {
	if (!req.files)
		return res.status(400).send('No files were uploaded.');
    
    	con.query("SELECT * FROM event_data", function (err, result, fields) {
		    if (err) throw err;
		    
		    if(result.length==0){
		    	console.log('DB is empty')
		    	con.query('ALTER TABLE event_data AUTO_INCREMENT = 1;')
		    	var key=1;
		    }else{
		    	console.log('The last record is');
		    	console.log(result[result.length-1]);
		   		prevkey=result[result.length-1].event_key;
		    	var key=prevkey+1;
		    }
		    
		
		console.log('key is '+key);
		event_image=req.files.event_image;
		
		filename=req.files.event_image.name;
		extension=filename.slice(filename.indexOf('.'));
		console.log(filename);
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
		    if (err) throw err;
		    console.log("Event Added");
		    newkey=result.insertId;
		    values=[newkey+extension,newkey];
		    con.query("UPDATE event_data SET img =? WHERE `event_key` = ?",values);
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
					// console.log(result[0].subscription_obj);
					i=0;
					while(i<result.length){
						subscription = JSON.parse(result[i].subscription_obj);
						webpush.sendNotification(subscription,payload).catch(err=> console.error(err));
						i++;
					}
					
				});
				

		    });
		  });
		});
});

// USE THIS FOR UPDATING ON SERVER
app.post('/update', urlencodedParser,function(req, res) {
	if (!req.files){
		console.log('Image not specified');
	}
    else{
    	var details=req.body;
    	event_key= details.event_key;
    	//Get old image name (whose key is event_key)
    	//and store it in old_imgpath
    	con.query('SELECT * FROM event_data WHERE `event_key`='+event_key+';', (err,result,fields)=>{
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
				console.log(event_imgpath);

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
			    if (err) throw err;
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
					// console.log(result[0].subscription_obj);
					i=0;
					while(i<result.length){
						subscription = JSON.parse(result[i].subscription_obj);
						webpush.sendNotification(subscription,payload).catch(err=> console.error(err));
						i++;
					}
					
				});
			    res.redirect('../dashboard/view');
			});







		});
    	
    }

	
	
});

//SERVING JSON DB DATA
app.get('/data',function(req,res){ //ADD authCheck MIDDLEWARE
	var initialEventinfo ={
    created: 'October 13, 2015 11:13:00',
    key: '986',
    title: 'Hackeve',
    date: '2015-04-16T07:52:00',
    description: 'This session will serve as an introduction to reactive front end frameworks. React, Angular and Vue.js are a few of the most popular frameworks which fall in this category...',
    img: 'bg4.jpg',
    club: 'Byld',
    venue: 'Library'
	};
	

	
	  con.query("SELECT * FROM event_data", function (err, result, fields) {
	    if (err) throw err;
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
	con.query('INSERT INTO subscriptions (subscription_obj) VALUES ?',[[[JSON.stringify(subscription)]]]);
	// console.log(subscription);
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
	webpush.sendNotification(subscription,payload).catch(err=> console.error(err));
});
//unsubscribe route
app.post('/unsubscribe',(req,res)=>{

	const subscription = req.body;
	con.query('DELETE FROM subscriptions WHERE subscription_obj =?',[[[JSON.stringify(subscription)]]]);
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

	  con.query(sql, [values], function (err, result) {
	    if (err) throw err;
	    console.log("Coordinator Added");
	    res.redirect('/dashboard/admin');
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
