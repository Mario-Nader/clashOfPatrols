const Land = require("../modules/Land_module")
const Patrol = require("../modules/patrol_module")
const Asset = require("../modules/assets_module")
const Scout = require("../modules/scout_module")


// In your backend controller file (e.g., cp_controller.js)
async function getPatrol(req, res) {
  try {
      // Assuming req.patrol holds the name to search (e.g., "lion")
      let patrolName = req.patrol; 

      // Find the patrol(s). This returns an array of Mongoose documents.
      let patrol = await Patrol.findOne({ name: patrolName }).exec();

      // Assuming you're fetching data for a single patrol.
      // If multiple patrols can match, you might need to iterate or select based on other criteria.
      const patrolDataFromDb = patrol; // Get the first patrol object from the array

      // Calculate GDP for the individual patrol object.
      // Ensure 'fed' property exists on your Patrol model.
      // Also, access values correctly from the Mongoose object (e.g., patrolDataFromDb.fed)
      // Adjust for MongoDB's $numberInt structure if necessary (e.g., patrolDataFromDb.fed.$numberInt)
      // Based on your previous JSON example, simple dot notation should work for direct fields after parsing.
      const fedValue = patrolDataFromDb.fed !== undefined ? patrolDataFromDb.fed : 0;
      const calculatedGdp = fedValue * 25; 

      // Construct the response data as an array of strings,
      // matching the "key: value" format your frontend's getValue expects.
      // Use default values (e.g., 0) for numbers or empty strings for text if they might be missing.
      const responsePatrolData = [
          `total soldiers: ${patrolDataFromDb.tot_sol !== undefined ? patrolDataFromDb.tot_sol : 0}`,
          `total houses: ${patrolDataFromDb.tot_houses !== undefined ? patrolDataFromDb.tot_houses : 0}`,
          `total workshops: ${patrolDataFromDb.tot_workshops !== undefined ? patrolDataFromDb.tot_workshops : 0}`,
          `total carts: ${patrolDataFromDb.tot_carts !== undefined ? patrolDataFromDb.tot_carts : 0}`,
          `total horses: ${patrolDataFromDb.tot_horses !== undefined ? patrolDataFromDb.tot_horses : 0}`,
          `rent horses: ${patrolDataFromDb.rentHorse !== undefined ? patrolDataFromDb.rentHorse : 0}`,
          `rent carts: ${patrolDataFromDb.rentCart !== undefined ? patrolDataFromDb.rentCart : 0}`,
          `total coins: ${patrolDataFromDb.coins !== undefined ? patrolDataFromDb.coins : 0}`,
          `total lands: ${patrolDataFromDb.tot_lands !== undefined ? patrolDataFromDb.tot_lands : 0}`,
          `gdp: ${calculatedGdp}`, // Use the calculated GDP
          `wheat seeds: ${patrolDataFromDb.wheatSeeds !== undefined ? patrolDataFromDb.wheatSeeds : 0}`,
          `apple seeds: ${patrolDataFromDb.appleSeeds !== undefined ? patrolDataFromDb.appleSeeds : 0}`,
          `watermelon seeds: ${patrolDataFromDb.watermelonSeeds !== undefined ? patrolDataFromDb.watermelonSeeds : 0}`,
          `wheat: ${patrolDataFromDb.wheat !== undefined ? patrolDataFromDb.wheat : 0}`,
          `apple: ${patrolDataFromDb.apple !== undefined ? patrolDataFromDb.apple : 0}`,
          `watermelon: ${patrolDataFromDb.watermelon !== undefined ? patrolDataFromDb.watermelon : 0}`,
          `total soil: ${patrolDataFromDb.tot_soil !== undefined ? patrolDataFromDb.tot_soil : 0}`,
          `wheat soil: ${patrolDataFromDb.soils && patrolDataFromDb.soils.wheat !== undefined ? patrolDataFromDb.soils.wheat : 0}`,
          `apple soil: ${patrolDataFromDb.soils && patrolDataFromDb.soils.apple !== undefined ? patrolDataFromDb.soils.apple : 0}`,
          `watermelon soil: ${patrolDataFromDb.soils && patrolDataFromDb.soils.watermelon !== undefined ? patrolDataFromDb.soils.watermelon : 0}`,
          `empty soil: ${patrolDataFromDb.soils && patrolDataFromDb.soils.empty !== undefined ? patrolDataFromDb.soils.empty : 0}`
      ];

      return res.status(200).send({ "message": "fetch done successfully", "patrol": responsePatrolData });

  } catch (err) {
      console.error("Error in getPatrol:", err.message); // Use console.error for better logging
      return res.status(500).send({ message: "An error occurred while fetching patrol data." });
  }
}

