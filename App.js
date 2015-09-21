Ext.define('PortfolioItemCostTracking', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    defaults: {
        margin: 10,
        startDate: new Date('2015-01-01'),
        endDate: new Date('2015-12-31'),
        groupByRelease: false
    },

    items: [{
        xtype: 'container',
        cls: 'header',
        layout: {
            type: 'hbox'
        }
    },{
        xtype: 'container',
        cls: 'body'
    }],

    config: {
        defaultSettings: {
            calculationType: 'points',
            normalizedCostPerUnit: 1000,
            projectCostPerUnit: {},
            currencySign: '$'
        }
    },

    portfolioItemRollupData: {},

    launch: function() {
        Deft.Promise.all([
            PortfolioItemCostTracking.WsapiToolbox.fetchPortfolioItemTypes(),
            PortfolioItemCostTracking.WsapiToolbox.fetchDoneStates()
        ]).then({
            scope: this,
            success: function(results){
                this.portfolioItemTypes = results[0];

                this._initializeSettings(this.getSettings(), results[1]);
                this._initializeUI();
            },
            failure: function(msg){
                Rally.ui.notify.Notifier.showError({message: msg});
            }
        });
    },
    _initializeSettings: function(settings, doneScheduleStates){


        PortfolioItemCostTracking.CostCalculator.notAvailableText = "N/A";
        PortfolioItemCostTracking.CostCalculator.currencySign = settings.currencySign;
        PortfolioItemCostTracking.CostCalculator.currencyPrecision = 0;
        PortfolioItemCostTracking.CostCalculator.currencyEnd = false;
        PortfolioItemCostTracking.CostCalculator.completedScheduleStates = doneScheduleStates;

        PortfolioItemCostTracking.CostCalculator.normalizedCostPerUnit = settings.normalizedCostPerUnit;

        var project_cpu = settings.projectCostPerUnit || {};
        if (!Ext.isObject(project_cpu)){
            project_cpu = Ext.JSON.decode(project_cpu);
        }
        PortfolioItemCostTracking.CostCalculator.projectCostPerUnit = project_cpu;

        PortfolioItemCostTracking.CostCalculator.calculationType = settings.calculationType || 'points';
    },
    _initializeUI: function(){
        var header = this.down('container[cls=header]');
        header.removeAll();

        header.add({
            xtype: 'rallydatefield',
            itemId: 'dt-start',
            stateful: true,
            stateId: this.getContext().getScopedStateId('dt-start'),
            stateEvents: ['change'],
            value: this.defaults.startDate,
            margin: this.defaults.margin,
            fieldLabel: 'Start Date',
            labelSeparator: '',
            labelAlign: 'top',
            listeners: {
                scope: this,
                change: this.refreshData
            }
        });

        header.add({
            xtype: 'rallydatefield',
            itemId: 'dt-end',
            stateful: true,
            stateId: this.getContext().getScopedStateId('dt-end'),
            stateEvents: ['change'],
            value: this.defaults.endDate,
            margin: this.defaults.margin,
            labelSeparator: '',
            fieldLabel: 'End Date',
            labelAlign: 'top',
            listeners: {
                scope: this,
                change: this.refreshData
            }
        });

        header.add({
            xtype: 'rallyportfolioitemtypecombobox',
            itemId: 'cb-type',
            stateful: true,
            stateId: this.getContext().getScopedStateId('cb-type'),
            stateEvents: ['change'],
            margin: this.defaults.margin,
            fieldLabel: 'Portfolio Item Type',
            labelAlign: 'top',
            listeners: {
                scope: this,
                change: this.refreshData,
                ready: this.refreshData
            }
        });

        //header.add({
        //    xtype: 'rallybutton',
        //    cls: 'rly-small secondary',
        //    iconCls: 'icon-export',
        //    iconOnly: true,
        //    margin: this.defaults.margin
        //});
    },
    _getCmpValue: function(scope, item_id){
        var cmp = scope.down(item_id) || null;
        if (cmp){
            return cmp.getValue() || null;
        }
        return null;
    },
    _getModel: function(){
        var cmp = this.down('#cb-type') || null;
        if (cmp){
            return cmp.getRecord().get('TypePath');
        }
        return null;
    },
    _getDateFilters: function(start_date, end_date){

        var filter_actual = [{
            property: 'ActualEndDate',
            operator: '>=',
            value: Rally.util.DateTime.toIsoString(start_date)
        },{
            property: 'ActualEndDate',
            operator: '<',
            value: Rally.util.DateTime.toIsoString(end_date)
        }];
        filter_actual = Rally.data.wsapi.Filter.and(filter_actual);

        var filter_planned = [{
            property: 'ActualEndDate',
            value: null
        },{
            property: 'PlannedEndDate',
            operator: '<',
            value: Rally.util.DateTime.toIsoString(end_date)
        },{
            property: 'PlannedEndDate',
            operator: '>=',
            value: Rally.util.DateTime.toIsoString(start_date)
        }];
        filter_planned = Rally.data.wsapi.Filter.and(filter_planned);

        return filter_actual.or(filter_planned);
    },
    refreshData: function(cmp){
        var start_date = this._getCmpValue(this, '#dt-start'),
            end_date = this._getCmpValue(this, '#dt-end'),
            model = this._getModel();

        this.getBody().removeAll();

        if (start_date === null || end_date === null || model === null){
            this.getBody().add({
                xtype: 'container',
                html: 'Please select a Start Date, End Date and Portfolio Item Type.'
            });
            return;
        }
        cmp.suspendEvents(false);

        var filters = this._getDateFilters(start_date, end_date),
            me = this;

        Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
            models: [model],
            filters: filters,
            autoLoad: true,
            fetch: ['FormattedID','Name','Project','PercentDoneByStoryPlanEstimate','AcceptedLeafStoryPlanEstimateTotal','LeafStoryPlanEstimateTotal','Children'],
            enableHierarchy: true,
            pageSize: 2,
            listeners: {
                scope: me,
                load: me._setRollupData
            }
        }).then({
            scope: this,
            success: function(store) {
                store.model.addField({name: '_rollupDataPreliminaryBudget', type: 'auto', defaultValue: null});
                store.model.addField({name: '_rollupDataTotalCost', type: 'auto', defaultValue: null});
                store.model.addField({name: '_rollupDataRemainingCost', type: 'auto', defaultValue: null});
                store.model.addField({name: '_rollupDataToolTip', type: 'string', defaultValue: null});

                this._updateDisplay(store);
            }
        }).always(function(){
            cmp.resumeEvents();
        });
    },
    _getStoryFetch: function(){
        var fetch = ['ObjectID','Project','ScheduleState','PortfolioItem'];
        if (PortfolioItemCostTracking.CostCalculator.calculationType === 'points'){
            fetch.push('PlanEstimate');
        }
        if (PortfolioItemCostTracking.CostCalculator.calculationType === 'taskHours'){
            fetch = fetch.concat(['TaskEstimateTotal','TaskActualTotal','TaskRemainingTotal']);
        }
        return fetch;

    },
    _setRollupData: function(store, node, records, success){
        console.log('app.js _setRollupData', store, node, records, success);
        var rollup_data = this.rollupData;
        if (!rollup_data) {
            this.rollupData = Ext.create('PortfolioItemCostTracking.RollupData',{
                storyFetch: this._getStoryFetch(),
                portfolioItemTypes: this.portfolioItemTypes,
                listeners: {
                    scope: this,
                    dataUpdated: function(record){
                        console.log('dataChanged', this.rollupData.data, this.down('rallytreegrid').getStore());
                        //this.down('rallytreegrid').getStore().sync();
                        //this.down('rallytreegrid').getView().refresh();
                    }
                }
            });
            rollup_data = this.rollupData;
        }

        _.each(records, function(r) {
            rollup_data.setRollupData(r);
        }, this);
    },
    _updateDisplay: function(store){
        this.getBody().add({
            xtype: 'rallytreegrid',
            columnCfgs: this._getColumnCfgs(),
            store: store
        });
    },
    _getColumnCfgs: function(){

        return [{
            dataIndex: 'Name',
            text: 'Name',
            flex: 5
        },{
            dataIndex: 'Project',
            text: 'Project',
            editor: false
        },{
            dataIndex: 'PreliminaryEstimate',
            text: 'Preliminary Budget',
            align: 'right',
            editor: false,
            renderer: PortfolioItemCostTracking.CostCalculator.preliminaryBudgetRenderer
        }, {
            dataIndex: 'PercentDoneByStoryPlanEstimate',
            text: '% Done by Story Points'
        },{
            dataIndex: "ObjectID",
            text: "Actual Cost",
            renderer: PortfolioItemCostTracking.CostCalculator.actualCostRenderer
        },{
            dataIndex: "ObjectID",
            text: "Remaining Cost",
            renderer: PortfolioItemCostTracking.CostCalculator.costRemainingRenderer
        }];
    },

    getBody: function(){
        return this.down('container[cls=body]');
    },
    getSettingsFields: function() {
        return PortfolioItemCostTracking.Settings.getFields();
    },
    onSettingsUpdate: function (settings){
        //console.log('onSettingsUpdate', settings);
        this.rollupData.clearRollupData();
        this._initializeSettings(settings);
        this._initializeUI();
    }
});
