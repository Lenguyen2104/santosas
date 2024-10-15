const mongoose  = require('mongoose');
const User      = require('../models/userModel');
const Onemin    = require('../models/oneminModel');
const Threemin  = require('../models/threeminModel');
const Fivemin   = require('../models/fiveminModel');
const OddsBet   = require('../models/oddsbetModel');
const Bet       = require('../models/betModel');
const Logbalance= require('../models/logbalance');
const Logweb    = require('../models/logswebModel');
const Setting   = require('../models/SettingModel');
const Banner    = require('../models/bannerModel');
const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');
const multer    = require('multer');
const path      = require('path');
const fs        = require('fs');
const UAParser  = require('ua-parser-js');



const register = async (req, res) => {
    const { username, password, phone, password_withdraw, coderef } = req.body;
    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ status: 0, msg: 'Tên đăng nhập đã trùng' });
    const hashedPassword = await bcrypt.hash(password, 10);
    let ref = null;
    if(coderef !== ''){
        const usercoderef = await User.findOne({ coderef: coderef });
        if(usercoderef){
            ref = usercoderef?._id
            const newUser = new User({
                username,
                password: hashedPassword,
                password_show: password,
                phone: phone,
                password_withdraw: password_withdraw,
                ref: ref,
                ipaddress: req.socket.remoteAddress,
                bank_id: null,
                bank_number: null,
                bank_user: null,
            });
            await newUser.save();
            res.json({ status: 1, msg: 'Tạo tài khoản thành công' });
        }else{
            res.json({ status: 0, msg: 'Mã mời không tồn tại' });
        }
    }else{
        const newUser = new User({
            username,
            password: hashedPassword,
            password_show: password,
            phone: phone,
            password_withdraw: password_withdraw,
            ref: ref
        });
        await newUser.save();
        res.json({ status: 1, msg: 'Tạo tài khoản thành công' });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({status: 0, msg: 'Tên đăng nhập không tồn tại' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ status: 0, msg: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, 'your_jwt_secret', { expiresIn: '10h' });
    const parser = new UAParser();
    const userAgent = req.headers['user-agent'];
    const result = parser.setUA(userAgent).getResult();
    const newLog = new Logweb({
        user_id: user._id,
        ipaddress: req.socket.remoteAddress,
        agent: result.browser,
        os: result.os,
        device: result.device,
    });
    await newLog.save();
    res.json({ status: 1, msg: 'Đăng nhập thành công', token, user: user });
};
const user = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const user = await User.findById(decoded.id).select('-password -password_show -password_withdraw').exec();
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        res.json({ status: 1, user: user });
    } catch (error) {
        // console.log('Error fetching user:', error);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

const logout = async (req, res) => {
    try {
        res.clearCookie('user');
        req.session.destroy();
        res.redirect('/');
    } catch (error) {
        console.log(error.message);
    }
};
const gethistorybetuser = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const user = await User.findById(decoded.id).exec();
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        const bets = await Bet.find({user_id: user._id})
            .sort({ createdAt: -1 })
            .limit(100); 
        const phienIds = bets.map(bet => bet.phien_id);
        const oneminmodels = await Onemin.find({ phien_id: { $in: phienIds } });
        const threeminmodels = await Threemin.find({ three_phien_id: { $in: phienIds } });
        const fiveminmodels = await Fivemin.find({ five_phien_id: { $in: phienIds } });
        const data = bets.map(bet => {
            return {
                ...bet._doc, 
                oneminmodel: oneminmodels.find(model2 => model2.phien_id === bet.phien_id),
                threeminmodel: threeminmodels.find(model2 => model2.three_phien_id === bet.phien_id),
                fiveminmodel: fiveminmodels.find(model2 => model2.five_phien_id === bet.phien_id),
            };
        });
        res.json({ data });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
};
// start one
const getfirstketquaone = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const user = await User.findById(decoded.id).exec();
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        const data = await Onemin.find()
            .sort({ createdAt: -1 })
            .limit(30); 
        res.json({ data });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
};
const getfirstonemin = async (req, res) => {
    const data = await Onemin.findOne().sort({ createdAt: -1 }).exec();
    const bets = await OddsBet.find({  });
    const convertedBets = {
        chinhthuc: {
            tong: [],
            doi: [],
            tamco: []
        },
        codien: {
            tong: [],
            doiben: [],
            doi: [],
            tamco: [],
            batky: []
        }
    };
    bets.forEach(bet => {
        if (bet.type === 'Đôi' && bet.official === 'chinhthuc') {
            convertedBets.chinhthuc.doi.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        } else if (bet.type === 'Tổng' && bet.official === 'chinhthuc') {
            convertedBets.chinhthuc.tong.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        } else if (bet.type === 'Tam cô' && bet.official === 'chinhthuc') {
            convertedBets.chinhthuc.tamco.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        }else if (bet.type === 'Tổng' && bet.official === 'codien') {
            convertedBets.codien.tong.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        }else if (bet.type === 'Đôi' && bet.official === 'codien') {
            convertedBets.codien.doi.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        }else if (bet.type === 'Tam cô' && bet.official === 'codien') {
            convertedBets.codien.tamco.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        }else if (bet.type === 'Đôi bên' && bet.official === 'codien') {
            convertedBets.codien.doiben.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        }else if (bet.type === 'Bất kỳ' && bet.official === 'codien') {
            convertedBets.codien.batky.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        }
    });
    res.json({ data, bets: convertedBets });
};
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const getresultonemin = async (req, res) => {
    const id = req.params.id;
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const user = await User.findById(decoded.id).exec();
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        await sleep(2000);
        const data = await Onemin.findOne({ phien_id: id });
        res.json({ data });
    } catch (error) {
        console.log(error.message);
    } 
};
const buyone = async (req, res) => {
    const { cart, phien_id, totalMoney } = req.body;
    console.log(cart)
    console.log(phien_id)
    console.log(totalMoney)
    try {
        const token     = req.headers.authorization.split(' ')[1];
        const decoded   = jwt.verify(token, 'your_jwt_secret');
        const user      = await User.findById(decoded.id).exec();
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        if(!user.enable_bet){
            res.json({ status: 0, msg: 'Tài khoản bị đóng cược !' });
        }else{
            if(totalMoney > user.balance){
                res.json({ status: 0, msg: 'Số dư của quý khách không đủ !' });
            }else{
                user.balance = (user.balance || 0) - totalMoney;
                await user.save();
                for (const bet of cart) {
                    const type = bet.type
                    if(type == 'Tổng' || type == 'Đôi bên'){
                        const newBet = new Bet({
                            user_id: user._id,
                            phien_id: phien_id,
                            type: 'one',
                            contenttype: type,
                            contenta: 0,
                            contentb: 0,
                            contentc: 0,
                            total: bet.title,
                            tyle: bet.value,
                            money: bet.money,
                            result: 0,
                            status: 'process'
                        });
                        const betnew = await newBet.save();
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
                            frommoney: user.balance,
                            money: bet.money,
                            tomoney: user.balance - bet.money,
                            content: '',
                            type: 'TX One',
                            status: 'Hoàn thành'
                        });
                        await newLogbalance.save();
                    }else if(type == 'Tam cô chung'){
                        const newBet = new Bet({
                            user_id: user._id,
                            phien_id: phien_id,
                            type: 'one',
                            contenttype: type,
                            contenta: 6,
                            contentb: 6,
                            contentc: 6,
                            total: bet.title,
                            tyle: bet.value,
                            money: bet.money,
                            result: 0,
                            status: 'process'
                        });
                        const betnew = await newBet.save();
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
                            frommoney: user.balance,
                            money: bet.money,
                            tomoney: user.balance - bet.money,
                            content: '',
                            type: 'TX One',
                            status: 'Hoàn thành'
                        });
                        await newLogbalance.save();
                    }else if(type == 'Tam cô'){
                        const newBet = new Bet({
                            user_id: user._id,
                            phien_id: phien_id,
                            type: 'one',
                            contenttype: type,
                            contenta: bet.title.split('-')[0],
                            contentb: bet.title.split('-')[1],
                            contentc: bet.title.split('-')[2],
                            total: bet.title,
                            tyle: bet.value,
                            money: bet.money,
                            result: 0,
                            status: 'process'
                        });
                        const betnew = await newBet.save();
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
                            frommoney: user.balance,
                            money: bet.money,
                            tomoney: user.balance - bet.money,
                            content: '',
                            type: 'TX One',
                            status: 'Hoàn thành'
                        });
                        await newLogbalance.save();
                    }else if(type == 'Đôi'){
                        const newBet = new Bet({
                            user_id: user._id,
                            phien_id: phien_id,
                            type: 'one',
                            contenttype: type,
                            contenta: bet.title.split('-')[0],
                            contentb: bet.title.split('-')[1],
                            contentc: 0,
                            total: bet.title,
                            tyle: bet.value,
                            money: bet.money,
                            result: 0,
                            status: 'process'
                        });
                        const betnew = await newBet.save();
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
                            frommoney: user.balance,
                            money: bet.money,
                            tomoney: user.balance - bet.money,
                            content: '',
                            type: 'TX One',
                            status: 'Hoàn thành'
                        });
                        await newLogbalance.save();
                    }else if(type == 'Bất kỳ'){
                        const newBet = new Bet({
                            user_id: user._id,
                            phien_id: phien_id,
                            type: 'one',
                            contenttype: type,
                            contenta: 0,
                            contentb: 0,
                            contentc: 0,
                            total: bet.title,
                            tyle: bet.value,
                            money: bet.money,
                            result: 0,
                            status: 'process'
                        });
                        const betnew = await newBet.save();
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
                            frommoney: user.balance,
                            money: bet.money,
                            tomoney: user.balance - bet.money,
                            content: '',
                            type: 'TX One',
                            status: 'Hoàn thành'
                        });
                        await newLogbalance.save();
                    }
                };
                res.json({ status: 1, msg: 'Đặt cược thành công' });
            }
        }
    } catch (error) {
        console.log('Error fetching user:', error);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};
