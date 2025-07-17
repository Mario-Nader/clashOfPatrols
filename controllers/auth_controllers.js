const Scout = require('../modules/scout_module');
const Patrol = require('../modules/patrol_module')
const Asset = require('../modules/assets_module')
// const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require("dotenv").config();

async function closedRejection(req,res,next){
    let closed = await Asset.findOne({asset : "closed"}).exec()
    if(closed.cost === 1){
        return res.status(400).send({message:"the game is closed now"})
    }else{
        next()
    }
}

async function close(req,res){
    let closed = await Asset.findOne({asset:"closed"}).exec()
    let message = ""
    if(closed.cost === 1){
        closed.cost = 0
        message = "the game is opned successfully"
    }else{
        closed.cost = 1
        message = "the game is closed successfully"
    }
    await closed.save()
    return res.status(200).send({"message":message})
}


function createToken(id,patrol){
    return jwt.sign({id,patrol},process.env.secretTokenString,{
        expiresIn: 24*60*60*30
    })
}

async function  signup(req,res){
    let {name,password,cp,patrol} = req.body;
    try{
        let pat = await Patrol.findOne({name:patrol})
        // console.log(pat.name)
        if(!pat){
            return res.status(400).send({message:"this patrol doesn't exist"})
        }
        const scout = new Scout({
            name,
            password,
            cp,
            "patrol":pat._id,
        });
        // console.log(scout.name)
        token = createToken(scout._id,pat.name);
        res.cookie('token',token,{httpOnly:true, maxAge:24*60*60*1000*30});
        await scout.save();
        // console.log("the user is saved")
        res.status(201).json({
            "success": true,
            "message": "user registered successfully"
          });
    }catch(err){
        console.log(err)
        if(err.errorResponse.code == 11000){
            return res.status(400).send({message:"this username is already registered"})
        }else{
        return res.status(500).json({success:false,message:"couldn't create the user"});
        }
    }
}

async function login(req,res){
    let {name,password} = req.body;
    console.log(name)
    // console.log("Request body:", req.body);
    try{
const scout = await Scout.findOne({ name: new RegExp(`^${name}$`, 'i') }).exec();
// console.log("Scout found:", scout); for logging only
        if(scout){
                if(scout.password == password){
                    let rank = 0
                    if(scout.cp == true){
                        rank = 2
                    }else{
                        let patrol = await Patrol.findById(scout.patrol).exec()
                        if(patrol.name == "kadr"){
                            rank = 3
                        }else{
                            rank = 1
                        }
                    }
                    let pat = await Patrol.findOne({_id : scout.patrol}) 
                    token = createToken(scout._id ,pat.name)
                    res.cookie("token",token,{httpOnly:true,maxAge:30*24*60*60*1000})
                    res.status(200).json({"success":true,"user":{"username":scout.name,"rank":rank}})
                }
                else{
                    res.status(400).json({"success":false,"msg":"the password is incorrect"});
                }
        }else{
            res.status(400).json({"success":false,"msg":"the user is not registred please create an accound first"})
        }
    }catch(err){
        console.log(err);
        res.status(500).json({success:false,message:"couldn't login"});
    }
}

function authenMid(req,res,next){
    const token = req.cookies.token;
    if(token){
        jwt.verify(token,process.env.secretTokenString,(err,decodedToken)=>{
            if(err){
                return res.status(400).json({"msg":"you must be loged in to enter this page"})
            }else{
                next()
            }
        })
        
    }else{
        return res.status(400).json({"msg":"you must be loged in to enter this page"})
    }
}

async function verifyUser(req,res,next){
    token = req.cookies.token;
    let id = 0;
    let patrol
    if(!token){
       return res.status(401).json({"msg":"unauthorized access"});
    }else{
        jwt.verify(token,process.env.secretTokenString,(err,decodedToken)=>{
            if(err){
                console.log(err.message);
                return res.status(401).json({"msg":"unauthorized access"});
            }else{
                 id = decodedToken.id;
                 patrol = decodedToken.patrol
            }
        })
    }
    const scout = await Scout.findById(id);
    if(!scout){
       return res.status(404).json({"msg":"user not found"})
    }else{
        req.id = id;
        req.patrol = patrol;
        next();
    }
}

function logout(req,res){
    try{
    res.cookie('token',"",{httpOnly:true, maxAge:1});
    res.status(204).json({
        "success": true,
        "message": "User signed out successfully"
      })
    }catch(err){
        console.log(err);
    }
}

async function CPvalidation(req,res,next){
    let user = await Scout.findOne({_id : req.id}).exec()
    if(user.cp){
        next()
    }else{
        return res.status(403).send({message:"must be a cp to enter"})
    }
}

async function chefValidation (req,res,next){
    try{
    let user = await Scout.findOne({_id : req.id}).exec()
    let pat = await Patrol.findOne({_id: user.patrol}).exec()
    if(!user || ! pat){
        return res.status(400).send({message:"error in retreaving the patrol or user in chef validation"})
    }
    if(pat.name === "kadr"){
        return next()
    }else{
        return res.status(403).send({message:"must be a chef to enter"})
    }
}catch(err){
    return res.status(500).send({message:"error in chef validation function"})
}
}


module.exports = {signup,login,authenMid,verifyUser,logout,CPvalidation,chefValidation,closedRejection,close}