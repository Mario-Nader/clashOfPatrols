const Land = require("../modules/Land_module")
const Patrol = require("../modules/patrol_module")
const Asset = require("../modules/assets_module")
const Scout = require("../modules/scout_module")


//land doesn't belong to the patrol in give , trad , take 


async function view_scores(req,res){
  let  patrols = await Patrol.find({"name":{$ne:"kadr"}}).exec();
  return patrols
}


async function update_scores(req,res){
  let user = await Scout.findById(req.id).exec()
  if(user){
  if((await Patrol.findById(user.patrol).exec()).name == "kadr"){
    let pats = await Patrol.find({name:{$ne :"kadr"}},{_id:1,name:1,coins:1}).exec()
    let points = req.body
    for (let pat of pats) {
      if (points.hasOwnProperty(pat.name)) {
        pat.coins += points[pat.name]; // safely add points
      }
    }
    await Promise.all(pats.map(pat =>pat.save()))
    return res.status(200).send({message:"the scores were updated successfully"})
  }else{
    return res.status(401).send({message:"must be a chef to update score"})
  }
}else{
  return res.status(403).send({message:"must be logged in to do this action"})
}
}


async function getharvest(req,res){
  try{
  let patrol = await Patrol.find({"name":{$ne:"kadr"}},{
    name:1,
    "soils.apple":1,
    "soils.watermelon":1,
    "soils.wheat":1,
    farming:1,
    _id:0
  }).exec()
  let pats = patrol.reduce((acc,p)=>{
    if(p.farming){
    acc[p.name]={
      "watermelon":p.soils.watermelon,
      "apple":p.soils.apple,
      "wheat":p.soils.wheat
    };
  }else{
    acc[p.name] = {
      "watermelon":0,
      "apple":0,
      "wheat":0
    }
  }
    return acc;
  },{})
  return res.status(200).send({"patrols":pats})
}catch(err){
  console.log(err)
  return res.status(500).send({message:"error in getting harverst data please try again later"})
}
}


async function watering(req,res){
  let farmingAsset = await Asset.findOne({asset : "farming" }).exec()
  let pat = req.body.patrol
  let patrol = await Patrol.findOne({name:pat},{_id:1,farming:1,coins:1}).exec()
  if(patrol){
  if(patrol.farming){
    return res.status(400).send({message:"this patrol has already watered their plants"})
  }else{
    if(patrol.coins < farmingAsset.cost){
      return res.status(400).send({message:"not enough balance for watering"})
    }else{
    patrol.farming = true
    patrol.coins -= farmingAsset.cost
    await patrol.save()
    return res.status(200).send({message:"the plants were watered successfully"})
    }
  }
}else{
  return res.status(400).send({message:"this patrol doesn't exist"})
}
}


async function harvest(req, res) {
  try{
  let farmings = await Patrol.find({name:{$ne : "kadr"}},{
    _id:1,
    farming:1
  }).exec()
  let kadrID = await Patrol.find({name : "kadr"},{_id:1}).exec()
  let pats = farmings.reduce((acc,pat)=>{
    acc[pat._id] = pat.farming
    return acc
  },{})
  let landArr  = await Land.find({patrol_ID : {$ne : kadrID._id}})//reduce the number of lands by excluding the leaders' lands
  landArr.forEach((element)=>{
    if(pats[element.patrol_ID]){
      element.inventory.apple += element.soils.apple
      element.inventory.watermelon += element.soils.watermelon
      element.inventory.wheat += element.soils.wheat
    }
  })
  let chuncksize = 10 //this is chunck size saves to reduce the risk of overloading the connections with the databases
  for(let i = 0; i < landArr.length; i += chuncksize){
    let chunck = landArr.slice(i , i + chuncksize)
    await Promise.all(chunck.map(land => land.save()))
  }
  farmings.forEach((element) => {element.farming = false})
  await Promise.all(farmings.map(pat => pat.save()))
  return res.status(200).send({message:"harvest done successfully"})
}
catch(err){
    console.log(err)
    return res.status(500).send({message:"error in harvesting please try again later"})
  }
}


async function give(req,res){
  let {patrol,quantity,type,landNumber} = req.body
  // let assetType = await Asset.findOne({asset:type}).exec()
  //may be removed in the future and replaced by type for further optmization
  let pat = await Patrol.findOne({name : patrol}).exec()
  if(landNumber !== 0){ //if the asset is land specific
  if(landNumber > 33 || landNumber < 1){
    return res.status(400).send({message:"the land number is invalid",success:false})
  }
  let land = await Land.findOne({land_no : landNumber}).exec()
  if(! land.patrol_ID.equals(pat._id)){
    return res.status(400).send({
      message:`this land doesn't belong to the ${pat.name}`
      ,success:false
    })
  }
  if(type === "soldier"){
    land.soldiers += quantity
    pat.tot_sol += quantity
  }else{
    land.inventory[type] += quantity
    pat[type] += quantity
  }
  await land.save()
}else{
  pat[type] += quantity
}
await pat.save()
return res.status(200).send({success:true})
}