// start one

// three one
const getfirstketquathree = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const user = await User.findById(decoded.id).exec();
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        const data = await Threemin.find()
            .sort({ createdAt: -1 })
            .limit(30); 
        res.json({ data });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
};
const getfirstthreemin = async (req, res) => {
    const data = await Threemin.findOne().sort({ createdAt: -1 }).exec();
    const bets = await OddsBet.find({  });
    const convertedBets = {
        chinhthuc: {
            tong: [],
            doi: [],
            tamco: []
        },
        codien: {
            tong: [],
            doiben: [],
            doi: [],
            tamco: [],
            batky: []
        }
    };
    bets.forEach(bet => {
        if (bet.type === 'Đôi' && bet.official === 'chinhthuc') {
            convertedBets.chinhthuc.doi.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        } else if (bet.type === 'Tổng' && bet.official === 'chinhthuc') {
            convertedBets.chinhthuc.tong.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        } else if (bet.type === 'Tam cô' && bet.official === 'chinhthuc') {
            convertedBets.chinhthuc.tamco.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        }else if (bet.type === 'Tổng' && bet.official === 'codien') {
            convertedBets.codien.tong.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        }else if (bet.type === 'Đôi' && bet.official === 'codien') {
            convertedBets.codien.doi.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        }else if (bet.type === 'Tam cô' && bet.official === 'codien') {
            convertedBets.codien.tamco.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        }else if (bet.type === 'Đôi bên' && bet.official === 'codien') {
            convertedBets.codien.doiben.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        }else if (bet.type === 'Bất kỳ' && bet.official === 'codien') {
            convertedBets.codien.batky.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        }
    });
    res.json({ data, bets: convertedBets });
};
const getresultthreemin = async (req, res) => {
    const id = req.params.id;
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const user = await User.findById(decoded.id).exec();
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        await sleep(2000);
        const data = await Threemin.findOne({ three_phien_id: id });
        res.json({ data });
    } catch (error) {
        console.log(error.message);
    } 
};
const buythree = async (req, res) => {
    const { cart, phien_id, totalMoney } = req.body;
    console.log(cart)
    console.log(phien_id)
    console.log(totalMoney)
    try {
        const token     = req.headers.authorization.split(' ')[1];
        const decoded   = jwt.verify(token, 'your_jwt_secret');
        const user      = await User.findById(decoded.id).exec();
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        if(!user.enable_bet){
            res.json({ status: 0, msg: 'Tài khoản bị đóng cược !' });
        }else{
            if(totalMoney > user.balance){
                res.json({ status: 0, msg: 'Số dư của quý khách không đủ !' });
            }else{
                user.balance = (user.balance || 0) - totalMoney;
                await user.save();
                for (const bet of cart) {
                    const type = bet.type
                    if(type == 'Tổng' || type == 'Đôi bên'){
                        const newBet = new Bet({
                            user_id: user._id,
                            phien_id: phien_id,
                            type: 'three',
                            contenttype: type,
                            contenta: 0,
                            contentb: 0,
                            contentc: 0,
                            total: bet.title,
                            tyle: bet.value,
                            money: bet.money,
                            result: 0,
                            status: 'process'
                        });
                        const betnew = await newBet.save();
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
                            frommoney: user.balance,
                            money: bet.money,
                            tomoney: user.balance - bet.money,
                            content: '',
                            type: 'TX Three',
                            status: 'Hoàn thành'
                        });
                        await newLogbalance.save();
                    }else if(type == 'Tam cô chung'){
                        const newBet = new Bet({
                            user_id: user._id,
                            phien_id: phien_id,
                            type: 'three',
                            contenttype: type,
                            contenta: 6,
                            contentb: 6,
                            contentc: 6,
                            total: bet.title,
                            tyle: bet.value,
                            money: bet.money,
                            result: 0,
                            status: 'process'
                        });
                        const betnew = await newBet.save();
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
                            frommoney: user.balance,
                            money: bet.money,
                            tomoney: user.balance - bet.money,
                            content: '',
                            type: 'TX Three',
                            status: 'Hoàn thành'
                        });
                        await newLogbalance.save();
                    }else if(type == 'Tam cô'){
                        const newBet = new Bet({
                            user_id: user._id,
                            phien_id: phien_id,
                            type: 'three',
                            contenttype: type,
                            contenta: bet.title.split('-')[0],
                            contentb: bet.title.split('-')[1],
                            contentc: bet.title.split('-')[2],
                            total: bet.title,
                            tyle: bet.value,
                            money: bet.money,
                            result: 0,
                            status: 'process'
                        });
                        const betnew = await newBet.save();
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
                            frommoney: user.balance,
                            money: bet.money,
                            tomoney: user.balance - bet.money,
                            content: '',
                            type: 'TX Three',
                            status: 'Hoàn thành'
                        });
                        await newLogbalance.save();
                    }else if(type == 'Đôi'){
                        const newBet = new Bet({
                            user_id: user._id,
                            phien_id: phien_id,
                            type: 'three',
                            contenttype: type,
                            contenta: bet.title.split('-')[0],
                            contentb: bet.title.split('-')[1],
                            contentc: 0,
                            total: bet.title,
                            tyle: bet.value,
                            money: bet.money,
                            result: 0,
                            status: 'process'
                        });
                        const betnew = await newBet.save();
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
                            frommoney: user.balance,
                            money: bet.money,
                            tomoney: user.balance - bet.money,
                            content: '',
                            type: 'TX Three',
                            status: 'Hoàn thành'
                        });
                        await newLogbalance.save();
                    }else if(type == 'Bất kỳ'){
                        const newBet = new Bet({
                            user_id: user._id,
                            phien_id: phien_id,
                            type: 'one',
                            contenttype: type,
                            contenta: 0,
                            contentb: 0,
                            contentc: 0,
                            total: bet.title,
                            tyle: bet.value,
                            money: bet.money,
                            result: 0,
                            status: 'process'
                        });
                        const betnew = await newBet.save();
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
                            frommoney: user.balance,
                            money: bet.money,
                            tomoney: user.balance - bet.money,
                            content: '',
                            type: 'TX Three',
                            status: 'Hoàn thành'
                        });
                        await newLogbalance.save();
                    }
                };
                res.json({ status: 1, msg: 'Đặt cược thành công' });
            }
        }
    } catch (error) {
        console.log('Error fetching user:', error);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};
