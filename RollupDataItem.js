Ext.define('PortfolioItemCostTracking.RollupDataItem',{

    children: undefined,
    type: undefined,

    totalUnits: null,
    actualUnits: null,
    _rollupDataPreliminaryBudget: null,
    _rollupDataTotalCost: 0,
    _rollupDataActualCost: 0,
    _rollupDataRemainingCost: 0,
    tooltip: undefined,
    projectCosts: undefined,
    /**
     * data is from the record associated with the rollup data
     */
    data: undefined,

    constructor: function(config){
        this.data = config.record.getData();
        this.type = config.record.get('_type');

        this._updateProjectNameAndCostHash(this.data.Project);

        this._rollupDataPreliminaryBudget = this.calculatePreliminaryBudget(this.data);

        if ((this.type.toLowerCase() === 'hierarchicalrequirement' )||(this.type.toLowerCase() === 'task')){
            this.actualUnits = this.getActualUnits(this.data,this.type.toLowerCase());
            this.totalUnits = this.getTotalUnits(this.data,this.type.toLowerCase());
            this._rollupDataActualCost = this.calculateCost(this.data, this.actualUnits);
            this._rollupDataTotalCost = this.calculateCost(this.data, this.totalUnits);
            console.log('rollupDataItem constructor',this._rollupDataActualCost,this._rollupDataTotalCost);
            if (this._rollupDataActualCost === null || this._rollupDataTotalCost === null) {
                this._rollupDataRemainingCost = null;
            } else {
                this._rollupDataRemainingCost = this._rollupDataTotalCost - this._rollupDataActualCost ;
            }
        }

        //Init the rollup data
        if (PortfolioItemCostTracking.Utilities.isPortfolioItem(this.type)){
            this.totalUnits = 0;
            this._rollupDataTotalCost = 0;
            this.actualUnits = 0;
            this._rollupDataActualCost = 0;
            this._rollupDataRemainingCost = 0;
        }
    },
    getData: function(field){
         if (this[field] || this[field] === 0 ) {
            return this[field];
        }
        if (this.data[field] || this.data[field] === 0){
            return this.data[field];
        }
        return null;
    },
    addChild: function(record){
        var childType = record.get('_type'),
            childData = record.getData();

        if (record.get('_type').toLowerCase() === 'hierarchicalrequirement'){
            this._updateProjectNameAndCostHash(childData.Project);
            var total_units = this.getTotalUnits(childData, childType) || 0,
                actual_units = this.getActualUnits(childData, childType) || 0;

            this.totalUnits = (this.totalUnits || 0) + total_units;
            this.actualUnits = (this.actualUnits || 0) + actual_units;

            this._rollupDataTotalCost = (this._rollupDataTotalCost || 0) + (this.calculateCost(childData, total_units) || 0);
            this._rollupDataActualCost = (this._rollupDataActualCost || 0) + (this.calculateCost(childData, actual_units) || 0);
            this._rollupDataRemainingCost = this._rollupDataTotalCost  - this._rollupDataActualCost;
            console.log('addchild', this._rollupDataRemainingCost);

        }

        if (!this.children){
            this.children = [];
        }
        this.children.push(childData.ObjectID);
    },

    /**
     * addChildRollupData
     * @param childData
     */
    addChildRollupData: function(childData){
        console.log('addChildRollupData',childData);
        this.totalUnits = (this.totalUnits || 0) + childData.totalUnits;
        this._rollupDataTotalCost = (this._rollupDataTotalCost || 0) + childData._rollupDataTotalCost ;

        this.actualUnits = (this.actualUnits || 0) + childData.actualUnits;
        this._rollupDataActualCost = (this._rollupDataActualCost || 0) + childData._rollupDataActualCost;

        this._rollupDataRemainingCost = (this._rollupDataRemainingCost || 0) + childData._rollupDataRemainingCost;

        this.projectCosts = Ext.merge(this.projectCosts || {}, childData.projectCosts || {});
    },
    getTooltip: function(){
        var completed  = PortfolioItemCostTracking.Settings.notAvailableText;
        if ((this.actualUnits !== null) && (this.totalUnits !== null)){
            completed = Ext.String.format("{0}/{1}", this.actualUnits, this.totalUnits);
        }

        var calc_type_name = PortfolioItemCostTracking.Settings.getCalculationTypeDisplayName();

        var html = Ext.String.format('{0} completed {1}<br/><br/>Cost per unit:<br/>', calc_type_name, completed);
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
    calculateCost: function(data, units){
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
        var preliminaryBudgetField = PortfolioItemCostTracking.Settings.preliminaryBudgetField;

        if (data && data[preliminaryBudgetField]){
            //We need to do this in case we are using hte PreliminaryEstimate field, which is an object
            var val = data[preliminaryBudgetField].Value || data[preliminaryBudgetField];
            var cpu = PortfolioItemCostTracking.Settings.getCostPerUnit(data.Project._ref);
            return cpu * val;
        }
        return null;
    }
});
