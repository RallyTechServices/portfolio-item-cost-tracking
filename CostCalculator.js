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

    notAvailableText: '',
    normalizedCostPerUnit: 1,
    projectCostPerUnit: {},

    completedScheduleStates: [],

    getCostPerUnit: function(project_ref){
        console.log('getCostPerUnit', project_ref, this.projectCostPerUnit);
        return this.projectCostPerUnit[project_ref] || this.normalizedCostPerUnit;
    },
    calculateTotalCostForStory: function(data){
        switch(PortfolioItemCostTracking.CostCalculator.calculationType){

            case 'points':
               if (data.PlanEstimate){
                    return data.PlanEstimate * PortfolioItemCostTracking.CostCalculator.getCostPerUnit(data.Project._ref);
               }
               return null;

            case 'taskHours':
                //return data.TaskEstimateTotal * PortfolioItemCostTracking.CostCalculator.getCostPerUnit(data.Project._ref);
                return (data.TaskRemainingTotal + data.TaskActualTotal) * PortfolioItemCostTracking.CostCalculator.getCostPerUnit(data.Project._ref);

            case 'timesheets':
                return 2;
        }
        return null;
    },
    calculateActualCostForStory: function(data){
        switch(PortfolioItemCostTracking.CostCalculator.calculationType){

            case 'points':
                if (data.PlanEstimate && Ext.Array.contains(PortfolioItemCostTracking.CostCalculator.completedScheduleStates, data.ScheduleState)) {
                    return data.PlanEstimate * PortfolioItemCostTracking.CostCalculator.getCostPerUnit(data.Project._ref);
                }
                break;

            case 'taskHours':
                return data.TaskActualTotal * PortfolioItemCostTracking.CostCalculator.getCostPerUnit(data.Project._ref);

            case 'timesheets':
                return 1;
        }
        return null;
    },
    formatCost: function(cost){
        return Ext.util.Format.currency(cost, this.currencySign, this.currencyPrecision, this.currencyEnd);
    },
    actualCostRenderer: function(value,metaData,record){
        var cr = PortfolioItemCostTracking.CostCalculator.notAvailableText;
        if (!isNaN(record.get('_rollupDataTotalCost'))){
            return PortfolioItemCostTracking.CostCalculator.formatCost(record.get('_rollupDataTotalCost'));
        }
        return cr;
    },
    costRemainingRenderer: function(value, metaData, record){
        var cr = PortfolioItemCostTracking.CostCalculator.notAvailableText;
        if (!isNaN(record.get('_rollupDataRemainingCost'))){
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
    }

});
