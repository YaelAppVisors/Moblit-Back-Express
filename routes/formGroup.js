var express = require('express');
var router = express.Router();
var formGroupController = require('../controllers/formGroupController');

/* GET users listing. */
router.get('/', formGroupController.getFormGroups);
router.get('/negocio/:id_negocio', formGroupController.getFormGroupsByNegocio);
router.get('/:id_form_group', formGroupController.getFormGroupById);
router.post('/:id_negocio', formGroupController.postFormGroup);
router.put('/:id_form_group', formGroupController.updateFormGroup);
router.delete('/:id_form_group', formGroupController.deleteFormGroup);

router.post('/question/:id_form_group', formGroupController.postFormQuestions);
router.put('/createFormQuestion/:id_form_group', formGroupController.postFormQuestions);

router.put('/question/:id_form_group/:id_form_questions', formGroupController.updateFormQuestion);
router.delete('/question/:id_form_group/:id_form_questions', formGroupController.deleteFormQuestion);

router.post('/option/:id_form_group/:id_form_questions', formGroupController.postOptions);
router.put('/createOptions/:id_form_group/:id_form_questions', formGroupController.postOptions);
router.put('/option/:id_form_group/:id_form_questions/:id_option', formGroupController.updateOption);
router.delete('/option/:id_form_group/:id_form_questions/:id_option', formGroupController.deleteOption);

module.exports = router;