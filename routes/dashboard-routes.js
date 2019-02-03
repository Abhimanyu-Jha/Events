const router = require('express').Router();
const mysql = require('mysql');
const keys = require('../config/keys');
const fs = require('fs');
const webpush = require('web-push'); 

var getConnection = require('../db_pool');

const authCheck = (req,res,next)=>{
	console.log(req.session);
	if(!req.session.usernameser){
		res.redirect('/auth/login');


	}else if(!req.session.user.superuser==1){
		club=req.session.user.club
		res.redirect('/dashboard/'+club);
	}
	else{
		next();
	}
}

// var con = mysql.createConnection({
//   host: keys.database.ip,
//   user: keys.database.user,
//   password: keys.database.password,
//   database: keys.database.db
// });
// con.on('error',function(){
// 	console.log('hi error')
// });

// con.connect();
getConnection(function(err, con){
		if (err) {
			throw err;
		}
		//Now do whatever you want with this connection obtained from the pool
});


//DASHBOARD MAIN
router.get('/admin',authCheck,(req,res)=>{
	rootdir=__dirname;
	rootdir=rootdir.substring(0,rootdir.length -7);
	res.sendFile(rootdir+'/dashboard.html');
	// res.send('you are logged in ' + req.user.username);
});
router.get('/:club',(req,res)=>{
	if(!req.user){
		res.redirect('/auth/login');
	}else if(req.params.club!=req.session.user.club){
		res.redirect('/dashboard/'+req.user.club);
	}else{
		res.render('cc_dashboard',{club: req.params.club,dp: req.user.thumbnail });
	}
	
});

//ADD FORM
router.get('/admin/add',authCheck,(req,res)=>{
	rootdir=__dirname;
	rootdir=rootdir.substring(0,rootdir.length -7);
	res.sendFile(rootdir+'/add_form.html');
});
router.get('/:club/add',(req,res)=>{
	if(!req.user){
		res.redirect('/auth/login');
	}else if(req.params.club!=req.user.club){
		res.redirect('/dashboard/'+req.user.club);
	}else{
		res.render('cc_add_form',{club: req.params.club, });
	}
});

//EDIT EVENTS 
router.get('/admin/edit/:key',authCheck,function(req,res){
	getConnection(function(err, con){
		if (err) {
			con.release(); 
			throw err;
		}
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
		    
		    data=[];
			    
				  edate= new Date(result[0].date);
				  
				  year = edate.getFullYear();
				  month= edate.getMonth()+1;
				  month = month < 10 ? '0'+month : month;
				  d= edate.getDate();
				  d = d<10 ? '0'+d : d;

				  hh = edate.getHours();
				  hh = hh <10 ? '0'+hh: hh;
				  mm= edate.getMinutes();
				  mm = mm <10 ? '0'+mm: mm;



				  etime=hh+':'+mm;

				  edate=year+'-'+month+'-'+d
				  
			var i=0;
			var data={
					created: result[i].created,
				    key: result[i].event_key,
				    title: result[i].title,
				    date: edate,
				    time: etime,			    
				    description:result[i].description,
				    img: result[i].img,
				    club: result[i].club,
				    venue: result[i].venue
				};
		
			res.render('edit',{key: req.params.key, data});
			con.release();
		});
		
	});
});
router.get('/:club/edit/:key',function(req,res){
	if(!req.user){
		res.redirect('/auth/login');
	}else if(req.params.club!=req.user.club){
		res.redirect('/dashboard/'+req.user.club);
	}else{
		getConnection(function(err, con){
			if (err) {
				throw err;
			}
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
			    
			    data=[];
				    
					  edate= new Date(result[0].date);
					  
					  year = edate.getFullYear();
					  month= edate.getMonth()+1;
					  month = month < 10 ? '0'+month : month;
					  d= edate.getDate();
					  d = d<10 ? '0'+d : d;

					  hh = edate.getHours();
					  hh = hh <10 ? '0'+hh: hh;
					  mm= edate.getMinutes();
					  mm = mm <10 ? '0'+mm: mm;



					  etime=hh+':'+mm;

					  edate=year+'-'+month+'-'+d
					  
				var i=0;
				var data={
						created: result[i].created,
					    key: result[i].event_key,
					    title: result[i].title,
					    date: edate,
					    time: etime,			    
					    description:result[i].description,
					    img: result[i].img,
					    club: result[i].club,
					    venue: result[i].venue
					};
				res.render('edit',{key: req.params.key, data,club: req.params.club});
				con.release();
			});
			
		});

		
	}
});



