Ext.define('PortfolioItemCostTracking.Settings', {
    singleton: true,

    /**
     * App Settings
     */
    selectedCalculationType: undefined,
    /**
     * Currency display settings to pass into the Ext.util.Format currency function
     */
    currencySign: '$',
    currencyPrecision: 0,
    currencyEnd: false,

    normalizedCostPerUnit: 1,
    projectCostPerUnit: {},

    preliminaryBudgetField: 'PreliminaryEstimate',
    /**
     * App configurations
     */

    tooltipActualCost: 'actualcost ',
    tooltipTotalCost: 'totalcost',
    tooltipRemainingCost: 'remaining cost',
    tooltipPreliminaryBudget: 'preliminary budget',

    calculationTypes: {
        points: {
            key: 'points',
            label: 'Based on Story Points',
            displayName: 'Story Points',
            defaultColumns: ['Name', 'Project', 'PlanEstimate', 'LeafStoryPlanEstimateTotal','AcceptedLeafStoryPlanEstimateTotal'],
            requiredStoryFetch: ['ScheduleState','PortfolioItem','PlanEstimate'],
            requiredTaskFetch: [],
            tooltips: {
                _rollupDataActualCost: 'Actual Cost is the sum of the Accepted Story Plan Estimates <i>for all stories in scope</i> * Cost Per Unit for the project that the top level story resides in.',
                _rollupDataRemainingCost: 'Remaining Cost is the Total Projected Cost - Actual Cost',
                _rollupDataTotalCost: 'Total Projected Cost is the sum of the Plan Estimate <i>for each story in scope</i>* Cost Per Unit for the project that the top level story resides in.  <br/><br/> If a Portfolio Item does not have any estimated stories and the Preliminary Budget is greater than the Portfolio Item\'s Actual Cost, then the Preliminary Budget will be used for the Total Projected Cost.',
                _rollupDataPreliminaryBudget: 'The prelimary budget will be calculated by multiplying the value of the selected field by the Cost per Unit for the project of the portfolio item. <br/><br/> Note that for portfolio item types beyond the lowest level, this is calculated from the preliminary estimate of the portfolio item, not from the sum of the portfolio item children.  If the selected field value is null, then -- will be displayed.'
            },
            actualUnitsForStoryFn: function(data){
                if (data.PlanEstimate && Ext.Array.contains(PortfolioItemCostTracking.Settings.completedScheduleStates, data.ScheduleState)) {
                    return data.PlanEstimate || 0;
                }
                return 0;
            },
            totalUnitsForStoryFn: function(data){
                return data.PlanEstimate || 0;
            }
        },
        taskHours: {
            key: 'taskHours',
            displayName: 'Task Actuals',
            label: 'Based on Task Actuals',
            defaultColumns: ['Name','Project'],
            requiredStoryFetch: ['ScheduleState','PortfolioItem','TaskEstimateTotal','TaskActualTotal','TaskRemainingTotal'],
            requiredTaskFetch: ['ToDo','Actuals'],
            tooltips: {
                _rollupDataActualCost: 'Actual Cost is the sum of the Task Actuals <i>for all stories in scope</i> * Cost Per Unit for the project that the top level story resides in.',
                _rollupDataRemainingCost: 'Remaining Cost is the sum of the ToDo <i>for all stories in scope</i> * Cost Per Unit for the project that the top level story resides in.',
                _rollupDataTotalCost: 'Total Projected Cost is the sum of the Task Estimate Total <i>for each story in scope</i> * Cost Per Unit for the project that the top level story resides in.  <br/><br/> If a Portfolio Item does not have any estimated stories and the Preliminary Budget is greater than the Portfolio Item\'s Actual Cost, then the Preliminary Budget will be used for the Total Projected Cost.',
                _rollupDataPreliminaryBudget: 'The prelimary budget will be calculated by multiplying the value of the selected field by the Cost per Unit for the project of the portfolio item. <br/><br/> Note that for portfolio item types beyond the lowest level, this is calculated from the preliminary estimate of the portfolio item, not from the sum of the portfolio item children.  If the selected field value is null, then -- will be displayed.'
            },
            actualUnitsForStoryFn: function(data){ return data.TaskActualTotal || 0; },
            totalUnitsForStoryFn: function(data){
                return (data.TaskActualTotal || 0) + (data.TaskRemainingTotal || 0);
            },
            actualUnitsForTaskFn: function(data){
                return data.Actuals || 0;
            },
            totalUnitsForTaskFn: function(data){
                return (data.ToDo || 0) + (data.Actuals || 0);
            }
        },
        timesheets: {
            key: 'timesheets',
            displayName: 'Time Spent',
            label: 'Based on Timesheets',
            defaultColumns: ['Name','Project'],
            requiredStoryFetch: [],
            requiredTaskFetch: [],
            disabled: true,
            actualUnitsForStoryFn: function(data){ return 0; },
            actualUnitsForTaskFn: function(data){ return 0; },
            totalUnitsForStoryFn: function(data){  return 0; },
            totalUnitsForTaskFn: function(data){  return 0; }
        }
    },

    /**
     * Required fetch fields in addition to what the Tree might fetch.  We need these for the rollup data fetch lists and for group by Release
     */
    requiredPortfolioItemFetch: ['UserStories'],
    requiredFetch: ['ObjectID','FormattedID','Project','Parent','Children','Release','Name'],

    notAvailableText: '--',

    completedScheduleStates: [],

    portfolioItemTypes: [],

    currencyData: [
        {name: "US Dollars", value: "$"},
        {name: "Euro", value: "&#128;"},
        {name: "Japanese Yen", value: "&#165;"},
        {name: "Brazilian Real", value: "R$"}
    ],
    getHeaderTooltip: function(field){
        var settings = PortfolioItemCostTracking.Settings.getCalculationTypeSettings();
        return settings.tooltips[field] || null;

    },
    setCalculationType: function(type){
         //Check that actuals is on, and warn user if it is not.
        if (type === 'taskHours'){
            Rally.data.ModelFactory.getModel({
                type: 'task',
                success: function(model){
                    var field = model.getField('Actuals');
                    if (field && field.hidden){
                        Rally.ui.notify.Notifier.showWarning({message: 'The Task Actuals field is not visible in the current project.  As a result, Task Actuals values may be 0.'});
                    }
                }
            });
        }


        if (PortfolioItemCostTracking.Settings.calculationTypes[type]){
            PortfolioItemCostTracking.Settings.selectedCalculationType = type;
        } else {
            PortfolioItemCostTracking.Settings.selectedCalculationType = 'points';
        }
    },
    /**
     * getPortfolioItemTypeLevel
     * @param modelName
     * Given a model name, this function returns the level of portfolio item the model name is:
     *  0 = Lowest Level (Feature)
     *  1 = Second Level (e.g. Initiative)
     *  ...
     *  return -1 if the modelName is not a portfolio item type
     */
    getPortfolioItemTypeLevel: function(modelName){
        var idx = _.indexOf(PortfolioItemCostTracking.Settings.getPortfolioItemTypes(), modelName.toLowerCase());
        return idx;
    },
    getRollupItemType: function(type){
        var idx = _.indexOf(PortfolioItemCostTracking.Settings.getPortfolioItemTypes(), type.toLowerCase());
        if (idx > 0){
            return 'PortfolioItemCostTracking.UpperLevelPortfolioRollupItem';
        }
        if (idx === 0){
            return 'PortfolioItemCostTracking.LowestLevelPortfolioRollupItem';
        }
        return null;
    },
    getPortfolioItemTypes: function(){
        return _.map( this.portfolioItemTypes, function(p){ return p.typePath.toLowerCase(); });
    },
    getPortfolioItemTypeObjects: function(){
        return this.portfolioItemTypes;
    },
    getTypePathDisplayName: function(piTypePath){
        if (piTypePath.toLowerCase() === 'hierarchicalrequirement'){
            return 'User Story';
        }

        var piDisplayName = '';

        Ext.Array.each(this.portfolioItemTypes, function(p){
            if (p.typePath.toLowerCase() === piTypePath.toLowerCase()){
                piDisplayName = p.name;
                return false;
            }
        });
        return piDisplayName;
    },
    getCalculationTypeSettings: function(){
        return PortfolioItemCostTracking.Settings.calculationTypes[PortfolioItemCostTracking.Settings.selectedCalculationType] || PortfolioItemCostTracking.Settings.calculationTypes.points;
    },
    getCalculationTypeDisplayName: function(){
        return PortfolioItemCostTracking.Settings.getCalculationTypeSettings().displayName || 'Unknown';
    },
    formatCost: function(cost){
        return Ext.util.Format.currency(cost,
            PortfolioItemCostTracking.Settings.currencySign,
            PortfolioItemCostTracking.Settings.currencyPrecision,
            PortfolioItemCostTracking.Settings.currencyEnd);
    },
    getCostPerUnit: function(project_ref){
        return PortfolioItemCostTracking.Settings.projectCostPerUnit[project_ref] || PortfolioItemCostTracking.Settings.normalizedCostPerUnit;
    },

    isProjectUsingNormalizedCost: function(project_ref){
        if (PortfolioItemCostTracking.Settings.projectCostPerUnit[project_ref]){
            return false;
        }
        return true;
    },
    /**
     * This function returns all the fields that we want to return for the tree. It is built depending on the settings for cost calculations so
     * that we know to include all necessary fields.
     * @param fetch
     * @returns {*}
     */
    getTreeFetch: function(fetch){
        if (!fetch){
            fetch = [];
        }


       return Ext.Array.merge(PortfolioItemCostTracking.Settings.getStoryFetch(),
                                PortfolioItemCostTracking.Settings.getPortfolioItemFetch(),
                                (PortfolioItemCostTracking.Settings.getCalculationTypeSettings().requiredTaskFetch || []));

    },
    getStoryFetch: function(fetch){
        if (!fetch){
            fetch = [];
        }

        return Ext.Array.merge(fetch, PortfolioItemCostTracking.Settings.requiredFetch,
                        PortfolioItemCostTracking.Settings.getCalculationTypeSettings().requiredStoryFetch);

    },
    getPortfolioItemFetch: function(fetch){
        if (!fetch){
            fetch = [];
        }

        return Ext.Array.merge(PortfolioItemCostTracking.Settings.requiredFetch,
            PortfolioItemCostTracking.Settings._getPreliminaryBudgetFields(),
            PortfolioItemCostTracking.Settings.requiredPortfolioItemFetch);

    },
    _getPreliminaryBudgetFields: function(){
        var preliminaryBudgetFields = [PortfolioItemCostTracking.Settings.preliminaryBudgetField];
        if (PortfolioItemCostTracking.Settings.preliminaryBudgetField === "PreliminaryEstimate"){
            preliminaryBudgetFields.push('Value');
        }
        return preliminaryBudgetFields;
    },
    getFields: function(config) {

        var current_calculation_type = (config && config.selectedCalculationType) || 'points',
            current_project_costs = (config && config.projectCostPerUnit) || {};

        var currency_store = Ext.create('Rally.data.custom.Store', {
            data: PortfolioItemCostTracking.Settings.currencyData
        });
        var labelWidth = 100;

        var cost_items = [];
        _.each(PortfolioItemCostTracking.Settings.calculationTypes, function(obj, key){
            cost_items.push({
                boxLabel: obj.label || key,
                name: 'selectedCalculationType',
                inputValue: key,
                disabled: obj.disabled || false,
                checked: key === current_calculation_type
            });
        });

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
            xtype: 'numberfieldcombobox',
            name: 'preliminaryBudgetField',
            fieldLabel: 'Calculate Preliminary Budget using',
            model: 'PortfolioItem',
            labelWidth: labelWidth,
            margin: '10 0 10 0'
        },{
            xtype: 'radiogroup',
            fieldLabel: 'Calculate Cost',
            columns: 1,
            vertical: true,
            labelWidth: labelWidth,
            margin: '10 0 10 0',
            items: cost_items
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
            value: current_project_costs,
            readyEvent: 'ready'
        }];
    }
});