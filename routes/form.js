const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');

router.get('/', formController.getForms);
router.get('/negocio/:id_negocio', formController.getFormsByNegocio);
router.get('/:id_form', formController.getFormById);
router.post('/negocio/:id_negocio', formController.postForm);

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
router.put('/:id_form/groups/:id_group/fields/:id_field', formController.updateFormField);
// router.delete('/:id_form/groups/:id_group/fields/:id_field', formController.deleteFormField);

// ==========================================
// 4. RUTAS DE OPCIONES
// ==========================================
router.post('/:id_form/groups/:id_group/fields/:id_field/options', formController.postOption);
router.put('/:id_form/groups/:id_group/fields/:id_field/options/:id_option', formController.updateOption);

// router.delete('/:id_form/groups/:id_group/fields/:id_field/options/:id_option', formController.deleteOption);

module.exports = router;