//VIEW EVENTS
router.get('/admin/view',authCheck,(req,res)=>{
	// console.log(req.user)
	rootdir=__dirname;
	rootdir=rootdir.substring(0,rootdir.length -7);
	res.sendFile(rootdir+'/view_events.html');
	
});
router.get('/:club/view',(req,res)=>{
	if(!req.user){
		res.redirect('/auth/login');
	}else if(req.params.club!=req.user.club){
		res.redirect('/dashboard/'+req.user.club);
	}else{
		res.render('cc_view_events',{club: req.params.club});
	}
	
});

//DELETE EVENTS
router.get('/admin/delete/:key',authCheck,function(req,res){
	getConnection(function(err, con){
		if (err) {
			throw err;
		}
		//Now do whatever you want with this connection obtained from the pool
		con.query("SELECT * FROM event_data where event_key = ?",[req.params.key],(err,result,fields)=>{
			if (err) {
				con.release();
				throw err;
			}
		// console.log(result[0].img);
		event_name = result[0].title;
		club=result[0].club;
		event_venue=result[0].venue;
		event_date_time=result[0].date;
		var imgpath= result[0].img;
		key=req.params.key;
		con.query("DELETE FROM event_data where event_key="+req.params.key, function (err, result, fields) {
			if (err) {
				con.release();
				throw err;
			}
			rootdir=__dirname;
			rootdir=rootdir.substring(0,rootdir.length -7);
			fs.unlink(rootdir+'/images/'+imgpath,(err)=>{
				if(err) throw err;
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
					title: event_name+' by '+club+" is cancelled.",
					options:{
						body: 'The event '+event_name+' (Date: '+edate+', \nVenue: '+event_venue+') stands cancelled for now.',
						icon: '/icons/events.png',
						badge: '/icons/monochrome1.png',
						vibrate: [500,110,500,110,450,110,200,110,170,40,450,110,200,110,170,40,500] // STAR WARS
					},
					data: {event_key: key}
				});

				con.query('SELECT * FROM subscriptions', (err,result,fields)=>{
					if (err) {
						con.release();
						throw err;
					}
					con.release();
					// console.log(result[0].subscription_obj);
					i=0;
					while(i<result.length){
						subscription = JSON.parse(result[i].subscription_obj);
						webpush.sendNotification(subscription,payload).catch(err=> console.error('webpush err'));
						i++;
					}
					
				});
				// console.log(rootdir+'/images/'+imgpath)
				res.redirect('/dashboard/view');
			});
			
		});		
	})
	});
	
});

router.get('/:club/delete/:key',function(req,res){
		if(!req.user){
			res.redirect('/auth/login');
		}else if(req.params.club!=req.user.club){
			res.redirect('/dashboard/'+req.user.club);
		}else{
			getConnection(function(err, con){
				if (err) {
					throw err;
				}
				//Now do whatever you want with this connection obtained from the pool
				con.query("SELECT * FROM event_data where event_key = ?",[req.params.key],(err,result,fields)=>{
					if (err) {
						con.release();
						throw err;
					}
				// console.log(result[0].img);
				event_name = result[0].title;
				club=result[0].club;
				event_venue=result[0].venue;
				event_date_time=result[0].date;
				var imgpath= result[0].img;
				key=req.params.key;
				con.query("DELETE FROM event_data where event_key="+req.params.key, function (err, result, fields) {
					if (err) {
					con.release();
					throw err;
				}
					rootdir=__dirname;
					rootdir=rootdir.substring(0,rootdir.length -7);
					fs.unlink(rootdir+'/images/'+imgpath,(err)=>{
						if(err) throw err;
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
							title: event_name+' by '+club+" is cancelled.",
							options:{
								body: 'The event '+event_name+' (Date: '+edate+', \nVenue: '+event_venue+') stands cancelled for now.',
								icon: '/icons/events.png',
								badge: '/icons/monochrome1.png',
								vibrate: [500,110,500,110,450,110,200,110,170,40,450,110,200,110,170,40,500] // STAR WARS
							},
							data: {event_key: key}
						});

						con.query('SELECT * FROM subscriptions', (err,result,fields)=>{
							if (err) {
								throw err;
							}
							con.release();
							// console.log(result[0].subscription_obj);
							i=0;
							while(i<result.length){
								subscription = JSON.parse(result[i].subscription_obj);
								webpush.sendNotification(subscription,payload).catch(err=> console.error('webpush err'));
								i++;
							}
							
						});
						// console.log(rootdir+'/images/'+imgpath)
						res.redirect('/dashboard/'+club+'/view');
				});
				
				});		
				})
			});
			
	}
	
});

//ADD CLUB COORDINATOR
router.get('/admin/add_coordinator',authCheck,(req,res)=>{
	rootdir=__dirname;
	rootdir=rootdir.substring(0,rootdir.length -7);
	res.sendFile(rootdir+'/add_coordinator.html');
});


module.exports=router;