async function buy(req,res){//need to add comment here
  console.log(req.body.landNo)
  const landNumber = parseInt(req.body.landNo)
  console.log(landNumber)
  let land = null
  let user = await Scout.findById(req.id).exec();//grab the user by the ID
  // //if the user is a cp he can buy items by using the patrols resources 
    let quantity = parseInt(req.body.quantity);//extracting the type and quantity from the request
    let type = await Asset.findOne({asset:req.body.type}).exec();
    let pat = await Patrol.findOne({_id : user.patrol}).exec();
    if (landNumber !== 0){
     land = await Land.findOne({land_no:landNumber}).exec()//the request will contain the land number
     console.log(land)
    }
    if(!type){
      return res.status(400).send({
        message:"this asset doesn't exist"
      })
    }
    if(!pat){
      return res.status(400).send({
        message:"this patrol doesn't exist"
      })
    }
    console.log("")
    if(pat.coins >= (type.cost * quantity)){//check the balance of the patrol to see if it is sufficient
      let item = assetMap(type.asset)
      if(item == "tot_workshops" | item == "tot_sol" |item == "tot_houses"| item  == "soil" | item == "watermelon" |item == "wheat" | item == "apple"){//dealing with land specific purchases
        if(landNumber == 0){
          return res.status(400).send({message:"you need land number to purchase this item"})
        }
        if(!land.patrol_ID.equals(pat.id)){
          return res.status(400).send({message:"this patrol doesn't own this land"})
        }
        if(item == "tot_workshops"){
              if(land.workshop == true){
               return res.status(400).send({
                  message:"the land has already a workshop"
                })
              }else{
                if(quantity != 1){
                  return res.status(400).send({message:"you can't buy more than one workshop in one land"})
                }else if(land.workshop == true){
                  return res.status(400).send({message:"you can't build another workshop in this land"})
                }
                else{
                  land.workshop = true;
                  pat.tot_workshops = pat.tot_workshops + 1
                }
              }
        }else if(item == "tot_sol"){
                land.soldiers = land.soldiers + quantity;
                pat.tot_sol = pat.tot_sol + 1;
        }else if(item == "tot_houses"){// may need to change to make the chef controll the adding of houses not the cp
                if(land.houses < 3){
                  land.houses = land.houses + quantity;
                  pat.tot_houses = pat.tot_houses + quantity;
                }else{
                  return res.status(400).send({
                    message:"the houses are already maximum on this land"
                  })
                }
              }
        else if(item == "watermelon"){
                land.inventory.watermelon = land.inventory.watermelon + quantity;
                pat.watermelon += quantity;
        }else if(item == "wheat"){
                land.inventory.wheat = land.inventory.wheat + quantity;
                pat.wheat+=quantity;
        }else if (item == "apple"){
                land.inventory.apple = land.inventory.apple + quantity;
                pat.apple += quantity
        }else if(item == "soil"){
          if(land.soil_no < 5){
                  if(land.soil_no + quantity > 5){
                    return res.status(400).send({
                      message: "the quantity is more than the allowed limit of soils in one land"
                    })
                  }else{
                    land.soil_no = land.soil_no + quantity;
                    land.soils.empty = land.soils.empty + quantity 
                    pat.tot_soil += quantity
                    pat.soils.empty += quantity
                  }
                }else{
                  return res.status(400).send({
                    message:"the soil limit in this land was reached"
                  })
                }
              }
      }else{
        pat[item] = pat[item] + quantity  //incrementing the items
      }   
      pat.coins = pat.coins - (type.cost * quantity);
      if(landNumber !== 0){
      await land.save();
      }
      await pat.save();
      return res.status(200).send({
        message:"purchase done successful"
      })
    }else{//if the balance in not sufficient
      return res.status(401).send({
        message:"no enough coins"
      })
    }
 
}

