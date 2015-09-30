Ext.define('PortfolioItemCostTracking', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    defaults: {
        startDate: new Date('2015-01-01'),
        endDate: new Date('2015-12-31'),
        groupByRelease: false
    },

    config: {
        defaultSettings: {
            calculationType: 'points',
            normalizedCostPerUnit: 1000,
            projectCostPerUnit: {},
            currencySign: '$'
        }
    },

    items: [],

    portfolioItemRollupData: {},

    launch: function() {

        //ToDO: check for RPM?

        //Initialize the filter values...
        var state = Ext.state.Manager.get(this.getContext().getScopedStateId('cb-type')),
            state_val = state ? state.value : null;


       Deft.Promise.all([
            PortfolioItemCostTracking.WsapiToolbox.fetchPortfolioItemTypes(),
            PortfolioItemCostTracking.WsapiToolbox.fetchDoneStates(),
            PortfolioItemCostTracking.WsapiToolbox.fetchModelTypePathByTypeDefinition(state_val)
        ]).then({
            scope: this,
            success: function(results){
                this.portfolioItemTypes = results[0];
                this._initializeSettings(this.getSettings(), results[1]);
                this._createPickers();
            },
            failure: function(msg){
                Rally.ui.notify.Notifier.showError({message: msg});
            }
        });
    },
    _createPickers: function(){

        this.fixedHeader = Ext.create('Ext.container.Container',{
            itemId: 'header-controls',
            width: 460,
            layout: 'hbox',
            margin: '0 20 0 0',
            padding: '0 0 0 20',
            items: [{
                xtype: 'rallydatefield',
                itemId: 'dt-start',
                stateful: true,
                stateId: this.getContext().getScopedStateId('dt-start'),
                stateEvents: ['change'],
                margin: '0 10 0 0',
                fieldLabel: 'Start Date',
                labelSeparator: '',
                labelCls: 'lbl',
                labelAlign: 'top',
                listeners: {
                    scope: this,
                    change: this.updateStoreFilters
                }
            },{
                xtype: 'rallydatefield',
                itemId: 'dt-end',
                stateful: true,
                stateId: this.getContext().getScopedStateId('dt-end'),
                stateEvents: ['change'],
                margin: '0 10 0 0',
                labelSeparator: '',
                labelCls: 'lbl',
                fieldLabel: 'End Date',
                labelAlign: 'top',
                listeners: {
                    scope: this,
                    change: this.updateStoreFilters
                }
            },{
                xtype: 'rallyportfolioitemtypecombobox',
                itemId: 'cb-type',
                stateful: true,
                stateId: this.getContext().getScopedStateId('cb-type'),
                stateEvents: ['change'],
                margin: '0 10 0 0',
                fieldLabel: 'Portfolio Item Type',
                labelAlign: 'top',
                labelCls: 'lbl',
                listeners: {
                    scope: this,
                    ready: function (picker) {
                        console.log('ready');
                    }
                }
            }]
        });
        this.fixedHeader.down('#cb-type').on('change', this._onTypeChange, this);
    },
    _onTypeChange: function(piPicker){
        var piType = piPicker.getRecord().get('TypePath');
        this.modelNames = [piType];
        this._initializeGrid(this.modelNames);
    },
    _initializeSettings: function(settings, doneScheduleStates){

        PortfolioItemCostTracking.CostCalculator.notAvailableText = "--";
        PortfolioItemCostTracking.CostCalculator.currencySign = settings.currencySign;
        PortfolioItemCostTracking.CostCalculator.currencyPrecision = 0;
        PortfolioItemCostTracking.CostCalculator.currencyEnd = false;
        if (doneScheduleStates){
            PortfolioItemCostTracking.CostCalculator.completedScheduleStates = doneScheduleStates;
        }

        PortfolioItemCostTracking.CostCalculator.normalizedCostPerUnit = settings.normalizedCostPerUnit;

        var project_cpu = settings.projectCostPerUnit || {};
        if (!Ext.isObject(project_cpu)){
            project_cpu = Ext.JSON.decode(project_cpu);
        }
        PortfolioItemCostTracking.CostCalculator.projectCostPerUnit = project_cpu;

        PortfolioItemCostTracking.CostCalculator.calculationType = settings.calculationType || 'points';
    },

     _initializeGrid: function(modelNames){
        var me = this;

        if (this.rollupData){
            this.rollupData.clearRollupData();
        }

        if (this.down('treegridcontainer')){
            if (this.fixedHeader && this.fixedHeader.rendered) {
                var parent = this.fixedHeader.up();
                if(parent && parent.remove){
                    parent.remove(this.fixedHeader, false);
                }
            }
            this.down('treegridcontainer').destroy();
        }

        var filters = this._getDateFilters();
        console.log('filters', filters.toString());
        Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
            models: modelNames,
            filters: filters,
            fetch: ['FormattedID','Name','Project','PreliminaryEstimate','PercentDoneByStoryPlanEstimate','AcceptedLeafStoryPlanEstimateTotal','LeafStoryPlanEstimateTotal','Children','ToDo','Actuals'],
            enableHierarchy: true,
            listeners: {
                scope: me,
                load: me._setRollupData
            }
        }).then({
            scope: this,
            success: function(store) {
                store.model.addField({persist: false, name: '_rollupDataPreliminaryBudget', type: 'auto', defaultValue: null, displayName: 'Preliminary Budget'});
                store.model.addField({persist: false, name: '_rollupDataTotalCost', type: 'auto', defaultValue: null, displayName: 'Total Cost'});
                store.model.addField({persist: false, name: '_rollupDataRemainingCost', type: 'auto', defaultValue: null, displayName: 'Remaining Cost'});
                store.model.addField({persist: false, name: '_rollupDataActualCost', type: 'auto', defaultValue: null, displayName: 'Actual Cost'});
                store.model.addField({persist: false, name: '_rollupDataToolTip', type: 'string', defaultValue: null});

                this._updateDisplay(store, modelNames);
            }
        });
    },
    getStartDate: function(){
        return this.getDate('dt-start',this.defaults.startDate);
    },
    getEndDate: function(){
        return this.getDate('dt-end',this.defaults.endDate);
    },
    getDate: function(itemId, defaultDate){
        var dt = defaultDate,
            cmpId = '#' + itemId;

        if (this.down(cmpId)){
            dt = this.down(cmpId).getValue();
        } else {
            var state = Ext.state.Manager.get(this.getContext().getScopedStateId(itemId));
            if (state && state.value){
                dt = new Date(state.value);
            }
        }
        return dt;
    },
    addHeader: function (gb) {
        var header = gb.getHeader();

        if (header) {
            header.getLeft().add(this.fixedHeader);
        }
    },
    _showExportMenu: function (button) {
        console.log('export');
    },
    _getDateFilters: function(){

        var start_date = this.getStartDate(),
            end_date = this.getEndDate();

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
    updateStoreFilters: function(){
        if (this.down('treegridcontainer')){
            this.down('treegridcontainer').storeConfig.filters = this._getDateFilters();
            this.down('treegridcontainer').applyCustomFilter(this.down('treegridcontainer').currentCustomFilter);
        }
    },
    _setRollupData: function(store, node, records, success){
         var rollup_data = this.rollupData;
        if (!rollup_data) {
            this.rollupData = Ext.create('PortfolioItemCostTracking.RollupData',{
                portfolioItemTypes: this.portfolioItemTypes
            });
            rollup_data = this.rollupData;
        }

        _.each(records, function(r) {
            rollup_data.setRollupData(r);
        }, this);
    },
    _updateDisplay: function(store, modelNames){
        var me = this;

        this.add({
            xtype: 'treegridcontainer',
            context: this.getContext(),
            storeConfig: {
                filters: this._getDateFilters()
            },
            gridConfig: {
                columnCfgs: this._getColumnCfgs(),
                store: store,
                stateId: this.getContext().getScopedStateId('cost-grid-test7'),
                stateful: true
            },
            plugins:[{
                ptype: 'treegridcontainercustomfiltercontrol',
                filterControlConfig: {
                    modelNames: modelNames,
                    stateful: true,
                    stateId: this.getContext().getScopedStateId('cost-grid-filter'),
                    margin: '15px 10px 0px 0px'
                },
                showOwnerFilter: true,
                ownerFilterControlConfig: {
                    stateful: true,
                    stateId: this.getContext().getScopedStateId('cost-grid-owner-filter'),
                    margin: '15px 10px 0px 0px'
                }
            },{
                ptype: 'treegridcontainerfieldpicker',
                headerPosition: 'left',
                modelNames: modelNames,
                alwaysSelectedFields: ['_rollupDataPreliminaryBudget','_rollupDataTotalCost','_rollupDataRemainingCost','_rollupDataActualCost'],
                stateful: true,
                stateId: this.getContext().getScopedStateId('cost-grid-field-picker'),
                margin: '15px 0px 10px 10px'
            },{
                ptype: 'rallygridboardactionsmenu',
                menuItems: [
                    {
                        text: 'Export...',
                        handler: me._showExportMenu,
                        scope: me
                    }
                ],
                buttonConfig: {
                    iconCls: 'icon-export',
                    margin: '15px 10px 0px 0px'
                }
            }],
            listeners: {
                beforerender: function(gb){
                    console.log('beforeRender');
                    this.addHeader(gb);
                },
                scope: this
            },
            height: this.getHeight()
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
            editor: false,
            isCellEditable: false
        },{
            dataIndex: 'PercentDoneByStoryPlanEstimate',
            text: '% Done by Story Points'
        },{
            dataIndex: '_rollupDataPreliminaryBudget',
            text: 'Preliminary Budget',
            align: 'right',
            xtype: 'costtemplatecolumn',
            costField: '_rollupDataPreliminaryBudget'
        }, {
            dataIndex: '_rollupDataTotalCost',
            text: 'Total Projected',
            align: 'right',
            xtype: 'costtemplatecolumn',
            costField: '_rollupDataTotalCost'
        },{
            dataIndex: '_rollupDataActualCost',
            text: "Actual Cost To Date",
            align: 'right',
            xtype: 'costtemplatecolumn',
            costField: '_rollupDataActualCost'
        },{
            dataIndex: '_rollupDataRemainingCost',
            text: "Remaining Cost",
            align: 'right',
            xtype: 'costtemplatecolumn',
            costField: '_rollupDataRemainingCost'
        }];
    },
    getSettingsFields: function() {
        return PortfolioItemCostTracking.Settings.getFields();
    },
    onSettingsUpdate: function (settings){
        this._initializeSettings(settings);
        this._initializeGrid(this.modelNames);
    }
});
