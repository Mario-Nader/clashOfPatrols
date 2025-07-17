const Patrol  = require('../modules/patrol_module')
const Land = require('../modules/Land_module')

async function view_scores(req,res){
  let  patrols = await Patrol.find({"name":{$ne:"kadr"}}).exec();
  let lands = await viewMap()
  res.status(200).send({"patrols":patrols,"lands":lands})
}

async function viewMap(){
  let landArr = await Land.find().lean().exec()
  let patrols = await Patrol.find({},{id : 1,name : 1}).exec()
  let pats = patrols.reduce((acc,curr)=>{
    acc[curr.id] = curr.name
    return acc
  },{})
  landArr.forEach((land) =>{
    land.patrol = pats[land.patrol_ID]
    // console.log(land.patrol)
  })
  // console.log(landArr[0].patrol)
  return landArr 
}

module.exports = {view_scores}