async function take(req,res){//the patrol must have the land(must be handled)
  let {patrol,quantity,type,landNumber} = req.body
  // let assetType = await Asset.findOne({asset:type}).exec()//may be removed in the future and replaced by type for further optmization
  let pat = await Patrol.findOne({name : patrol}).exec()
  if(landNumber !== 0){ //if the asset is land specific
  if(landNumber > 33 || landNumber < 1){
    return res.status(400).send({message:"the land number is invalid",success:false})
  }
  let land = await Land.findOne({land_no : landNumber}).exec()
  if(! land.patrol_ID.equals(pat._id)){
    return res.status(400).send({
      message:`this land doesn't belong to the ${pat.name}`,
      success:false
    })
  }
  if(type === "soldier"){
    if(land.soldiers >= quantity){
    land.soldiers -= quantity
    pat.tot_sol -= quantity
    }else{
      return res.status(400).send({
        message:`the ${pat.name} doesn't have this much resources`,success:false
      })
    }
  }else{
    if(land.inventory[type] >= quantity){
    land.inventory[type] -= quantity
    pat[type] -= quantity
    }else{
      return res.status(400).send({
        message:`the ${pat.name} doesn't have this much resources`,
        success:false
      })
    }
  }
  await land.save()
}else{
  pat[type] -= quantity
}
await pat.save()
return res.status(200).send({success:true})
}


async function giveHelper(pat,quantity,type,land,landNumber){
  //  let assetType = await Asset.findOne({asset:type}).exec()
   //may be removed in the future and replaced by type for further optmization
  // let pat = await Patrol.findOne({name : patrol}).exec()
  if(landNumber !== 0){ //if the asset is land specific
  // let land = await Land.findOne({land_no : landNumber}).exec()
  if(! land.patrol_ID.equals(pat._id)){
    throw {code:400,message:`the land doesn't belong to the ${pat.name}`}
  }
  if(type === "soldier"){
    land.soldiers += quantity
    pat.tot_sol += quantity
  }else{
    land.inventory[type] += quantity
    pat[type] += quantity
  }
  // await land.save()
}else{
  pat[type] += quantity
}
// await pat.save()
return {code:200 , message:"success"}
} 


async function takeHelper(pat,quantity,type,land,landNumber){// no fetching insiede
  // let assetType = await Asset.findOne({asset:type}).exec() testing the removal and replacing with type
  //may be removed in the future and replaced by type for further optmization
  console.log("taking from land number :" + landNumber)
  console.log("the patrol : "+ pat.name)
  // land = await Land.findOne({land_no : landNumber}).exec()
  console.log("taking from land : " + land.inventory.apple)
  if(landNumber !== 0){ //if the asset is land specific
  if(! land.patrol_ID.equals(pat._id)){
    console.log("the land's patrol id" + land.patrol_ID)
    console.log("the patrol id " + pat._id)
    throw {code:400, message:`this land doesn't belong to the ${pat.name}`}
  }
  if(type === "soldier"){
    if(land.soldiers >= quantity){
      console.log("land.soldiers >= quantity" + !!(land.soldiers >= quantity))
    land.soldiers -= quantity
    pat.tot_sol -= quantity
    }else{
      console.log("land.soldiers" + land.soldiers + "quality" + quantity)
      console.log(" land.soldiers >= quantity : " + !!(land.soldiers >= quantity))
      throw {code:400, message:`the ${pat.name} doesn't have this much soldiers`}
    }
  }else{
    if(land.inventory[type] >= quantity){
    console.log(`land.inventory ${type} : ` + !!(land.inventory[type] >= quantity))  
    land.inventory[type] -= quantity
    pat[type] -= quantity
    }else{
        console.log(`land.inventory ${type} : ` + !!(land.inventory[type] >= quantity))
        console.log("the exsisting " + land.inventory[type] + " quantity : " + quantity)
       throw {code:400, message:`the ${pat.name} doesn't have this much resources`}
    }
  }
  // await land.save()
}else{
  pat[type] -= quantity
}
// await pat.save()
return
}


function between(upper , lower , number){
  if(number >= lower && number <= upper){
    return true
  }else{
    return false
  }
}


