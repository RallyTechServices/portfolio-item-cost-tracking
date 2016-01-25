Ext.define('PortfolioItemCostTracking.PortfolioRollupItem',{

    _rollupDataPreliminaryBudget: undefined,
    _rollupDataTotalCost: undefined,
    _rollupDataActualCost: undefined,
    _rollupDataRemainingCost: undefined,
    _rollupDataToolTip: null,
    _notEstimated: true,
    children: undefined,

    projectCosts: undefined,
    useBudgetCalc: false,

    constructor: function(record) {
        this._rollupDataTotalCost = 0;
        this._rollupDataActualCost = 0;
        this._rollupDataRemainingCost = 0;

        this.parent = record.get('Parent') && record.get('Parent').ObjectID || null;
        this.objectID = record.get('ObjectID');

        this._rollupDataPreliminaryBudget = this._calculatePreliminaryBudget(record.getData());
        this._rollupDataTotalCost = this.getPreliminaryBudget();
        this._rollupDataToolTip = this.getTooltip();
    },
    addChild: function(objectID){
        if (!this.children){
            this.children = [];
        }
        this.children.push(objectID);
    },
    _calculatePreliminaryBudget: function(data){
        var preliminaryBudgetField = PortfolioItemCostTracking.Settings.preliminaryBudgetField;

        if (data && data[preliminaryBudgetField]){
            //We need to do this in case we are using hte PreliminaryEstimate field, which is an object
            var val = data[preliminaryBudgetField].Value || data[preliminaryBudgetField];
            var cpu = PortfolioItemCostTracking.Settings.getCostPerUnit(data.Project._ref);
            return cpu * val;
        }
        return null;
    },
    getTooltip: function(){

        var completed  = PortfolioItemCostTracking.Settings.notAvailableText;
        if ((this.__actualUnits >= 0) && (this.__totalUnits >=0 )){
            completed = Ext.String.format("{0}/{1}", this.__actualUnits, this.__totalUnits);
        }

        var calc_type_name = PortfolioItemCostTracking.Settings.getCalculationTypeDisplayName();

        var html = Ext.String.format('{0} completed {1}<br/>', calc_type_name, completed);
        if (this.projectCosts){
            html += '<br/>Cost per unit:<br/>';
            _.each(this.projectCosts, function(project_cost, project_name){
                html += Ext.String.format('{0} {1}<br/>', PortfolioItemCostTracking.Settings.formatCost(project_cost), project_name);
            });
        }


        if (this._notEstimated){
            html += '<br/><p>Portfolio Item has missing ' + calc_type_name + '.  Preliminary Budget is being used to calculate Projected and Remaining costs.</p>';
        }
        return html;
    },
    getTotalCostRollup: function(){
        if (this._notEstimated){
            return this.getActualCostRollup() + this.getRemainingCostRollup();
        }
        return this._rollupDataTotalCost;
    },
    getActualCostRollup: function(){
        return this._rollupDataActualCost;
    },
    getRemainingCostRollup: function(){
        if (this._notEstimated){
            return this.getPreliminaryBudget() - this.getActualCostRollup();
        }
        return this._rollupDataRemainingCost;
    },
    getPreliminaryBudget: function(){
        return this._rollupDataPreliminaryBudget;
    }
});


