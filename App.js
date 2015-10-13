Ext.define('PortfolioItemCostTracking', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    defaults: {
        startDate: new Date('2015-06-01'),
        endDate: new Date('2016-05-31'),
        groupByRelease: false
    },

    config: {
        defaultSettings: {
            selectedCalculationType: 'points',
            normalizedCostPerUnit: 1000,
            projectCostPerUnit: {},
            currencySign: '$',
            preliminaryBudgetField: 'PreliminaryEstimate'
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
                this._initializeSettings(this.getSettings(), results[1], results[0]);
                this._createPickers(state_val);
            },
            failure: function(msg){
                Rally.ui.notify.Notifier.showError({message: msg});
            }
        });
    },
    _createPickers: function(piType){

        var startDate = this.getStartDate(),
            endDate = this.getEndDate();

        this.fixedHeader = Ext.create('Ext.container.Container',{
            itemId: 'header-controls',
            width: 460,
            height: 50,
            layout: 'hbox',
            padding: '0 0 20 20',
            margin: 10,
            items: [{
                xtype: 'rallydatefield',
                itemId: 'dt-start',
                stateful: true,
                stateId: this.getContext().getScopedStateId('dt-start'),
                stateEvents: ['change'],
                margin: '0 10 0 0',
                padding: 5,
                fieldLabel: 'Start Date',
                labelSeparator: '',
                labelCls: 'lbl',
                labelAlign: 'top',
                listeners: {
                    scope: this,
                    ready: this._attachListeners
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
                    ready: this._attachListeners
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
                    ready: this._attachListeners
                }
            }]
        });

        this.fixedHeader.down('#dt-start').setValue(startDate);
        this.fixedHeader.down('#dt-end').setValue(endDate);
        this.fixedHeader.down('#cb-type').setValue(piType);
    },
    _attachListeners: function(){
        if (this.fixedHeader && this.fixedHeader.down('#cb-type') &&
            this.fixedHeader.down('#dt-start') && this.fixedHeader.down('#dt-end')){

                this.fixedHeader.down('#cb-type').on('change', this._onTypeChange, this);
                this.fixedHeader.down('#dt-start').on('change', this.updateStoreFilters, this);
                this.fixedHeader.down('#dt-end').on('change', this.updateStoreFilters, this);
                this._onTypeChange(this.fixedHeader.down('#cb-type'));
        }
    },
    _onTypeChange: function(piPicker){
        var piType = piPicker.getRecord().get('TypePath');
        this.modelNames = [piType];
        this._initializeGrid(this.modelNames);
    },
    _initializeSettings: function(settings, doneScheduleStates, portfolioItemTypes){

        PortfolioItemCostTracking.Settings.notAvailableText = "--";
        PortfolioItemCostTracking.Settings.currencySign = settings.currencySign;
        PortfolioItemCostTracking.Settings.currencyPrecision = 0;
        PortfolioItemCostTracking.Settings.currencyEnd = false;
        if (doneScheduleStates){
            PortfolioItemCostTracking.Settings.completedScheduleStates = doneScheduleStates;
        }
        if (portfolioItemTypes){
            PortfolioItemCostTracking.Settings.portfolioItemTypes = portfolioItemTypes;
        }

        PortfolioItemCostTracking.Settings.normalizedCostPerUnit = settings.normalizedCostPerUnit;

        var project_cpu = settings.projectCostPerUnit || {};
        if (!Ext.isObject(project_cpu)){
            project_cpu = Ext.JSON.decode(project_cpu);
        }
        PortfolioItemCostTracking.Settings.projectCostPerUnit = project_cpu;

        PortfolioItemCostTracking.Settings.preliminaryBudgetField = settings.preliminaryBudgetField;

        PortfolioItemCostTracking.Settings.setCalculationType(settings.selectedCalculationType);
    },
     _initializeGrid: function(modelNames){

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

        this._updateStore(modelNames);
    },
    getStartDate: function(){
        return this.getDate('dt-start',this.defaults.startDate);
    },
    getEndDate: function(){
        return this.getDate('dt-end',this.defaults.endDate);
    },
    getDate: function(itemId, defaultDate){
        var dt = defaultDate || null,
            cmpId = '#' + itemId;

        if (this.fixedHeader && this.fixedHeader.down(cmpId)){
            dt = this.fixedHeader.down(cmpId).getValue();
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
    _showExportMenu: function () {
        var columnCfgs = this.down('treegridcontainer').getGrid().columnCfgs,
            additionalFields = _.pluck(columnCfgs, 'dataIndex');

        var filters = this._getDateFilters(),//Todo: Add custom filter settings
            fetch = PortfolioItemCostTracking.Settings.getTreeFetch(additionalFields),
            root_model = this.modelNames[0];

         var exporter = new PortfolioItemCostTracking.Exporter();
        exporter.fetchExportData(root_model,filters,fetch,columnCfgs).then({
            scope: this,
            success: function(csv){
                var filename = Ext.String.format("export-{0}.csv",Ext.Date.format(new Date(),"Y-m-d-h-i-s"));
                exporter.saveCSVToFile(csv, filename);
            },
            failure: function(msg){
                console.log('failure',msg);
            }
        });
    },

    _getDateFilters: function(){

        var start_date = this.getStartDate(),
            end_date = this.getEndDate();

        if(start_date === null && end_date === null){
            return null;
        }

        var filter_actual = [],
            filter_planned = [{
                property: 'ActualEndDate',
                value: null
            }];

        if (start_date){
            filter_actual.push({
                property: 'ActualEndDate',
                operator: '>=',
                value: Rally.util.DateTime.toIsoString(start_date)
            });
            filter_planned.push({
                property: 'PlannedEndDate',
                operator: '>=',
                value: Rally.util.DateTime.toIsoString(start_date)
            });
        }

        if (end_date){
            filter_actual.push({
                property: 'ActualEndDate',
                operator: '<',
                value: Rally.util.DateTime.toIsoString(end_date)
            });
            filter_planned.push({
                property: 'PlannedEndDate',
                operator: '<',
                value: Rally.util.DateTime.toIsoString(end_date)
            });
        }

        if (filter_actual.length > 1){
            filter_actual = Rally.data.wsapi.Filter.and(filter_actual);
        }
        if (filter_planned.length > 1){
            filter_planned = Rally.data.wsapi.Filter.and(filter_planned);
        }
        return filter_planned.or(filter_actual);
    },
    updateStoreFilters: function(){
        console.log('UpdateStoreFilters');
        if (this.down('treegridcontainer')){
            this.down('treegridcontainer').storeConfig.filters = this._getDateFilters();
            this.down('treegridcontainer').applyCustomFilter(this.down('treegridcontainer').currentCustomFilter);
        }
    },
    _setRollupData: function(store, node, records, success){
        var rollup_data = this.rollupData;
        if (!rollup_data) {
            this.rollupData = new PortfolioItemCostTracking.RollupData();
            rollup_data = this.rollupData;
        }

        _.each(records, function(r) {
            rollup_data.setRollupData(r);
        }, this);

    },
    _updateStore: function(modelNames){
        var filters = this._getDateFilters();
   
        var field_names = [];

        if (filters === null){
            return;
        }
        Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
            models: modelNames,
            filters: filters,
            fetch: PortfolioItemCostTracking.Settings.getTreeFetch(field_names),
            enableHierarchy: true,
            listeners: {
                scope: this,
                load: this._setRollupData
            }
        }).then({
            scope: this,
            success: function(store) {
                store.model.addField({name: '_rollupDataPreliminaryBudget', type: 'auto', defaultValue: null, displayName: 'Preliminary Budget'});
                store.model.addField({name: '_rollupDataTotalCost', type: 'auto', defaultValue: null, displayName: 'Total Cost'});
                store.model.addField({name: '_rollupDataRemainingCost', type: 'auto', defaultValue: null, displayName: 'Remaining Cost'});
                store.model.addField({name: '_rollupDataActualCost', type: 'auto', defaultValue: null, displayName: 'Actual Cost'});
                store.model.addField({name: '_rollupDataToolTip', type: 'string', defaultValue: null});

                this._updateDisplay(store, modelNames);
            }
        });
    },
    _updateDisplay: function(store, modelNames){
        var me = this;

        this.add({
            xtype: 'treegridcontainer',
            context: this.getContext(),
            gridConfig: {
                columnCfgs: this._getColumnCfgs(),
                derivedColumns: this._getDerivedColumns(),
                store: store,
                storeConfig: {
                    filters: this._getDateFilters()
                },
                stateful: true,
                stateId: this.getContext().getScopedStateId('cost-tree-grid')
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
                    this.addHeader(gb);
                },
                scope: this
            },
            height: this.getHeight()
        });
    },
    _getDerivedColumns: function(){
        return [{
            text: "Actual Cost To Date",
            align: 'right',
            xtype: 'costtemplatecolumn',
            dataIndex: '_rollupDataActualCost'
        },{
            text: "Remaining Cost",
            align: 'right',
            xtype: 'costtemplatecolumn',
            dataIndex: '_rollupDataRemainingCost'
        }, {
            text: 'Total Projected',
            align: 'right',
            xtype: 'costtemplatecolumn',
            dataIndex: '_rollupDataTotalCost'
        },{
            text: 'Preliminary Budget',
            align: 'right',
            xtype: 'costtemplatecolumn',
            dataIndex: '_rollupDataPreliminaryBudget'
        }];
    },
    _getColumnCfgs: function(){

        return  [{
            dataIndex: 'Name',
            text: 'Name',
            flex: 5
        },{
            dataIndex: 'Project',
            text: 'Project',
            editor: false
        },{
            dataIndex: 'LeafStoryPlanEstimateTotal',
            text: 'Plan Estimate Total'
        }, {
            dataIndex: 'PercentDoneByStoryPlanEstimate',
            text: '% Done by Story Points'
        }];
    },
    getSettingsFields: function() {
        return PortfolioItemCostTracking.Settings.getFields(this.getSettings());
    },
    onSettingsUpdate: function(settings){
        this._initializeSettings(settings);
        this._initializeGrid(this.modelNames);
    }
});
