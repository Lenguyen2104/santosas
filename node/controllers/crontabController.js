const mongoose = require('mongoose');
const cron = require('node-cron');
const User = require('../models/userModel');
const Onemin = require('../models/oneminModel');
const Threemin = require('../models/threeminModel');
const Fivemin = require('../models/fiveminModel');
const Bet       = require('../models/betModel');
const Logbalance= require('../models/logbalance');

cron.schedule('* * * * *', async () => {
    console.log('Running a task every 1 minutes');
    const results = await Onemin.findOne().sort({ createdAt: -1 }).exec();
    if(results?.status == 'set' && results !== null){
        console.log('status 1: ')
        results.status = 'done';
        await results.save();
    }else{
        console.log('results 2: ', results.phien_id + 1)
        const Betresults = await Bet.find({ type: 'one', status: 'process', 'phien_id': results.phien_id + 1 });
        if(Betresults.length > 0){
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
            for (const bet of Betresults) {
                if(bet.contenttype === 'Tam cô'){
                    if(bet.contenta == contenta && bet.contentb == contentb && bet.contentc == contentc){
                        await Bet.updateOne({ _id: bet._id }, { $set: { status: 'win' } });
                        const user          = await User.findById(bet.user_id);
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
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
                    if((bet.contenta == contenta && bet.contentb == contentb) || (bet.contentb == contentb && bet.contentc == contentc)){
                        await Bet.updateOne({ _id: bet._id }, { $set: { status: 'win' } });
                        const user          = await User.findById(bet.user_id);
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
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
                        await Bet.updateOne({ _id: bet._id }, { $set: { status: 'win' } });
                        const user          = await User.findById(bet.user_id);
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
                        user.balance = user.balance + bet.money * bet.tyle;
                        await user.save();
                    }else{
                        await Bet.updateOne({ _id: bet._id }, { $set: { status: 'done' } });
                    }
                }else{
                    await Bet.updateOne({ _id: bet._id }, { $set: { status: 'done' } });
                }
            }            
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
});
cron.schedule('*/3 * * * *', async () => {
    console.log('Running a task every 3 minutes');
    const results = await Threemin.findOne().sort({ createdAt: -1 }).exec();
    if(results?.status == 'set' && results !== null){
        console.log('status 1: ')
        results.status = 'done';
        await results.save();
    }else{
        console.log('results 2: ', results.three_phien_id +1 )
        const Betresults = await Bet.find({ type: 'three', status: 'process', 'phien_id': results.three_phien_id + 1 });
        if(Betresults.length > 0){
            console.log('Betresults 3: ')
            contenta = getRandomNumber(1, 6)
            contentb = getRandomNumber(1, 6)
            contentc = getRandomNumber(1, 6)
            const total = parseInt(contenta) + parseInt(contentb) + parseInt(contentc);
            const newThreemin = new Threemin({
                contenta: contenta,
                contentb: contentb,
                contentc: contentc,
                total: total,
                status: 'done'
            });
            await newThreemin.save();
            for (const bet of Betresults) {
                if(bet.contenttype === 'Tam cô'){
                    if(bet.contenta == contenta && bet.contentb == contentb && bet.contentc == contentc){
                        await Bet.updateOne({ _id: bet._id }, { $set: { status: 'win' } });
                        const user          = await User.findById(bet.user_id);
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
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
                    if((bet.contenta == contenta && bet.contentb == contentb) || (bet.contentb == contentb && bet.contentc == contentc)){
                        await Bet.updateOne({ _id: bet._id }, { $set: { status: 'win' } });
                        const user          = await User.findById(bet.user_id);
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
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
                    console.log('bet.total ',bet.total)
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
                    console.log('bet.total ',String(total))
                    console.log('listvalue:', listvalue);
                    if(listvalue.includes(bet.total)){
                        await Bet.updateOne({ _id: bet._id }, { $set: { status: 'win' } });
                        const user          = await User.findById(bet.user_id);
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
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
                }else{
                    await Bet.updateOne({ _id: bet._id }, { $set: { status: 'done' } });
                }
            }
        }else{
            console.log('ko thay phien dat cuoc')
            contenta = getRandomNumber(1, 6)
            contentb = getRandomNumber(1, 6)
            contentc = getRandomNumber(1, 6)
            const total = parseInt(contenta) + parseInt(contentb) + parseInt(contentc);
            const newThreemin = new Threemin({
                contenta: contenta,
                contentb: contentb,
                contentc: contentc,
                total: total,
                status: 'done'
            });
            await newThreemin.save();
        }
    }
});

cron.schedule('*/5 * * * *', async () => {
    console.log('Running a task every 5 minutes');
    const results = await Fivemin.findOne().sort({ createdAt: -1 }).exec();
    if(results?.status == 'set' && results !== null){
        console.log('status 1: ')
        results.status = 'done';
        await results.save();
    }else{
        console.log('results 2: ', results.five_phien_id + 1)
        const Betresults = await Bet.find({ type: 'five', status: 'process', 'phien_id': results.five_phien_id + 1});
        if(Betresults.length > 0){
            console.log('Betresults 5: ')
            contenta = getRandomNumber(1, 6)
            contentb = getRandomNumber(1, 6)
            contentc = getRandomNumber(1, 6)
            const total = parseInt(contenta) + parseInt(contentb) + parseInt(contentc);
            const newFivemin = new Fivemin({
                contenta: contenta,
                contentb: contentb,
                contentc: contentc,
                total: total,
                status: 'done'
            });
            await newFivemin.save();
            for (const bet of Betresults) {
                if(bet.contenttype === 'Tam cô'){
                    if(bet.contenta == contenta && bet.contentb == contentb && bet.contentc == contentc){
                        await Bet.updateOne({ _id: bet._id }, { $set: { status: 'win' } });
                        const user          = await User.findById(bet.user_id);
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
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
                    if((bet.contenta == contenta && bet.contentb == contentb) || (bet.contentb == contentb && bet.contentc == contentc)){
                        await Bet.updateOne({ _id: bet._id }, { $set: { status: 'win' } });
                        const user          = await User.findById(bet.user_id);
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
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
                    console.log('bet.total ',bet.total)
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
                    console.log('bet.total ',String(total))
                    console.log('listvalue:', listvalue);
                    if(listvalue.includes(bet.total)){
                        await Bet.updateOne({ _id: bet._id }, { $set: { status: 'win' } });
                        const user          = await User.findById(bet.user_id);
                        const newLogbalance = new Logbalance({
                            user_id: user._id,
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
                }else{
                    await Bet.updateOne({ _id: bet._id }, { $set: { status: 'done' } });
                }
            }
        }else{
            console.log('ko thay phien dat cuoc')
            contenta = getRandomNumber(1, 6)
            contentb = getRandomNumber(1, 6)
            contentc = getRandomNumber(1, 6)
            const total = parseInt(contenta) + parseInt(contentb) + parseInt(contentc);
            const newFivemin = new Fivemin({
                contenta: contenta,
                contentb: contentb,
                contentc: contentc,
                total: total,
                status: 'done'
            });
            await newFivemin.save();
        }
    }
});

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
function getRandomNumbersSamllereven(min, max, count, minSum) {
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

