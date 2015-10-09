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

//Ext.override(Rally.ui.grid.TreeGrid,{
//    //_getStatefulColumns: function(columnCfgs) {
//    //    return _.filter(columnCfgs, function(columnCfg) {
//    //        var columnName = Ext.isString(columnCfg) ? columnCfg: columnCfg.dataIndex;
//    //        return !Ext.isEmpty(columnName) && this._isStatefulColumn(columnName);
//    //    }, this);
//    //    //console.log('_getStatefulColumns',columnCfgs);
//    //    //return columnCfgs;
//    //},
//    reconfigureWithColumns: function(columnCfgs, reconfigureExistingColumns, suspendLoad) {
//        columnCfgs = this._getStatefulColumns(columnCfgs);
//
//        if (!reconfigureExistingColumns) {
//            columnCfgs = this._mergeColumnConfigs(columnCfgs, this.columns);
//        }
//
//        this.columnCfgs = columnCfgs;
//        console.log('beforebuild', this.columns, this.columnCfgs);
//        this._buildColumns(true);
//        console.log('afterbuild', this.columns, this.columnCfgs);
//        this.getStore().fetch = this._buildFetch();
//
//        this.on('reconfigure', function() {
//            this.headerCt.setSortState();
//        }, this, {single: true});
//        this.reconfigure(null, this.columns);
//        this.columns = this.headerCt.items.getRange();
//
//        if (!suspendLoad) {
//            this.getStore().load();
//        }
//    },


    //_applyState: function(state) {
    //    console.log('_applyState',state);
    //    if (state.columns) {
    //        // make sure flex is set correctly for column configs saved in a preference
    //        _.each(state.columns, this._setColumnFlex, this);
    //        if (this.enableRanking) {
    //            state.columns = this._removeExistingRankColumn(state.columns);
    //        }
    //
    //        this._applyStatefulColumns(state.columns);
    //    }
    //
    //    if (state.pagingToolbar) {
    //        var store = this.getStore();
    //        store.pageSize = state.pagingToolbar.pageSize;
    //        store.currentPage = state.pagingToolbar.currentPage;
    //    }
    //
    //    if (state.sorters) {
    //        var sorters = _.transform(state.sorters, function (collection, sorterState) {
    //            if(Rally.data.Ranker.isRankField(sorterState.property)) {
    //                sorterState.property = Rally.data.Ranker.getRankField(this.store.model);
    //            }
    //
    //            collection.add(Ext.create('Ext.util.Sorter', {
    //                property: sorterState.property,
    //                direction: sorterState.direction
    //            }));
    //        }, Ext.create('Ext.util.MixedCollection'), this);
    //        this.getStore().sorters = sorters;
    //    }
    //
    //    if (state.expandedRowPersistence) {
    //        this.expandedRowPersistenceState = state.expandedRowPersistence;
    //    }
    //
    //    this.fireEvent('staterestore', this, state);
    //},
    //
    //_applyStatefulColumns: function(columns) {
    //    console.log('_applyStatefulColumns',columns);
    //    if (this.alwaysShowDefaultColumns) {
    //        _.each(this.columnCfgs, function(columnCfg) {
    //            var dataIndex = _.has(columnCfg.dataIndex) ? columnCfg.dataIndex : columnCfg;
    //            if (!_.any(columns, {dataIndex: dataIndex})) {
    //                columns.push(columnCfg);
    //            }
    //        });
    //    }
    //
    //    this.columnCfgs = columns;
    //}
//});