async function trade(req,res){
  let {patrol1,patrol2,quantity1,quantity2,type1,type2,SLand1,SLand2,DLand1,DLand2} = req.body
  console.log("the request body " + patrol1 + " " + patrol2 + " " + quantity1 + " " +quantity2 + " " + type1 + " " + type2 + " " +SLand1 + " " + SLand2 + " "+ DLand1 + " " + DLand2)
  console.log(typeof(SLand1) + " " +typeof(SLand2) + " " + typeof(DLand1)+ " " + typeof(DLand2))
  if(patrol1 === patrol2){
    return res.status(400).send({message:"the two patrols are the same",success:false})
  }
  if(! between(33,0,SLand1) || ! between(33,0,DLand1) || ! between(33,0,DLand2) || ! between(33,0,SLand2) ){
    return res.status(400).send({message:"A land number is not valid",success:false})
  }else{
    let tempLand
    let srcLand1 //patrol 1 gives from
    let srcLand2  // patrol 2 gives from
    let distLand1  // patrol 1 receives in
    let distLand2 // patrol 2 recieves in

    if(SLand1 === DLand1 && SLand1 !== 0 ){// to decrease the number of database times of access if possible
      tempLand = await Land.findOne({land_no : SLand1})
      srcLand1 = tempLand
      distLand1 = tempLand
    }else{
      if(SLand1 !== 0){
      srcLand1 = await Land.findOne({land_no : SLand1}).exec()
    }if(DLand1 !== 0){
      distLand1 = await Land.findOne({land_no : DLand1}).exec() 
    }
    }

    if(SLand2 === DLand2 && SLand2 !== 0){// to decrease the number of database times of access if possible
      tempLand = await Land.findOne({land_no : SLand2})
      srcLand2 = tempLand
      distLand2 = tempLand
    }else{
      if(SLand2 !== 0){
      srcLand2 = await Land.findOne({land_no : SLand2}).exec()
      }if(DLand2 !== 0){
      distLand2 = await Land.findOne({land_no : DLand2}).exec() 
      }
    }

  let pat1 = await Patrol.findOne({name:patrol1}).exec()
  let pat2 = await Patrol.findOne({name:patrol2}).exec()

  //the fetching of the data into doc objects are done before calling the helpers not in them
  //as the objects are passed by refrence so the functions would change the original document
  // (pat,quantity,type,land,landNumber)
  try{
  await takeHelper(pat1,quantity1,type1,srcLand1,SLand1)
  await takeHelper(pat2,quantity2,type2,srcLand2,SLand2)
  await giveHelper(pat2,quantity1,type1,distLand2,DLand2)
  await giveHelper(pat1,quantity2,type2,distLand1,DLand1)

  if(SLand1 === DLand1 && SLand1 !== 0){
    await srcLand1.save()
  }else{
    if(SLand1 !== 0){
    await srcLand1.save()
    }if(DLand1 !== 0){
    await distLand1.save()
    }
  }
  if(SLand2 === DLand2 && SLand2 !== 0){
    await srcLand2.save()
  }else{
    if(SLand2 !== 0){
    await srcLand2.save()
    }if(DLand2 !== 0){
    await distLand2.save()
    }
  }
  await pat1.save()
  await pat2.save()
  return res.status(200).send({message :"trade successfully",success:true})
  }catch(err){
    console.log(err)
    return res.status(err.code).send({
      message:err.message,
      success:false
    })
  }

  }
}


async function getGDP(req,res){
  try{
  let patrols = await Patrol.find({name : {$ne : "kadr"}}, {_id: 1 , fed : 1 , name:1}).exec()
  patrols.forEach((element,index,arr) => {
    element.gdp = element.fed * 25 //as every house contribute by 25 coins in case it was fed
  })
 let pats = patrols.reduce((acc,curr)=> {
  acc[curr.name] = curr.gdp
  return acc
  },{})
  return res.status(200).send({message:"GDP data is fetched successfully","patrols" : pats})
}catch(err){
  console.log(err.message)
  return res.status(500).send({message:"error happened in the getGDP"})
}
}


async function addGDP(req,res){
  try{
    let patrols = await Patrol.find({name : {$ne : "kadr"}}, {_id: 1 , fed : 1 , name:1,coins:1}).exec()
    patrols.forEach((element)=>{
      element.coins += element.fed * 25
      element.fed = 0
    })
    await Promise.all(patrols.map( (patrol)=> patrol.save()))// six patrols don't need batching technique but if for some reason more patrols were to be added batching technique will be needed
    return res.status(200).send({message:"the GDP was added successfully"})
}catch(err){
    return res.status(500).send({message:"error in the addGDP function"})
}
}


async function attackCondition(req,res){
  try{
    let kadr = await Patrol.findOne({name:"kadr"}).exec()
    let {soldiers,houses,lands,coins,inLandSoldiers,landNo} = req.body
    if(landNo < 1 || landNo > 33 || landNo === undefined){
      return res.status(400).send({message:"invalid landNO"})
    }
    let land = await Land.findOne({land_no : landNo}).exec()
    land.soldiers = inLandSoldiers
    kadr.tot_sol += inLandSoldiers
    land.conditions = {soldiers,houses,lands,coins,inLandSoldiers}
    await land.save()
    await kadr.save()
    return res.status(200).send({message:"the conditions were set successfully"})
  }catch(err){
    console.log(err.message)
    return res.status(500).send({message:"error in the attack condtitions functions"})
  }

}


module.exports = {view_scores,getharvest,harvest,watering,update_scores,give,take,trade,getGDP,addGDP,attackCondition}