// three one


// five one
const getfirstketquafive = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const user = await User.findById(decoded.id).exec();
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        const data = await Fivemin.find()
            .sort({ createdAt: -1 })
            .limit(30); 
        res.json({ data });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
};
const getfirstfivemin = async (req, res) => {
    const data = await Fivemin.findOne().sort({ createdAt: -1 }).exec();
    const bets = await OddsBet.find({  });
    const convertedBets = {
        chinhthuc: {
            tong: [],
            doi: [],
            tamco: []
        },
        codien: {
            tong: [],
            doiben: [],
            doi: [],
            tamco: [],
            batky: []
        }
    };
    bets.forEach(bet => {
        if (bet.type === 'Đôi' && bet.official === 'chinhthuc') {
            convertedBets.chinhthuc.doi.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        } else if (bet.type === 'Tổng' && bet.official === 'chinhthuc') {
            convertedBets.chinhthuc.tong.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        } else if (bet.type === 'Tam cô' && bet.official === 'chinhthuc') {
            convertedBets.chinhthuc.tamco.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        }else if (bet.type === 'Tổng' && bet.official === 'codien') {
            convertedBets.codien.tong.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        }else if (bet.type === 'Đôi' && bet.official === 'codien') {
            convertedBets.codien.doi.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        }else if (bet.type === 'Tam cô' && bet.official === 'codien') {
            convertedBets.codien.tamco.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        }else if (bet.type === 'Đôi bên' && bet.official === 'codien') {
            convertedBets.codien.doiben.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        }else if (bet.type === 'Bất kỳ' && bet.official === 'codien') {
            convertedBets.codien.batky.push({
                title: bet.title,
                value: bet.value,
                type: bet.type
            });
        }
    });
    res.json({ data, bets: convertedBets });
};
const getresultfivemin = async (req, res) => {
    const id = req.params.id;
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const user = await User.findById(decoded.id).exec();
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        await sleep(2000);
        const data = await Fivemin.findOne({ five_phien_id: id });
        res.json({ data });
    } catch (error) {
        console.log(error.message);
    } 
};
const buyfive = async (req, res) => {
    const { cart, phien_id, totalMoney } = req.body;
    console.log(cart)
    console.log(phien_id)
    console.log(totalMoney)
    try {
        const token     = req.headers.authorization.split(' ')[1];
        const decoded   = jwt.verify(token, 'your_jwt_secret');
        const user      = await User.findById(decoded.id).exec();
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        if(!user.enable_bet){
            res.json({ status: 0, msg: 'Tài khoản bị đóng cược !' });
        }else{
            if(totalMoney > user.balance){
                res.json({ status: 0, msg: 'Số dư của quý khách không đủ !' });
            }else{
                user.balance = (user.balance || 0) - totalMoney;
                await user.save();
                for (const bet of cart) {
                    const type = bet.type
                    if(type == 'Tổng' || type == 'Đôi bên'){
                        const newBet = new Bet({
                            user_id: user._id,
                            phien_id: phien_id,
                            type: 'five',
                            contenttype: type,
                            contenta: 0,
                            contentb: 0,
                            contentc: 0,
                            total: bet.title,
                            tyle: bet.value,
                            money: bet.money,
                            result: 0,
                            status: 'process'
                        });
                        const betnew = await newBet.save();
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
                            frommoney: user.balance,
                            money: bet.money,
                            tomoney: user.balance - bet.money,
                            content: '',
                            type: 'TX Three',
                            status: 'Hoàn thành'
                        });
                        await newLogbalance.save();
                    }else if(type == 'Tam cô chung'){
                        const newBet = new Bet({
                            user_id: user._id,
                            phien_id: phien_id,
                            type: 'five',
                            contenttype: type,
                            contenta: 6,
                            contentb: 6,
                            contentc: 6,
                            total: bet.title,
                            tyle: bet.value,
                            money: bet.money,
                            result: 0,
                            status: 'process'
                        });
                        const betnew = await newBet.save();
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
                            frommoney: user.balance,
                            money: bet.money,
                            tomoney: user.balance - bet.money,
                            content: '',
                            type: 'TX Three',
                            status: 'Hoàn thành'
                        });
                        await newLogbalance.save();
                    }else if(type == 'Tam cô'){
                        const newBet = new Bet({
                            user_id: user._id,
                            phien_id: phien_id,
                            type: 'five',
                            contenttype: type,
                            contenta: bet.title.split('-')[0],
                            contentb: bet.title.split('-')[1],
                            contentc: bet.title.split('-')[2],
                            total: bet.title,
                            tyle: bet.value,
                            money: bet.money,
                            result: 0,
                            status: 'process'
                        });
                        const betnew = await newBet.save();
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
                            frommoney: user.balance,
                            money: bet.money,
                            tomoney: user.balance - bet.money,
                            content: '',
                            type: 'TX Three',
                            status: 'Hoàn thành'
                        });
                        await newLogbalance.save();
                    }else if(type == 'Đôi'){
                        const newBet = new Bet({
                            user_id: user._id,
                            phien_id: phien_id,
                            type: 'five',
                            contenttype: type,
                            contenta: bet.title.split('-')[0],
                            contentb: bet.title.split('-')[1],
                            contentc: 0,
                            total: bet.title,
                            tyle: bet.value,
                            money: bet.money,
                            result: 0,
                            status: 'process'
                        });
                        const betnew = await newBet.save();
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
                            frommoney: user.balance,
                            money: bet.money,
                            tomoney: user.balance - bet.money,
                            content: '',
                            type: 'TX Three',
                            status: 'Hoàn thành'
                        });
                        await newLogbalance.save();
                    }else if(type == 'Bất kỳ'){
                        const newBet = new Bet({
                            user_id: user._id,
                            phien_id: phien_id,
                            type: 'one',
                            contenttype: type,
                            contenta: 0,
                            contentb: 0,
                            contentc: 0,
                            total: bet.title,
                            tyle: bet.value,
                            money: bet.money,
                            result: 0,
                            status: 'process'
                        });
                        const betnew = await newBet.save();
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
                            frommoney: user.balance,
                            money: bet.money,
                            tomoney: user.balance - bet.money,
                            content: '',
                            type: 'TX Three',
                            status: 'Hoàn thành'
                        });
                        await newLogbalance.save();
                    }
                };
                res.json({ status: 1, msg: 'Đặt cược thành công' });
            }
        }
    } catch (error) {
        console.log('Error fetching user:', error);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};