Ext.define('PortfolioItemCostTracking.UpperLevelPortfolioRollupItem',{
    extend: 'PortfolioItemCostTracking.PortfolioRollupItem',


    processChildren: function(){

        var rollupDataTotal = 0,
            rollupDataActual = 0,
            rollupDataRemaining = 0,
            totalUnitsSum = 0,
            actualUnitsSum = 0,
            projectCosts = {},
            rollupItems = this.children || [],
            notEstimated = false;

        Ext.Array.each(rollupItems, function(item){
            item.processChildren();

            rollupDataTotal += item.getTotalCostRollup() ;
            rollupDataActual +=  item.getActualCostRollup();
            rollupDataRemaining += item.getRemainingCostRollup();
            totalUnitsSum += item.__totalUnits || 0;
            actualUnitsSum += item.__actualUnits || 0;
            projectCosts = Ext.merge(projectCosts, item.projectCosts || {});
            notEstimated = notEstimated && item._notEstimated;

        }, this);

        this._notEstimated = notEstimated;
        this._rollupDataTotalCost = rollupDataTotal;
        this._rollupDataActualCost = rollupDataActual;
        this._rollupDataRemainingCost = rollupDataRemaining;
        this.projectCosts = projectCosts;
        this.__totalUnits = totalUnitsSum;
        this.__actualUnits = actualUnitsSum;
        this._rollupDataToolTip = this.getTooltip();

    }
});

Ext.define('PortfolioItemCostTracking.LowestLevelPortfolioRollupItem',{
    extend: 'PortfolioItemCostTracking.PortfolioRollupItem',

    processChildren: function(stories, projectCostPerUnit, normalizedCostPerUnit, totalFn, actualFn){

        if (!stories || stories.length === 0){
            return;
        }

        var objectID = this.objectID,
            rollupDataTotal = 0,
            rollupDataActual = 0,
            totalUnitsSum = 0,
            actualUnitsSum = 0,
            projectCosts = {};



        for (var i=0; i<stories.length; i++){
            var childData = stories[i].getData();
            if (childData.PortfolioItem && childData.PortfolioItem.ObjectID === objectID) {

                var totalUnits = totalFn(childData) || 0,
                    actualUnits = actualFn(childData) || 0;

                totalUnitsSum += totalUnits;
                actualUnitsSum += actualUnits;
                projectCosts = this._updateProjectNameAndCostHash(projectCosts, childData.Project);

                var costPerUnit = projectCostPerUnit[childData.Project._ref] || normalizedCostPerUnit;
                rollupDataTotal += (totalUnits * costPerUnit) || 0;
                rollupDataActual += (actualUnits * costPerUnit) || 0;
            }
        }

        this._notEstimated = (totalUnitsSum === 0);
        if (this._notEstimated && this.getPreliminaryBudget() > this.getActualCostRollup()){
            this._rollupDataRemainingCost = this.getPreliminaryBudget() - this.getActualCostRollup();
            this._rollupDataTotalCost = this._rollupDataActualCost + this._rollupDataRemainingCost;
        } else {
            this._rollupDataTotalCost = rollupDataTotal;
            this._rollupDataRemainingCost = rollupDataTotal  - rollupDataActual;
        }
        this.__totalUnits = totalUnitsSum;
        this.__actualUnits = actualUnitsSum;

        this._rollupDataActualCost = rollupDataActual;
        this.projectCosts = projectCosts;
        this._rollupDataToolTip = this.getTooltip();

    },
    _updateProjectNameAndCostHash: function(projectCosts, project){

        projectCosts = projectCosts || {};

        var name = project._refObjectName,
            cost = PortfolioItemCostTracking.Settings.getCostPerUnit(project._ref);

        if (PortfolioItemCostTracking.Settings.isProjectUsingNormalizedCost(project._ref)){
            name =  "normalized (default)";
        }
        projectCosts[name] = cost;
        return projectCosts;
    }
});