async function getBuy(req,res){
  try{
  let pat = await Patrol.findOne({name : req.patrol}).exec()
  let quantity = req.body.quantity
  let type =  req.body.type
  let asset = await Asset.findOne({asset : type}).exec()
  let cost  = asset.cost * quantity
  return res.status(200).send({"cost" : cost , "coins": pat.coins})
  }catch(err){
    console.log(err.message)
    return res.status(500).send({message:"error in getBuy"})
  } 
}

//must do a function that return all the costs on the get method on the /buy route
function assetMap(name){//map the name in the assets with the names in the patrol module the work with the buy function
 switch(name) {
  case "soldier":
    return "tot_sol";
  case "horse":
    return "tot_horses"
  case "cart":
    return "tot_carts"
  case "workshop":
    return "tot_workshops"
  case "house":
    return "tot_houses"
  default:
    return name
}
}

//process
async function transport(req,res)
{
  try{
    // let id = req.id
    // let user = await Scout.findById(id).exec()
    //if the user is a cp he can preform the action
    console.log("this is the body : " +  req.body)
    let patrolName = req.patrol
    let pat = await Patrol.findOne({name:patrolName}).exec();
    let initialNo = req.body.intialLand
    // console.log(initialNo)
    let finalNo= req.body.finalLand
    let initial = await Land.findOne({land_no : initialNo}).exec()
    // console.log(initial)
    let final = await Land.findOne({land_no : finalNo}).exec()
    if(initialNo == finalNo){//if both numbers are equal
      return res.status(400).send({message:"both lands are the same land"})
    }else if( ! initial.patrol_ID.equals(pat._id) && ! final.patrol_ID.equals(pat._id)){//the two lands are not owned by the patrol
          return res.status(400).send({
              message:"the patrol doesn't own both lands"
          })
      }else if(! initial.patrol_ID.equals(pat._id)){//the inital land only is not owned by the patrol
          return res.status(400).send({
              message:"the patrol doesn't own the inital land"
          })
      }else if(! final.patrol_ID.equals(pat._id)){//the final land is not owned by the patrol
          return res.status(400).send({message:"the patrol doesn't own the final land"})
      }else{
          let typeName = req.body.typeName
          let type = await Asset.findOne({asset : typeName}).exec()
          console.log("the type name : "+type)
          let quantity = req.body.quantity
          let horses = req.body.horses
          let rentHorses = req.body.rentHorses
          let carts = req.body.carts
          let rentCarts = req.body.rentCarts
          let neededPower
          let power
          if(pat.tot_horses < horses || pat.tot_carts < carts || pat.rentCart < rentCarts || pat.rentHorse < rentHorses){//the patrol doesn't have the required means
          return res.status(400).send({message:"patrol doesn't have the given number of means"})
        }
          if(type.asset == "soldier"){
              if(initial.soldiers <= quantity){//the land doesn't have enough soldiers to send and keep at least one soldier in the land
                  return res.status(400).send({message:"the inital land doesn't have enough resources"})
              }else{// calculating the needed power for soldiers
                   neededPower = quantity
                   power = horses + rentHorses + (carts * 5)  +  (rentCarts * 5)
              }
              if(neededPower > power){//if the trasportation means don't cover the needed power
                return res.status(400).send({message:"the transportation power is not enough"})
              }
          }else{
              if(initial.inventory[type.asset] < quantity){//the land doesn't have enough resources to send
                  return res.status(400).send({
                      message:"the intial land doesn't have enough resources"
                  })
              }else{//calculating needed and provided power to trasnport (wheat / apple / watermelon)
                   neededPower = quantity
                   power = horses + rentHorses + (carts * 3)  +  (rentCarts * 3)
              }
              if(neededPower > power){//if the trasportation means don't cover the needed power
                return res.status(400).send({message:"the transportation power is not enough"})
              }else{
                  if(power - neededPower >= 3 && (carts + rentCarts) != 0){// if cart(s) can be removed and still cover the power needed
                  let removed  = (power - neededPower) / 3
                  return res.status(400).send({message:`you can remove at least ${removed} carts`})
              }else if(power - neededPower >= 1 && (horses + rentHorses) != 0){// if horse(s) can be removed and still cover the power needed
                  let removed  = power - neededPower
                  return res.status(400).send({message:`you can remove at least ${removed} horses`})
              }else{// subtracting the used rent items as it is one-use only
                  initial.inventory[type.asset] -= quantity
                  final.inventory[type.asset] += quantity
                  await initial.save()
                  await final.save()
                  pat.rentHorse -= rentHorses
                  pat.rentCart -= rentCarts
                  await pat.save()
                  return res.status(200).send({message:"was transported successfully"})
              }
              }
          }
      }
  }catch(err){
    console.log(err)
    return res.status(500).send({message:"error in transport"})
  }

}

