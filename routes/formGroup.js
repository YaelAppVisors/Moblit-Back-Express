var express = require('express');
var router = express.Router();
var formGroupController = require('../controllers/formGroupController');

/* GET users listing. */
router.get('/', formGroupController.getFormGroups);
router.post('/:id_negocio', formGroupController.postFormGroup);
router.put('/createFormQuestion/:id_form_group', formGroupController.postFormQuestions);
router.put('/createOptions/:id_form_group/:id_form_questions', formGroupController.postOptions);

module.exports = router;