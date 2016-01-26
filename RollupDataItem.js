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