async function singleLandResources(landNo){
  try{
  let land = await Land.findOne({land_no:landNo}).exec()
  let landData = {
    "apple":land.inventory.apple,
    "watermelon":land.inventory.watermelon,
    "wheat":land.inventory.wheat,
    "soldiers":land.soldiers
  }
  return landData
  }catch(err){
    console.log(err)
  }

}

async function twoLandsResources(req,res) {
  try{
  let starting = await singleLandResources(req.body.initialLandNo)
  let finishing = await singleLandResources(req.body.finalLandNo)
  console.log(starting)
  console.log(finishing)
  let patrol = await Patrol.findOne({name : req.patrol}).exec()
  let horses = patrol.tot_horses
  let rentHorses = patrol.rentHorse
  let carts = patrol.tot_carts
  let rentCarts = patrol.rentCart
  return res.status(200).send({starting,finishing,"horses": horses, "carts":carts, "rentHorses":rentHorses , "rentCarts": rentCarts})
  }catch(err){
    console.log(err)
    return res.status(500).send({message:"internal server error in the twoLandsResources"})
  }
}

async function getPlant(req,res){
  try{
  let land = await Land.findOne({land_no:req.body.landNo}).exec()
  let patrol = await Patrol.findOne({name:req.patrol}).exec()
  console.log(`the land number : ${req.body.landNo}`)
  if(! land.patrol_ID.equals(patrol.id)){
    return res.status(400).send({message:`the ${(patrol.name).charAt(0).toUpperCase() + (patrol.name).slice(1)} does not own this land`})
  }if(req.body.landNo > 33 ||  req.body.landNo < 1){
    return res.status(400).send({message:"enter a valid land number"})
  }
  let landSoils = {
    "empty":land.soils.empty,
    "apple":land.soils.apple,
    "watermelon":land.soils.watermelon,
    "wheat":land.soils.wheat
  }
  let scout = await Scout.findById(req.id).exec()
  let pat = await Patrol.findById(scout.patrol).exec()
  let seeds = {
    "apple":pat.appleSeeds,
    "watermelon":pat.watermelonSeeds,
    "wheat":pat.wheatSeeds
  }
  return res.status(200).send({
    "landSoil":landSoils,
    "seeds":seeds
  })
}catch(err){
  console.log(err)
  return res.status(500).send({message:"an error happened in getplant please try again later"})
}
}