// five one




const ruttien = async (req, res) => {
    const { password } = req.body;
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const user = await User.findById(decoded.id).exec();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const data = await User.findOne({ _id: user._id, password_withdraw: password });
        if(data){
            res.json({ status: 1, msg: 'OKE' });
        }else{
            res.json({ status: 0, msg: 'Sai mật khẩu' });
        }
    } catch (error) {
        console.log(error.message);
    } 
};
const addnewbank = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const user = await User.findById(decoded.id).exec();
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        upload(req, res, async function (err) {
            if (err) {
                console.error('Error uploading avatar:', err);
                return;
            }
            const { bank_name, bank_user, bank_number } = req.body;
            const cccd_mt = req.files.cccd_mt ? req.files.cccd_mt[0].path : null;
            const cccd_ms = req.files.cccd_ms ? req.files.cccd_ms[0].path : null;
            const cccd_mt_link = cccd_mt ? `/uploads/avatars/${path.basename(cccd_mt)}` : null;
            const cccd_ms_link = cccd_ms ? `/uploads/avatars/${path.basename(cccd_ms)}` : null;
            const data = await User.findOne({ _id: user._id });
            if (data) {
                data.bank_id        = bank_name
                data.bank_number    = bank_number
                data.bank_user      = bank_user
                data.cmndmt        = cccd_mt_link
                data.cmndms        = cccd_ms_link
                await data.save();
                res.json({ status: 1, msg: 'Thêm ngân hàng thành công' });
            } else {
                res.json({ status: 0, msg: 'Thêm ngân hàng thất bại' });
            }
        });
    } catch (error) {
        console.log(error.message);
    } 
};
const getdynamicbalance = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const user = await User.findById(decoded.id).exec();
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        const data = await Logbalance.find({ user_id: user._id });
        if(data){
            res.json({ status: 1, data });
        }else{
            res.json({ status: 0, data: [] });
        }
    } catch (error) {
        console.log(error.message);
    } 
};
const gethistorydesposit = async (req, res) => {
    try {
        console.log('nap tien')
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const user = await User.findById(decoded.id).exec();
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        const data = await Logbalance.find({ user_id: user._id, type: 'Nạp tiền' });
        if(data){
            res.json({ status: 1, data });
        }else{
            res.json({ status: 0, data: [] });
        }
    } catch (error) {
        console.log(error.message);
    } 
};
const gethistorywithdraw = async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const user = await User.findById(decoded.id).exec();
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        const log = await Logbalance.find({ user_id: user._id, type: 'Rút tiền' });
        if(log){
            res.json({ status: 1, data : log });
        }else{
            res.json({ status: 0, data: [] });
        }
    } catch (error) {
        console.log(error.message);
    } 
};
const changepasswordwithdraw = async (req, res) => {
    const { password_withdraw, password_withdraw_new } = req.body;
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const user = await User.findById(decoded.id).exec();
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        // const log = await User.find({ _id: user._id, password_withdraw: password_withdraw });
        if(user.password_withdraw == password_withdraw){
            user.password_withdraw = password_withdraw_new
            await user.save();
            res.json({ status: 1, msg: 'Đổi mật khẩu thành công' });
        }else{
            res.json({ status: 0, msg: 'Mật khẩu sai' });
        }
    } catch (error) {
        console.log(error.message);
    } 
};
const changepassword = async (req, res) => {
    const { password_withdraw, password_withdraw_new } = req.body;
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const user = await User.findById(decoded.id).exec();
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        const hashedPassword = await bcrypt.hash(password_withdraw, 10);
        if(password_withdraw == password_withdraw_new){
            user.password = hashedPassword
            await user.save();
            res.json({ status: 1, msg: 'Đổi mật khẩu thành công' });
        }else{
            res.json({ status: 0, msg: 'Mật khẩu không trùng nhau' });
        }
    } catch (error) {
        console.log(error.message);
    } 
};
const withdraw = async (req, res) => {
    const { balance } = req.body;
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, 'your_jwt_secret');
        const user = await User.findById(decoded.id).exec();
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        if(user.balance > balance){
            const newLogbalance = new Logbalance({
                user_id: user._id,
                frommoney: user.balance,
                money: balance,
                tomoney: user.balance - balance,
                content: '',
                type: 'Rút tiền',
                status: 'Đang xử lý'
            });
            await newLogbalance.save();
            user.balance = user.balance - balance;
            await user.save();
            res.json({ status: 1, msg: 'Rút tiền thành công' });
        }else{
            res.json({ status: 0, msg: 'Tiền vượt quá mức' });
        }
    } catch (error) {
        console.log(error.message);
    } 
};

