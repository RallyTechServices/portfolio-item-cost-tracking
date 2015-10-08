Ext.define('Ext.CostTemplate', {
    extend: 'Ext.grid.column.Template',
    alias: ['widget.costtemplatecolumn'],

    tpl: '',
    costField: '',

    initComponent: function(){
        var me = this;

        Ext.QuickTips.init();

        me.tpl = new Ext.XTemplate('<tpl><div data-qtip="{[this.getTooltip(values)]}" style="cursor:pointer;">{[this.getCost(values)]}</div></tpl>',{
            costField: me.costField,
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

Ext.override(Rally.ui.grid.TreeGrid,{
    _isStatefulColumn: function(columnName) {
        if (!this.allColumnsStateful) {
            columnName = columnName.toLowerCase();

            var found = _.filter(this.nonStatefulColumns, function(c){
                return c.toLowerCase() === columnName;
            });
            if (found){
                return false;
            }

            if (this.store.enableHierarchy && columnName === this.treeColumnDataIndex.toLowerCase()) {
                return false;
            }

            if (this.enableRanking && columnName === this.rankColumnDataIndex.toLowerCase()) {
                return false;
            }
        }

        return true;
    }
});
