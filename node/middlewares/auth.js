const isLogin = async (req, res, next) =>{
    try {
        if(req.session.user){

        }else{
            res.redirect('/');
        }
        next();
    } catch (error) {
        console.log(error.message);
    }
}

const isLogout = async (req, res, next) =>{
    try {
        if(req.session.user){
            res.redirect('/');
        }
        next();
    } catch (error) {
        console.log(error.message);
    }
}

const isAdmin = (req, res, next) => {
    const user = req.session.user; 
    // console.log(user);
    if (user && user.roles && user.roles.includes('admin')) {
      next();
    } else {
        res.redirect('/admin/login');
    }
};

module.exports = {
    isLogin,
    isAdmin,
    isLogout
}