Ext.define('HierarchyExporter',{

    parentModel: null,
    descendantModels: null,
    fetch: null,
    filters: null,

    constructor: function(config) {
        Ext.merge(this,config);
    },
    /**
     * fetchResults: returns an array of arrays that can be manipulated into a delimited string or some other data structure
     * for exporting/manipulation
     **/
    fetchResults: function(){
        var deferred = Ext.create('Deft.Deferred');

        PortfolioItemCostTracking.WsapiToolbox.fetchWsapiRecords(this.parentModel, this.filters,this.fetch).then({
            success: function(records){
                deferred.resolve(records);
            },
            failure: function(msg){
                deferred.reject(msg);
            }
        });


        return deferred;
    },

    //exportDetail: function(filename, grid){
    //    var root = grid.store.getRootNode();
    //    var columnsOfInterest = _.map(grid.columnCfgs, function(cfg){
    //        if (typeof cfg == 'object'){
    //            return cfg.dataIndex;
    //        }
    //        return cfg;
    //    });
    //    columnsOfInterest = _.without(columnsOfInterest,'FormattedID');
    //
    //    //We want the first child of the root node, plus its' children
    //    this._exportNodeDetail(root,columnsOfInterest, filename);
    //
    //},
    //_exportNodeDetail: function(expandedNode,columnsOfInterest,filename){
    //    var nodeDepth = Rally.technicalservices.Export._getDeepestNodeDepth(expandedNode);
    //    var nameIndex = nodeDepth;
    //
    //    var headers = [];
    //    for (var i=0; i<nodeDepth; i++){
    //        headers.push('');
    //    }
    //    headers[0] = 'Initiative';
    //    headers[1] = 'Feature';
    //    headers.push(columnsOfInterest);
    //    headers = _.flatten(headers);
    //    var rows = Rally.technicalservices.util.Excel.formatArrayAsRow(headers);
    //
    //
    //    Ext.each(expandedNode.childNodes, function (firstLevelNode) {
    //        var arr = Rally.technicalservices.Export._initializeArray(firstLevelNode.getDepth(), nameIndex, firstLevelNode.data.FormattedID);
    //        Ext.each(columnsOfInterest, function(col){
    //            arr.push(firstLevelNode.data[col]);
    //        });
    //        rows += Rally.technicalservices.util.Excel.formatArrayAsRow(_.flatten(arr));
    //        rows += Rally.technicalservices.Export._getChildNodeRows(true, firstLevelNode, nameIndex, columnsOfInterest);
    //    });
    //    var table = Rally.technicalservices.util.Excel.formatTable(rows);
    //    var text = Rally.technicalservices.util.Excel.formatHtml(Rally.technicalservices.util.Excel.formatBody(table));
    //    Rally.technicalservices.FileUtilities.saveTextAsFile(text,filename);
    //},
    //
    //_getChildNodeRows: function(recursive, parentNode, columnIndex, columnsOfInterest){
    //    var depth = parentNode.getDepth();
    //    var text = '';
    //    Ext.each(parentNode.childNodes, function(childNode){
    //        var arr = Rally.technicalservices.Export._initializeArray(childNode.getDepth(), columnIndex, childNode.data.FormattedID);
    //        arr.push(_.values(_.pick(childNode.data, columnsOfInterest)));
    //        text += Rally.technicalservices.util.Excel.formatArrayAsRow(_.flatten(arr));
    //        if (recursive){
    //            text += Rally.technicalservices.Export._getChildNodeRows(true, childNode, columnIndex, columnsOfInterest);
    //        }
    //    });
    //    return text;
    //},
    //_getNodeDepth: function(node){
    //    var depth =  node.getDepth();
    //
    //    if (node.hasChildNodes()){
    //        node.eachChild(function(child){
    //            var childDepth = Rally.technicalservices.Export._getNodeDepth(child);
    //            if (childDepth > depth){
    //                depth = childDepth;
    //            }
    //        });
    //    }
    //
    //    return depth;
    //},
    //
    //exportSummary: function(filename, grid){
    //    var root = grid.store.getRootNode();
    //    var columnsOfInterest = _.map(grid.columnCfgs, function(cfg){
    //        if (typeof cfg == 'object'){
    //            return cfg.dataIndex;
    //        }
    //        return cfg;
    //    });
    //    columnsOfInterest = _.without(columnsOfInterest,'FormattedID');
    //
    //    //We want the first child of the root node, plus its' children
    //    this._exportNodeSummary(root,columnsOfInterest, filename);
    //
    //},
    //_exportNodeSummary: function(expandedNode,columnsOfInterest,filename){
    //    var headers = [];
    //    headers[0] = 'Initiative';
    //    headers[1] = 'Feature';
    //    headers.push(columnsOfInterest);
    //    headers = _.flatten(headers);
    //    var rows = Rally.technicalservices.util.Excel.formatArrayAsRow(headers);
    //
    //    Ext.each(expandedNode.childNodes, function (firstLevelNode) {
    //        var arr = Rally.technicalservices.Export._initializeArray(firstLevelNode.getDepth(), 2, firstLevelNode.data.FormattedID);
    //        Ext.each(columnsOfInterest, function(col){
    //            arr.push(firstLevelNode.data[col]);
    //        });
    //        rows += Rally.technicalservices.util.Excel.formatArrayAsRow(_.flatten(arr));
    //        rows += Rally.technicalservices.Export._getChildNodeRows(false, firstLevelNode, 2, columnsOfInterest);
    //    });
    //    var table = Rally.technicalservices.util.Excel.formatTable(rows);
    //    var text = Rally.technicalservices.util.Excel.formatHtml(Rally.technicalservices.util.Excel.formatBody(table));
    //    Rally.technicalservices.FileUtilities.saveTextAsFile(text,filename);
    //},
    //
    //_initializeArray: function(nodeDepth, columnIndex, formattedID){
    //    var arr = _.range(columnIndex).map(function(a){return ''});
    //    arr[nodeDepth-1] = formattedID;
    //    return arr;
    //},
    //_getDeepestNodeDepth: function(root){
    //    var depth = 0;
    //    root.eachChild(function(node){
    //        var nodeDepth = Rally.technicalservices.Export._getNodeDepth(node);
    //        if (nodeDepth > depth){
    //            depth = nodeDepth;
    //        }
    //    });
    //    return depth;
    //},
    //
    //
    //convertDataArrayToCSVText: function(data_array, requestedFieldHash){
    //
    //    var text = '';
    //    Ext.each(Object.keys(requestedFieldHash), function(key){
    //        text += requestedFieldHash[key] + ',';
    //    });
    //    text = text.replace(/,$/,'\n');
    //
    //    Ext.each(data_array, function(d){
    //        Ext.each(Object.keys(requestedFieldHash), function(key){
    //            if (d[key]){
    //                if (typeof d[key] === 'object'){
    //                    if (d[key].FormattedID) {
    //                        text += Ext.String.format("\"{0}\",",d[key].FormattedID );
    //                    } else if (d[key].Name) {
    //                        text += Ext.String.format("\"{0}\",",d[key].Name );
    //                    } else if (!isNaN(Date.parse(d[key]))){
    //                        text += Ext.String.format("\"{0}\",",Rally.util.DateTime.formatWithDefaultDateTime(d[key]));
    //                    }else {
    //                        text += Ext.String.format("\"{0}\",",d[key].toString());
    //                    }
    //                } else {
    //                    text += Ext.String.format("\"{0}\",",d[key] );
    //                }
    //            } else {
    //                text += ',';
    //            }
    //        },this);
    //        text = text.replace(/,$/,'\n');
    //    },this);
    //    return text;
    //},
    ///*
    // * will render using your grid renderer.  If you want it to ignore the grid renderer,
    // * have the column set _csvIgnoreRender: true
    // */
    //getCSVFromTreeGrid:function(app, grid){
    //    var deferred = Ext.create('Deft.Deferred');
    //
    //    var store = Ext.create('Rally.data.wsapi.Store',{
    //        fetch: grid.getStore().config.fetch,
    //        filters: grid.getStore().config.filters,
    //        model: grid.getStore().config.model,
    //        pageSize: 200
    //    });
    //
    //    var columns = grid.columns;
    //    var column_names = [];
    //    var headers = [];
    //
    //    Ext.Array.each(columns,function(column){
    //        if ( column.dataIndex || column.renderer ) {
    //            column_names.push(column.dataIndex);
    //            if ( column.csvText ) {
    //                headers.push(column.csvText);
    //            } else {
    //                headers.push(column.text);
    //            }
    //        }
    //    });
    //
    //    var record_count = grid.getStore().getTotalCount(),
    //        page_size = grid.getStore().pageSize,
    //        pages = Math.ceil(record_count/page_size),
    //        promises = [];
    //
    //    for (var page = 1; page <= pages; page ++ ) {
    //        promises.push(this.loadStorePage(app, grid, store, columns, page, pages));
    //    }
    //    Deft.Promise.all(promises).then({
    //        success: function(csvs){
    //            var csv = [];
    //            csv.push('"' + headers.join('","') + '"');
    //            _.each(csvs, function(c){
    //                _.each(c, function(line){
    //                    csv.push(line);
    //                });
    //            });
    //            csv = csv.join('\r\n');
    //            deferred.resolve(csv);
    //            app.setLoading(false);
    //        }
    //    });
    //    return deferred.promise;
    //
    //},
    //loadStorePage: function(app, grid, store, columns, page, total_pages){
    //    var deferred = Ext.create('Deft.Deferred');
    //    this.logger.log('loadStorePage',page, total_pages);
    //
    //    var mock_meta_data = {
    //        align: "right",
    //        classes: [],
    //        cellIndex: 9,
    //        column: null,
    //        columnIndex: 9,
    //        innerCls: undefined,
    //        recordIndex: 5,
    //        rowIndex: 5,
    //        style: "",
    //        tdAttr: "",
    //        tdCls: "x-grid-cell x-grid-td x-grid-cell-headerId-gridcolumn-1029 x-grid-cell-last x-unselectable",
    //        unselectableAttr: "unselectable='on'"
    //    }
    //
    //    store.loadPage(page, {
    //        callback: function (records) {
    //            var csv = [];
    //            app.setLoading(Ext.String.format('Page {0} of {1} loaded',page, total_pages));
    //            for (var i = 0; i < records.length; i++) {
    //                var record = records[i];
    //
    //                var node_values = [];
    //                Ext.Array.each(columns, function (column) {
    //                    if (column.xtype != 'rallyrowactioncolumn') {
    //                        if (column.dataIndex) {
    //                            var column_name = column.dataIndex;
    //                            var display_value = record.get(column_name);
    //
    //                            if (!column._csvIgnoreRender && column.renderer) {
    //                                if (column.exportRenderer) {
    //                                    display_value = column.exportRenderer(display_value, mock_meta_data, record, 0, 0, store, grid.getView());
    //                                } else {
    //                                    display_value = column.renderer(display_value, mock_meta_data, record, 0, 0, store, grid.getView());
    //                                }
    //                            }
    //                            node_values.push(display_value);
    //                        } else {
    //                            var display_value = null;
    //                            if (!column._csvIgnoreRender && column.renderer) {
    //                                if (column.exportRenderer) {
    //                                    display_value = column.exportRenderer(display_value, mock_meta_data, record, record, 0, 0, store, grid.getView());
    //                                } else {
    //                                    display_value = column.renderer(display_value, mock_meta_data, record, record, 0, 0, store, grid.getView());
    //                                }
    //                                node_values.push(display_value);
    //                            }
    //                        }
    //
    //                    }
    //                }, this);
    //                csv.push('"' + node_values.join('","') + '"');
    //            }
    //            deferred.resolve(csv);
    //        },
    //        scope: this
    //    });
    //    return deferred;
    //}
});
