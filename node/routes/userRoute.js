const express = require('express');
const user_route = express();

const bodyParser = require('body-parser');
const session = require('express-session');
const { SESSION_SECRET } = process.env;
user_route.use(session({ secret:SESSION_SECRET }));


const cookieParser = require('cookie-parser');
user_route.use(cookieParser());
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}));
user_route.set('view engine', 'ejs');
user_route.set('views', './views');
user_route.use(express.static('public'));


const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
    destination:function(req, file, cb){
        cb(null, path.join(__dirname,'/../public/images'));
    },
    filename:function(req, file, cb){
        const name = Date.now()+'-'+file.originalname;
        cb(null, name);
    }
});
const upload = multer({storage:storage});

const userController = require('../controllers/userController');
const adminController = require('../controllers/adminController');

const auth = require('../middlewares/auth');

user_route.get('/admin/login', auth.isLogout, adminController.loginLoad);
user_route.post('/admin/login', adminController.login);
user_route.get('/admin/register', auth.isLogout, adminController.registerLoad);
user_route.post('/admin/register', adminController.register);
user_route.get('/logout', auth.isLogin, userController.logout);

user_route.get('/admin/dashboard',auth.isAdmin, adminController.loadDashboard);
user_route.get('/admin/members', auth.isAdmin, adminController.loadMembers);
user_route.get('/admin/members/:id', auth.isAdmin, adminController.editMembers);
user_route.post('/admin/members/:id', auth.isAdmin, adminController.updateMembers);
user_route.get('/admin/members/money/:id', auth.isAdmin, adminController.editMembersMoney);
user_route.post('/admin/members/money/:id', auth.isAdmin, adminController.updateMembersMoney);
user_route.get('/admin/members/delete/:id', auth.isAdmin, adminController.deleteMembers);
user_route.get('/admin/history', auth.isAdmin, adminController.loadBethistory);
user_route.get('/admin/bets/delete/:id', auth.isAdmin, adminController.deleteBethistory);

user_route.get('/admin/history/one', auth.isAdmin, adminController.loadBethistoryone);
user_route.get('/admin/history/one/add', auth.isAdmin, adminController.loadBethistoryoneAdd);
user_route.post('/admin/history/one/add', auth.isAdmin, adminController.BethistoryoneAdd);

user_route.get('/admin/history/three', auth.isAdmin, adminController.loadBethistorythree);
user_route.get('/admin/history/three/add', auth.isAdmin, adminController.loadBethistorythreeAdd);
user_route.post('/admin/history/three/add', auth.isAdmin, adminController.BethistorythreeAdd);

user_route.get('/admin/history/five', auth.isAdmin, adminController.loadBethistoryfive);
user_route.get('/admin/history/five/add', auth.isAdmin, adminController.loadBethistoryfiveAdd);
user_route.post('/admin/history/five/add', auth.isAdmin, adminController.BethistoryfiveAdd);

user_route.get('/admin/history/withdraw', auth.isAdmin, adminController.loadhistorywithdraw);
user_route.get('/admin/history/withdraw/:id', auth.isAdmin, adminController.edithistorywithdraw);
user_route.post('/admin/history/withdraw/:id', auth.isAdmin, adminController.updatehistorywithdraw);
user_route.get('/admin/history/withdraw/delete/:id', auth.isAdmin, adminController.deletehistorywithdraw);

user_route.get('/admin/oddsbet', auth.isAdmin, adminController.loadoddsbet);
user_route.get('/admin/oddsbet/:id', auth.isAdmin, adminController.editoddsbet);
user_route.post('/admin/oddsbet/:id', auth.isAdmin, adminController.updateoddsbet);

user_route.get('/admin/settings', auth.isAdmin, adminController.loadsettings);
user_route.get('/admin/settings/edit/:id', auth.isAdmin, adminController.editsettings);
user_route.post('/admin/settings/edit/:id', auth.isAdmin, adminController.updatesettings);
user_route.get('/admin/logs', auth.isAdmin, adminController.logs);
user_route.get('/admin/logs/delete/:id', auth.isAdmin, adminController.deletelogs);

user_route.get('/admin/banners', auth.isAdmin, adminController.loadbanners);
user_route.get('/admin/banners/add', auth.isAdmin, adminController.loadbannersadd);
user_route.post('/admin/banners/add', auth.isAdmin, adminController.addbanner);
user_route.get('/admin/banners/delete/:id', auth.isAdmin, adminController.deletebanner);





const secretKey = 'your_jwt_secret';
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
    if (!token) {
      return res.sendStatus(401);
    }
    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next(); 
    });
}
  
user_route.get('/user', userController.user);
user_route.post('/loginuser', userController.login);
user_route.post('/registeruser', userController.register);

user_route.get('/getfirstketquaone', userController.getfirstketquaone);
user_route.get('/getfirstonemin', userController.getfirstonemin);
user_route.get('/getresultonemin/:id', userController.getresultonemin);
user_route.post('/buyone', userController.buyone);

user_route.get('/gethistorybetuser', userController.gethistorybetuser);

user_route.get('/test', userController.test);

user_route.get('/getfirstketquathree', userController.getfirstketquathree);
user_route.get('/getfirstthreemin', userController.getfirstthreemin);
user_route.get('/getresultthreemin/:id', userController.getresultthreemin);
user_route.post('/buythree', userController.buythree);

user_route.get('/getfirstketquafive', userController.getfirstketquafive);
user_route.get('/getfirstfivemin', userController.getfirstfivemin);
user_route.get('/getresultfivemin/:id', userController.getresultfivemin);
user_route.post('/buyfive', userController.buyfive);

user_route.post('/rut-tien', userController.ruttien);
user_route.post('/addnewbank', userController.addnewbank);
user_route.get('/getdynamicbalance', userController.getdynamicbalance);
user_route.get('/gethistorydesposit', userController.gethistorydesposit);
user_route.get('/gethistorywithdraw', userController.gethistorywithdraw);
user_route.post('/changepasswordwithdraw', userController.changepasswordwithdraw);
user_route.post('/changepassword', userController.changepassword);
user_route.post('/withdraw', userController.withdraw);
user_route.get('/getlinkchat', userController.getlinkchat);
user_route.get('/getlinkkhuyenmai', userController.getlinkkhuyenmai);


user_route.get('*', function(req, res){
    res.render('error');
})

module.exports = user_route;