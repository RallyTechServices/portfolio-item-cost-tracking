Ext.define('PortfolioItemCostTracking.Exporter',{
    saveCSVToFile:function(csv,file_name,type_object){
        if (type_object === undefined){
            type_object = {type:'text/csv;charset=utf-8'};
        }
        this.saveAs(csv,file_name, type_object);
    },
    saveAs: function(textToWrite, fileName)
    {
        if (Ext.isIE9m){
            Rally.ui.notify.Notifier.showWarning({message: "Export is not supported for IE9 and below."});
            return;
        }

        var textFileAsBlob = null;
        try {
            textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
        }
        catch(e){
            window.BlobBuilder = window.BlobBuilder ||
                        window.WebKitBlobBuilder ||
                    window.MozBlobBuilder ||
                    window.MSBlobBuilder;
            if (window.BlobBuilder && e.name == 'TypeError'){
                bb = new BlobBuilder();
                bb.append([textToWrite]);
                textFileAsBlob = bb.getBlob("text/plain");
            }

        }

        if (!textFileAsBlob){
            Rally.ui.notify.Notifier.showWarning({message: "Export is not supported for this browser."});
            return;
        }

        var fileNameToSaveAs = fileName;

        if (Ext.isIE10p){
            window.navigator.msSaveOrOpenBlob(textFileAsBlob,fileNameToSaveAs); // Now the user will have the option of clicking the Save button and the Open button.
            return;
        }

        var url = this.createObjectURL(textFileAsBlob);

        if (url){
            var downloadLink = document.createElement("a");
            if ("download" in downloadLink){
                downloadLink.download = fileNameToSaveAs;
            } else {
                //Open the file in a new tab
                downloadLink.target = "_blank";
            }

            downloadLink.innerHTML = "Download File";
            downloadLink.href = url;
            if (!Ext.isChrome){
                // Firefox requires the link to be added to the DOM
                // before it can be clicked.
                downloadLink.onclick = this.destroyClickedElement;
                downloadLink.style.display = "none";
                document.body.appendChild(downloadLink);
            }
            downloadLink.click();
        } else {
            Rally.ui.notify.Notifier.showError({message: "Export is not supported "});
        }

    },
    createObjectURL: function ( file ) {
        if ( window.webkitURL ) {
            return window.webkitURL.createObjectURL( file );
        } else if ( window.URL && window.URL.createObjectURL ) {
            return window.URL.createObjectURL( file );
        } else {
            return null;
        }
    },
    destroyClickedElement: function(event)
    {
        document.body.removeChild(event.target);
    },
    fetchExportData: function(rootModel, rootFilters, fetch, columns){
        var deferred = Ext.create('Deft.Deferred');
        var recordCounter = 0;
        var rootFetch = Ext.Array.merge(fetch, PortfolioItemCostTracking.Settings.getPortfolioItemFetch());

        PortfolioItemCostTracking.WsapiToolbox.fetchWsapiRecords(rootModel, rootFilters || [], rootFetch).then({
            scope: this,
            success: function(records){

                var recordTotal = records.length;

                var oids = _.map(records, function(r){ return r.get('ObjectID'); });

                var loader = Ext.create('PortfolioItemCostTracking.RollupDataLoader',{
                    context: this.getContext(),
                    rootRecords: records,
                    fetch: fetch,
                    listeners: {
                        rollupdataloaded: function(portfolioHash, stories){
                            this._processRollupData(portfolioHash,stories,records);
                        },
                        loaderror: this._handleLoadError,
                        statusupdate: this._showStatus,
                        scope: this
                    }
                });
                loader.load(records);


                //var rollupData = Ext.create('PortfolioItemCostTracking.RollupCalculator',{
                //    fetch: fetch,
                //    listeners: {
                //        scope: this,
                //        dataUpdated: function(data){
                //            //console.log('dataUpdated', data, recordCounter, recordTotal);
                //            recordCounter++;
                //            if (recordCounter == recordTotal){
                //                var exportData = this._getExportableRollupData(oids,columns, rollupData);
                //
                //                columns = this._getAncestorTypeColumns(rootModel).concat(columns);
                //                var csv = this._transformExportableRollupDataToDelimitedString(exportData, columns);
                //                deferred.resolve(csv);
                //            }
                //        },
                //        error: function(msg){
                //            deferred.reject(msg);
                //        }
                //    }
                //});
                //
                //_.each(records, function(r) {
                //    rollupData.setRollupData(r);
                //}, this);
            },
            failure: function(msg){
                deferred.reject(msg);
            }
        });
        return deferred;
    },
    _transformExportableRollupDataToDelimitedString: function(rollupData, columns){
        var csvArray = [],
            delimiter = ",",
            rowDelimiter = "\r\n",
            re = new RegExp(delimiter + '|\"|\r|\n','g');

        var column_keys = _.pluck(columns, 'dataIndex'),
            column_headers = _.pluck(columns, 'text');

        csvArray.push(column_headers.join(delimiter));

        Ext.Array.each(rollupData, function(obj){
            var data = [];
            Ext.Array.each(column_keys, function(key){
                var val = obj[key];
                if (val){
                    if (re.test(val)){ //enclose in double quotes if we have the delimiters
                        val = val.replace('"','\"\"');
                        val = Ext.String.format("\"{0}\"",val);
                    }
                }
               data.push(val);
            });
            csvArray.push(data.join(delimiter));
        });

        return csvArray.join(rowDelimiter);
    },
    /**
     * Returns an array of hash rollup data
     *
     * @param rootObjectIDs
     * @param columns - the data index of the columns that we want to export.
     * @param rollupData
     * @returns {Array}
     * @private
     */
    _getExportableRollupData: function(rootObjectIDs, columns, rollupData){

        var exportData = [];

        _.each(rootObjectIDs, function(oid){
            var obj = rollupData.getRollupItem(oid);
            if (obj){
                var ancestors = {};
                var rec = this._getExportDataRow(obj, columns , ancestors);
                exportData.push(rec);
                this._addExportChildren(obj,exportData, columns, rollupData,ancestors);
            }
        },this);
        return exportData;
    },
    _addExportChildren: function(obj, exportData, columns, rollupData,ancestors){
        var new_ancestors = Ext.clone(ancestors);
        new_ancestors[obj.getData('type')] = obj.getData('FormattedID');

        var children = obj.children;
        if (children && children.length > 0){
            _.each(children, function(c){
                var row = this._getExportDataRow(rollupData.getRollupItem(c),columns, new_ancestors);
                exportData.push(row);
                this._addExportChildren(rollupData.getRollupItem(c), exportData, columns, rollupData, new_ancestors);
            }, this);
        }
        return;
    },
    _getExportDataRow: function(obj, columns, ancestors){
        var rec = Ext.clone(ancestors),
            type = obj.getData('type');

        rec[type] = obj.getData('FormattedID');
        rec.type = PortfolioItemCostTracking.Settings.getTypePathDisplayName(obj.getData('type'));
        _.each(columns, function(c){
            var field = c.dataIndex || null;
            if (field){
                var data = obj.getData(field);

                if (Ext.isObject(data)){
                    rec[field] = data._refObjectName;
                } else if (Ext.isDate(data)){
                    rec[field] = Rally.util.DateTime.formatWithDefaultDateTime(data);
                } else {
                    rec[field] = data;
                }
            }
        });
        return rec;
    },
    _getAncestorTypeColumns: function(rootModel){
        var piTypes = PortfolioItemCostTracking.Settings.getPortfolioItemTypeObjects(),
            piIdx = -1;

        Ext.Array.each(piTypes, function(piObj, idx){
            if (piObj.typePath.toLowerCase() === rootModel.toLowerCase()){
                piIdx = idx;
            }
        });

        var columns = [{
            dataIndex: 'hierarchicalrequirement',
            text: 'User Story'
        }];

        if (piIdx >= 0){
            columns = columns.concat(Ext.Array.map(piTypes.slice(0,piIdx+1), function(piObj) { return { dataIndex: piObj.typePath.toLowerCase(), text: piObj.name };} ));
            columns.push({
                dataIndex: 'type',
                text: 'Artifact Type'
            });
            columns.reverse();
        }
        return columns;
    }
});

