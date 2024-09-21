/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.controller("i2d.eam.workpermit.manages1.ext.controller.ListReportExt", {
 onApplicationLogsPress: function () {
  this.extensionAPI
   .getNavigationController()
   .navigateExternal("ApplicationLog", {
    LogObjectId: "LOG_WCM_ML"
   });
 },

 onBeforeRebindTableExtension: function (oEvent) {
  //Request Number of orders read on order list display
  var oBindingParams = oEvent.getParameter("bindingParams");
  var sSelect = oBindingParams && oBindingParams.parameters.select;
  if ( sSelect.includes("ActiveMaintenanceOrder") && !sSelect.includes("NumberOfOrders")){
   oBindingParams.parameters.select += ",NumberOfOrders";
  }
 },

 //Formatter to display more on Associated with column
 formatOrderColumnExt: function (sNumberOfOrders) {
  // var oI18nModel = this.getView().getModel("i18n|sap.suite.ui.generic.template.ListReport|C_WorkPermitTP");
  var oI18nModel = this.getView().getModel("i18n");
  var sAssigned  = oI18nModel.getResourceBundle().getText("xlnk.assigned");
  return sAssigned + "(" + sNumberOfOrders + ") ";
 },

 // Press event handler for the more button in order column
 onOrderColumnLinkPress: function (oEvent) {
  var oSource = oEvent.getSource();
  if (!this._oOrderListPopover) {
   sap.ui.core.Fragment.load({
    id: "idOrderListFragment",
    name: "i2d.eam.workpermit.manages1.ext.view.fragments.OrderListPopover",
    controller: this
   }).then(function (oPopover) {
    this._oOrderListPopover = oPopover;
    this.getView().addDependent(this._oOrderListPopover);
    //Set Title
    var sTitle  = oSource.getBindingContext().getProperty("/WorkPermit/ActiveMaintenanceOrder/#@sap:label");
    oPopover.setModel(new sap.ui.model.json.JSONModel({title:sTitle}),"assignedOrderList");
    // getting order data
    this._setOrderListData(oPopover,oSource);
    this._oOrderListPopover.openBy(oSource);
   }.bind(this));
  } else {
   this._setOrderListData(this._oOrderListPopover,oSource);
   this._oOrderListPopover.openBy(oSource);
  }
 },

 // Getting Order data and Removing the duplicate orders from the response
 _setOrderListData: function(oPopover,oSource){
  oPopover.setBusy(true);
  var sPath = oSource.getBindingContext().getPath() + "/to_WorkPermitOrder";
  var oAssignedOrderList = oPopover.getModel("assignedOrderList");
  oAssignedOrderList.setProperty("/data", []);
  this.getView().getModel().read(sPath, {
   urlParameters: {
    "$select" : "MaintenanceOrder,MaintenanceOrderDesc",
    "$orderby": "MaintenanceOrder"
   },
   success: function (oData) {
    oAssignedOrderList.setProperty("/data", oData.results);
    oPopover.setBusy(false);
   },
   error: function (){
    oPopover.setBusy(false);
   }
  });
 },
 //Formatter to display maintenance orders with description
 formatMaintOrderListExt: function (sMaintOrderDesc, sMaintOrder) {
  return sMaintOrderDesc + " (" + sMaintOrder + ") ";
 },
 //Handle navigation of order
 onNavOrderPress: function(oEvent){
  var oBindingContext = oEvent.getSource().getBindingContext("assignedOrderList");
  var sMaintenanceOrder = oBindingContext.getProperty("MaintenanceOrder");
  var oNavigationController = this.extensionAPI.getNavigationController();
  if (oNavigationController && sMaintenanceOrder){
   oNavigationController.navigateExternal("MaintenanceOrderDisplay", {"MaintenanceOrder": sMaintenanceOrder});
  }
 }
});