function seedMap(seedName){
  switch(seedName){
    case "wheatSeeds":
      return "wheat"
    case "appleSeeds":
      return "apple"
    case "watermelonSeeds":
      return "watermelon"
    default:
      return "invalid"
  }
}

function seedMap2(cropName){
  switch(cropName){
    case "wheat":
      return "wheatSeeds"
    case "apple":
      return "appleSeeds"
    case "watermelon":
      return "watermelonSeeds"
    default:
      return "invalid"
  }
}

async function plant(req,res){
  console.log(req)
  let landnum = req.body.landNo
  console.log(`the land number : ${landnum}`)
  let land = await Land.findOne({land_no : landnum}).exec()
  let targetSoil = req.body.targetSoil
  let targetSeed = req.body.targetSeed//the target seed name will come in plural form in the request

  console.log(`the targetSoil : ${targetSoil}`)
  console.log(`the targetSeed : ${targetSeed}`) 
  let seedType = targetSeed //the front-end sent it wrong
  targetSeed = seedMap2(seedType)
  console.log(`the seed type : ${seedType}`)
  let pat = await Patrol.findOne({name : req.patrol}).exec()
  console.log(req.patrol)
  if(pat[targetSeed] == 0){
    return res.status(400).send({message:"the patrol has no seeds of that kind"})
  }else if(land.soils[targetSoil] == 0){
    return res.status(400).send({message:"the land doesn't have that kind of soil"})
  }else if(seedType == targetSoil){
   return res.status(400).send({message:"the soil is already of that kind"})
  }else{
    if(seedType == "invalid"){
      return res.status(400).send({message:"the seed type is invalid"})
    }else{
      pat[targetSeed] -= 1
      land.soils[targetSoil] -= 1
      pat.soils[targetSoil] -= 1
      land.soils[seedType] += 1
      pat.soils[seedType] += 1
      await pat.save()
      await land.save()
      return res.status(200).send({message:"planting is done successfully"})
      }
  }
}

async function watering(req,res){//watering may end up in the chef controllers
  let patrol = await Patrol.findOne({name:req.patrol}).exec()
  let watering = await Asset.findOne({asset:"farming"}).exec()
  if(patrol.farming){
    return res.status(400).send({message:"the patrol already watered it's plants"})
  }else if(patrol.coins < watering.cost){
    return res.status(400).send({message:"the patrol doesn't have enough money for watering their plants"})
  }
  else{
    patrol.farming = true
    patrol.coins -= watering.cost
    await patrol.save()
    return res.status(200).send({message:"the plants were watered successfully"})
  }
}

async function getAttackKadr(req,res){
  try{//get the conditions of the land using attacked land only from the request
    //and get the qualifications of the patrol
  let patName = req.patrol
  let patrol = await Patrol.findOne({name : patName}).exec()
  let attackedLand = await Land.findOne({land_no : req.query.landNo}).exec()
  let land = await Land.findOne({land_no : req.query.attackedLand}).exec()
  let conditions = attackedLand.conditions
  let qualifications = {}
  qualifications.soldiers = patrol.tot_sol
  qualifications.houses = patrol.tot_houses
  qualifications.inLandSoldiers = land.soldiers
  qualifications.coins = patrol.coins
  return res.status(200).send({"conditions":conditions ,"qualifications":qualifications})
  }catch(err){
    console.log(err.message)
    return res.status(500).send({message:"error in getAttackKadr functions"})
  }
}