const getlinkchat = async (req, res) => {
    try {
        const setting = await Setting.findOne({ name: 'linkchat' });
        res.json({ data: setting?.value });
    } catch (error) {
        console.log(error);
    } 
};
const getlinkkhuyenmai = async (req, res) => {
    try {
        const banner = await Banner.find({});
        res.json({ data: banner });
    } catch (error) {
        console.log(error);
    } 
};



const test = async (req, res) => {
    
    const results = await Onemin.findOne().sort({ createdAt: -1 }).exec();
    if(results?.status == 'set' && results !== null){
        console.log('status 1: ')
        results.status = 'done';
        await results.save();
    }else{
        console.log('results 2: ', results.phien_id + 1)
        const Betresults = await Bet.find({ type: 'one', status: 'process', 'phien_id': results.phien_id + 1 });
        if(Betresults.length > 0){
            console.log('Betresults 3: ')
            const hasBatky  = Betresults.some(bet => bet.contenttype === 'Bất kỳ');
            if (hasBatky) {
                console.log('Có ít nhất một đối tượng có contenttype là "Bất kỳ".');
            }
            const checkTypes = ['Lớn', 'Nhỏ', 'Chẵn', 'Lẻ', 'Lớn Lẻ', 'Lớn Chẵn', 'Nhỏ Lẻ', 'Nhỏ Chẵn'];
            const hasTong   = Betresults.some(bet => bet.contenttype === 'Tổng' && checkTypes.includes(bet.total));
            let valuehasTong = [];
            if (hasTong) {
                valuehasTong = Betresults
                    .filter(bet => bet.contenttype === 'Tổng'  && checkTypes.includes(bet.total))
                    .map(bet => bet.total);
                console.log('Có ít nhất một đối tượng có contenttype là "hasTong".', valuehasTong);
            }
            const checkTypesSo = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18'];
            const hasTongSo = Betresults.some(bet => bet.contenttype === 'Tổng' && checkTypesSo.includes(bet.total)); // 3,4,5,6,7,8,9,10
            let valuehasTongSo = [];
            if (hasTongSo) {
                valuehasTongSo = Betresults
                    .filter(bet => bet.contenttype === 'Tổng' && checkTypesSo.includes(bet.total))
                    .map(bet => bet.total);
                console.log('Có ít nhất một đối tượng có contenttype là "hasTongSo".', valuehasTongSo);
            }
            const hasDoi = Betresults.some(bet => bet.contenttype === 'Đôi');
            let valuehasDoi = null;
            if (hasDoi) {
                console.log('Có ít nhất một đối tượng có contenttype là "Đôi".');
                valuehasDoi = hasDoi[0].total
            } 
            const hasTamco = Betresults.some(bet => bet.contenttype === 'Tam cô');
            if (hasTamco) {
                console.log('Có ít nhất một đối tượng có contenttype là "Tam cô".');
            } 
            function generateCounts(Batky, Doi, valuehasDoi, Tong, valuehasTong, TongSo, valuehasTongSo, hasTamco) {
                const isValid = (a, b, c) => {
                    const sum = a + b + c;
                    let notBig = true;
                    let notSmall = true;
                    let notOddIndividual = true;
                    let notEvenIndividual = true;
                    let notBigEven = true;
                    let notBigOdd = true;
                    let notSmallOdd = true;
                    let notSmallEven = true;
                    // Điều kiện: tổng không lớn
                    if (valuehasTong.includes('Lớn')) {
                        notBig = sum < 11;
                    }
                    // Điều kiện: tổng không nhỏ
                    if (valuehasTong.includes('Nhỏ')) {
                        notSmall = sum > 10;
                    }
                    if (valuehasTong.includes('Lớn') && valuehasTong.includes('Nhỏ')) {
                        notBig = sum < 11;
                        notSmall = true
                    }
                    // Điều kiện: không lẻ
                    if (valuehasTong.includes('Lẻ')) {
                        notOddIndividual = (a % 2 === 0) && (b % 2 === 0) && (c % 2 === 0);
                    }
                    // Điều kiện: không chẵn
                    if (valuehasTong.includes('Chẵn')) {
                        notEvenIndividual = (a % 2 !== 0) && (b % 2 !== 0) && (c % 2 !== 0);
                    }
                    if (valuehasTong.includes('Lẻ') && valuehasTong.includes('Chẵn')) {
                        notOddIndividual = (a % 2 === 0) && (b % 2 === 0) && (c % 2 === 0);
                        notEvenIndividual = true
                    }
                    // Điều kiện: tổng không lớn lẻ
                    if ((valuehasTong.includes('Lớn Lẻ') && valuehasTong.includes('Nhỏ')) || valuehasTong.includes('Lớn Lẻ')) {
                        notBigOdd = (sum < 11) || (sum % 2 === 0);
                    }
                    // Điều kiện: tổng không lớn chẵn 
                    if ((valuehasTong.includes('Lớn Chẵn') && valuehasTong.includes('Nhỏ')) || valuehasTong.includes('Lớn Chẵn')) {
                        notBigEven = (sum < 11) || (sum % 2 !== 0);
                    }
                    // Điều kiện tổng không nhỏ lẻ
                    if ((valuehasTong.includes('Nhỏ Lẻ')  && valuehasTong.includes('Lớn')) || valuehasTong.includes('Nhỏ Lẻ')) {
                        notSmallOdd = ( sum > 10) || (sum % 2 === 0);
                    }
                    // Điều kiện tổng không nhỏ chẵn
                    if ((valuehasTong.includes('Nhỏ Chẵn') && valuehasTong.includes('Lớn')) || valuehasTong.includes('Nhỏ Lẻ')) {
                        notSmallEven = ( sum > 10) || (sum % 2 !== 0);
                    }
                    if(hasTamco && Doi && TongSo){
                        return (a !== b && b !== c ) && (a !== valuehasDoi || !(b === valuehasDoi || c === valuehasDoi)) ((a + b + c) !== valuehasTongSo) &&
                         notBig && notSmall && notOddIndividual && notEvenIndividual && notBigOdd && notBigEven && notSmallOdd &&notSmallEven;
                    }else if(hasTamco && TongSo){
                        return (a !== b && b !== c ) && ((a + b + c) !== valuehasTongSo) && notBig && notSmall && notOddIndividual && notEvenIndividual && notBigOdd && notBigEven && notSmallOdd &&notSmallEven;
                    }else if(hasTamco && Doi){
                        return (a !== b && b !== c ) && (a !== valuehasDoi || !(b === valuehasDoi || c === valuehasDoi)) &&
                         notBig && notSmall && notOddIndividual && notEvenIndividual && notBigOdd && notBigEven && notSmallOdd &&notSmallEven;
                    }else if(hasTamco){
                        return (a !== b && b !== c ) && notBig && notSmall && notOddIndividual && notEvenIndividual && notBigOdd && notBigEven && notSmallOdd &&notSmallEven;
                    }else if(Doi && TongSo){
                        return (a !== valuehasDoi || !(b === valuehasDoi || c === valuehasDoi)) && ((a + b + c) !== valuehasTongSo) 
                        && notBig && notSmall && notOddIndividual && notEvenIndividual && notBigOdd && notBigEven && notSmallOdd &&notSmallEven;
                    }else if(Doi){
                        return (a !== valuehasDoi || !(b === valuehasDoi || c === valuehasDoi)) && notBig && notSmall && notOddIndividual && notEvenIndividual && notBigOdd && notBigEven && notSmallOdd &&notSmallEven;
                    }else if(TongSo){
                        return ((a + b + c) !== valuehasTongSo) && notBig && notSmall && notOddIndividual && notEvenIndividual && notBigOdd && notBigEven && notSmallOdd &&notSmallEven;
                    }else{
                        return notBig && notSmall && notOddIndividual && notEvenIndividual && notBigOdd && notBigEven && notSmallOdd &&notSmallEven;
                    }
                };
                let a, b, c;
                do {
                    a = Math.floor(Math.random() * 6) + 1;
                    b = Math.floor(Math.random() * 6) + 1;
                    c = Math.floor(Math.random() * 6) + 1;
                } while ( !isValid(a, b, c) );
                console.log('a, b, c', a, b, c)
                return { a, b, c };
            }
            const counts = generateCounts(hasBatky, hasDoi, valuehasDoi, hasTong, valuehasTong, hasTongSo, valuehasTongSo, hasTamco);
            const total = parseInt(counts.a) + parseInt(counts.b) + parseInt(counts.c);
            const newOnemin = new Onemin({
                contenta: counts.a,
                contentb: counts.b,
                contentc: counts.c,
                total: total,
                status: 'done'
            });
            await newOnemin.save();
            for (const bet of Betresults) {
                if(bet.contenttype === 'Tam cô'){
                    if(bet.contenta == counts.a && bet.contentb == counts.b && bet.contentc == counts.c){
                        await Bet.updateOne({ _id: bet._id }, { $set: { status: 'win' } });
                        const user          = await User.findById(bet.user_id);
                        const newLogbalance = new Logbalance({
                            user_id: user.user_id,
                            frommoney: user.balance,
                            money: bet.money * bet.tyle,
                            tomoney: user.balance + bet.money * bet.tyle,
                            content: '',
                            type: 'WIN '+bet.type,
                            status: 'Hoàn thành'
                        });
                        await newLogbalance.save();
                        user.balance = user.balance + bet.money * bet.tyle;
                        await user.save();
                    }else{
                        await Bet.updateOne({ _id: bet._id }, { $set: { status: 'done' } });
                    }
                }else if(bet.contenttype === 'Đôi'){
                    if((bet.contenta == counts.a && bet.contentb == counts.b) || (bet.contentb == counts.b && bet.contentc == counts.c)){
                        await Bet.updateOne({ _id: bet._id }, { $set: { status: 'win' } });
                        const user          = await User.findById(bet.user_id);
                        const newLogbalance = new Logbalance({
                            user_id: user.user_id,
                            frommoney: user.balance,
                            money: bet.money * bet.tyle,
                            tomoney: user.balance + bet.money * bet.tyle,
                            content: '',
                            type: 'WIN '+bet.type,
                            status: 'Hoàn thành'
                        });
                        await newLogbalance.save();
                        user.balance = user.balance + bet.money * bet.tyle;
                        await user.save();
                    }else{
                        await Bet.updateOne({ _id: bet._id }, { $set: { status: 'done' } });
                    }
                }else if(bet.contenttype === 'Tổng'){
                    console.log('bet.total 1',bet.total)
                    let listvalue = [];
                    if(total % 2 === 0){
                        listvalue.push('Chẵn')
                    }if(total % 2 !== 0){
                        listvalue.push('Lẻ')
                    }if(total < 11){
                        listvalue.push('Nhỏ')
                    }if(total > 10){
                        listvalue.push('Lớn')
                    }if(total > 10 && total % 2 === 0){
                        listvalue.push('Lớn Chẵn')
                    }if(total > 10 && total % 2 !== 0){
                        listvalue.push('Lớn Lẻ')
                    }if(total < 11 && total % 2 === 0){
                        listvalue.push('Nhỏ Chẵn')
                    }if(total < 11 && total % 2 !== 0){
                        listvalue.push('Nhỏ Lẻ')
                    }
                    listvalue.push(String(total))
                    // console.log('bet.total ',String(total))
                    console.log('listvalue:', listvalue);
                    if(listvalue.includes(bet.total)){
                        console.log(' oke win ')
                        // await Bet.updateOne({ _id: bet._id }, { $set: { status: 'win' } });
                        const user          = await User.findById(bet.user_id);
                        console.log(' user win ', user._id)
                        console.log(' user balance ', user.balance)
                        console.log(' bet.money * bet.tyle ', bet.money * bet.tyle)
                        console.log(' user.balance + bet.money * bet.tyle ', user.balance + bet.money * bet.tyle)
                        console.log(' bet.type ', bet.type)
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
                            frommoney: user.balance,
                            money: bet.money * bet.tyle,
                            tomoney: user.balance + bet.money * bet.tyle,
                            content: '',
                            type: 'WIN ' + bet.type,
                            status: 'Hoàn thành'
                        });
                        await newLogbalance.save();
                        console.log(' newLogbalance win ', newLogbalance)
                        user.balance = user.balance + bet.money * bet.tyle;
                        console.log(' user.balance ', user.balance)
                        await user.save();
                    }else{
                        // await Bet.updateOne({ _id: bet._id }, { $set: { status: 'done' } });
                    }
                }else{
                    await Bet.updateOne({ _id: bet._id }, { $set: { status: 'done' } });
                }
            }            
            // res.json({ counts });
        }else{
            console.log('ko thay phien dat cuoc')
            contenta = getRandomNumber(1, 6)
            contentb = getRandomNumber(1, 6)
            contentc = getRandomNumber(1, 6)
            const total = parseInt(contenta) + parseInt(contentb) + parseInt(contentc);
            const newOnemin = new Onemin({
                contenta: contenta,
                contentb: contentb,
                contentc: contentc,
                total: total,
                status: 'done'
            });
            await newOnemin.save();
        }
    }


}
function getRandomNumbersSamllerodd(min, max, count, minSum) {
    let results = [];
    function generateCombination(current) {
        if (current.length === count) {
            const sum = current.reduce((sum, num) => sum + num, 0);
            if (sum < minSum && sum % 2 !== 0) {
                results.push([...current]);
            }
            return;
        }
        for (let i = min; i <= max; i++) {
            generateCombination([...current, i]);
        }
    }
    generateCombination([]);
    return results;
}
function getRandomNumbersSamllereven(min, max, count, minSum) { // nho chan
    let results = [];
    function generateCombination(current) {
        if (current.length === count) {
            const sum = current.reduce((sum, num) => sum + num, 0);
            if (sum < minSum && sum % 2 === 0) {
                results.push([...current]);
            }
            return;
        }
        for (let i = min; i <= max; i++) {
            generateCombination([...current, i]);
        }
    }
    generateCombination([]);
    return results;
}
function getRandomNumbersbigerodd(min, max, count, minSum) {
    let results = [];
    function generateCombination(current) {
        if (current.length === count) {
            const sum = current.reduce((sum, num) => sum + num, 0);
            if (sum > minSum && sum % 2 !== 0) {
                results.push([...current]);
            }
            return;
        }
        for (let i = min; i <= max; i++) {
            generateCombination([...current, i]);
        }
    }
    generateCombination([]);
    return results;
}
function getRandomNumbersbigereven(min, max, count, minSum) {
    let results = [];
    function generateCombination(current) {
        if (current.length === count) {
            const sum = current.reduce((sum, num) => sum + num, 0);
            if (sum > minSum && sum % 2 === 0) {
                results.push([...current]);
            }
            return;
        }
        for (let i = min; i <= max; i++) {
            generateCombination([...current, i]);
        }
    }
    generateCombination([]);
    return results;
}
function getRandomOddSumNumbers(min, max, count) {
    let results = [];
    function generateCombination(current) {
        if (current.length === count) {
            if (current.reduce((sum, num) => sum + num, 0) % 2 !== 0) {
                results.push([...current]);
            }
            return;
        }
        for (let i = min; i <= max; i++) {
            generateCombination([...current, i]);
        }
    }
    generateCombination([]);
    return results;
}
function getRandomEvenSumNumbers(min, max, count) {
    let results = [];
    function generateCombination(current) {
        if (current.length === count) {
            const sum = current.reduce((acc, num) => acc + num, 0);
            if (sum % 2 === 0) {
                results.push([...current]);
            }
            return;
        }
        for (let i = min; i <= max; i++) {
            generateCombination([...current, i]);
        }
    }
    generateCombination([]);
    return results;
}
function getRandomNumbersUnderLimit(min, max, count, maxSum) { // nho hon
    let results = [];
    function generateCombination(current) {
        if (current.length === count) {
            if (current.reduce((sum, num) => sum + num, 0) < maxSum) {
                results.push([...current]);
            }
            return;
        }
        for (let i = min; i <= max; i++) {
            generateCombination([...current, i]);
        }
    }
    generateCombination([]);
    return results;
}
function getRandomNumbersbigger(min, max, count, maxSum) {
    let results = [];
    function generateCombination(current) {
        if (current.length === count) {
            if (current.reduce((sum, num) => sum + num, 0) > maxSum) {
                results.push([...current]);
            }
            return;
        }
        for (let i = min; i <= max; i++) {
            generateCombination([...current, i]);
        }
    }
    generateCombination([]);
    return results;
}
function getRandomNumbers(min, max, count, excludeSum) {
    const validCombinations = [];
    function generateCombinations(start, currentCombination) {
        if (currentCombination.length === count) {
            const sum = currentCombination.reduce((a, b) => a + b, 0);
            if (sum >= 3 && sum <= 18 && sum !== excludeSum) {
                validCombinations.push(currentCombination.slice());
            }
            return;
        }
        for (let i = start; i <= max; i++) {
            if (currentCombination.includes(i)) continue; // Ensure numbers are distinct
            generateCombinations(i + 1, [...currentCombination, i]);
        }
    }
    generateCombinations(min, []);
    const randomIndex = Math.floor(Math.random() * validCombinations.length);
    return validCombinations[randomIndex];
}
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function sortCountsByValue(countObject) {
    const countArray = Object.entries(countObject);
    const allValuesEqual = countArray.every(([key, value]) => value === countArray[0][1]);
    if (allValuesEqual) {
        const randomIndex = Math.floor(Math.random() * countArray.length);
        return countArray[randomIndex][0];
    } else {
        countArray.sort((a, b) => a[1] - b[1]);
        return countArray[0][0];
    }
    // countArray.sort((a, b) => a[1] - b[1]);
    // const firstElement = countArray[0][0];
    // return firstElement;
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './public/uploads/avatars';
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
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only .png, .jpg, and .jpeg formats are allowed!'), false);
    }
};
const upload = multer({ storage: storage, fileFilter: fileFilter }).fields([
    { name: 'cccd_mt', maxCount: 1 },
    { name: 'cccd_ms', maxCount: 1 },
]);

module.exports = {
    test,
    user,
    register,
    login,
    logout,
    getresultonemin,
    getfirstonemin,
    getfirstketquaone,
    gethistorybetuser,
    buyone,
    getfirstketquathree,
    getfirstthreemin,
    getresultthreemin,
    buythree,
    getfirstketquafive,
    getfirstfivemin,
    getresultfivemin,
    buyfive,
    ruttien,
    addnewbank,
    getdynamicbalance,
    gethistorydesposit,
    gethistorywithdraw,
    changepasswordwithdraw,
    changepassword,
    withdraw,
    getlinkchat,
    getlinkkhuyenmai
};