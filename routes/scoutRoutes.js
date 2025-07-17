const express = require('express')
const router = express.Router()
const scout_controller = require('../controllers/scout_controllers')
const auth = require('../controllers/auth_controllers')

router.get("/view-scores",scout_controller.view_scores)

module.exports = router