async function attackKadr(req,res){//checking the qualifications of the patrol overall with the attacked land
  //and then useing the attack function to complete the action
  //the req.body should contain the {initalL:land_no,attackedL:land_no}
  try{
  // let land = await Land.findOne({land_no : req.body.landNo}).exec() not needed
  let attackedLand = await Land.findOne({land_no : req.body.attackedL})
  let kadr = await Patrol.findOne({name : "kadr"}).exec()
  if(! attackedLand.patrol_ID.equals(kadr.id)){
    return res.status(400).send({message : "the land doesn't belong to kadr"})
  }
  let patrol = await Patrol.findOne({name : req.patrol}).exec()
  let conditions = attackedLand.conditions
  let qualifications = {}
  qualifications.soldiers = patrol.tot_sol
  qualifications.houses = patrol.tot_houses 
  qualifications.lands = patrol.tot_lands
  qualifications.coins = patrol.coins
  let quals = ["soldiers" , "apples", "wheats","watermelons", "soils",
    "houses","lands","coins"]
  let qualified = ! (quals.some(element=>{//checking if the patrol passes all the qualifications
    return(qualifications[element] < conditions[element])
  }))
  if(! qualified){
    return res.status(400).send({message:"you are not qualified"})
  }else{
    req.body.attackedPatrol = "kadr"
    return attack(req,res)
  }
}catch(err){
  console.log(err.message)
  return res.status(500).send({message : "error in attackKadr"})
}
}

//getAttackKadr   attackKadr   attack checkAttack
////////////////////////////////////////////////////////////////
async function checkAttack(req,res){
  try{
  let initialLandNo = req.body.landNo
  let targetLandNo = req.body.targetLandNo
  console.log(targetLandNo  +  " " +  initialLandNo)
  let initialPat = await Patrol.findOne({name : req.patrol}).exec()
  let initialLand = await Land.findOne({land_no : initialLandNo}).exec()
  let targetLand = await Land.findOne({land_no : targetLandNo}).exec()
  let kadr = await Patrol.findOne({name : "kadr"}).exec()
  let adjacent = initialLand.adjacent
  let adj = adjacent.some(element => element === targetLand.land_no)
  if(!adj){
    return res.status(400).send({message:"the two lands are not adjacent"})
  }else if (targetLand.patrol_ID.equals(initialPat.id)){
    return res.status(400).send({message:"can't attack your own land"})
  }if(! initialPat._id.equals(initialLand.patrol_ID)){
    return res.status(400).send({message:"the patrol doesn't own this land"})
  }else {  
  if(initialLandNo.patrol_ID.equals(kadr.id)){
    return res.status(200).send({attacked:"kadr"})
  }else{
    return res.status(200).send({attacked:"patrol"})
  }
}
}catch(err){
  console.log(err.message)
  return res.status(500).send({"message":"error in checkAttack"})
}
}

