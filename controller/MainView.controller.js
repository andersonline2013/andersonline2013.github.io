sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	'sap/viz/ui5/format/ChartFormatter',
	'sap/viz/ui5/api/env/Format',
	'sap/viz/ui5/controls/Popover'
], function(Controller, JSONModel, ChartFormatter, Format, Popover) {
"use strict";


  return Controller.extend("covid.controller.MainView", {
	url: 'https://covid19.mathdro.id/api',

	settingsModel : {
		values:[{
			vizType : "timeseries_column",
			dataset : {
				"dimensions": [{
					"name": "Dia",
					"value": "{date}",
					"dataType":"Date"
				}],
				"measures": [{
					"name": "Confirmados",
					"value": "{confirmed}"
				},{
					"name": "Mortes",
					"value": "{deaths}"
				}],
				data: {
					path: "/dataCovid"
				}
			},
			vizProperties: {
				timeAxis: {
						title: {
							visible: false
						}
					},
				plotArea: {
					dataLabel: {
						formatString: ChartFormatter.DefaultPattern.SHORTFLOAT_MFD2,
						visible: true
					},
					window: {
						start:"firstDataPoint",
						end:"lastDataPoint",
						hideWhenOverlap: true
					}
				},
				valueAxis: {
					label: {
						formatString: ChartFormatter.DefaultPattern.SHORTFLOAT
					},
					title: {
						visible: false
					}
				},
				title: {
					visible: true,
					text: 'GLOBAL'
				},
				legend: {
					visible: true
				}
			}
		}]
	},

	onInit : function () {
		
		Format.numericFormatter(ChartFormatter.getInstance());		
		
		var bindValue = this.settingsModel.values;
		this._oVizFrame = this.byId("idVizFrame");
		this._oVizFrameDonut = this.byId("idVizFrameDonut");	
		
		this._oVizFrame.setVizProperties(bindValue[0].vizProperties);
		this.onPopulationChartGlobal();
		
	},
	onPopulationChartGlobal: function(){
		const data = this.getDataByCountries();
		data.countries = this.getCountries();
		const oModel = new JSONModel(data);
		oModel.setSizeLimit(3000)
		this.getView().setModel(oModel);

		const daily = this.getData();
		const data1 = { dataCovid : daily};
		var dataModel = new JSONModel(data1);
		this._oVizFrame.setModel(dataModel);
		
		this.byId("cmbVizFrame").setSelectedKey(null);
		this.byId("cmbVizFrame1").setSelectedKey(null);
		this.byId("idChartContainer2").setVisible(false);
		this.byId("idChartContainer").setVisible(true);
		
		var oPopOver = new Popover({});
            oPopOver.connect(this._oVizFrame.getVizUid());
            oPopOver.setFormatString({
                "Confirmados": ChartFormatter.DefaultPattern.STANDARDFLOAT
            }, {
                "Mortes": ChartFormatter.DefaultPattern.STANDARDFLOAT
			});
		
			this._oVizFrame.setLayoutData(new sap.m.FlexItemData({
				maxHeight: '90%',
				baseSize : '90%',
				order: 0
			})
		);
	},
	onPopulationChartByCountries: function(country){
		const data = this.getDataByCountries(country);
		data.countries = this.getCountries();
		const oModel = new JSONModel(data);
		oModel.setSizeLimit(3000)
		this.getView().setModel(oModel);
		
		this.byId("cmbVizFrame1").setSelectedKey(this.countrySelected);
		this.byId("idChartContainer").setVisible(false);
		this.byId("idChartContainer2").setVisible(true);	
		this._oVizFrameDonut.setVizProperties({
			legend : {
				title : {
					visible : true
				}
			},
			 dataLabel: {
					visible: true,
			 },
			title : {
				visible : true,
				text : this.countrySelected,
			}
		});
	},
	getData: function(){
		let changeableUrl = `${this.url}/daily`;
		let _data;
		$.ajax({
			url: changeableUrl,
			async: false
		}).done(function (response) { 
			const modifiefData = response.map((dailyData) => ({
				confirmed: dailyData.confirmed.total,
				deaths: dailyData.deaths.total,
				date: dailyData.reportDate,
			  }))
			  _data = modifiefData;
		});
		return _data;
	},
	getDataByCountries: function(country){
		let changeableUrl = this.url;
		if (country) {
			changeableUrl = `${changeableUrl}/countries/${country}`;
		  } 
		let _data;
		$.ajax({
			url: changeableUrl,
			async: false
		}).done(function (response) { 
			  _data = { lastUpdate : new Date(response.lastUpdate).toLocaleDateString(navigator.language),
				dataCovid :[
					{ type: 'confirmed', value: response.confirmed.value},
			  		{ type: 'deaths', value: response.deaths.value},
					{ type: 'recovered', value: response.recovered.value}
				]};
		});
		return _data;
	},
	getCountries: function(){
		let changeableUrl = `${this.url}/countries`;
		let _data;
		$.ajax({
			url: changeableUrl,
			async: false
		}).done(function (response) { 
			const modifiefData = response.countries.map((country)  => ({ code:country.name, name:country.name}));
			_data = modifiefData;
		});
		return _data;
	},
	onChangeCombo: function(oEvent){
		let selectedItem =  oEvent.getSource().getSelectedItem();
		if(selectedItem){
			this.countrySelected = selectedItem.getKey()
			this.onPopulationChartByCountries(this.countrySelected);
		}			
		else
			this.onPopulationChartGlobal();
	},
	initPageUtil: function(){
		var that = this;
		that.getView().byId('chartBox').removeAllItems();
		var libraries = sap.ui.getVersionInfo().libraries || [];
            var bSuiteAvailable = libraries.some(function(lib){
                return lib.name.indexOf("sap.suite.ui.commons") > -1;
            });
            if (bSuiteAvailable) {
                jQuery.sap.require("sap/suite/ui/commons/ChartContainer");
                var oChartContainerContent = new sap.suite.ui.commons.ChartContainerContent('chartContainerContent',{
                    icon : "sap-icon://vertical-bar-chart",
                    title : "vizFrame Column Chart Sample",
                    content : [ that._oVizFrameDonut, that._oVizFrame]
                });
                var oItemTemplate = new sap.ui.core.ListItem({
                    key: "{code}",
                    text: "{name}",
                });
                var oComboBox = new sap.m.ComboBox({
                    items: {
                        path: "/countries",
                        template: oItemTemplate
					},
					selectionChange: function(oEvent){
						let selectedItem =  oEvent.getSource().getSelectedItem();
						if(selectedItem)
							that.onPopulationChartByCountries(selectedItem.getKey() );
						else
						that.onPopulationChartGlobal();
					}
                });
                var oChartContainer = new sap.suite.ui.commons.ChartContainer({
                    content : [ oChartContainerContent ],
                    dimensionSelectors: [oComboBox]
                });
                oChartContainer.setShowFullScreen(true);
                oChartContainer.setAutoAdjustHeight(true);
                oChartContainer.setLayoutData(new sap.m.FlexItemData({
                    maxHeight: '80%',
                    baseSize: '80%'
                }));
                that.getView().byId('chartBox').addItem(oChartContainer);
	}}
});

return Controller;

});
