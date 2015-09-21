Ext.define('PortfolioItemCostTracking.ModelExtender',{
    singleton: true,
    getExtendedModel: function(model_name) {
        extended_model_name = "ExtendedModel";

        return Rally.data.ModelFactory.getModel({
            type: model_name
        }).then({
            success: function (model) {
                return Ext.define(extended_model_name, {
                    extend: model,
                    fields: [{
                        name: '__PreliminaryBudget',
                        defaultValue: 0,
                        displayName: 'Preliminary Budget'
                    }]
                });
            },
            scope: this
        });
    }
});

