Ext.define('PortfolioItemCostTracking.CostCalculator', {
    singleton: true,

    calculationTypeStoryPoints: 'points',
    calculationTypeTaskHours: 'taskHours',
    calculationTypeTimesheets: 'timesheets',

    notAvailableText: '--',

    completedScheduleStates: [],

    /**
     * App Settings
     */
    calculationType: undefined,

    /**
     * Currency display settings to pass into the Ext.util.Format currency function
     */
    currencySign: '$',
    currencyPrecision: 0,
    currencyEnd: false,

    normalizedCostPerUnit: 1,
    projectCostPerUnit: {},


    getCostPerUnit: function(project_ref){
        return PortfolioItemCostTracking.CostCalculator.projectCostPerUnit[project_ref] || PortfolioItemCostTracking.CostCalculator.normalizedCostPerUnit;
    },
    isProjectUsingNormalizedCost: function(project_ref){
        if (PortfolioItemCostTracking.CostCalculator.projectCostPerUnit[project_ref]){
            return false;
        }
        return true;
    },
    getActualUnitsForTask: function(data){
        switch(PortfolioItemCostTracking.CostCalculator.calculationType){

            case 'points':
                return null;

            case 'taskHours':
                return data.Actuals || 0;

            case 'timesheets':
                return 1;
        }
        return null;
    },
    getTotalUnitsForTask: function(data){
        switch(PortfolioItemCostTracking.CostCalculator.calculationType){

            case 'points':
                return null;

            case 'taskHours':
                return (data.ToDo || 0 + data.Actuals || 0);

            case 'timesheets':
                return 1;
        }
        return null;
    },
    getActualUnitsForStory: function(data){
        switch(PortfolioItemCostTracking.CostCalculator.calculationType){

            case 'points':
                if (data.PlanEstimate && Ext.Array.contains(PortfolioItemCostTracking.CostCalculator.completedScheduleStates, data.ScheduleState)) {
                    return data.PlanEstimate;
                }
                return 0;

            case 'taskHours':
                return data.TaskActualTotal || 0;

            case 'timesheets':
                return 1;
        }
        return null;
    },
    getTotalUnitsForStory: function(data){
        switch(PortfolioItemCostTracking.CostCalculator.calculationType){

            case 'points':
                return data.PlanEstimate || 0;

            case 'taskHours':
                return (data.TaskActualTotal || 0) + (data.TaskRemainingTotal || 0);

            case 'timesheets':
                return 1;
        }
        return null;
    },
    calculateTotalCostForStory: function(data){
        switch(PortfolioItemCostTracking.CostCalculator.calculationType){

            case 'points':
               if (data.PlanEstimate){
                    return data.PlanEstimate * PortfolioItemCostTracking.CostCalculator.getCostPerUnit(data.Project._ref);
               }
               return 0;

            case 'taskHours':
                //return data.TaskEstimateTotal * PortfolioItemCostTracking.CostCalculator.getCostPerUnit(data.Project._ref);
                return (data.TaskActualTotal + data.TaskRemainingTotal) * PortfolioItemCostTracking.CostCalculator.getCostPerUnit(data.Project._ref);

            case 'timesheets':
                return 2;
        }
        return null;
    },
    calculateActualCostForStory: function(data){
       // console.log('calculateActualCostForStory', data, PortfolioItemCostTracking.CostCalculator.getCostPerUnit(data.Project._ref),
       //     PortfolioItemCostTracking.CostCalculator.completedScheduleStates);

        switch(PortfolioItemCostTracking.CostCalculator.calculationType){

            case 'points':
                if (data.PlanEstimate && Ext.Array.contains(PortfolioItemCostTracking.CostCalculator.completedScheduleStates, data.ScheduleState)) {
                    return data.PlanEstimate * PortfolioItemCostTracking.CostCalculator.getCostPerUnit(data.Project._ref);
                }
                return 0;

            case 'taskHours':
                return (data.TaskActualTotal || 0) * PortfolioItemCostTracking.CostCalculator.getCostPerUnit(data.Project._ref);

            case 'timesheets':
                return 1;
        }
        return null;
    },
    calculateTotalCostForTask: function(data){

        switch(PortfolioItemCostTracking.CostCalculator.calculationType){

            case 'points':
                break;

            case 'taskHours':
                return (data.ToDo || 0 + data.Actuals || 0) * PortfolioItemCostTracking.CostCalculator.getCostPerUnit(data.Project._ref);

            case 'timesheets':
                return 1;
        }
        return null;
    },
    calculateActualCostForTask: function(data){

        switch(PortfolioItemCostTracking.CostCalculator.calculationType){

            case 'points':
                break;

            case 'taskHours':
                return (data.Actuals || 0) * PortfolioItemCostTracking.CostCalculator.getCostPerUnit(data.Project._ref);

            case 'timesheets':
                return 1;
        }
        return null;
    },
    calculatePreliminaryBudget: function(data){
        var pb = 0;
        if (data && data.PreliminaryEstimate && data.PreliminaryEstimate.Value){
            var cpu = PortfolioItemCostTracking.CostCalculator.getCostPerUnit(data.Project._ref);
            pb = cpu * data.PreliminaryEstimate.Value;
        }
        return pb;
    },

    formatCost: function(cost){
        return Ext.util.Format.currency(cost, this.currencySign, this.currencyPrecision, this.currencyEnd);
    },
    getStoryFetch: function(fetch){
        if (!fetch){
            fetch = [];
        }

        fetch = Ext.Array.merge(fetch, ['ObjectID','Project','ScheduleState','PortfolioItem']);
        if (PortfolioItemCostTracking.CostCalculator.calculationType === 'points'){
            fetch = Ext.Array.merge(fetch, ['PlanEstimate']);
        }
        if (PortfolioItemCostTracking.CostCalculator.calculationType === 'taskHours'){
            fetch = Ext.Array.merge(fetch, ['TaskEstimateTotal','TaskActualTotal','TaskRemainingTotal']);
        }
        return fetch;
    },
    getPortfolioItemFetch: function(fetch){
        if (!fetch){
            fetch = [];
        }
        fetch = Ext.Array.merge(fetch, ['ObjectID','Parent','Children','UserStories','PreliminaryEstimate','Value']);
        return fetch;
    }

});
