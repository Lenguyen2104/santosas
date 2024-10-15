const mongoose = require('mongoose');
const User = require('../models/useradminModel');
const UserClient = require('../models/userModel');
const Bet = require('../models/betModel');
const Onemin = require('../models/oneminModel');
const Threemin = require('../models/threeminModel');
const Fivemin = require('../models/fiveminModel');
const OddsBet = require('../models/oddsbetModel');
const Logbalance = require('../models/logbalance');
const Setting = require('../models/SettingModel');
const Banner = require('../models/bannerModel');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');




const registerLoad = async (req, res) => {
    try {
        res.render('admin/register');
    } catch (error) {
        console.log(error.message);
    }
};
const register = async (req, res) => {
    try {
        const { phone, username, password } = req.body;
        const existingPhone = await User.findOne({ phone });
        if (existingPhone) {
            return res.status(409).json({ status: 0, message: 'Số điện thoại đã tồn tại' });
        }
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(409).json({ status: 0, message: 'Tài khoản đã tồn tại' });
        }
        const passwordhash = await bcrypt.hash(password, 10);
        const user = new User({
            phone: phone,
            username: username,
            password: passwordhash,
            // roles: 'admin',
            is_online: false
        });
        await user.save();
        res.status(201).json({ status: 1, message: 'Tạo tài khoản thành công' });
    } catch (error) {
        console.error('Error saving user to the database:', error);
    }
};
const loginLoad = async (req, res) => {
    try {
        res.render('admin/login');
    } catch (error) {
        console.log(error.message);
    }
};
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const userData = await User.findOne({ phone:username, roles:'admin' });
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                req.session.user = userData;
                res.cookie(`user`, JSON.stringify(userData));
                res.status(200).json({ status: true, msg: 'Đăng nhập thành công', url: '/admin/dashboard' });
            }else{
                return res.status(409).json({ status: false, msg: 'Tài khoản không đúng' });
            }
        }else{
            return res.status(409).json({ status: false, message: 'Tài khoản không đúng' });
        }
    } catch (error) {
        console.log(error.message);
    }
};
const logout = async (req, res) => {
    try {
        res.clearCookie('user');
        req.session.destroy();
        res.redirect('/error');
    } catch (error) {
        console.log(error.message);
    }
};
const loadDashboard = async (req, res) => {
    try {
        var users = await User.find({ _id: { $nin:[req.session.user._id] } });
        res.render('admin/dashboard', {user: req.session.user, users: users});
    } catch (error) {
        console.log(error.message);
    }
};