//Ext.define('PortfolioItemCostTracking.RollupDataItem',{
//
//    children: undefined,
//    type: undefined,
//
//    totalUnits: null,
//    actualUnits: null,
//    _rollupDataPreliminaryBudget: null,
//    _rollupDataTotalCost: 0,
//    _rollupDataActualCost: 0,
//    _rollupDataRemainingCost: 0,
//    tooltip: undefined,
//    projectCosts: undefined,
//    useTraditionalCalc: false,
//    /**
//     * data is from the record associated with the rollup data
//     */
//    data: undefined,
//
//    constructor: function(config){
//        this.data = config.record.getData();
//        this.type = config.record.get('_type');
//        this.parent = config.record.get('Parent') && config.record.get('Parent').ObjectID ||
//            (config.record.get('Parent') && config.record.get('Parent').ObjectID) ||null;
//
//        this._updateProjectNameAndCostHash(this.data.Project);
//
//        this._rollupDataPreliminaryBudget = this.calculatePreliminaryBudget(this.data);
//
//        if ((this.type.toLowerCase() === 'hierarchicalrequirement' )||(this.type.toLowerCase() === 'task')){
//            this.actualUnits = this.getActualUnits(this.data,this.type.toLowerCase());
//            this.totalUnits = this.getTotalUnits(this.data,this.type.toLowerCase());
//            this._rollupDataActualCost = this.calculateCost(this.data, this.actualUnits);
//            this._rollupDataTotalCost = this.calculateCost(this.data, this.totalUnits);
//            if (this._rollupDataActualCost === null || this._rollupDataTotalCost === null) {
//                this._rollupDataRemainingCost = null;
//            } else {
//                this._rollupDataRemainingCost = this._rollupDataTotalCost - this._rollupDataActualCost ;
//            }
//        }
//
//        //Init the rollup data
//        if (PortfolioItemCostTracking.Utilities.isPortfolioItem(this.type)){
//            this.totalUnits = 0;
//            this._rollupDataTotalCost = 0;
//            this.actualUnits = 0;
//            this._rollupDataActualCost = 0;
//            this._rollupDataRemainingCost = 0;
//        }
//    },
//    getData: function(field){
//         if (this[field] || this[field] === 0 ) {
//            return this[field];
//        }
//        if (this.data[field] || this.data[field] === 0){
//            return this.data[field];
//        }
//        return null;
//    },
//    addChild: function(record){
//        var childType = record.get('_type'),
//            childData = record.getData();
//
//        if (!this.children){
//            this.children = [];
//        }
//        if (Ext.Array.contains(this.children, childData.ObjectID)){
//            //We've already processed this, so don't do it again.
//            return;
//        }
//
//        this.children.push(childData.ObjectID);
//
//        if (record.get('_type').toLowerCase() === 'hierarchicalrequirement'){
//            this._updateProjectNameAndCostHash(childData.Project);
//
//            var total_units = this.getTotalUnits(childData, childType) || 0,
//                actual_units = this.getActualUnits(childData, childType) || 0;
//
//            this.totalUnits = (this.totalUnits || 0) + total_units;
//            this.actualUnits = (this.actualUnits || 0) + actual_units;
//
//            this._rollupDataTotalCost = (this._rollupDataTotalCost || 0) + (this.calculateCost(childData, total_units) || 0);
//            this._rollupDataActualCost = (this._rollupDataActualCost || 0) + (this.calculateCost(childData, actual_units) || 0);
//            this._rollupDataRemainingCost = this._rollupDataTotalCost  - this._rollupDataActualCost;
//        }
//    },
//    getTotalCostRollup: function(useBudgetCalc){
//        if (this.usePreliminaryBudgetInCalcuation(useBudgetCalc)){
//            return this.getActualCostRollup() + this.getRemainingCostRollup();
//        }
//        return this._rollupDataTotalCost;
//    },
//    getActualCostRollup: function(){
//        return this._rollupDataActualCost;
//    },
//    getRemainingCostRollup: function(useBudgetCalc){
//        if (this.usePreliminaryBudgetInCalcuation(useBudgetCalc)){
//            return this.getPreliminaryBudget() - this.getActualCostRollup();
//        }
//        return this._rollupDataRemainingCost;
//    },
//    getPreliminaryBudget: function(){
//        return this._rollupDataPreliminaryBudget;
//    },
//    /**
//     * addChildRollupData
//     * @param childData
//     */
//    addChildRollupData: function(childData){
//        console.log('addChildRollupData',childData._type);
//        this.totalUnits = (this.totalUnits || 0) + childData.totalUnits;
//        this._rollupDataTotalCost = (this._rollupDataTotalCost || 0) + childData.getTotalCostRollup() ;
//
//        this.actualUnits = (this.actualUnits || 0) + childData.actualUnits;
//        this._rollupDataActualCost = (this._rollupDataActualCost || 0) + childData.getActualCostRollup();
//
//        this._rollupDataRemainingCost = (this._rollupDataRemainingCost || 0) + childData.getRemainingCostRollup();
//
//        this.projectCosts = Ext.merge(this.projectCosts || {}, childData.projectCosts || {});
//    },
//    usePreliminaryBudgetInCalcuation: function(useBudgetCalc){
//        if (useBudgetCalc || (this._rollupDataTotalCost <= 0  && this.getPreliminaryBudget() > this.getActualCostRollup())){
//            return true;
//        }
//        return false;
//    },
//    getTooltip: function(){
//        var completed  = PortfolioItemCostTracking.Settings.notAvailableText;
//        if ((this.actualUnits !== null) && (this.totalUnits !== null)){
//            completed = Ext.String.format("{0}/{1}", this.actualUnits, this.totalUnits);
//        }
//
//        var calc_type_name = PortfolioItemCostTracking.Settings.getCalculationTypeDisplayName();
//
//        var html = Ext.String.format('{0} completed {1}<br/><br/>Cost per unit:<br/>', calc_type_name, completed);
//        _.each(this.projectCosts, function(project_cost, project_name){
//            html += Ext.String.format('{0} {1}<br/>', PortfolioItemCostTracking.Settings.formatCost(project_cost), project_name);
//        });
//
//        if (this.usePreliminaryBudgetInCalcuation()){
//             html += '<br/><p>Portfolio Item has missing ' + calc_type_name + '.  Preliminary Budget is being used to calculate Projected and Remaining costs.</p>';
//        }
//        return html;
//
//    },
//    _updateProjectNameAndCostHash: function(project){
//
//        this.projectCosts = this.projectCosts || {};
//
//        var name = project._refObjectName,
//            cost = PortfolioItemCostTracking.Settings.getCostPerUnit(project._ref);
//
//        if (PortfolioItemCostTracking.Settings.isProjectUsingNormalizedCost(project._ref)){
//            name =  "normalized (default)";
//        }
//        this.projectCosts[name] = cost;
//    },
//    calculateCost: function(data, units){
//        if (units === null){
//            return null;
//        }
//        return units * PortfolioItemCostTracking.Settings.getCostPerUnit(data.Project._ref);
//    },
//    getActualUnits: function(data, modelType){
//         var calcType = PortfolioItemCostTracking.Settings.getCalculationTypeSettings(),
//            fn = 'actualUnitsForStoryFn';
//
//        if (modelType.toLowerCase() === 'task'){
//            fn = 'actualUnitsForTaskFn';
//        }
//
//        if (calcType[fn]) {
//            return calcType[fn](data);
//        }
//        return null;
//    },
//    getTotalUnits: function(data, modelType){
//        var calcType = PortfolioItemCostTracking.Settings.getCalculationTypeSettings(),
//            fn = 'totalUnitsForStoryFn';
//
//        if (modelType.toLowerCase() === 'task'){
//            fn = 'totalUnitsForTaskFn';
//        }
//        if (calcType[fn]) {
//            return calcType[fn](data);
//        }
//        return null;
//    },
//
//    calculatePreliminaryBudget: function(data){
//        var preliminaryBudgetField = PortfolioItemCostTracking.Settings.preliminaryBudgetField;
//
//        if (data && data[preliminaryBudgetField]){
//            //We need to do this in case we are using hte PreliminaryEstimate field, which is an object
//            var val = data[preliminaryBudgetField].Value || data[preliminaryBudgetField];
//            var cpu = PortfolioItemCostTracking.Settings.getCostPerUnit(data.Project._ref);
//            return cpu * val;
//        }
//        return null;
//    }
//});
