Ext.define('PortfolioItemCostTracking.RollupDataItem',{

    children: undefined,
    type: undefined,



    totalUnits: null,
    actualUnits: null,
    preliminaryBudget: null,
    actualCost: 0,
    remainingCost: 0,
    totalCost: 0,
    tooltip: undefined,
    projects: undefined,
    /**
     * data is from the record associated with the rollup data
     */
    data: undefined,

    constructor: function(config){
        this.data = config.data;
        this.type = config.type;
        this._updateProjectNameAndCostHash(this.data.Project);

        if (this.data.PreliminaryEstimate && this.data.PreliminaryEstimate.Value){
            this.preliminaryBudget = this.data.PreliminaryEstimate.Value  * PortfolioItemCostTracking.CostCalculator.getCostPerUnit(this.data.Project._ref);
        }

        if (this.type.toLowerCase() === 'hierarchicalrequirement' ){
            this.actualCost = PortfolioItemCostTracking.CostCalculator.calculateActualCostForStory(this.data);
            this.remainingCost = PortfolioItemCostTracking.CostCalculator.calculateTotalCostForStory(this.data) - this.actualCost;
            this.totalCost = PortfolioItemCostTracking.CostCalculator.calculateTotalCostForStory(this.data);
            this.actualUnits = PortfolioItemCostTracking.CostCalculator.getActualUnitsForStory(this.data);
            this.totalUnits = PortfolioItemCostTracking.CostCalculator.getTotalUnitsForStory(this.data);
        }

        if (this.type.toLowerCase() === 'task'){
            this.actualCost = PortfolioItemCostTracking.CostCalculator.calculateActualCostForTask(this.data);
            this.totalCost = PortfolioItemCostTracking.CostCalculator.calculateTotalCostForTask(this.data);
            this.actualUnits = PortfolioItemCostTracking.CostCalculator.getActualUnitsForTask(this.data);
            this.totalUnits = PortfolioItemCostTracking.CostCalculator.getTotalUnitsForTask(this.data);
            if (this.actualCost === null || this.totalCost === null) {
                this.remainingCost = null;
            } else {
                this.remainingCost = this.totalCost - this.actualCost ;
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
            total_value = 0,
            actual_units = 0,
            total_units = 0;

        _.each(this.children, function (s) {
            total_value += PortfolioItemCostTracking.CostCalculator.calculateTotalCostForStory(s);
            actual_value += PortfolioItemCostTracking.CostCalculator.calculateActualCostForStory(s);
            this._updateProjectNameAndCostHash(s.Project);
            actual_units += PortfolioItemCostTracking.CostCalculator.getActualUnitsForStory(s);
            total_units += PortfolioItemCostTracking.CostCalculator.getTotalUnitsForStory(s);
        }, this);

        this.actualUnits = actual_units;
        this.totalUnits = total_units;

        this.totalCost = total_value;
        this.actualCost = actual_value;
        this.remainingCost = total_value - actual_value;
    },
    getTooltip: function(){
        var actual_units = this.actualUnits === null ? '--' :  this.actualUnits,
            total_units = this.totalUnits === null ? '--' : this.totalUnits;


        var html = Ext.String.format('[{0}] completed {1}/{2}<br/><br/>Cost per unit:<br/>', this.getType(), actual_units, total_units);
        _.each(this.projectCosts, function(project_cost, project_name){
            html += Ext.String.format('{0} {1}<br/>', PortfolioItemCostTracking.CostCalculator.formatCost(project_cost), project_name);
        });

        return html;

    },
    _updateProjectNameAndCostHash: function(project){

        this.projectCosts = this.projectCosts || {};

        var name = project._refObjectName,
            cost = PortfolioItemCostTracking.CostCalculator.getCostPerUnit(project._ref);

        if (PortfolioItemCostTracking.CostCalculator.isProjectUsingNormalizedCost(project._ref)){
            name =  "normalized (default)";
        }
        console.log('--updateProjectNameandCostHash', name, cost);
        this.projectCosts[name] = cost;
        console.log('--updateProjectNameandCostHash', this.data.FormattedID, this.projectCosts);
    },
    getType: function(){
        switch(PortfolioItemCostTracking.CostCalculator.calculationType){
            case PortfolioItemCostTracking.CostCalculator.calculationTypeStoryPoints:
                return 'Story points';
            case PortfolioItemCostTracking.CostCalculator.calculationTypeTaskHours:
                return 'Task actuals';
            case PortfolioItemCostTracking.CostCalculator.calculationTypeTimesheets:
                return 'Time spent';
        }
        return 'Unknown';
   }
});