const loadMembers = async (req, res) => {
    try {
        // const users = await UserClient.find({});
        const usersWithLogs = await UserClient.aggregate([
        {
            $lookup: {
                from: 'logwebs',
                localField: '_id',
                foreignField: 'user_id',
                as: 'logs'
            }
        },
        {
            $unwind: {
                path: '$logs',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $sort: {
                'logs.createdAt': -1
            }
        },
        {
            $group: {
                _id: '$_id',
                username: { $first: '$username' },
                password: { $first: '$password' },
                password_show: { $first: '$password_show' },
                phone: { $first: '$phone' },
                password_withdraw: { $first: '$password_withdraw' },
                balance: { $first: '$balance' },
                bank_id: { $first: '$bank_id' },
                bank_number: { $first: '$bank_number' },
                bank_user: { $first: '$bank_user' },
                email: { $first: '$email' },
                address: { $first: '$address' },
                info: { $first: '$info' },
                gender: { $first: '$gender' },
                birthday: { $first: '$birthday' },
                vip: { $first: '$vip' },
                avatar: { $first: '$avatar' },
                ref: { $first: '$ref' },
                coderef: { $first: '$coderef' },
                banned: { $first: '$banned' },
                roles: { $first: '$roles' },
                cmndmt: { $first: '$cmndmt' },
                cmndms: { $first: '$cmndms' },
                ipaddress: { $first: '$ipaddress' },
                enable_bet: { $first: '$enable_bet' },
                createdAt: { $first: '$createdAt' },
                logs: { $push: '$logs' }
            }
        },
        {
            $addFields: {
                logs: { $slice: ['$logs', 10] }  // Limit logs array to the 10 most recent logs
            }
        }
    ]);
        res.render('admin/members',{ users:usersWithLogs });
    } catch (error) {
        console.log(error.message);
    }
};
const editMembersMoney = async (req, res) => {
    try {
        const user = await UserClient.findOne({ _id:req.params.id });
        res.render('admin/members/money', { user:user });
    } catch (error) {
        console.log(error.message);
    }
};
const updateMembersMoney = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await UserClient.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const { balance: rawBalance, khuyenmai: rawKhuyenmai } = req.body;
        const balance = Number(rawBalance);
        const khuyenmai = Number(rawKhuyenmai);
        const currentBalance = user.balance;
        var updatedBalance;
        if (khuyenmai === 0) {
            updatedBalance = currentBalance + balance;
        } else {
            const percentage = khuyenmai / 100;
            updatedBalance  = { balance: balance * (1 + percentage) + currentBalance };
        }
        const logba = new Logbalance({
            user_id: userId,
            frommoney: user.balance,
            money: balance + balance * khuyenmai / 100,
            tomoney: user.balance + balance + balance * khuyenmai / 100,
            content: '',
            status: 'Hoàn thành',
            type: 'Nạp tiền',
        });
        await logba.save();
        var updatedUser = await UserClient.findByIdAndUpdate(
            req.params.id,
            { balance: updatedBalance },
            { new: true }
        );
        if (updatedUser) {
            res.render('admin/members/money', { message:'Cập nhật thành công', user:updatedUser });
        } else {
            console.log('User not found');
            res.render('admin/members/money', { message:'Cập nhật thất bại'});
        }
    } catch (error) {
        console.log(error.message);
    }
};
const editMembers = async (req, res) => {
    try {
        const user = await UserClient.findOne({ _id:req.params.id });
        console.log(user);
        res.render('admin/members/edit', { user:user });
    } catch (error) {
        console.log(error.message);
    }
};
const updateMembers = async (req, res) => {
    try {
        var { phone, username, password_withdraw, balance, bank_id, banned, bank_number, bank_user, vip, coderef, password,enable_bet } = req.body;
        if(password !== ''){
            let updateFields = { phone, username, password_withdraw, balance, bank_id, banned, bank_number, bank_user, vip, coderef, password_show : password,enable_bet };
            var passwordHash = await bcrypt.hash(password, 10);
            updateFields.password = passwordHash;
            var updatedUser = await UserClient.findByIdAndUpdate(
                req.params.id,
                updateFields,
                { new: true }
            );
        }else{
            var updatedUser = await UserClient.findByIdAndUpdate(
                req.params.id,
                { phone, username, password_withdraw, balance, bank_id, banned, bank_number, bank_user, vip, coderef,enable_bet },
                { new: true } 
            );
        }
        if (updatedUser) {
            console.log('User updated:', updatedUser);
            res.render('admin/members/edit', { message:'Cập nhật thành công', user:updatedUser });
        } else {
            console.log('User not found');
            res.render('admin/members/edit', { message:'Cập nhật thất bại'});
        }
    } catch (error) {
        console.log(error.message);
    }
};
const deleteMembers = async (req, res) => {
    try {
        const deletemember = await UserClient.findByIdAndDelete(req.params.id);
        const users = await UserClient.find({});
        if (deletemember) {
            res.render('admin/members', { message:'Xóa thành công', users:users });
        } else {
            res.render('admin/members', { message:'Xóa thất bại', users:users });
        }
    } catch (error) {
        console.log(error.message);
    }
};


