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

        this._createPickers();

        PortfolioItemCostTracking.WsapiToolbox.fetchDoneStates().then({
            success: function(doneScheduleStates){
                PortfolioItemCostTracking.Settings.completedScheduleStates = doneScheduleStates;
            },
            failure: function(msg){
                Rally.ui.notify.Notifier.showError({message: msg});
            },
            scope: this
        });
    },
    _createPickers: function(piType){

        //var startDate = this.getStartDate(),
        //    endDate = this.getEndDate();
        this.fixedHeader = this.add({ //Ext.create('Ext.container.Container',{
            xtype: 'container',
            itemId: 'header-controls',
            width: 600,
            height: 50,
            layout: {type:  'hbox'},
            padding: '0 0 20 20',
            margin: 10,
            items: [{
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
                    ready: this._initialize
                }
            }]
        });
    },
    _initialize: function(){
        if (this.fixedHeader && this.fixedHeader.down('#cb-type')){
          //  this.fixedHeader.down('#dt-start') && this.fixedHeader.down('#dt-end')){

            //Get the portfolio item types from the combobox since we have just loaded that.
            var portfolioItemTypes = this._initializePortfolioItemTypes(this.fixedHeader.down('#cb-type'));
            this._initializeSettings(this.getSettings(),null, portfolioItemTypes);

            var state = Ext.state.Manager.get(this.getContext().getScopedStateId('cb-type')),
                state_val = state ? state.value : null;
            if (state_val){
                this.fixedHeader.down('#cb-type').setValue(state_val);
            }

            this.fixedHeader.down('#cb-type').on('change', this._onTypeChange, this);
                //this.fixedHeader.down('#dt-start').on('change', this.updateStoreFilters, this);
                //this.fixedHeader.down('#dt-end').on('change', this.updateStoreFilters, this);
                this._onTypeChange(this.fixedHeader.down('#cb-type'));
        }
    },
    _initializePortfolioItemTypes: function(cb){

        var items = cb.getStore().data.items,
            portfolioItemTypes = new Array(items.length);

        Ext.Array.each(items, function(item){
                var idx = Number(item.get('Ordinal'));
                portfolioItemTypes[idx] = { typePath: item.get('TypePath'), name: item.get('Name'), ordinal: idx };
        });
        return  portfolioItemTypes;
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
             this.rollupData = null;
         }
         var me = this;
         this.rollupData = Ext.create('PortfolioItemCostTracking.RollupCalculator', {});

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

    addHeader: function (gb) {
        var header = gb.getHeader();

        if (header) {
            header.getLeft().add(this.fixedHeader);
        }
    },
    _getFilters: function(){
        //var filters = this._getDateFilters(),
        var    custom_filters = [];

        if (this.down('treegridcontainer') && this.down('treegridcontainer').currentCustomFilter){
            custom_filters = this.down('treegridcontainer').currentCustomFilter.filters || [];
        }
        return custom_filters;
        //return Ext.Array.merge(filters, custom_filters);

    },
    _showExportMenu: function () {
        var columnCfgs = this.down('treegridcontainer').getGrid().columnCfgs,
            additionalFields = _.pluck(columnCfgs, 'dataIndex');

        var filters = this._getFilters(),
            fetch = PortfolioItemCostTracking.Settings.getTreeFetch(additionalFields),
            root_model = this.modelNames[0];
        console.log('_showExportMenu', fetch,additionalFields);
         var exporter = new PortfolioItemCostTracking.Exporter();
        exporter.fetchExportData(root_model,filters,fetch,columnCfgs).then({
            scope: this,
            success: function(csv){
                var filename = Ext.String.format("export-{0}.csv",Ext.Date.format(new Date(),"Y-m-d-h-i-s"));
                exporter.saveCSVToFile(csv, filename);
            },
            failure: function(msg){
                Rally.ui.notify.Notifier.showError({message: "An error occurred fetching the data to export:  " + msg});
            }
        });
    },
    updateStoreFilters: function(){

        if (this.down('treegridcontainer')){
            this.down('treegridcontainer').applyCustomFilter(this.down('treegridcontainer').currentCustomFilter);
        }
    },

    _loadRollupData: function(records){

        var loader = Ext.create('PortfolioItemCostTracking.RollupDataLoader',{
            context: this.getContext(),
            rootRecords: records,
            listeners: {
                rollupdataloaded: function(portfolioHash, stories){
                    this._processRollupData(portfolioHash,stories,records);
                },
                loaderror: this._handleLoadError,
                statusupdate: this._showStatus,
                scope: this
            }
        });
        loader.load(records);
    },
    _handleLoadError: function(msg){
        Rally.ui.notify.Notifier.showError({message: msg});
    },
    _processRollupData: function(portfolioHash, stories, records){
        var me = this;
        console.log('rollupdataloaded', portfolioHash, stories.length ,stories, records,records.length);

        portfolioHash[records[0].get('_type').toLowerCase()] = records;
        this.rollupData.addRollupRecords(portfolioHash, stories);
        this.rollupData.updateModels(records);

        me._showStatus(null);
    },
    _showStatus: function(message){
            if (message) {
                Rally.ui.notify.Notifier.showStatus({
                    message: message,
                    showForever: true,
                    closable: false,
                    animateShowHide: false
                });
            } else {
                Rally.ui.notify.Notifier.hide();
            }
    },
    _setRollupData: function(store, node, records, success){

        if (!store.model.getField('_rollupData')){
            store.model.addField({name: '_rollupData', type: 'auto', defaultValue: null});
        }

        var unloadedRecords = this.rollupData.updateModels(records);
        if (unloadedRecords && unloadedRecords.length > 0 && node.parentNode === null){
            this._loadRollupData(unloadedRecords);
        }
        this.down('treegridcontainer').getGrid().getView().refresh();
        //this.down('treegridcontainer').getGrid().refresh()
    },

    _updateStore: function(modelNames){

        var field_names = [];
        Ext.create('Rally.data.wsapi.TreeStoreBuilder').build({
            models: modelNames,
            //filters: filters,
            fetch: PortfolioItemCostTracking.Settings.getTreeFetch(field_names),
            enableHierarchy: true,
            listeners: {
                scope: this,
                load: this._setRollupData
            }
        }).then({
            scope: this,
            success: function(store) {
                 store.model.addField({name: '_rollupData', type: 'auto', defaultValue: null});
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
                stateful: true,
                stateId: this.getContext().getScopedStateId('cost-tree-grid')
            },
            plugins:[{
                ptype: 'treegridcontainercustomfiltercontrol',
                filterControlConfig: {
                    modelNames: modelNames,
                    stateful: true,
                    stateId: this.getContext().getScopedStateId('cost-tree-filter'),
                    margin: '15px 10px 0px 0px'
                }
            },{
                ptype: 'treegridcontainerfieldpicker',
                headerPosition: 'left',
                modelNames: modelNames,
                stateful: true,
                stateId: this.getContext().getScopedStateId('cost-tree-field-picker'),
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
            xtype: 'actualcosttemplatecolumn',
            dataIndex: '_rollupData',
            tooltip: PortfolioItemCostTracking.Settings.getHeaderTooltip('_rollupDataActualCost')
        },{
            text: "Remaining Cost",
            xtype: 'remainingcosttemplatecolumn',
            dataIndex: '_rollupData',
            tooltip: PortfolioItemCostTracking.Settings.getHeaderTooltip('_rollupDataRemainingCost')
        }, {
            text: 'Total Projected',
            xtype: 'totalcosttemplatecolumn',
            dataIndex: '_rollupData',
            tooltip: PortfolioItemCostTracking.Settings.getHeaderTooltip('_rollupDataTotalCost')
        },{
            text: 'Preliminary Budget',
            xtype: 'preliminarybudgettemplatecolumn',
            dataIndex: '_rollupData',
            tooltip: PortfolioItemCostTracking.Settings.getHeaderTooltip('_rollupDataPreliminaryBudget')
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
