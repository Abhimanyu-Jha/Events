const router = require('express').Router();
const passport =require('passport');
const authCheck = (req,res,next)=>{
	if(req.user){
		club=req.user.club
		res.redirect('/dashboard/'+club);
	}
	else{
		next();
	}
}
//auth login
router.get('/login',authCheck,(req,res)=>{
	rootdir=__dirname;
	rootdir=rootdir.substring(0,rootdir.length -7);
	res.sendFile(rootdir+'/login.html');
});

//auth with google
router.get('/google', passport.authenticate('google',{
	scope:['profile'],
	prompt: 'consent'
}));

//callback route for google redirect
router.get('/google/redirect', passport.authenticate('google',
	{successRedirect:'/dashboard/admin', failureRedirect: '/auth/login'})
// 	function(req, res) {
// 		if (!user) { return res.redirect('/login'); }
// 		res.redirect('/dashboard');
// }

);

// logging out
router.get('/logout', (req,res)=>{
	req.logout();
	res.redirect('/')
});


module.exports= router;