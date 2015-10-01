Ext.define('PortfolioItemCostTracking.Settings', {
    singleton: true,

    currencyData: [
        {name: "US Dollars", value: "$"},
        {name: "Euro", value: "&#128;"},
        {name: "Japanese Yen", value: "&#165;"},
        {name: "Brazilian Real", value: "R$"}
    ],

    getFields: function(config) {


        var currency_store = Ext.create('Rally.data.custom.Store', {
            data: this.currencyData
        });
        var labelWidth = 100;

        return [{
            xtype: 'rallycombobox',
            name: 'currencySign',
            store: currency_store,
            displayField: 'name',
            valueField: 'value',
            fieldLabel:  'Currency',
            labelWidth: labelWidth,
            margin: '10 0 10 0'
        },{
            xtype: 'radiogroup',
            fieldLabel: 'Calculate Cost',
            columns: 1,
            vertical: true,
            labelWidth: labelWidth,
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
            labelWidth: labelWidth,
            width: 200,
            margin: '25 0 0 0'
        },{
            xtype: 'costperprojectsettings',
            name: 'projectCostPerUnit',
            fieldLabel: 'Optionally define costs per unit for individual teams (exceptions to the normalized cost)',
            labelAlign: 'top',
            margin: '25 0 0 0',
            readyEvent: 'ready'
        }];
    }
});