const groupHeader = {
    "nombre_grupo": "Finalización",
    "orden": 0
}

const groupFields = [
    {
        "activo": true,
        "allowMultiOption": false,
        "required": false,
        "fieldType": "text",
        "label": "Observaciones del inspector",
        "name": "observaciones_inspector"
    },
    {
        "activo": true,
        "allowMultiOption": false,
        "required": false,
        "fieldType": "text",
        "label": "Observaciones del inspeccionado",
        "name": "observaciones_inspeccionado"
    },
    {
        "activo": true,
        "allowMultiOption": false,
        "required": false,
        "fieldType": "signature",
        "label": "Firma",
        "name": "firma"
    },
    {
        "activo": true,
        "allowMultiOption": false,
        "required": false,
        "fieldType": "image",
        "label": "Evidencias finales",
        "name": "evidencias_finales"
    }
];

module.exports = {groupHeader, groupFields};