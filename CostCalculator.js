Ext.define('PortfolioItemCostTracking.CostCalculator', {
    singleton: true,

    calculationTypeStoryPoints: 'points',
    calculationTypeTaskHours: 'taskHours',
    calculationTypeTimesheets: 'timesheets',
    calculationType: undefined,

    /**
     * Currency display settings to pass into the Ext.util.Format currency function
     */
    currencySign: '$',
    currencyPrecision: 0,
    currencyEnd: false,

    notAvailableText: '--',
    normalizedCostPerUnit: 1,
    projectCostPerUnit: {},

    completedScheduleStates: [],

    getCostPerUnit: function(project_ref){
        //console.log('getCostPerUnit', project_ref, PortfolioItemCostTracking.CostCalculator.projectCostPerUnit);
        return PortfolioItemCostTracking.CostCalculator.projectCostPerUnit[project_ref] || PortfolioItemCostTracking.CostCalculator.normalizedCostPerUnit;
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
        console.log('calculateActualCostForStory', data, PortfolioItemCostTracking.CostCalculator.getCostPerUnit(data.Project._ref),
            PortfolioItemCostTracking.CostCalculator.completedScheduleStates);

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
    formatCost: function(cost){
        return Ext.util.Format.currency(cost, this.currencySign, this.currencyPrecision, this.currencyEnd);
    },
    totalCostRenderer: function(value, metaData, record){
        var cr = PortfolioItemCostTracking.CostCalculator.notAvailableText;
        if (record.get('_rollupDataTotalCost') != null && !isNaN(record.get('_rollupDataTotalCost'))){
            return PortfolioItemCostTracking.CostCalculator.formatCost(record.get('_rollupDataTotalCost'));
        }
        return cr;

    },
    actualCostRenderer: function(value,metaData,record){
        var cr = PortfolioItemCostTracking.CostCalculator.notAvailableText;
        if (record.get('_rollupDataActualCost') != null && !isNaN(record.get('_rollupDataActualCost'))){
            return PortfolioItemCostTracking.CostCalculator.formatCost(record.get('_rollupDataActualCost'));
        }
        return cr;
    },
    costRemainingRenderer: function(value, metaData, record){
        var cr = PortfolioItemCostTracking.CostCalculator.notAvailableText;
        if (record.get('_rollupDataRemainingCost') != null  && !isNaN(record.get('_rollupDataRemainingCost'))){
            return PortfolioItemCostTracking.CostCalculator.formatCost(record.get('_rollupDataRemainingCost'));
        }
        return cr;
    },
    preliminaryBudgetRenderer: function(value,metaData,record){
        var pb = PortfolioItemCostTracking.CostCalculator.notAvailableText;
        if (value && value.Value){
            var cpu = PortfolioItemCostTracking.CostCalculator.getCostPerUnit(record.get('Project')._ref);
            pb = PortfolioItemCostTracking.CostCalculator.formatCost(cpu * value.Value);
        }
        return pb;
    },
    getStoryFetch: function(){
        var fetch = ['ObjectID','Project','ScheduleState','PortfolioItem'];
        if (PortfolioItemCostTracking.CostCalculator.calculationType === 'points'){
            fetch.push('PlanEstimate');
        }
        if (PortfolioItemCostTracking.CostCalculator.calculationType === 'taskHours'){
            fetch = fetch.concat(['TaskEstimateTotal','TaskActualTotal','TaskRemainingTotal']);
        }
        return fetch;

    }

});