async function attack(req,res){//attack process in general
  try{//the request should contain {initalL: land_no , attackedL:land_no, attackedPatrol: "name"}
  
  let {initialL,attackedL,attackedPatrol,soldiers} = req.body
  let initialLand = await Land.findOne({land_no : initialL}).exec()
  let attackedLand = await Land.findOne({land_no : attackedL}).exec()
  patrolName = req.patrol
  let initialPat = await Patrol.findOne({name:patrolName}).exec()
  let attackedPat = await Patrol.findOne({name:attackedPatrol}).exec()
  let adjacent = initialLand.adjacent
  let adj = adjacent.some(element => element === attackedLand.land_no)
  if(!adj){
    return res.status(400).send({message:"the two lands are not adjacent"})
  }
   if(! initialPat._id.equals(initialLand.patrol_ID)){
    return res.status(400).send({message:"the patrol doesn't own this land"})
  }else if(soldiers - attackedLand.soldiers < 2){
    return res.status(400).send({message:"not enough soldiers to attack"})
  }else if(soldiers > initialLand.soldiers){
    return res.status(400).send({message:"this land doesn't contain this much soldiers"})
  }else if(! attackedLand.patrol_ID.equals(attackedPat.id)){
    return res.status(400).send({message:"the attacked patrol does not own the attacked land"})
  }else{
    initialLand.soldiers -= soldiers
    soldiers -= attackedLand.soldiers
    attackedPat.tot_sol -= attackedLand.soldiers
    initialPat.tot_sol -= attackedLand.soldiers
    if(soldiers % 2 == 0){
      initialLand.soldiers += soldiers / 2
      attackedLand.soldiers = soldiers / 2
    }else{
      initialLand.soldiers += Math.floor(soldiers / 2) + 1
      attackedLand.soldiers = Math.floor(soldiers / 2)
    }
    initialPat.tot_sol += soldiers
    attackedLand.patrol_ID = initialPat._id
    attackedPat.tot_lands -= 1
    initialPat.tot_lands += 1
    attackedPat.tot_soil -= attackedLand.soil_no
    initialPat.tot_soil += attackedLand.soil_no
    attackedPat.tot_houses -= attackedLand.houses
    initialPat.tot_houses += attackedLand.houses
    if(attackedLand.workshop){
      initialPat.tot_workshops += 1
      attackedPat.tot_workshops -= 1
    }
    initialPat.wheat += attackedLand.inventory.wheat
    initialPat.apple += attackedLand.inventory.apple
    initialPat.watermelon += attackedLand.inventory.watermelon
    attackedPat.wheat -= attackedLand.inventory.wheat
    attackedPat.apple -= attackedLand.inventory.apple
    attackedPat.watermelon -= attackedLand.inventory.watermelon
    initialPat.soils.apple += attackedLand.soils.apple
    initialPat.soils.wheat += attackedLand.soils.wheat
    initialPat.soils.watermelon += attackedLand.soils.watermelon
    initialPat.soils.empty += attackedLand.soils.empty
    attackedPat.soils.apple -= attackedLand.soils.apple
    attackedPat.soils.wheat -= attackedLand.soils.wheat
    attackedPat.soils.watermelon -= attackedLand.soils.watermelon
    attackedPat.soils.empty -= attackedLand.soils.empty
    initialPat.fed += attackedLand.fed
    attackedPat.fed -= attackedLand.fed
    await attackedLand.save()
    await attackedPat.save()
    await initialLand.save()
    await initialPat.save()
    return res.status(200).send({message:"the attack was done successfully"})
  }
}catch(err){
  console.log(err)
  return res.status(500).send({message:"error in the attack function"})
}
}


async function getFeeding(req,res){
  try{
  patrolName = req.patrol
  let patrol = await Patrol.findOne({name: patrolName}).exec()
  let land = await Land.findOne({land_no : req.body.landNo}).exec()
  let unfed = land.houses - land.fed 
  return res.status(200).send({"totalHouses":land.houses ,"unfed" : unfed , watermelon : land.inventory.watermelon,apple : land.inventory.apple,wheat : land.inventory.wheat})
  }catch(err){
    return res.status(500).send({message: "getFeeding error"})
  }
}

