const router = require('express').Router();
const passport =require('passport');

//auth login
router.get('/login', (req,res)=>{
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