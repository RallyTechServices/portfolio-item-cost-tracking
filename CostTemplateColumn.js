Ext.define('Ext.CostTemplate', {
    extend: 'Ext.grid.column.Template',
    alias: ['widget.costtemplatecolumn'],

    initComponent: function(){
        var me = this;

        Ext.QuickTips.init();

        me.tpl = new Ext.XTemplate('<tpl><div data-qtip="{[this.getTooltip(values)]}" style="cursor:pointer;">{[this.getCost(values)]}</div></tpl>',{
            costField: me.dataIndex,
            getCost: function(values){
                if (values[this.costField] === null){
                    return PortfolioItemCostTracking.Settings.notAvailableText;
                } else {
                    return PortfolioItemCostTracking.Settings.formatCost(values[this.costField] || 0);
                }
            },
            getTooltip: function(values){
                if (values._rollupDataToolTip){
                    return values._rollupDataToolTip;
                }
                return '';
            }

        });
        me.hasCustomRenderer = true;
        me.callParent(arguments);
    },
    getValue: function(){
        return this.values[this.costField] || 0;
    },
    defaultRenderer: function(value, meta, record) {

        var data = Ext.apply({}, record.data, record.getAssociatedData());
        return this.tpl.apply(data);
    }
});