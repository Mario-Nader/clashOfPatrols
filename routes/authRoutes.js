const express = require('express')
const router = express.Router()
const Land = require('../modules/Land_module')
const auth = require('../controllers/auth_controllers')
const mongoose = require("mongoose")
router.post('/update', async (req, res) => {
  try {
    console.log("in update");

    const result = await Land.updateMany(
      {},
      {
        $unset: {
          "conditions.soils": "",
          "conditions.watermelons" : "",
          "conditions.wheats": "",
          "conditions.apples" : ""
        }
      }
    );

    console.log("update result:", result);

    return res.status(200).send({ message: "done", modified: result.modifiedCount });

  } catch (err) {
    console.error("Update error:", err);
    return res.status(500).send({ message: "Update failed", error: err.message });
  }
});

router.post('/signup',auth.signup);
router.post('/login',auth.login);
router.post('/signout',auth.logout);

module.exports = router;


//empty soils -1