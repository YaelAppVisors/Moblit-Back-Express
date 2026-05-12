const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');

router.get('/', formController.getForms);
router.get('/negocio/:id_negocio', formController.getFormsByNegocio);
router.get('/negocio/:id_negocio/responses', formController.getFormResponsesByNegocio);
router.get('/responses/:id_response', formController.getFormResponseById);
router.patch('/responses/:id_response/cancel', formController.cancelFormResponse);
router.get('/:id_form', formController.getFormById);
router.post('/negocio/:id_negocio', formController.postForm);
router.put('/:id_form', formController.updateForm);
router.put('/:id_form/default_group', formController.defaultGroup);

// ==========================================
// 2. RUTAS DE GRUPOS
// ==========================================

router.post('/:id_form/groups', formController.postFormGroup);
router.put('/:id_form/groups/:id_group', formController.updateFormGroup);
// router.delete('/:id_form/groups/:id_group', formController.deleteFormGroup);

// ==========================================
// 3. RUTAS DE CAMPOS (Antes "Preguntas")
// ==========================================
router.post('/:id_form/groups/:id_group/fields', formController.postFormField);
router.post('/:id_form/groups/:id_group/fields/bulk', formController.postFormFieldsBulk);
router.put('/:id_form/groups/:id_group/fields/:id_field', formController.updateFormField);
router.delete('/:id_form/groups/:id_group/fields/:id_field', formController.deleteFormField);

// ==========================================
// 4. RUTAS DE OPCIONES
// ==========================================
router.post('/:id_form/groups/:id_group/fields/:id_field/options', formController.postOption);
router.put('/:id_form/groups/:id_group/fields/:id_field/options/:id_option', formController.updateOption);

// router.delete('/:id_form/groups/:id_group/fields/:id_field/options/:id_option', formController.deleteOption);

// ==========================================
// 5. RUTAS DE RESPUESTAS
// ==========================================
router.post('/:id_form/responses', formController.postFormResponse);
router.get('/:id_form/responses', formController.getFormResponsesByForm);
router.get("/service_types/available", formController.getServiceTypes);

module.exports = router;