Ext.define('PortfolioItemCostTracking.NumberFieldComboBox', {
    requires: [],
    extend: 'Rally.ui.combobox.FieldComboBox',
    alias: 'widget.numberfieldcombobox',
    _isNotHidden: function(field) {
        var validFields= ['PreliminaryEstimate','RefinedEstimate','ValueScore'];

        if (!field.hidden) {

            if (Ext.Array.contains(validFields, field.name)) {
                return true;
            }

            //Allow for custom number fields
            if (field.custom && field.attributeDefinition) {
                return (field.attributeDefinition.AttributeType === "INTEGER" ||
                field.attributeDefinition.AttributeType === "DECIMAL");

            }
        }
        return false;
    }
});
