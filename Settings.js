Ext.define('PortfolioItemCostTracking.Settings', {
    singleton: true,

    currencyData: [
        {name: "US Dollars", value: "$"}
    ],

    getFields: function(config) {


        var currency_store = Ext.create('Rally.data.custom.Store', {
            data: this.currencyData
        });

        return [{
            xtype: 'rallycombobox',
            name: 'currencySign',
            store: currency_store,
            displayField: 'name',
            valueField: 'value',
            fieldLabel:  'Currency',
            labelAlign: 'top',
            labelCls: 'lbl',
            margin: '10 0 10 0'
        },{
            xtype: 'radiogroup',
            fieldLabel: 'Calculate Cost',
            labelAlign: "top",
            labelCls: 'lbl',
            columns: 1,
            vertical: true,
            margin: '10 0 10 0',
            items: [
                { boxLabel: 'Based on Story Points', name: 'calculationType',inputValue: 'points', checked: true },
                { boxLabel: 'Based on Task Hours', name: 'calculationType',inputValue: 'taskHours'},
                { boxLabel: 'Using Timesheets', name: 'calculationType',inputValue: 'timesheets' }
            ]
        },{
            xtype: 'rallytextfield',
            name: 'normalizedCostPerUnit',
            fieldLabel: 'Normalized Cost Per Unit',
            labelAlign: 'top',
            labelCls: 'lbl',
            width: 175,
            margin: '25 0 0 0'
        },{
            xtype: 'costperprojectsettings',
            name: 'projectCostPerUnit',
            fieldLabel: 'Cost Per Unit by Team',
            labelAlign: 'top',
            labelCls: 'lbl',
            margin: '25 0 0 0',
            readyEvent: 'ready'
        }];
    }
});