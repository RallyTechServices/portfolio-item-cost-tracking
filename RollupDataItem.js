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
    projectCosts: undefined,
    /**
     * data is from the record associated with the rollup data
     */
    data: undefined,

    constructor: function(config){
        this.data = config.data;
        this.type = config.type;

        this._updateProjectNameAndCostHash(this.data.Project);

        this.preliminaryBudget = this.calculatePreliminaryBudget(this.data);

        if ((this.type.toLowerCase() === 'hierarchicalrequirement' )||(this.type.toLowerCase() === 'task')){
            this.actualCost = this.calculateActualCost(this.data, this.type.toLowerCase());
            this.totalCost = this.calculateTotalCost(this.data,this.type.toLowerCase());
            this.actualUnits = this.getActualUnits(this.data,this.type.toLowerCase());
            this.totalUnits = this.getTotalUnits(this.data,this.type.toLowerCase());
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
            total_value += this.calculateTotalCost(s, 'hierarchicalrequirement');
            actual_value += this.calculateActualCost(s, 'hierarchicalrequirement');
            this._updateProjectNameAndCostHash(s.Project);
            actual_units += this.getActualUnits(s, 'hierarchicalrequirement');
            total_units += this.getTotalUnits(s, 'hierarchicalrequirement');
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


        var calc_type_name = PortfolioItemCostTracking.Settings.getCalculationTypeDisplayName();

        var html = Ext.String.format('[{0}] completed {1}/{2}<br/><br/>Cost per unit:<br/>', calc_type_name, actual_units, total_units);
        _.each(this.projectCosts, function(project_cost, project_name){
            html += Ext.String.format('{0} {1}<br/>', PortfolioItemCostTracking.Settings.formatCost(project_cost), project_name);
        });

        return html;

    },
    _updateProjectNameAndCostHash: function(project){

        this.projectCosts = this.projectCosts || {};

        var name = project._refObjectName,
            cost = PortfolioItemCostTracking.Settings.getCostPerUnit(project._ref);

        if (PortfolioItemCostTracking.Settings.isProjectUsingNormalizedCost(project._ref)){
            name =  "normalized (default)";
        }
        this.projectCosts[name] = cost;
    },
    calculateActualCost: function(data, modelType){
        var units = this.getActualUnits(data, modelType);
        if (units === null){
            return null;
        }
        return units * PortfolioItemCostTracking.Settings.getCostPerUnit(data.Project._ref);
    },
    calculateTotalCost: function(data, modelType){

        var units = this.getTotalUnits(data, modelType);
        if (units === null){
            return null;
        }
        return units * PortfolioItemCostTracking.Settings.getCostPerUnit(data.Project._ref);
    },
    getActualUnits: function(data, modelType){
        var calcType = PortfolioItemCostTracking.Settings.getCalculationTypeSettings(),
            fn = 'actualUnitsForStoryFn';

        if (modelType.toLowerCase() === 'task'){
            fn = 'actualUnitsForTaskFn';
        }

        if (calcType[fn]) {
            return calcType[fn](data);
        }
        return null;
    },
    getTotalUnits: function(data, modelType){
        var calcType = PortfolioItemCostTracking.Settings.getCalculationTypeSettings(),
            fn = 'totalUnitsForStoryFn';

        if (modelType.toLowerCase() === 'task'){
            fn = 'totalUnitsForTaskFn';
        }
        if (calcType[fn]) {
            return calcType[fn](data);
        }
        return null;
    },
    calculatePreliminaryBudget: function(data){

        if (data && data.PreliminaryEstimate && data.PreliminaryEstimate.Value){
            var cpu = PortfolioItemCostTracking.Settings.getCostPerUnit(data.Project._ref);
            return cpu * data.PreliminaryEstimate.Value;
        }
        return null;
    }
});
