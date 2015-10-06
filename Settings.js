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

    /**
     * App configurations
     */

    calculationTypes: {
        points: {
            key: 'points',
            label: 'Based on Story Points',
            displayName: 'Story Points',
            defaultColumns: ['Name', 'Project', 'PlanEstimate', 'LeafStoryPlanEstimateTotal'],
            additionalStoryFetch: ['PlanEstimate'],
            actualUnitsForStoryFn: function(data){
                if (data.PlanEstimate && Ext.Array.contains(PortfolioItemCostTracking.Settings.completedScheduleStates, data.ScheduleState)) {
                    return data.PlanEstimate;
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
            additionalStoryFetch: ['TaskEstimateTotal','TaskActualTotal','TaskRemainingTotal'],
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
            additionalStoryFetch: [],
            disabled: true,
            actualUnitsForStoryFn: function(data){ return 0; },
            actualUnitsForTaskFn: function(data){ return 0; },
            totalUnitsForStoryFn: function(data){  return 0; },
            totalUnitsForTaskFn: function(data){  return 0; }
        }
    },

    portfolioItemFetch: ['ObjectID','Parent','Children','UserStories','PreliminaryEstimate','Value'],
    storyFetch: ['ObjectID','Project','ScheduleState','PortfolioItem'],
    treeFetch: ['FormattedID','Name','Project','PreliminaryEstimate','PlanEstimate','PercentDoneByStoryPlanEstimate','AcceptedLeafStoryPlanEstimateTotal','LeafStoryPlanEstimateTotal','Children','ToDo','Actuals'],

    notAvailableText: '--',

    completedScheduleStates: [],

    currencyData: [
        {name: "US Dollars", value: "$"},
        {name: "Euro", value: "&#128;"},
        {name: "Japanese Yen", value: "&#165;"},
        {name: "Brazilian Real", value: "R$"}
    ],
    setCalculationType: function(type){
        console.log('setCalculationType', type);
        //Check that actuals is on, and warn user if it is not.
        if (type === 'taskHours'){
            Rally.data.ModelFactory.getModel({
                type: 'task',
                success: function(model){
                    var field = model.getField('Actuals');
                    console.log('validate', field);
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
    getTreeFetch: function(fetch){
        if (!fetch){
            fetch = [];
        }
        return Ext.Array.merge(fetch, PortfolioItemCostTracking.Settings.treeFetch);
    },
    getStoryFetch: function(fetch){
        if (!fetch){
            fetch = [];
        }
        fetch = Ext.Array.merge(fetch, PortfolioItemCostTracking.Settings.storyFetch);

        fetch = Ext.Array.merge(fetch, PortfolioItemCostTracking.Settings.getCalculationTypeSettings().additionalStoryFetch);
        return fetch;
    },
    getPortfolioItemFetch: function(fetch){
        if (!fetch){
            fetch = [];
        }
        return Ext.Array.merge(fetch, PortfolioItemCostTracking.Settings.portfolioItemFetch);
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
           // value: current_project_costs,
            readyEvent: 'ready'
        }];
    }
});