Ext.define('PortfolioItemCostTracking.RollupDataItem',{

    children: undefined,
    type: undefined,

    preliminaryBudget: null,
    actualCost: 0,
    remainingCost: 0,
    tooltip: undefined,
    /**
     * data is from the record associated with the rollup data
     */
    data: undefined,

    constructor: function(config){
        this.data = config.data;
        this.type = config.type;

        if (this.data.PreliminaryEstimate && this.data.PreliminaryEstimate.Value){
            this.preliminaryBudget = this.data.PreliminaryEstimate.Value  * PortfolioItemCostTracking.CostCalculator.getCostPerUnit(this.data.Project._ref);
        }

        if (this.type.toLowerCase() === 'hierarchicalrequirement' ){
            this.actualCost = PortfolioItemCostTracking.CostCalculator.calculateActualCostForStory(this.data);
            this.remainingCost = PortfolioItemCostTracking.CostCalculator.calculateTotalCostForStory(this.data) - this.actualCost;
        }

    },
    addChild: function(child){
        if (!this.children){
            this.children = [];
        }
        this.children.push(child);
    },
    calculateRollupFromChildren: function(){
        var actual_value = 0,
            total_value = 0;

        _.each(this.children, function (s) {
            total_value += PortfolioItemCostTracking.CostCalculator.calculateTotalCostForStory(s);
            actual_value += PortfolioItemCostTracking.CostCalculator.calculateActualCostForStory(s);
        }, this);

        this.actualCost = actual_value;
        this.remainingCost = total_value - actual_value;
    },
    taskHours: function(){
        var actual_value = 0,
            total_value = 0,
            remaining_value = 0;

        _.each(this.children, function(s){
            total_value += s.TaskEstimateTotal * PortfolioItemCostTracking.CostCalculator.getCostPerUnit(s.Project._ref);
            actual_value += s.TaskActualTotal * PortfolioItemCostTracking.CostCalculator.getCostPerUnit(s.Project._ref);
            remaining_value = s.TaskRemainingTotal * PortfolioItemCostTracking.CostCalculator.getCostPerUnit(s.Project._ref);
        }, this);

        this.actualCost = actual_value;
        this.remainingCost = total_value - actual_value;
    },
    timesheets: function(){
        this.actualCost = 1;
        this.remainingCost = 1;
    }
});