const loadBethistory = async (req, res) => {
    try {
        const bets = await Bet.find({}).sort({ _id: -1 }).limit(100).populate('user_id');
        res.render('admin/history',{ bets:bets });
    } catch (error) {
        console.log(error.message);
    }
};
const deleteBethistory = async (req, res) => {
    try {
        const deletemember = await Bet.findByIdAndDelete(req.params.id);
        const bets = await Bet.find({}).sort({ _id: -1 }).limit(100);
        if (deletemember) {
            res.render('admin/history', { message:'Xóa thành công', bets:bets });
        } else {
            res.render('admin/history', { message:'Xóa thất bại', bets:bets });
        }
    } catch (error) {
        console.log(error.message);
    }
};



const loadBethistoryone = async (req, res) => {
    try {
        const bets = await Onemin.find({}).sort({ _id: -1 }).limit(100);
        res.render('admin/historyone',{ bets:bets });
    } catch (error) {
        console.log(error.message);
    }
};
const loadBethistorythree = async (req, res) => {
    try {
        const bets = await Threemin.find({}).sort({ _id: -1 }).limit(100);
        res.render('admin/historythree',{ bets:bets });
    } catch (error) {
        console.log(error.message);
    }
};
const loadBethistoryfive = async (req, res) => {
    try {
        const bets = await Fivemin.find({}).sort({ _id: -1 }).limit(100);
        res.render('admin/historyfive',{ bets:bets });
    } catch (error) {
        console.log(error.message);
    }
};
const loadhistorywithdraw = async (req, res) => {
    try {
        const logs = await Logbalance.find({type : 'Rút tiền'}).sort({ _id: -1 }).limit(500).populate('user_id');
        res.render('admin/historywithdraw',{ logs:logs });
    } catch (error) {
        console.log(error.message);
    }
};
const edithistorywithdraw = async (req, res) => {
    try {
        const log = await Logbalance.findOne({ _id:req.params.id });
        res.render('admin/historywithdraw/edit', { log:log });
    } catch (error) {
        console.log(error.message);
    }
};
const updatehistorywithdraw = async (req, res) => {
    var { status, content, money } = req.body;
    if(status == 'Rút tiền thất bại'){
        var updateFields = { status, content: 'Thông tin Họ Tên & Số Tài Khoản của quý khách không đúng, hệ thống nghi ngờ quý khách có Dấu Hiệu Gian Lận trong quá trình rút tiền, quý khách vui lòng liên hệ CSKH để được hướng dẫn kiểm tra thông tin !'  };
    }else{
        var updateFields = { status, content };
    }
    var updatedUser = await Logbalance.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { new: true }
    );
    if (updatedUser) {
        console.log('User updated:', updatedUser);
        if(status == 'Hoàn thành'){
            const id = updatedUser.user_id
            var updatedUser = await UserClient.findByIdAndUpdate(
                id,
                { bank_id : null, bank_number : null, bank_user : null },
                { new: true } 
            );
        }else if(status == 'Rút tiền thất bại'){
            const id = updatedUser.user_id
            const user = await UserClient.findById(id);
            var updatedBalance;
            updatedBalance  = user.balance + Number(money);
            var updatedUserclient = await UserClient.findByIdAndUpdate(
                id,
                { balance: updatedBalance },
                { new: true }
            );
        }
        res.render('admin/historywithdraw/edit', { message:'Cập nhật thành công', log:updatedUser });
    } else {
        console.log('User not found');
        res.render('admin/historywithdraw/edit', { message:'Cập nhật thất bại'});
    }
};
const deletehistorywithdraw = async (req, res) => {
    try {
        const deletemember = await Logbalance.findByIdAndDelete(req.params.id);
        const bets = await Logbalance.find({}).sort({ _id: -1 }).limit(100);
        if (deletemember) {
            res.render('admin/historywithdraw', { message:'Xóa thành công', logs:bets });
        } else {
            res.render('admin/historywithdraw', { message:'Xóa thất bại', logs:bets });
        }
    } catch (error) {
        console.log(error.message);
    }
};
const loadBethistoryoneAdd = async (req, res) => {
    try {
        res.render('admin/historyone/add');
    } catch (error) {
        console.log(error.message);
    }
};
const BethistoryoneAdd = async (req, res) => {
    try {
        const { contenta, contentb, contentc } = req.body;
        const contentaNum = Number(contenta);
        const contentbNum = Number(contentb);
        const contentcNum = Number(contentc);
        if (isNaN(contentaNum) || isNaN(contentbNum) || isNaN(contentcNum)) {
            throw new Error('Invalid input: one or more content values are not numbers.');
        }
        const total = contentaNum + contentbNum + contentcNum;
        const one = new Onemin({
            contenta: contentaNum,
            contentb: contentbNum,
            contentc: contentcNum,
            total: total,
            status: 'set'
        });
        await one.save();
        res.render('admin/historyone/add', { message:'Tạo thành công' });
    } catch (error) {
        console.error('Error saving user to the database:', error);
    }
};
const loadBethistorythreeAdd = async (req, res) => {
    try {
        res.render('admin/historythree/add');
    } catch (error) {
        console.log(error.message);
    }
};
const BethistorythreeAdd = async (req, res) => {
    try {
        const { contenta, contentb, contentc } = req.body;
        const contentaNum = Number(contenta);
        const contentbNum = Number(contentb);
        const contentcNum = Number(contentc);
        if (isNaN(contentaNum) || isNaN(contentbNum) || isNaN(contentcNum)) {
            throw new Error('Invalid input: one or more content values are not numbers.');
        }
        const total = contentaNum + contentbNum + contentcNum;
        const one = new Threemin({
            contenta: contentaNum,
            contentb: contentbNum,
            contentc: contentcNum,
            total: total,
            status: 'set'
        });
        await one.save();
        res.render('admin/historythree/add', { message:'Tạo thành công' });
    } catch (error) {
        console.error('Error saving user to the database:', error);
    }
};
const loadBethistoryfiveAdd = async (req, res) => {
    try {
        res.render('admin/historyfive/add');
    } catch (error) {
        console.log(error.message);
    }
};
const BethistoryfiveAdd = async (req, res) => {
    try {
        const { contenta, contentb, contentc } = req.body;
        const contentaNum = Number(contenta);
        const contentbNum = Number(contentb);
        const contentcNum = Number(contentc);
        if (isNaN(contentaNum) || isNaN(contentbNum) || isNaN(contentcNum)) {
            throw new Error('Invalid input: one or more content values are not numbers.');
        }
        const total = contentaNum + contentbNum + contentcNum;
        const one = new Fivemin({
            contenta: contentaNum,
            contentb: contentbNum,
            contentc: contentcNum,
            total: total,
            status: 'set'
        });
        await one.save();
        res.render('admin/historyfive/add', { message:'Tạo thành công' });
    } catch (error) {
        console.error('Error saving user to the database:', error);
    }
};
const logs = async (req, res) => {
    try {
        const logs = await Logbalance.find({}).sort({ _id: -1 }).limit(500).populate('user_id');
        res.render('admin/logs',{ logs:logs });
    } catch (error) {
        console.log(error.message);
    }
};
const deletelogs = async (req, res) => {
    try {
        const deletemember = await Logbalance.findByIdAndDelete(req.params.id);
        const logs = await Logbalance.find({}).sort({ _id: -1 }).limit(100);
        if (deletemember) {
            res.render('admin/logs', { message:'Xóa thành công', logs:logs });
        } else {
            res.render('admin/logs', { message:'Xóa thất bại', logs:logs });
        }
    } catch (error) {
        console.log(error.message);
    }
};
const loadoddsbet = async (req, res) => {
    try {
        const odds = await OddsBet.find({}).sort({ _id: -1 }).limit(500);
        res.render('admin/oddsbet',{ odds:odds });
    } catch (error) {
        console.log(error.message);
    }
};
const editoddsbet = async (req, res) => {
    try {
        const odds = await OddsBet.findOne({ _id:req.params.id });
        res.render('admin/oddsbet/edit', { odds:odds });
    } catch (error) {
        console.log(error.message);
    }
};
const updateoddsbet = async (req, res) => {
    // var { title, value } = req.body;
    // try {
    //     const odds = await OddsBet.findOne({ _id:req.params.id });
    //     res.render('admin/oddsbet/edit', { odds:odds });
    // } catch (error) {
    //     console.log(error.message);
    // }
    var { title, value } = req.body;
    let updateFields = { title, value  };
    var odds = await OddsBet.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { new: true }
    );
    if (odds) {
        res.render('admin/oddsbet/edit', { message:'Cập nhật thành công', odds:odds });
    } else {
        res.render('admin/oddsbet/edit', { message:'Cập nhật thất bại'});
    }
};
const loadsettings = async (req, res) => {
    try {
        const settings = await Setting.find({});
        res.render('admin/settings',{ settings:settings });
    } catch (error) {
        console.log(error.message);
    }
};
const editsettings = async (req, res) => {
    try {
        const settings = await Setting.findOne({ _id:req.params.id });
        res.render('admin/settings/edit',{ setting:settings });
    } catch (error) {
        console.log(error.message);
    }
};
const updatesettings = async (req, res) => {
    try {
        var { value } = req.body;
        let updateFields = { value };
        var settings = await Setting.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true }
        );
        res.render('admin/settings/edit',  { message:'Cập nhật thành công', setting:settings  });
    } catch (error) {
        console.log(error.message);
    }
};