async function feeding(req,res){  
  let {numberOfHouses,landNo,watermelon,apple,wheat} = req.body
  let land = await Land.findOne({land_no : landNo}).exec()
  let user = await Scout.findOne({_id : req.id}).exec()
  let patrol = await Patrol.findOne({_id : user.patrol}).exec()
  if(! land.patrol_ID.equals(patrol._id)){
    return res.status(400).send({message : "this patrol doesn't own this land"})
  }
  if(numberOfHouses > land.houses || numberOfHouses < 0 || numberOfHouses > (land.houses - land.fed)){
    return res.status(400).send({message:"invalid number of houses"})
  } 
  let unfed = land.houses - land.fed
  if(unfed === 0){
    return res.status(400).send({
      message:"the land is already fed"
    })
  }
  let neededFood = numberOfHouses
  let food = (watermelon * 4) + (wheat) + (apple * 2)
  console.log("watermelon: " + watermelon)
  console.log("wheat: " + wheat)
  console.log("apple: " + apple)
  if(neededFood > food){
    console.log("needed Food: " +neededFood)
    console.log("food:" + food)
    return res.status(400).send({message:"not enough food"})
  }
  if(land.inventory.apple < apple || land.inventory.wheat < wheat || land.inventory.watermelon < watermelon){
    return res.status(400).send({message:"you don't have enough resources in this land"})
  }
  let exceeded = {
    watermelons:0,
    apples:0,
    wheats:0
  }
  let exceededBool = false
  if(neededFood < food){
    console.log("neededFood < food")
    let ex = 0;
    if(food - neededFood > 4 && watermelon > 0){
      console.log("food - neededFood > 4 && watermelon > 0")
      ex = parseInt(Math.floor((food - neededFood) / 4))
      if (watermelon >= ex){
        exceeded.watermelons = ex
      }else{
        exceeded.watermelons = watermelon
      }
      food -= exceeded.watermelons * 4
    }
    if(food - neededFood > 2 && apple > 0){
      ex = parseInt(Math.floor((food - neededFood) / 2))
      if (apple >= ex){
        exceeded.apples = ex
      }else{
        exceeded.apples = apple
      }
      food -= exceeded.apples * 2
    }
    if(food - neededFood > 1 && wheat > 0){
      ex = parseInt(MMath.floor((food - neededFood)))
      if (wheat >= ex){
        exceeded.wheats = ex
      }else{
        exceeded.wheats = wheat
      }
      food -= exceeded.wheats
    }
    if(exceeded.wheats === 0 && exceeded.watermelons === 0 && exceeded.apples === 0){
      exceededBool = false
    }else{
      exceededBool = true
    }
  }
  if(exceededBool){
    return res.status(400).send({message:"you could remove all of these crops","exceeded":exceeded})
  }else{
    land.inventory.apple -= apple
    land.inventory.watermelon -= watermelon
    land.inventory.wheat -= wheat
    land.fed += numberOfHouses
    patrol.fed += numberOfHouses
    await land.save()
    await patrol.save()
    return res.status(200).send({message:"feeding done successfully"})
  }


  
}

async function checkLandNo(req,res){
  let patrolName = req.patrol
  let patrol = await Patrol.findOne({name : patrolName}).exec()
  let landNo = req.body.landNo
  let land = await Land.findOne({land_no : landNo}).exec()
  if(!land.patrol_ID.equals(patrol.id)){
    return res.status(400).send({message:"the land doesn't belong to the patrol"})
  }
  if(landNo > 33 || landNo < 1){
    return res.status(400).send({message:"invalid land number"})
  }
  return res.status(200).send({message:"the land number is valid"})
}

async function getAttackPatrol(req,res){
  try{
  let startingLandNo = req.body.initialLandNo
  let finishingLandNo = req.body.finalLandNo
  let startingLand = await Land.findOne({land_no : startingLandNo}).exec()
  let finishingLand = await Land.findOne({land_no : finishingLandNo}).exec()
  let attackedPat = await Patrol.findById(finishingLand.patrol_ID).exec()
  return res.status(200).send({"patrol1":req.patrol,"patrol2":attackedPat.name,"soldiers1":startingLand.soldiers,"soldiers2":finishingLand.soldiers,"resources":{
    "houses":finishingLand.houses,
    "appleSoils":finishingLand.soils.apple,
    "watermelonSoils":finishingLand.soils.watermelon,
    "wheatSoils":finishingLand.soils.wheat,
    "emptySoils":finishingLand.soils.empty,
    "wheat":finishingLand.inventory.wheat,
    "apple":finishingLand.inventory.apple,
    "watermelon":finishingLand.inventory.watermelon
  },"land1":startingLandNo,"land2":finishingLandNo})
}catch(err){
console.log(err.message)

}
}

module.exports = {buy,transport,twoLandsResources,getPlant,plant,watering,feeding,attack,getAttackKadr,getBuy,attackKadr,checkLandNo,getFeeding,getPatrol,checkAttack,getAttackPatrol}