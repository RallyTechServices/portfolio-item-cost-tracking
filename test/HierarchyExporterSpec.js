describe('HierarchyExporter', function(){

    var exporter = Ext.create('HierarchyExporter',{
        models: ['PortfolioItem/Initiative','PortfolioItem/Feature','HierarchicalRequirement'],
        fetch: ['FormattedID','Project','Name','PreliminaryEstimate','PlanEstimate'],
        rootFilters: []
    });


    it ('should merge the configuration passed in during creation', function(){
        expect(exporter.models).toEqual(['PortfolioItem/Initiative','PortfolioItem/Feature','HierarchicalRequirement']);
        expect(exporter.fetch).toEqual(['FormattedID','Project','Name','PreliminaryEstimate','PlanEstimate']);
        expect(exporter.rootFilters).toEqual([]);
    });

    it ('should figure out the child model from the models array and it should be case sensitive', function(){
        expect(exporter._getChildModel('portfolioItem/Initiative')).toBe('portfolioitem/feature');
        expect(exporter._getChildModel('portfolioItem/feature')).toBe('hierarchicalrequirement');
        expect(exporter._getChildModel('PortfolioItem/Initiative')).toBe('portfolioitem/feature');
        expect(exporter._getChildModel('PortfolioItem/Feature')).toBe('hierarchicalrequirement');
        expect(exporter._getChildModel('hierarchicalrequirement')).toBe(null);
        expect(exporter._getChildModel('somethingrandom')).toBe(null);
    });
});