const loadbanners = async (req, res) => {
    try {
        const banners = await Banner.find({});
        res.render('admin/banner',{ banners:banners });
    } catch (error) {
        console.log(error.message);
    }
};
const loadbannersadd = async (req, res) => {
    try {
        const banners = await Banner.find({});
        res.render('admin/banner/add');
    } catch (error) {
        console.log(error.message);
    }
};
const addbanner = async (req, res) => {
    try {
        upload(req, res, async function (err) {
            if (err) {
                console.error('Error uploading avatar:', err);
                return;
            }
            const { content } = req.body;
            const link = req.file ? req.file.path : null;
            const link_link = link ? `/uploads/banners/${path.basename(link)}` : null;
            const newBanner = new Banner({
                link: link_link,
                content: content,
            });
            await newBanner.save();
            const banners = await Banner.find({});
            res.render('admin/banner/add', { message:'Thêm thành công', banners:banners });
        });
    } catch (error) {
        console.log(error.message);
    }
};
const deletebanner = async (req, res) => {
    try {
        const deletemember = await Banner.findByIdAndDelete(req.params.id);
        const banners = await Banner.find({}).sort({ _id: -1 }).limit(100);
        if (deletemember) {
            res.render('admin/banner', { message:'Xóa thành công', banners:banners });
        } else {
            res.render('admin/banner', { message:'Xóa thất bại', banners:banners });
        }
    } catch (error) {
        console.log(error.message);
    }
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './public/uploads/banners';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir); 
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage }).single('link');




module.exports = {
  registerLoad,
  register,
  loginLoad,
  login,
  logout,
  loadDashboard,
  deleteMembers,
  loadMembers,
  editMembers,
  updateMembers,
  loadBethistory,
  deleteBethistory,
  loadBethistoryone,
  loadBethistorythree,
  loadBethistoryfive,
  loadhistorywithdraw,
  edithistorywithdraw,
  updatehistorywithdraw,
  loadBethistoryoneAdd,
  BethistoryoneAdd,
  loadBethistorythreeAdd,
  BethistorythreeAdd,
  loadBethistoryfiveAdd,
  BethistoryfiveAdd,
  deletehistorywithdraw,
  editMembersMoney,
  updateMembersMoney,
  loadoddsbet,
  editoddsbet,
  updateoddsbet,
  loadsettings,
  editsettings,
  updatesettings,
  logs,
  deletelogs,
  loadbanners,
  loadbannersadd,
  addbanner,
  deletebanner,
};
