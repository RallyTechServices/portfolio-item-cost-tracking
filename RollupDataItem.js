Ext.define('PortfolioItemCostTracking.RollupDataItem',{

    children: undefined,
    type: undefined,

    preliminaryBudget: null,
    actualCost: 0,
    remainingCost: 0,
    totalCost: 0,
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
            this.totalCost = PortfolioItemCostTracking.CostCalculator.calculateTotalCostForStory(this.data);
        }

        if (this.type.toLowerCase() === 'task'){
            this.actualCost = PortfolioItemCostTracking.CostCalculator.calculateActualCostForTask(this.data);
            this.totalCost = PortfolioItemCostTracking.CostCalculator.calculateTotalCostForTask(this.data);
            if (this.actualCost === null || this.totalCost === null) {
                this.remainingCost = null;
            } else {
                this.remainingCost = this.totalCost - this.actualCost;
            }
        }
    },
    addChild: function(child){
        if (!this.children){
            this.children = [];
        }
        this.children.push(child);
    },
    calculateRollupFromChildren: function(){

        var noRollups = ['task','hierarchicalrequirement'];
        if (Ext.Array.contains(noRollups, this.type.toLowerCase())){
            return;
        }

        var actual_value = 0,
            total_value = 0;

        _.each(this.children, function (s) {
            total_value += PortfolioItemCostTracking.CostCalculator.calculateTotalCostForStory(s);
            actual_value += PortfolioItemCostTracking.CostCalculator.calculateActualCostForStory(s);
        }, this);

        this.totalCost = total_value;
        this.actualCost = actual_value;
        this.remainingCost = total_value - actual_value;
    }
});
