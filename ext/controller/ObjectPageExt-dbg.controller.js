/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
 "i2d/eam/workpermit/manages1/ext/controller/ObjectPageExt.controller",
 "i2d/eam/workpermit/manages1/formatter/Formatter",
 "sap/ui/core/Fragment",
 "sap/ui/model/FilterOperator",
 "sap/ui/model/Filter",
 "sap/m/MessageBox",
 "sap/m/MessageToast",
 "sap/m/TextArea",
 "sap/m/SearchField",
 "sap/m/Button",
 "sap/ui/table/Column",
 "sap/m/Label",
 "sap/m/Text"
], function (controller, Formatter, Fragment, FilterOperator, Filter, MessageBox, MessageToast, TextArea, SearchField, Button, UIColumn, Label,
 Text) {
 "use strict";
 return sap.ui.controller("i2d.eam.workpermit.manages1.ext.controller.ObjectPageExt", {
  /*General Information Section*/
  onInit: function (oEvent) {
   this.sAppId = oEvent.getParameter("id");
   this.oModel = this.getOwnerComponent().getModel();
   this.i18nModel = this.getOwnerComponent().getModel("i18n").getResourceBundle();
   this.initializeTables();
   var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
   oRouter.getRoute("WorkPermitquery").attachMatched(this._onRouteMatched, this);
   this.extensionAPI.attachPageDataLoaded(function (oEvt) {
    this.permitData = sap.ui.getCore().byId(this.sAppId + "--objectPage").getBindingContext().getObject();
    this.IsApproved = this.permitData.IsApproved;
    this.oEditBtnVisibility = sap.ui.getCore().byId(this.sAppId + "--edit");
    this.setDefaultValues();
    this.fnObjectPageLoad();
    sap.ui.getCore().byId(this.sAppId + "--AddORDEntry--permitButtonAssignOperation").setEnabled(false);
    sap.ui.getCore().byId(this.sAppId + "--AddORDEntry--permitButtonUnassignOrder").setEnabled(false);
    this.handleChangeStatusButtons();
   }.bind(this));
   sap.ui.getCore().byId(this.sAppId + "--objectPage").attachSectionChange(function (oevt) {
    this.handleSectionChange(oevt.getSource().getSelectedSection());
   }.bind(this));
   this.addPrintButton();
   this.addSPRCellPopover();
   this.getApprovalField();
   var ordersTable = sap.ui.getCore().byId(this.sAppId + "--ord::responsiveTable");
   if (ordersTable) {
    ordersTable.attachSelectionChange(this._onOrderTableSelectionChange, this);
    ordersTable.attachUpdateFinished(this._onOrderTableUpdate, this);
   }
   this.getOwnerComponent().getModel().attachBatchRequestCompleted(function (oEvent) {
    var aParameters = oEvent && oEvent.getParameters();
    if (aParameters && aParameters.requests && aParameters.response.statusCode === 202 && aParameters.requests[0].response.statusCode ===
     "200") {
     var sUrl = aParameters.requests[0].url;
     var sSaveBtnId = this.sAppId + "--activate";
     if (sUrl.startsWith("SubmitForApproval?") || sUrl.startsWith("RevokeRelease?") || sUrl.startsWith("Deactivate?") || sUrl.startsWith(
       "ActivateChanges?") || sUrl.startsWith("SetProcessingStatusToClosed?") || sUrl.startsWith("SetDeletionFlag?") || sUrl.startsWith(
       "RemoveDeletionFlag?") || sUrl.startsWith("Cancel?")) {
      if (this.getView().getBindingContext().getObject().IsActiveEntity) {
       this.oModel.refresh();
      } else {
       jQuery.sap.delayedCall(5, this, function () {
        this.navigateToDisplayMode();
       });
      }
     }
    }
   }.bind(this));
//Begin of n3483410
  this.getOwnerComponent().getModel().attachBatchRequestCompleted(function (oEvent) {

      var aParameters = oEvent && oEvent.getParameters();
      if (aParameters && aParameters.requests && aParameters.response.statusCode === 202 && aParameters.requests[0].response.statusCode ===
       "200") {
       var sUrl = aParameters.requests[0].url;
       if (sUrl.startsWith("WorkPermit") || sUrl.startsWith("WorkPermitEdit")) {
         try {
        if (this.getView().getBindingContext().getObject().WorkPermitProcessingStatus !== "PS50") {
         sap.ui.getCore().byId("idCombineChangeidSetIssueFlagButton").setVisible(false);
         sap.ui.getCore().byId("idCombineChangeidReissueWrkPmtButton").setVisible(false);
        }//endif
         } catch(error){ }
       }
     }

     }.bind(this));
//End of n3483410
  },
  _onRouteMatched: function () {
   this.getOwnerComponent().getModel("uiConfigModel").setProperty("/navigated", false);
  },
  getApprovalField: function () {
   var complianceFields = ["PlainLongText", "WorkPermitApprovalStatus"];
   var oCausesSmartTable = sap.ui.getCore().byId(this.sAppId + "--APPR1::Table");
   if (oCausesSmartTable) {
    oCausesSmartTable.setRequestAtLeastFields(complianceFields);
    oCausesSmartTable.setIgnoreFromPersonalisation(
     "PlainLongText,WorkPermitApprovalStatus"
    );
   }
   var orderFields = ["RowIndex"];
   var oOrdersSmartTable = sap.ui.getCore().byId(this.sAppId + "--ord::Table");
   if (oOrdersSmartTable) {
    oOrdersSmartTable.setRequestAtLeastFields(orderFields);
    oOrdersSmartTable.setIgnoreFromPersonalisation(
     "RowIndex"
    );
   }
  },
  handleAuthError: function (oError) {
   MessageBox.error(JSON.parse(oError.responseText).error.message.value);
  },
  onApplicationLogsPress: function () {
   var workPermit, externalID, creationDate;;
   workPermit = this.getView().getBindingContext().getObject().WorkPermit;
   externalID = "WORKPERMIT" + workPermit;
   creationDate = this.formatCreationDate();
   this.extensionAPI
    .getNavigationController()
    .navigateExternal("ApplicationLog", {
     LogObjectId: "LOG_WCM_ML",
     LogExternalId: externalID,
     DateFrom: creationDate
    });
  },
  formatCreationDate: function () {
   var creationDateTime, creationMonth, creationDay;
   creationDateTime = this.getView().getBindingContext().getObject().CreationDateTime;
   creationMonth = creationDateTime.getMonth() + 1;
   creationDay = creationDateTime.getDate();
   if (creationMonth < 10) {
    creationMonth = creationMonth.toString().padStart(2, '0');
   }
   if (creationDay < 10) {
    creationDay = creationDay.toString().padStart(2, '0');
   }
   var dateFrom = creationDateTime.getFullYear() + "" + creationMonth + "" + creationDay;
   return dateFrom;
  },
  _onOrderTableSelectionChange: function (oEvent) {
   this.handleOrderTableSelectionChange(oEvent);
  },
  handleCloseExtPopupButton: function (oEvent) {
   this.idPermitValidity.setValueState("None");
   // this.onExtendPermitDialog.close();
  },
  _onOrderTableUpdate: function (oEvent) {
   if (this.permitData.WrkPmtOrdOpAssgmtIsAllowed) {
    sap.ui.getCore().byId(this.sAppId + "--ExtensionWizard::ColumnBreakoutOperations").setVisible(true);
   } else {
    sap.ui.getCore().byId(this.sAppId + "--ExtensionWizard::ColumnBreakoutOperations").setVisible(false);
   }
   this.handleOrderTableSelectionChange(oEvent);
  },
  handleOrderTableSelectionChange: function (oEvent) {
   if (oEvent.getSource().getSelectedItems().length >= 1) {
    sap.ui.getCore().byId(this.sAppId + "--AddORDEntry--permitButtonAssignOperation").setEnabled(true);
    sap.ui.getCore().byId(this.sAppId + "--AddORDEntry--permitButtonUnassignOrder").setEnabled(true);
   } else {
    sap.ui.getCore().byId(this.sAppId + "--AddORDEntry--permitButtonAssignOperation").setEnabled(false);
    sap.ui.getCore().byId(this.sAppId + "--AddORDEntry--permitButtonUnassignOrder").setEnabled(false);
   }
  },
  //Assign Operations Functions --- START
  handleOperationsValueHelp: function (oEvent) {
   var ordersTable = sap.ui.getCore().byId(this.sAppId + "--ord::responsiveTable");
   var selectedItem = ordersTable.getSelectedItem().getBindingContext();
   var orderID = selectedItem.getProperty("MaintenanceOrder");
   this.getAssignedOperations(orderID);
   this._oAssignOperationsValueHelpDialog = sap.ui.xmlfragment(
    "i2d.eam.workpermit.manages1.ext.view.fragments.AssignOperations",
    this
   );
   this.getView().addDependent(this._oAssignOperationsValueHelpDialog);
   this._oBasicSearchField = new SearchField({
    showSearchButton: true
   });

   var oFilterBar = this._oAssignOperationsValueHelpDialog.getFilterBar();
   oFilterBar.setFilterBarExpanded(false);
   oFilterBar.setBasicSearch(this._oBasicSearchField);

   // Trigger filter bar search when the basic search is fired
   this._oBasicSearchField.attachSearch(function () {
    oFilterBar.search();
   });

   var MaintenanceOrder = orderID;
   var oModel = this.getOwnerComponent().getModel();
   var oFilter = new Filter({
    path: "MaintenanceOrder",
    operator: FilterOperator.EQ,
    value1: MaintenanceOrder
   });

   var operationNumber = new sap.ui.table.Column({
    label: new sap.m.Label({
     text: this.i18nModel.getText("Input.OperationNo")
    }),
    template: new sap.m.Text({
     text: "{MaintenanceOrderOperation}"
    })
   });
   var operationDesc = new sap.ui.table.Column({
    label: new sap.m.Label({
     text: this.i18nModel.getText("Input.Description")
    }),
    template: new sap.m.Text({
     text: "{OperationDescription}"
    })
   });
   var workCenter = new sap.ui.table.Column({
    label: new sap.m.Label({
     text: this.i18nModel.getText("WorkCenterFilterItemText")
    }),
    template: new sap.m.Text({
     text: "{WorkCenter}"
    })
   });
   var plantName = new sap.ui.table.Column({
    label: new sap.m.Label({
     text: this.i18nModel.getText("PlantNameFilterItemText")
    }),
    template: new sap.m.Text({
     text: "{Plant}"
    })
   });
   var systemStatus = new sap.ui.table.Column({
    label: new sap.m.Label({
     text: this.i18nModel.getText("SystemStatusFilterItemText")
    }),
    template: new sap.m.Text({
     text: "{ConcatenatedActiveSystStsName}"
    })
   });

   this._oAssignOperationsValueHelpDialog.getTableAsync().then(
    function (oTable) {
     oTable.bindAggregation("rows", {
      path: "/OrderOperation",
      filters: oFilter
     });
     oTable.setModel(oModel);
     oTable.addColumn(operationNumber);
     oTable.addColumn(operationDesc);
     oTable.addColumn(workCenter);
     oTable.addColumn(plantName);
     oTable.addColumn(systemStatus);
     this._oAssignOperationsValueHelpDialog.update();
    }.bind(this)
   );
   this._oAssignOperationsValueHelpDialog.open();
  },
  onOperationsFilterBarSearch: function (oEvent) {
   var sSearchQuery = this._oBasicSearchField.getValue(),
    aSelectionSet = oEvent.getParameter("selectionSet");
   sSearchQuery = sSearchQuery;
   var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
    if (oControl.getValue()) {
     var filterValue = oControl.getValue();
     aResult.push(new Filter({
      path: oControl.getName(),
      operator: FilterOperator.Contains,
      value1: filterValue
     }));
    }
    return aResult;
   }, []);

   aFilters.push(
    new Filter({
     filters: [
      new Filter({
       path: "MaintenanceOrderOperation",
       operator: FilterOperator.Contains,
       value1: sSearchQuery
      }),
      new Filter({
       path: "OperationDescription",
       operator: FilterOperator.Contains,
       value1: sSearchQuery
      }),
      new Filter({
       path: "WorkCenter",
       operator: FilterOperator.Contains,
       value1: sSearchQuery
      }),
      new Filter({
       path: "PlantName",
       operator: FilterOperator.Contains,
       value1: sSearchQuery
      })
     ],
     and: false
    })
   );
   this._filterOperationTable(
    new Filter({
     filters: aFilters,
     and: true
    })
   );
  },
  _filterOperationTable: function (oFilter) {
   var oValueHelpDialog = this._oAssignOperationsValueHelpDialog;
   oValueHelpDialog.getTableAsync().then(function (oTable) {
    if (oTable.bindRows) {
     oTable.getBinding("rows").filter(oFilter);
    }
    if (oTable.bindItems) {
     oTable.getBinding("items").filter(oFilter);
    }
    oValueHelpDialog.update();
   });
  },
  onOperationValueHelpOkPress: function (oEvent) {
   this.handleAssignOperationConfirm(oEvent);
   this._oAssignOperationsValueHelpDialog.close();
  },
  // Get List of Already Added Operations for an Order
  getAssignedOperations: function (MaintOrder) {
   var workPermit, draftId;
   workPermit = this.getView().getBindingContext().getObject().WorkPermit;
   draftId = this.getView().getBindingContext().getObject().DraftUUID;
   this.oModel.read("/WrkPmtOrderOperation", {
    filters: [new Filter("WorkPermit", FilterOperator.EQ, workPermit),
     new Filter("ParentDraftUUID", FilterOperator.EQ, draftId),
     new Filter("IsActiveEntity", FilterOperator.EQ, false),
     new Filter("MaintenanceOrder", FilterOperator.EQ, MaintOrder)
    ],
    success: function (oData) {
     this.AssignedOperations = oData.results;
    }.bind(this),
    error: function (oData) {}.bind(this)
   });
  },
  // Assign Operation functionality
  handleAssignOperationConfirm: function (oEvent) {
   sap.ui.core.BusyIndicator.show(0);
   var OperationControl = oEvent.getSource(),
    controlName = sap.ui.getCore().byId(this.sAppId + "--ord::Table"),
    oSelLength = oEvent.getSource().getTable().getSelectedIndices().length;

   if (oEvent.getParameters().tokens.length > 0) {
    this._OperationLength = 0;
    this.operationCount = 0;
    for (var i = 0; i < oSelLength; i++) {
     this._OperationAvailable = false;
     var oItems = oEvent.getSource()._oSelectedItems.items[oEvent.getSource()._oSelectedTokens.getTokens()[i].getKey()];
     this.oModel.setDeferredGroups(["NewOperationItems"]);
     for (var j = 0; j < this.AssignedOperations.length; j++) {
      if (oItems.MaintenanceOrderOperation === this.AssignedOperations[j].MaintenanceOrderOperation &&
       oItems.OperationDescription === this.AssignedOperations[j].OperationDescription) {
       this._OperationAvailable = true;
       this._OperationLength += 1;
       break;
      }
     }
     if (this._OperationAvailable === false) {
      this.operationCount += 1;
      this.oModel.createEntry(
       oEvent.getSource().getBindingContext().sPath + "/to_WorkPermitOrderOperation", {
        groupId: "NewOperationItems",
        properties: {
         "OperationOrderRoutingNumber": oItems.MaintOrderRoutingNumber,
         "MaintenanceOrderOperation": oItems.MaintenanceOrderOperation,
         "OperationDescription": oItems.OperationDescription,
         "MaintenanceOrder": oItems.MaintenanceOrder,
         "MaintOrderOperationCounter": oItems.MaintOrderOperationCounter,
         "IsActiveEntity": false
        }
       });
     }
    }
    this.operationCount = this.operationCount + this.AssignedOperations.length;
    this.submitBatchChanges(OperationControl, controlName, "NewOperationItems");
   } else {
    sap.ui.core.BusyIndicator.hide();
    OperationControl.setBusy(false);
    OperationControl.close();
    OperationControl.destroy();
   }
  },
  UpdateOperationCount: function (operationCount) {
   var ordersTable = sap.ui.getCore().byId(this.sAppId + "--ord::responsiveTable");
   var selectedItem = ordersTable.getSelectedItem().getBindingContext();
   var orderInternalID = selectedItem.getProperty("MaintenanceOrderInternalID");
   var path = ordersTable.getSelectedItem().getBindingContext().sPath;
   var orderSmartTable = sap.ui.getCore().byId(this.sAppId + "--ord::Table");
   var oEntry = {
    "MaintenanceOrderInternalID": orderInternalID,
    "WorkPermitInternalID": this.permitData.WorkPermitInternalID,
    "RowIndex": operationCount,
    "DraftUUID": this.permitData.DraftUUID,
    "IsActiveEntity": false
   };
   this.oModel.update(path, oEntry, {
    success: function () {
     orderSmartTable.rebindTable();
    },
    error: function (e) {}
   });
  },
  onOperationValueHelpCancelPress: function () {
   this._oAssignOperationsValueHelpDialog.close();
  },
  handlePressDisplayOperationList: function (oEvent) {
   var MaintenanceOrder = oEvent.getSource().getBindingContext().getProperty("MaintenanceOrder");
   var WorkPermit = this.getView().getBindingContext().getProperty("WorkPermit");

   var oFilterOperation = new Filter({
    filters: [
     new sap.ui.model.Filter({
      path: "WorkPermit",
      operator: sap.ui.model.FilterOperator.EQ,
      value1: WorkPermit
     }),
     new sap.ui.model.Filter({
      path: "IsActiveEntity",
      operator: sap.ui.model.FilterOperator.EQ,
      value1: true
     }),
     new sap.ui.model.Filter({
      path: "MaintenanceOrder",
      operator: sap.ui.model.FilterOperator.EQ,
      value1: MaintenanceOrder
     })
    ],
    and: true
   });
   this.displayAssignedOperationList(oFilterOperation, MaintenanceOrder, oEvent);
  },
  handlePressEditOperationList: function (oEvent) {
   var MaintenanceOrder = oEvent.getSource().getBindingContext().getProperty("MaintenanceOrder");
   var WorkPermit = this.getView().getBindingContext().getProperty("WorkPermit");
   var draftId = this.getView().getBindingContext().getProperty("DraftUUID");

   var oFilterOperation = new Filter({
    filters: [
     new sap.ui.model.Filter({
      path: "WorkPermit",
      operator: sap.ui.model.FilterOperator.EQ,
      value1: WorkPermit
     }),
     new sap.ui.model.Filter({
      path: "ParentDraftUUID",
      operator: sap.ui.model.FilterOperator.EQ,
      value1: draftId
     }),
     new sap.ui.model.Filter({
      path: "IsActiveEntity",
      operator: sap.ui.model.FilterOperator.EQ,
      value1: false
     }),
     new sap.ui.model.Filter({
      path: "MaintenanceOrder",
      operator: sap.ui.model.FilterOperator.EQ,
      value1: MaintenanceOrder
     })
    ],
    and: true
   });
   this.displayAssignedOperationList(oFilterOperation, MaintenanceOrder, oEvent);
  },
  displayAssignedOperationList: function (oFilterOperation, MaintenanceOrder, oEvent) {
   var oLink = oEvent.getSource(),
    oView = this.getView(),
    that = this;
   var selectedOperationListTitle = this.i18nModel.getText("AssignedOperationsforOrderText") + " " + MaintenanceOrder;
   if (!this._oSelectedOperationsListPopover) {
    this._oSelectedOperationsListPopover = Fragment.load({
     id: oView.getId(),
     name: "i2d.eam.workpermit.manages1.ext.view.fragments.SelectedOperationList",
     controller: this
    }).then(function (oPopover) {
     oView.addDependent(oPopover);
     return oPopover;
    });
   }
   this._oSelectedOperationsListPopover.then(function (oPopover) {
    sap.ui.getCore().byId(oPopover.getId()).setTitle(selectedOperationListTitle);
    var selectedOperationTable = sap.ui.getCore().byId(that.sAppId + "--SelectedOperationTable");
    if (selectedOperationTable) {
     selectedOperationTable.attachRowSelectionChange(that._onOperationTableSelectionChange, that);
    }
    selectedOperationTable.bindAggregation("rows", {
     path: "/WrkPmtOrderOperation",
     filters: oFilterOperation
    });
    oPopover.openBy(oLink);
   });
  },
  handleSelectedOperationsListCloseButton: function (oEvent) {
   this.byId("SelectedOperationPopover").close();
  },
  _onOperationTableSelectionChange: function (oEvent) {
   if (oEvent.getSource().getSelectedIndices().length > 0) {
    sap.ui.getCore().byId(this.sAppId + "--unAssignOperationAction").setEnabled(true);
   } else {
    sap.ui.getCore().byId(this.sAppId + "--unAssignOperationAction").setEnabled(false);
   }
  },
  onPressUnassignOperation: function (oEvent) {
   var selectedOperationTable = sap.ui.getCore().byId(this.sAppId + "--SelectedOperationTable");
   var selectedOperations = selectedOperationTable.getRows();
   var SelectedIndices = selectedOperationTable.getSelectedIndices();
   var oModel = this.oModel;
   var draft = this.permitData.DraftUUID;
   var WorkPermitInternalID = this.getView().getBindingContext().getProperty("WorkPermitInternalID");
   var orderSmartTable = sap.ui.getCore().byId(this.sAppId + "--ord::Table");

   oModel.setDeferredGroups(oModel.getDeferredGroups().concat(["UnAssignOperationGroup"]));
   MessageBox.warning(this.i18nModel.getText("Error.OrderDelete"), {
    title: this.i18nModel.getText("Title.Delete"),
    actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
    emphasizedAction: MessageBox.Action.DELETE,
    onClose: function (sAction) {
     if (sAction === "DELETE") {
      selectedOperationTable.setBusy(true);
      SelectedIndices.forEach(function (selectedIndex) {
       var selectedOperation = selectedOperations[selectedIndex].getBindingContext().getObject();
       oModel.callFunction("/UnassignJobs", {
        method: "POST",
        groupId: "UnAssignOperationGroup",
        changeSetId: selectedIndex,
        urlParameters: {
         "WorkPermit": selectedOperation.WorkPermit,
         "MaintenanceOrder": selectedOperation.MaintenanceOrder,
         "MaintOrderRoutingNumber": selectedOperation.OperationOrderRoutingNumber,
         "WorkPermitInternalID": WorkPermitInternalID,
         "OperationOrderRoutingNumber": selectedOperation.OperationOrderRoutingNumber,
         "MaintenanceOrderOperation": selectedOperation.MaintenanceOrderOperation,
         "MaintOrderOperationCounter": selectedOperation.MaintOrderOperationCounter,
         "MaintOrderOperationInternalID": selectedOperation.MaintOrderOperationInternalID,
         "DraftUUID": draft,
         "WrkPmtOrderOperationDraftUUID": selectedOperation.DraftUUID,
         "IsActiveEntity": selectedOperation.IsActiveEntity
        }
       });
      });
      oModel.submitChanges({
       batchGroupId: "UnAssignOperationGroup",
       success: function (oData) {
        selectedOperationTable.getModel().refresh();
        selectedOperationTable.setBusy(false);
        orderSmartTable.rebindTable();
       }.bind(this),
       error: function (oError) {
        selectedOperationTable.setBusy(false);
       }
      });
     }
    }.bind(this)
   });
  },
  //Assign Operations Functions --- END
  addSPRCellPopover: function () {
   sap.ui.getCore().byId(this.sAppId + "--SPR::Table").attachFieldChange(function (oEvet1) {
    var oSelectedItem = oEvet1.getParameters().changeEvent.getSource().getBindingPath("value");
    var oIsSelected = oEvet1.getParameters().changeEvent.getParameter("newValue");
    if (oSelectedItem === "WrkPmtSftyRqmtIsImplemented" && oIsSelected) {
     var oPop = oEvet1.getParameters().changeEvent.getSource();
     if (!this.oPopover) {
      this.oPopover = new sap.m.ResponsivePopover({
       title: this.i18nModel.getText("SPRPopoverTitleMsg")
      });
     }
     this.oPopover.openBy(oPop);
    } else if (oSelectedItem === "WrkPmtSftyRqmtIsImplemented" && !oIsSelected && this.oPopover) {
     var _Orefresh = setInterval(function () {
      this.oPopover.fireAfterClose();
      clearInterval(_Orefresh);
     }.bind(this), 1000);
    }
   }.bind(this));
  },

  addPrintButton: function () {
   var oMenu = new sap.m.Menu({
    id: "idPrintmenu",
    itemSelected: function (oEvent) {},
    items: [
     new sap.m.MenuItem({
      id: "idPrint",
      text: this.i18nModel.getText("Print"),
      tooltip: this.i18nModel.getText("Print"),
      press: this.onClickPrint.bind(this)
     }),
     new sap.m.MenuItem({
      id: "PrintDraft",
      text: this.i18nModel.getText("PrintDraft"),
      tooltip: this.i18nModel.getText("PrintDraft"),
      press: this.onClickPrint.bind(this)
     })

    ]
   });

   var menuButton = new sap.m.MenuButton("PrintPageMenuButtonddIdStatus", {
    text: this.i18nModel.getText("Btn.PrintMenu"),
    type: "Default",
    visible: true,
    tooltip: this.i18nModel.getText("Btn.PrintMenu"),
    menu: oMenu
   });
   var objectPageHeader = sap.ui.getCore().byId(this.sAppId + "--template::ObjectPage::ObjectPageHeader");
   var shareButtonPosition;
   for (var r = 0; r < objectPageHeader.getActions().length; r++) {
    if (objectPageHeader.getActions()[1].getId().search("Share")) {
     shareButtonPosition = r;
     break;
    }
   }
   objectPageHeader.insertAction(menuButton, shareButtonPosition - 1);
  },
  handleChangeStatusButtons: function (oEvent) {
   if (this.permitData.WorkPermit !== "" && !this.oEditBtnVisibility.getVisible() && this.permitData.DraftUUID ===
    "00000000-0000-0000-0000-000000000000") { //Workpermit and edit mode (edit button hidden)
    this.callCheckAuthAction(false);
   } else if (this.permitData.WorkPermit !== "" && this.oEditBtnVisibility.getVisible()) { //Workpermit and Display (Edit button visible)
    this.callCheckAuthAction(true);
   } else { // no workpermit
    sap.ui.getCore().byId("PrintPageMenuButtonddIdStatus").setVisible(false);
    sap.ui.getCore().byId(this.sAppId + "--action::cds_ui_workpermit.cds_ui_workpermit_Entities::ExtendWorkPermit").setVisible(false);
    // if (this.permitData.WrkPmtCnctntdActvSystStsTxt == "") {
    if (this.permitData.SystemStatusText == "") {
     this.getView().byId("action::idSetIssueFlagButton").setVisible(false);
     this.getView().byId("action::idReissueWrkPmtButton").setVisible(false);
    }
   }
  },
  callCheckAuthAction: function (oEditBtnVisibility) {
   sap.ui.getCore().byId(this.sAppId + "--template::ObjectPage::ObjectPageHeader-_actionsToolbar").setBlocked(true);
   this.isActive = sap.ui.getCore().byId(this.sAppId + "--template::ObjectPage::ObjectMarkerObjectPageDynamicHeaderTitle").getBindingContext()
    .getObject().IsActiveEntity;
   var vData = JSON.parse(this.permitData.WrkPmtChgStsActnEnbldVal).actions[0];
   if (oEditBtnVisibility || this.isActive) {
    this.handleChangeStatusButtonOnEdit(vData);
   } else {
    this.handleChangeStatusButtonOnDisplay(vData);
   }
   sap.ui.getCore().byId(this.sAppId + "--template::ObjectPage::ObjectPageHeader-_actionsToolbar").setBlocked(false);
  },
  handleChangeStatusButtonOnDisplay: function (oData) {
   sap.ui.getCore().byId("PrintPageMenuButtonddIdStatus").setVisible(true);
   if (oData.workpermitprintisallowed && !this.oEditBtnVisibility.getVisible()) {
    sap.ui.getCore().byId("idPrint").setEnabled(oData.workpermitprintisallowed);
    sap.ui.getCore().byId("PrintDraft").setEnabled(oData.workpermitprintdraftisallowed);

   }
   // this.getView().byId("action::idSetIssueFlagButton").setVisible(oData.workpermitisissued);
   // this.getView().byId("action::idReissueWrkPmtButton").setVisible(oData.workpermitreissueisallowed);
//Begin of n3483410
   if (this.permitData.WorkPermitProcessingStatus !== "PS50") {
      sap.ui.getCore().byId("idCombineChangeidSetIssueFlagButton").setVisible(false);
      sap.ui.getCore().byId("idCombineChangeidReissueWrkPmtButton").setVisible(false);
     } else {
      sap.ui.getCore().byId("idCombineChangeidSetIssueFlagButton").setVisible(oData.workpermitisissued);
      // sap.ui.getCore().byId("idCombineChangeidReissueWrkPmtButton").setVisible(oData.workpermitreissueisallowed);
     }

   sap.ui.getCore().byId("idCombineChangeidReissueWrkPmtButton").setVisible(oData.workpermitreissueisallowed);
//end of n3483410

   var oDeactivateButton = sap.ui.getCore().byId("idCombineChangeStatusDeactivate");
   if (oDeactivateButton) {
    // if (this.permitData.WrkPmtCnctntdActvSystStsTxt.includes("WPHO")) {
     if (this.permitData.SystemStatusText.includes("I0642")) {
     oDeactivateButton.setText(this.i18nModel.getText("idReturnandDeactivate"));
    } else {
     oDeactivateButton.setText(this.i18nModel.getText("idSetInactiveFlagButton"));
    }
   }

   var oCloseButton = sap.ui.getCore().byId("idCombineChangeStatusSetProcessingStatusToClosed");
   if (oCloseButton) {
    // if (this.permitData.WrkPmtCnctntdActvSystStsTxt.includes("WPHO")) {
    if (this.permitData.SystemStatusText.includes("I0642")) {
     oCloseButton.setText(this.i18nModel.getText("idReturnandClose"));
    } else {
     oCloseButton.setText(this.i18nModel.getText("idCloseWorkPermitButton"));
    }
   }

  },
  handleChangeStatusButtonOnEdit: function (oData) {
  sap.ui.getCore().byId("idCombineChangeidSetIssueFlagButton").setVisible(false);
   sap.ui.getCore().byId("idCombineChangeidReissueWrkPmtButton").setVisible(false);
   sap.ui.getCore().byId("PrintPageMenuButtonddIdStatus").setVisible(false);
  },
  initializeTables: function () {
   if (sap.ui.getCore().byId(this.sAppId + "--NOW::Table")) {
    sap.ui.getCore().byId(this.sAppId + "--NOW::Table").setShowRowCount(false);
   }
   if (sap.ui.getCore().byId(this.sAppId + "--SPR::Table")) {
    sap.ui.getCore().byId(this.sAppId + "--SPR::Table").setEnableAutoColumnWidth(false);
    sap.ui.getCore().byId(this.sAppId + "--SPR::Table").setHeader(this.i18nModel.getText("Title.SPRTable"));
    sap.ui.getCore().byId(this.sAppId + "--SPR::Table").getTable().setMode("SingleSelectMaster");
   }
   if (sap.ui.getCore().byId(this.sAppId + "--PPE::Table")) {
    sap.ui.getCore().byId(this.sAppId + "--PPE::Table").setEnableAutoColumnWidth(false);
    sap.ui.getCore().byId(this.sAppId + "--PPE::Table").setHeader(this.i18nModel.getText("Title.PPETable"));
    sap.ui.getCore().byId(this.sAppId + "--PPE::Table").getTable().setMode("SingleSelectMaster");
   }
   if (sap.ui.getCore().byId(this.sAppId + "--ord::Table")) {
    sap.ui.getCore().byId(this.sAppId + "--ord::Table").setEnableAutoColumnWidth(false);
    sap.ui.getCore().byId(this.sAppId + "--ord::Table").getTable().setMode("SingleSelectMaster");
   }
   if (sap.ui.getCore().byId(this.sAppId + "--TechObj::Table")) {
    sap.ui.getCore().byId(this.sAppId + "--TechObj::Table").setEnableAutoColumnWidth(false);
    sap.ui.getCore().byId(this.sAppId + "--TechObj::Table").getTable().setMode("SingleSelectMaster");
   }
   if (sap.ui.getCore().byId(this.sAppId + "--Partner::Table")) {
    sap.ui.getCore().byId(this.sAppId + "--Partner::Table").setEnableAutoColumnWidth(false);
    sap.ui.getCore().byId(this.sAppId + "--Partner::Table").getTable().setMode("SingleSelectMaster");
   }
   if (sap.ui.getCore().byId(this.sAppId + "--APPR1::Table")) {
    sap.ui.getCore().byId(this.sAppId + "--APPR1::Table").setEnableAutoColumnWidth(false);
    sap.ui.getCore().byId(this.sAppId + "--APPR1::Table").getTable().setMode("SingleSelectMaster");
   }
   if (sap.ui.getCore().byId(this.sAppId + "--APPR2::Table")) {
    sap.ui.getCore().byId(this.sAppId + "--APPR2::Table").setEnableAutoColumnWidth(false);
   }
   if (sap.ui.getCore().byId(this.sAppId + "--SC::Table")) {
    sap.ui.getCore().byId(this.sAppId + "--SC::Table").setEnableAutoColumnWidth(false);
   }
   if (sap.ui.getCore().byId(this.sAppId + "--PA::Table")) {
    sap.ui.getCore().byId(this.sAppId + "--PA::Table").setEnableAutoColumnWidth(false);
   }
  },
  handleSectionChange: function (selectedSection) {
   if (selectedSection.includes("--GENDATA::Section")) { //When General tab is pressed
    this.setTableFilter(this.sAppId + "--NOW::responsiveTable", "NOW");
   }
   if (selectedSection.includes("--CDATA1::Section")) { //When Safety Requirements tab is pressed
    sap.ui.getCore().byId(this.sAppId + "--PPE::Table").rebindTable();
    sap.ui.getCore().byId(this.sAppId + "--SPR::Table").rebindTable();
    this.setTableFilter(this.sAppId + "--PPE::responsiveTable", "PPE");
    this.setTableFilter(this.sAppId + "--SPR::responsiveTable", "SPR");
   }
   if (selectedSection.includes("--TechObj::Section")) { //When Technical Object tab is pressed
    sap.ui.getCore().byId(this.sAppId + "--TechObj::Table").rebindTable();
    this.setAddObjectVisible("--TechObj::responsiveTable", "--ActionTechObjSection");
   }
   if (selectedSection.includes("--Partner::Section")) { //When Partner tab is pressed
    sap.ui.getCore().byId(this.sAppId + "--Partner::Table").rebindTable();
    this.setAddObjectVisible("--Partner::responsiveTable", "--ActionPartnerSection");
   }
   if (selectedSection.includes("--APRV::Section")) { //When Approval tab is pressed
    sap.ui.getCore().byId(this.sAppId + "--APPR1::Table").rebindTable();
    var oColumns = sap.ui.getCore().byId(this.sAppId + "--APPR1::responsiveTable").getColumns();
    var oTempCol;
    for (var i = 0; i < oColumns.length; i++) {
     if (oColumns[i].getId().includes("com.sap.vocabularies.UI.v1.FieldGroup:23AppAction")) {
      var sText = oColumns[i].getHeader().getText();
      if (oTempCol) {
       oColumns[i].setHeader(oTempCol.clone());
       oColumns[i].getHeader().setText(sText);
      }
     } else {
      oTempCol = oColumns[i].getHeader();
     }
    }
    this.setAddObjectVisible("--APPR1::responsiveTable", "--permitButtonAddApproval");
    this.setAddObjectVisible("--APPR2::responsiveTable", "");
   }
   if (selectedSection.includes("--CDATA2::Section")) { //When Safety Certificate tab is pressed
    sap.ui.getCore().byId(this.sAppId + "--SC::Table").rebindTable();
    this.setAddObjectVisible("--SC::responsiveTable", "--permitButtonAddSafetyCert");
   }
   if (selectedSection.includes("--attachmentReuseComponent::simple") && this.getOwnerComponent().getModel("ui").getData()['editable'] ==
    false) { //When attchment tab is pressed
    var asMode = this.getOwnerComponent().getModel("ui").getData()['editable'] ? 'C' : 'D',
     objectKey = "WCAAP",
     sapObjectType = String(this.permitData.WorkPermit).padStart(12, '0');
    var oAttachController = sap.ui.getCore().byId(this.sAppId + "--attachmentReuseComponent::simple::Attachments::ComponentSubSection");
    oAttachController.getBlocks()[0].getComponentInstance().refresh(asMode, objectKey, sapObjectType);
   }
  },
  setAddObjectVisible: function (oTable, oButton) {
   sap.ui.getCore().byId(this.sAppId + oTable).attachUpdateFinished(function (oEvet) {
    if (oEvet.getSource().getId().includes("SC") && this.oEditBtnVisibility.getVisible() === false) {
     // if ((this.permitData.WrkPmtSftyCertAssgmtCtrlCode === "01" && this.permitData.WrkPmtCnctntdActvSystStsTxt.includes("PWP")) ||
     //  (this.permitData.WrkPmtSftyCertAssgmtCtrlCode === "02" && this.permitData.WrkPmtCnctntdActvSystStsTxt.includes("PREP")) ||
     //  (this.getOwnerComponent().getModel('ui').getData().editable === false)) {
     if ((this.permitData.WrkPmtSftyCertAssgmtCtrlCode === "01" && this.permitData.SystemStatusText.includes("I0611")) ||
      (this.permitData.WrkPmtSftyCertAssgmtCtrlCode === "02" && this.permitData.SystemStatusText.includes("I0175")) ||
      (this.getOwnerComponent().getModel('ui').getData().editable === false)) {
      sap.ui.getCore().byId(this.sAppId + "--permitButtonAddSafetyCert--permitButtonAddSafetyCert").setVisible(false);
      sap.ui.getCore().byId(this.sAppId + "--SC::deleteEntry").setVisible(false);
      sap.ui.getCore().byId(this.sAppId + "--SC::Table").getTable().setMode("None");
     } else {
      sap.ui.getCore().byId(this.sAppId + "--permitButtonAddSafetyCert--permitButtonAddSafetyCert").setVisible(true);
      sap.ui.getCore().byId(this.sAppId + "--SC::deleteEntry").setVisible(true);
      sap.ui.getCore().byId(this.sAppId + "--SC::Table").getTable().setMode("SingleSelectLeft");
     }
    }
    if (this.oEditBtnVisibility || this.oResetDelBtnVisible || this.oResetInacBtnVisible) {
     var oItem = oEvet.getSource().getItems();
     for (var i = 0; i < oItem.length; i++) {
      if (oEvet.getSource().getId().includes("Partner")) {
       /*oItem[i].getCells().forEach(function (cell) {*/
       for (var c = 0; c < oItem[i].getCells().length; c++) {
        if (!this.IsApproved) {
         if (sap.ui.getCore().byId(this.sAppId + oTable).getColumns()[c].getHeader().getText() === this.i18nModel.getText(
           "Input.Description") ||
          sap.ui.getCore().byId(this.sAppId + oTable).getColumns()[c].getHeader().getText() === this.i18nModel.getText(
           "Input.PartnerFunction") ||
          sap.ui.getCore().byId(this.sAppId + oTable).getColumns()[c].getHeader().getText() === this.i18nModel.getText(
           "Input.PartnerName") ||
          sap.ui.getCore().byId(this.sAppId + oTable).getColumns()[c].getHeader().getText() === this.i18nModel.getText(
           "Label.PlanningPlant")) {
          oItem[i].getCells()[c].setEditable(false);
         }
        } else {
         oItem[i].getCells()[c].setEditable(false);
         //cell.setEditable(false);
        }
       } /*.bind(this));*/
      }
     }
    }

    if (oEvet.getSource().getId().includes("ord")) {
     for (i = 0; i < oEvet.getSource().getColumns().length; i++) {
      if (oEvet.getSource().getColumns()[i].getId().includes("MaintOrderRoutingNumber")) {
       oEvet.getSource().getColumns()[i].setVisible(false);
      }
     }
    }
    if (oEvet.getSource().getId().includes("APPR2")) {
     for (i = 0; i < oEvet.getSource().getColumns().length; i++) {
      if (oEvet.getSource().getColumns()[i].getId().includes("PlainLongText")) {
       oEvet.getSource().getColumns()[i].setVisible(false);
      }
      if (oEvet.getSource().getColumns()[i].getId().includes("WorkPermitRevokeLongText")) {
       oEvet.getSource().getColumns()[i].setVisible(false);
      }
     }
     var columnWithLongTextButtonHIST = oEvet.getSource().indexOfColumn(sap.ui.getCore().byId(this.sAppId +
      "--ExtensionWizard::ColumnBreakoutLongTextHistory"));
     var columnWithRevokeTextButtonHIST = oEvet.getSource().indexOfColumn(sap.ui.getCore().byId(this.sAppId +
      "--ExtensionWizard::ColumnBreakoutRevokeTextHistory"));
     for (i = 0; i < oEvet.getSource().getItems().length; i++) {
      var oItems = oEvet.getSource().getItems();
      if (oItems[i].getBindingContext().getObject().PlainLongText) {
       oItems[i].getCells()[columnWithLongTextButtonHIST].setType("Emphasized");
      } else {
       oItems[i].getCells()[columnWithLongTextButtonHIST].setType("Transparent");
      }
      if (oItems[i].getBindingContext().getObject().WorkPermitRevokeLongText) {
       oItems[i].getCells()[columnWithRevokeTextButtonHIST].setType("Emphasized");
      } else {
       oItems[i].getCells()[columnWithRevokeTextButtonHIST].setType("Transparent");
      }
     }
    }
    if (oEvet.getSource().getId().includes("APPR1")) {}
   }.bind(this));
  },
  setDefaultValues: function () {
   this.mGroupFunctions = {
    groupdescription: function (oContext) {
     var name = oContext.getProperty("WrkPmtSftyRequirementGroupText");
     return {
      key: name,
      text: name
     };
    }
   };
   sap.ui.getCore().byId(this.sAppId + "--objectPage").setShowHeaderContent(true);
   this.oColModel = new sap.ui.model.json.JSONModel({
    "cols": [{
     "label": this.i18nModel.getText("Title.Description"),
     "template": "WrkPmtSafetyRequirementText"
    }, {
     "label": this.i18nModel.getText("Title.Category"),
     "template": "WrkPmtSftyRequirementGroupText"
    }]
   });
   this.oTechObjColModel = new sap.ui.model.json.JSONModel({
    "cols": [{
     "label": this.i18nModel.getText("Title.TechObj"),
     "template": "TechnicalObjectLabel"
    }, {
     "label": this.i18nModel.getText("Label.PlanningPlant"),
     "template": "MaintenancePlanningPlant"
    }, {
     "label": this.i18nModel.getText("Title.TechObjType"),
     "template": "TechObjIsEquipOrFuncnlLocDesc"
    }, {
     "label": this.i18nModel.getText("Title.TechObjDescription"),
     "template": "TechnicalObjectDescription"
    }, {
     "label": this.i18nModel.getText("Title.TechWorkCenter"),
     "template": "WorkCenter"
    }]
   });
   this.oOrderColModel = new sap.ui.model.json.JSONModel({
    "cols": [{
     "label": this.i18nModel.getText("Input.OrderNo"),
     "template": "MaintenanceOrder"
    }, {
     "label": this.i18nModel.getText("Title.OrdersDesc"),
     "template": "MaintenanceOrderDesc"
    }, {
     "label": this.i18nModel.getText("Title.OrdersType"),
     "template": "MaintenanceOrderType"
    }, {
     "label": this.i18nModel.getText("Label.PlanningPlant"),
     "template": "MaintenancePlanningPlant"
    }]
   });
   this.oApprovalsColModel = new sap.ui.model.json.JSONModel({
    "cols": [{
     "label": this.i18nModel.getText("Title.ApprovalType"),
     "template": "WorkPermitApproval"
    }, {
     "label": this.i18nModel.getText("Title.ApprovalDescription"),
     "template": "WorkPermitApprovalDescription"
    }, {
     "label": this.i18nModel.getText("Title.ApprovalRequirement"),
     "template": "WrkPmtApprvlMandText"
    }]
   });

  },
  fnObjectPageLoad: function () {
   var sHash = window.location.href,
    PPExists, PTExists,
    isNavigatedFromListPage = decodeURIComponent(sHash).includes("WorkPermit=''"),
    isNavigatedFromObjectPage = this.getOwnerComponent().getModel("uiConfigModel").getProperty("/navigated");
   if (sap.ui.getCore().byId(this.sAppId + "--header::headerEditable::PlanningPlant::MaintenancePlanningPlant::Field")) {
    PPExists = sap.ui.getCore().byId(this.sAppId + "--header::headerEditable::PlanningPlant::MaintenancePlanningPlant::Field").getValue();
   }
   if (sap.ui.getCore().byId(this.sAppId + "--header::headerEditable::PlanningPlant::WorkPermitType::Field")) {
    PTExists = sap.ui.getCore().byId(this.sAppId + "--header::headerEditable::PlanningPlant::WorkPermitType::Field").getValue();
   }
   var hasActiveEntity = this.getView().getBindingContext().getObject().HasActiveEntity;
   if ((isNavigatedFromListPage === true && !isNavigatedFromObjectPage) && (PPExists === "" || PTExists === "" || !hasActiveEntity)) { //indicators to open popup
    this.onClickCreatePermitPopUp();
    this.duplicateKey = this.onCreatePermitDialog.getBindingContext().getObject().DraftUUID;
   }
   if (isNavigatedFromObjectPage === true) {
    this.getOwnerComponent().getModel("uiConfigModel").setProperty("/navigated", false);
   }
  },
  setTableFilter: function (oTable, oFilter) {
   if (sap.ui.getCore().byId(oTable)) {
    sap.ui.getCore().byId(oTable).attachUpdateStarted(function (oEvt) {
     if (!sap.ui.getCore().byId(oTable).getVisible()) {
      sap.ui.getCore().byId(oTable).setVisible(true);
     }
     sap.ui.getCore().byId(oTable).setAutoPopinMode(false);
    }.bind(this));
    sap.ui.getCore().byId(oTable).attachUpdateFinished(function (oEvt) {
     if (!oEvt.getSource().getId().includes("NOW")) {
      if (sap.ui.getCore().byId(this.sAppId + "PPE")) {
       sap.ui.getCore().byId(this.sAppId + "PPE").setVisible(!this.oEditBtnVisibility.getVisible() || !this.oResetDelBtnVisible.getVisible() ||
        !this.oResetInacBtnVisible.getVisible());
      }
      if (sap.ui.getCore().byId(this.sAppId + "SPR")) {
       sap.ui.getCore().byId(this.sAppId + "SPR").setVisible(!this.oEditBtnVisibility.getVisible() || !this.oResetDelBtnVisible.getVisible() ||
        !this.oResetInacBtnVisible.getVisible());
      }
      oEvt.getSource().getItems().forEach(function (item) {
       if (!item.isGroupHeader()) {
        /*item.getCells().forEach(function (cell) {
         if (cell.getAriaLabelledBy()[0] && (cell.getAriaLabelledBy()[0].includes("CreatedByUser") || cell.getAriaLabelledBy()[
           0].includes("CreationDateTime") || cell.getAriaLabelledBy()[0].includes("CriticalityText") || cell.getAriaLabelledBy()[
           0].includes("WrkPmtSftyRequirementGroupText") || cell.getAriaLabelledBy()[
           0].includes("WrkPmtSafetyRequirementText"))) {
          cell.setEditable(false);
         }
         item.setHighlight("None");
         if (item.getDeleteControl()) {
          item.getDeleteControl().setIcon("sap-icon://delete");
          if (!this.IsApproved) {
           if (this.oEditBtnVisibility.getVisible() || this.oResetDelBtnVisible.getVisible() || this.oResetInacBtnVisible.getVisible()) {
            item.getDeleteControl().setVisible(false);
           }
          } else {
           item.getDeleteControl().setVisible(false);
          }
         }
        }.bind(this));*/
        for (var c = 0; c < item.getCells().length; c++) {
         if (sap.ui.getCore().byId(oTable).getColumns()[c].getHeader().getText() === this.i18nModel.getText("Title.Category") ||
          sap.ui.getCore().byId(oTable).getColumns()[c].getHeader().getText() === this.i18nModel.getText("Title.Description") ||
          sap.ui.getCore().byId(oTable).getColumns()[c].getHeader().getText() === this.i18nModel.getText(
           "ImplementationStatusText") ||
          sap.ui.getCore().byId(oTable).getColumns()[c].getHeader().getText() === this.i18nModel.getText("ImplementedOnText") ||
          sap.ui.getCore().byId(oTable).getColumns()[c].getHeader().getText() === this.i18nModel.getText("ImplementedByText")) {
          item.getCells()[c].setEditable(false);
         }
         item.setHighlight("None");
         if (item.getDeleteControl()) {
          item.getDeleteControl().setIcon("sap-icon://delete");
          if (!this.IsApproved) {
           if (this.oEditBtnVisibility.getVisible() || this.oResetDelBtnVisible.getVisible() || this.oResetInacBtnVisible.getVisible()) {
            item.getDeleteControl().setVisible(false);
           }
          }
          // else {
          //  item.getDeleteControl().setVisible(false);
          // }
         }
        } /*.bind(this));*/
       }
      }.bind(this));
     }
     if (oEvt.getSource().getId().includes("SPR")) {
      for (var i = 0; i < sap.ui.getCore().byId(this.sAppId + "--SPR::Table").getTable().getColumns().length; i++) {
       if (this.oEditBtnVisibility.getVisible() === true && sap.ui.getCore().byId(this.sAppId + "--SPR::Table").getTable().getColumns()[
         i].getId().includes("WrkPmtSftyRqmtIsImplemented")) {
        sap.ui.getCore().byId(this.sAppId + "--SPR::Table").getTable().getColumns()[i].setVisible(false);
       }
       //else {
       //  sap.ui.getCore().byId(this.sAppId + "--SPR::Table").getTable().getColumns()[i].setVisible(true);
       // }
      }
     }
    }.bind(this));
   }
  },
  //Trigger Save Action to Navigate to Display Mode
  navigateToDisplayMode: function () {
   sap.ui.getCore().byId(this.sAppId + "--activate").firePress();
  },
  /*Create Premit PopUp*/
  onClickCreatePermitPopUp: function () {
   if (!this.onCreatePermitDialog) {
    this.onCreatePermitDialog = sap.ui.xmlfragment("idCreatePermitDialog",
     "i2d.eam.workpermit.manages1.ext.view.fragments.CreatePermitPopUp", this);
    this.getView().addDependent(this.onCreatePermitDialog);
   }
   this.onCreatePermitDialog.open();
   this.idPlanningPlant = sap.ui.core.Fragment.byId("idCreatePermitDialog", "permitInputPlanningPlant");
   this.idPermitType = sap.ui.core.Fragment.byId("idCreatePermitDialog", "permitInputPermitType");
   this.idMaintorder = sap.ui.core.Fragment.byId("idCreatePermitDialog", "permitInputMO");
   this.idRefObjTypSel = sap.ui.core.Fragment.byId("idCreatePermitDialog", "refObjTypSel");
   this.idTemplNumRef = sap.ui.core.Fragment.byId("idCreatePermitDialog", "permitInputTempNum");
   this.idWrkPmtRef = sap.ui.core.Fragment.byId("idCreatePermitDialog", "wrkPmtRefernce");
   this.idPermitNum = sap.ui.core.Fragment.byId("idCreatePermitDialog", "permitInputPermitNum");
   this.continueBtn = sap.ui.core.Fragment.byId("idCreatePermitDialog", "permitButtonCreatePermit");
   this.clearCreatePermitFields();
   this.setCreatePermitParameterValues();
   jQuery.sap.delayedCall(500, this, function () {
    sap.ui.core.Fragment.byId("idCreatePermitDialog", "permitInputPlanningPlant").focus();
   });
  },
  handleClosePermitButton: function () {
   this.onCreatePermitDialog.setBusy(true);
   this.oModel.resetChanges();
   this.oModel.callFunction("/WorkPermitDiscard", {
    method: "POST",
    urlParameters: {
     WorkPermit: "",
     DraftUUID: this.onCreatePermitDialog.getBindingContext().getObject().DraftUUID,
     IsActiveEntity: false
    },
    success: function (oData, response) {
     this.onCreatePermitDialog.setBusy(false);
     this.oModel.refresh();
     var sHash = window.location.href,
      inCreateMode = decodeURIComponent(sHash).includes("preferredMode=create");
     if (inCreateMode === true) {
      window.hasher.replaceHash("");
     } else {
      history.back();
     }
    }.bind(this),
    error: function (oData, response) {
     this.onCreatePermitDialog.setBusy(false);
    }.bind(this)
   });
  },
  clearCreatePermitFields: function () {
   this.idPlanningPlant.setValue("");
   this.idPermitType.setValue("");
   this.idPermitNum.setValue("");
   this.idTemplNumRef.setValue("");
   this.idWrkPmtRef.setValue("");
   this.idMaintorder.setValue("");

   this.idPlanningPlant.setValueState("None");
   this.idPermitType.setValueState("None");
   this.idPermitNum.setValueState("None");
   this.idTemplNumRef.setValueState("None");
   this.idWrkPmtRef.setValueState("None");
   this.idMaintorder.setValueState("None");

   this.newPPValue = "";
   this.newPTValue = "";
   this.newRefValue = "";
   this.newPermitNumValue = "";

   sap.ui.core.Fragment.byId("idCreatePermitDialog", "permitGroupElementPermitNum").setVisible(false);

   sap.ui.core.Fragment.byId("idCreatePermitDialog", "permitGroupElementTempNum").setVisible(false);
   sap.ui.core.Fragment.byId("idCreatePermitDialog", "permitGroupElementNum").setVisible(false);
  },
  escapeHandler: function (oPromise) {
   oPromise.resolve();
   this.handleClosePermitButton();
  },
  // changed for create Validation 
  handleCreatePermitButton: function () {
   if (this.idTemplNumRef.getValueStateText() !== "") {
    this.IsBlocked = true;
   } else {
    this.IsBlocked = false;
   }
   this.idPlanningPlant.setValueState("None");
   this.idPermitType.setValueState("None");
   this.idMaintorder.setValueState("None");
   this.idPermitNum.setValueState("None");
   this.idTemplNumRef.setValueStateText("");
   this.idTemplNumRef.setValueState("None");
   this.idWrkPmtRef.setValueStateText("");
   this.idWrkPmtRef.setValueState("None");
   this.idPlanningPlant.setValueStateText("");
   this.idPermitType.setValueStateText("");
   this.idMaintorder.setValueStateText("");
   this.idPermitNum.setValueStateText("");
   this.newMaintorder = "";
   this.newTemplNumRef = "";
   this.newWrkPmtRef = "";
   this.newRefObjTyp = "";
   // if (this.idMaintorder.getValue().includes("(") && this.idMaintorder.getValue().includes(")")) {
   //  this.newMaintorder = this.idMaintorder.getValue().split("(")[1].split(")")[0];
   // } else {
   //  this.newMaintorder = this.idMaintorder.getValue();
   // }
   this.newMaintorder = this.getView().getBindingContext().getObject().MaintenanceOrder;
   // if (this.idTemplNumRef.getValue().includes("(") && this.idTemplNumRef.getValue().includes(")")) {
   //  this.newTemplNumRef = this.idTemplNumRef.getValue().split("(")[1].split(")")[0];
   // } else {
   //  this.newTemplNumRef = this.idTemplNumRef.getValue();
   // }
   this.newTemplNumRef = this.getView().getBindingContext().getObject().WorkPermitReference;
   // if (this.idWrkPmtRef.getValue().includes("(") && this.idWrkPmtRef.getValue().includes(")")) {
   //  this.newWrkPmtRef = this.idWrkPmtRef.getValue().split("(")[1].split(")")[0];
   // } else {
   //  this.newWrkPmtRef = this.idWrkPmtRef.getValue();
   // }
   this.newWrkPmtRef = this.getView().getBindingContext().getObject().WorkPermitReferenceWorkPermit;
   var oRefObjTypDropDown = this.idRefObjTypSel.getInnerControls()[0];
   var refObjTyp;
   if (oRefObjTypDropDown.getSelectedItem()) {
    refObjTyp = oRefObjTypDropDown.getSelectedItem().getBindingContext().getObject().WorkPermitReferenceObjectType;
   }
   if (refObjTyp === "10" || refObjTyp === "20") {
    this.newRefObjTyp = refObjTyp;
   }
   this.callCreatePermitAction();
  },
  callCreatePermitAction: function () {
   this.onCreatePermitDialog.setBusy(true);
   this.oModel.callFunction("/CreateFromPopup", {
    method: "POST",
    urlParameters: {
     MaintenancePlanningPlant: this.newPPValue,
     WorkPermitType: this.newPTValue,
     WorkPermitReferenceObjectType: this.newRefObjTyp,
     WorkPermitReference: this.newTemplNumRef,
     WorkPermitReferenceWorkPermit: this.newWrkPmtRef,
     MaintenanceOrder: this.newMaintorder,
     WorkPermitExternalNumber: this.idPermitNum.getValue(),
     DraftUUID: this.duplicateKey,
     ValidationScenarioID: "00002",
     IsActiveEntity: false,
     IsBlocked: this.IsBlocked
    },
    success: function (oData, response) {
     this.oModel.refresh();
     this.oModel.setRefreshAfterChange(true);
     this.oModel.resetChanges();
     this.onCreatePermitDialog.setBusy(false);
     this.onCreatePermitDialog.close();
     this.createSuccessFunction(oData, response);
    }.bind(this),
    error: function (oData, response) {
     this.onCreatePermitDialog.setBusy(false);
     var ErrorInfo = JSON.parse(oData.responseText).error.innererror.errordetails;
     ErrorInfo = ErrorInfo.sort(function (a, b) {
      return parseInt(a.code.split("/")[1]) - parseInt(b.code.split("/")[1]);
     });
     for (var i = 0; i < ErrorInfo.length; i++) {
      // Planning plant
      if (ErrorInfo[i].code === "I4/824" || ErrorInfo[i].code === "I4/001") {
       this.idPlanningPlant.setValueStateText(ErrorInfo[i].message);
       this.idPlanningPlant.setValueState("Error");
       return;
      }
      // Permit Type
      else if (ErrorInfo[i].code === "I4/820" || ErrorInfo[i].code === "I4/009") {
       this.idPermitType.setValueStateText(ErrorInfo[i].message);
       this.idPermitType.setValueState("Error");
      }
      // External Number
      else if (ErrorInfo[i].code === "I4/842" || ErrorInfo[i].code === "I4/843" || ErrorInfo[i].code === "I4/008") {
       this.idPermitNum.setValueStateText(ErrorInfo[i].message);
       this.idPermitNum.setValueState("Error");
      }
      // Order 
      else if (ErrorInfo[i].code === "I4/845" || ErrorInfo[i].code === "I4/846" || ErrorInfo[i].code === "I4/847") {
       this.idMaintorder.setValueStateText(ErrorInfo[i].message);
       this.idMaintorder.setValueState("Error");
      }
      //reference template number
      else if (ErrorInfo[i].code === "I4/863" || ErrorInfo[i].code === "I4/865" || ErrorInfo[i].code === "I4/868" ||
       ErrorInfo[i].code === "I4/887" || ErrorInfo[i].code === "I4/897" || ErrorInfo[i].code === "I4/888" || ErrorInfo[i].code ===
       "I4/048") {
       this.idTemplNumRef.setValueStateText(ErrorInfo[i].message);
       this.idTemplNumRef.setValueState("Error");
      }
      //Reference Work permit
      else if (ErrorInfo[i].code === "I4/044") {
       this.idWrkPmtRef.setValueStateText(ErrorInfo[i].message);
       this.idWrkPmtRef.setValueState("Error");
      } else if (ErrorInfo[i].code === "I4/864") {
       if (this.newTemplNumRef) {
        this.idTemplNumRef.setValueStateText(ErrorInfo[i].message);
        this.idTemplNumRef.setValueState("Error");
       } else {
        this.idWrkPmtRef.setValueStateText(ErrorInfo[i].message);
        this.idWrkPmtRef.setValueState("Error");
       }
      } else {
       MessageBox.error(ErrorInfo[i].message);
      }
      // No Authorization 
      if (ErrorInfo[i].code === "I4/856") {
       this.continueBtn.setBlocked(true);
       MessageBox.error(ErrorInfo[i].message, {
        onClose: function (sAction) {
         if (sAction === "CLOSE") {
          this.handleClosePermitButton();
         }
        }.bind(this)
       });
      }
     }
    }.bind(this)
   });
  },
  createSuccessFunction: function (oData, response) {
   this.permitData = sap.ui.getCore().byId(this.sAppId + "--objectPage").getBindingContext().getObject();
   var sHashChanger = new sap.ui.core.routing.HashChanger(),
    newHash = sHashChanger.getHash();
   newHash = newHash.replace(sHashChanger.getHash().split(",")[1], "DraftUUID=guid'" + oData.DraftUUID + "'");
   if (oData.WorkPermit !== "") {
    newHash = newHash.replace("WorkPermit=''", "WorkPermit='" + oData.WorkPermit + "'");
   }
   sHashChanger.replaceHash(newHash);
   this.getOwnerComponent().getModel("uiConfigModel").setProperty("/navigated", true);
  },
  handlePlanningPlantValueChange: function (oEvent) {
   this.newPPValue = oEvent.getParameters().newValue;
   this.validateAuthorization(this.newPPValue);
  },
  onChangeCopyFrom: function (oEvent) {
   var oRefObjTypDropDown = this.idRefObjTypSel.getInnerControls()[0];
   var refObjTyp;
   if (oRefObjTypDropDown.getSelectedItem()) {
    refObjTyp = oRefObjTypDropDown.getSelectedItem().getBindingContext().getObject().WorkPermitReferenceObjectType;
   }
   if (refObjTyp === "10") {
    sap.ui.core.Fragment.byId("idCreatePermitDialog", "permitGroupElementTempNum").setVisible(true);
    sap.ui.core.Fragment.byId("idCreatePermitDialog", "permitGroupElementNum").setVisible(false);
    this.idWrkPmtRef.setValue("");
    this.idWrkPmtRef.setEditable(false);
    this.idTemplNumRef.setEditable(true);
   } else if (refObjTyp === "20") {
    sap.ui.core.Fragment.byId("idCreatePermitDialog", "permitGroupElementNum").setVisible(true);
    sap.ui.core.Fragment.byId("idCreatePermitDialog", "permitGroupElementTempNum").setVisible(false);
    this.idTemplNumRef.setValue("");
    this.idTemplNumRef.setEditable(false);
    this.idWrkPmtRef.setEditable(true);
   } else {
    sap.ui.core.Fragment.byId("idCreatePermitDialog", "permitGroupElementTempNum").setVisible(false);
    sap.ui.core.Fragment.byId("idCreatePermitDialog", "permitGroupElementNum").setVisible(false);
    this.idTemplNumRef.setValue("");
    this.idWrkPmtRef.setValue("");
    this.idTemplNumRef.setEditable(false);
    this.idWrkPmtRef.setEditable(false);
   }
  },
  validateAuthorization: function () {
   this.onCreatePermitDialog.setBusy(true);
   if (this.newPPValue.includes("(") && this.newPPValue.includes(")")) {
    this.newPPValue = this.newPPValue.split("(")[1].split(")")[0];
   }
   if (this.newPTValue === "") {
    this.newPTValue = this.permitData.WorkPermitType;
   }
   //var plantFilter = new Filter("MaintenancePlanningPlant", FilterOperator.EQ, this.newPPValue);
   this.oModel.callFunction("/CheckAuthorization", {
    method: "POST",
    urlParameters: {
     MaintenancePlanningPlant: this.newPPValue,
     WorkPermit: this.permitData.WorkPermit,
     WorkPermitType: this.newPTValue,
     WorkPermitInternalID: this.permitData.WorkPermitInternalID,
     DraftUUID: this.permitData.DraftUUID,
     IsActiveEntity: this.permitData.IsActiveEntity
    },
    success: function (oData) {
     this.onCreatePermitDialog.setBusy(false);
     this.continueBtn.setBlocked(false);
     if (oData.CheckAuthorization.WorkPermitType !== "") {
      this.idPermitType.setValueState("None");
      if (oData.CheckAuthorization.InternalNumberRangeInterval !== "" && oData.CheckAuthorization.ExternalNumberRangeInterval !==
       "") {
       sap.ui.core.Fragment.byId("idCreatePermitDialog", "permitGroupElementPermitNum").setVisible(true);
       this.idPermitNum.setRequired(false);
       jQuery.sap.delayedCall(0, this, function () {
        this.idPermitNum.focus();
       });
      } else if (oData.CheckAuthorization.ExternalNumberRangeInterval !== "") {
       sap.ui.core.Fragment.byId("idCreatePermitDialog", "permitGroupElementPermitNum").setVisible(true);
       this.idPermitNum.setRequired(true);
       jQuery.sap.delayedCall(0, this, function () {
        this.idPermitNum.focus();
       });
      } else if (oData.CheckAuthorization.InternalNumberRangeInterval !== "") {
       sap.ui.core.Fragment.byId("idCreatePermitDialog", "permitGroupElementPermitNum").setVisible(false);
      } else {
       this.idPermitType.setValueState("Error");
       this.idPermitType.setValueStateText(this.i18nModel.getText("Error.RangeDoesNotExists1", [this.newPPValue, this.newPTValue]));
      }
     }
    }.bind(this),
    error: function (oError) {
     this.continueBtn.setBlocked(true);
     this.onCreatePermitDialog.setBusy(false);
     var oMessage = JSON.parse(oError.responseText).error;
     if (oMessage.code === 'I4/012') {
      this.idPlanningPlant.setValueState("Error");
      this.idPlanningPlant.setValueStateText(oMessage.message.value);
     } else if (oMessage.code === 'I4/856') {
      this.idPermitType.setValueState("Error");
      this.idPermitType.setValueStateText(oMessage.message.value);
     } else if (oMessage.code === 'I4/013') {
      MessageBox.error(oMessage.message.value, {
       onClose: function (sAction) {
        if (sAction === "CLOSE") {
         this.handleClosePermitButton();
        }
       }.bind(this)
      });
     }
    }.bind(this)
   });
  },
  validateTechn: function () {
   this.continueBtn.setBlocked(true); //note 3460511
   var techFilter = new Filter("WorkAssignment", FilterOperator.EQ, this.TechId);
   this.oModel.read("/C_EAMPersonWorkAgreementVH", {
    filters: [techFilter],
    success: function (oData) {
     if (oData.results.length > 0) {
      this.idTechnician.setValueState("None");
      this.continueBtn.setBlocked(false);
     } else {
      this.idTechnician.setValueState("Error");
      this.idTechnician.setValueStateText(this.i18nModel.getText("Error.TechDoesNotExists"));
      this.continueBtn.setBlocked(true);
     }
    }.bind(this),
    error: function (oError) {
     this.idTechnician.setValueState("Error");
     this.idTechnician.setValueStateText(this.i18nModel.getText("Error.TechDoesNotExists"));
     this.continueBtn.setBlocked(true);
    }.bind(this)
   });
  },
  handlePermitTypeValueChange: function (oEvent) {
   this.newPTValue = oEvent.getParameters().newValue;
   if (this.newPTValue.includes("(") && this.newPTValue.includes(")")) {
    this.newPTValue = this.newPTValue.split("(")[1].split(")")[0];
   }
   if (this.newPPValue !== "" && this.idPlanningPlant.getValueState() === "None") {
    this.validateAuthorization();
   } else {
    this.idPlanningPlant.setValueState("Error");
   }
  },
  /*Safety Requirement Section*/
  getSearchHelpFilters: function (id, sSearchQuery) {
   var searchFilters;
   switch (true) {
   case id.includes("PPE") || id.includes("SPR"):
    if (sSearchQuery.endsWith("*")) {
     searchFilters = new Filter({
      filters: [
       new Filter("WrkPmtSftyRequirementGroupText", FilterOperator.StartsWith, sSearchQuery.slice(0, -1)),
       new Filter("WrkPmtSafetyRequirementText", FilterOperator.StartsWith, sSearchQuery.slice(0, -1))
      ],
      and: false
     });
    } else {
     searchFilters = new Filter({
      filters: [
       new Filter("WrkPmtSftyRequirementGroupText", FilterOperator.Contains, sSearchQuery),
       new Filter("WrkPmtSafetyRequirementText", FilterOperator.Contains, sSearchQuery)
      ],
      and: false
     });
    }
    break;
   case id.includes("TechObj"):
    if (sSearchQuery.endsWith("*")) {
     searchFilters = new Filter({
      filters: [
       new Filter("TechnicalObjectLabel", FilterOperator.StartsWith, sSearchQuery.slice(0, -1)),
       new Filter("TechObjIsEquipOrFuncnlLoc", FilterOperator.StartsWith, sSearchQuery.slice(0, -1)),
       new Filter("TechnicalObjectDescription", FilterOperator.StartsWith, sSearchQuery.slice(0, -1)),
       new Filter("WorkCenter", FilterOperator.StartsWith, sSearchQuery.slice(0, -1))
      ],
      and: false
     });
    } else {
     searchFilters = new Filter({
      filters: [
       new Filter("TechnicalObjectLabel", FilterOperator.Contains, sSearchQuery),
       new Filter("TechObjIsEquipOrFuncnlLoc", FilterOperator.Contains, sSearchQuery),
       new Filter("TechnicalObjectDescription", FilterOperator.Contains, sSearchQuery),
       new Filter("WorkCenter", FilterOperator.Contains, sSearchQuery)
      ],
      and: false
     });
    }
    break;
   case id.includes("SafetyCert"):
    if (sSearchQuery.endsWith("*")) {
     searchFilters = new Filter({
      filters: [
       new Filter("SafetyCertificate", FilterOperator.StartsWith, sSearchQuery.slice(0, -1)),
       new Filter("SafetyCertificateType", FilterOperator.StartsWith, sSearchQuery.slice(0, -1)),
       new Filter("TechnicalObjectLabel", FilterOperator.StartsWith, sSearchQuery.slice(0, -1)),
       new Filter("SftyCertProcessingStatusText", FilterOperator.StartsWith, sSearchQuery.slice(0, -1)),
       new Filter("MaintenancePlanningPlant", FilterOperator.StartsWith, sSearchQuery.slice(0, -1)),
      ],
      and: false
     });
    } else {
     searchFilters = new Filter({
      filters: [
       new Filter("SafetyCertificate", FilterOperator.Contains, sSearchQuery),
       new Filter("SafetyCertificateType", FilterOperator.Contains, sSearchQuery),
       new Filter("TechnicalObjectLabel", FilterOperator.Contains, sSearchQuery),
       new Filter("SftyCertProcessingStatusText", FilterOperator.Contains, sSearchQuery),
       new Filter("MaintenancePlanningPlant", FilterOperator.Contains, sSearchQuery),
      ],
      and: false
     });
    }
    break;
   case id.includes("Partner"):
    if (sSearchQuery.endsWith("*")) {
     searchFilters = new Filter({
      filters: [
       new Filter("PartnerFunctionName", FilterOperator.StartsWith, sSearchQuery.slice(0, -1)),
       new Filter("Partner", FilterOperator.StartsWith, sSearchQuery.slice(0, -1)),
       new Filter("PartnerFullName", FilterOperator.StartsWith, sSearchQuery.slice(0, -1))
      ],
      and: false
     });
    } else {
     searchFilters = new Filter({
      filters: [
       new Filter("PartnerFunctionName", FilterOperator.Contains, sSearchQuery),
       new Filter("Partner", FilterOperator.Contains, sSearchQuery),
       new Filter("PartnerFullName", FilterOperator.Contains, sSearchQuery)
      ],
      and: false
     });
    }
    break;
   case id.includes("Operation"):
    if (sSearchQuery.endsWith("*")) {
     searchFilters = new Filter({
      filters: [
       new Filter("MaintenanceOrderOperation", FilterOperator.StartsWith, sSearchQuery.slice(0, -1)),
       new Filter("OperationDescription", FilterOperator.StartsWith, sSearchQuery.slice(0, -1))
      ],
      and: false
     });
    } else {
     searchFilters = new Filter({
      filters: [
       new Filter("MaintenanceOrderOperation", FilterOperator.Contains, sSearchQuery),
       new Filter("OperationDescription", FilterOperator.Contains, sSearchQuery)
      ],
      and: false
     });
    }
    break;
   case id.includes("Order"):
    if (sSearchQuery.endsWith("*")) {
     searchFilters = new Filter({
      filters: [
       new Filter("MaintenanceOrderDesc", FilterOperator.StartsWith, sSearchQuery.slice(0, -1)),
       new Filter("MaintenanceOrderType", FilterOperator.StartsWith, sSearchQuery.slice(0, -1)),
       new Filter("MaintenanceOrder", FilterOperator.StartsWith, sSearchQuery.slice(0, -1)),
       new Filter("MaintenancePlanningPlant", FilterOperator.StartsWith, sSearchQuery.slice(0, -1))
      ],
      and: false
     });
    } else {
     searchFilters = new Filter({
      filters: [
       new Filter("MaintenanceOrderDesc", FilterOperator.Contains, sSearchQuery),
       new Filter("MaintenanceOrderType", FilterOperator.Contains, sSearchQuery),
       new Filter("MaintenanceOrder", FilterOperator.Contains, sSearchQuery),
       new Filter("MaintenancePlanningPlant", FilterOperator.Contains, sSearchQuery)
      ],
      and: false
     });
    }
    break;
   case id.includes("Approvals"):
    if (sSearchQuery.endsWith("*")) {
     searchFilters = new Filter({
      filters: [
       new Filter("WorkPermitApproval", FilterOperator.StartsWith, sSearchQuery.slice(0, -1)),
       new Filter("WorkPermitApprovalDescription", FilterOperator.StartsWith, sSearchQuery.slice(0, -1))
      ],
      and: false
     });
    } else {
     searchFilters = new Filter({
      filters: [
       new Filter("WorkPermitApproval", FilterOperator.Contains, sSearchQuery),
       new Filter("WorkPermitApprovalDescription", FilterOperator.Contains, sSearchQuery)
      ],
      and: false
     });
    }
    break;
   default:
    break;
   }
   return searchFilters;
  },
  getValueHelpData: function (id, WorkPermit, draftId) {
   var valueHelpData = {};
   switch (true) {
   case id.includes("PPE"):
    valueHelpData.oTable = sap.ui.getCore().byId(this.sAppId + "--PPE::Table");
    valueHelpData.fragmentId = "i2d.eam.workpermit.manages1.ext.view.fragments.AddPPEPopUp";
    valueHelpData.vhTitle = this.i18nModel.getText("Title.PPE");
    valueHelpData.columnModel = this.oColModel;
    valueHelpData.path = "/SafetyRequirementVH";
    valueHelpData.valueHelp = this._oPPEValueHelpDialog;
    valueHelpData.sPath = "/to_PermitProtEquip";
    break;
   case id.includes("SPR"):
    valueHelpData.sPath = "/to_PermitSftyPrecaution";
    valueHelpData.oTable = sap.ui.getCore().byId(this.sAppId + "--SPR::Table");
    valueHelpData.fragmentId = "i2d.eam.workpermit.manages1.ext.view.fragments.AddSPRPopUp";
    valueHelpData.vhTitle = this.i18nModel.getText("Title.SPR");
    valueHelpData.columnModel = this.oColModel;
    valueHelpData.path = "/SafetyRequirementVH";
    valueHelpData.valueHelp = this._oSPRValueHelpDialog;
    break;
   case id.includes("TechObj"):
    valueHelpData.fragmentId = "i2d.eam.workpermit.manages1.ext.view.fragments.AddTechnicalObjectPopup";
    valueHelpData.vhTitle = this.i18nModel.getText("Title.vhTechObj");
    valueHelpData.columnModel = this.oTechObjColModel;
    valueHelpData.path = "/TechnicalObject";
    valueHelpData.valueHelp = this._oTechObjValueHelpDialog;
    break;
   case id.includes("SafetyCert"):
    valueHelpData.fragmentId = "i2d.eam.workpermit.manages1.ext.view.fragments.AddSafetyCertificatePopUp";
    valueHelpData.vhTitle = this.i18nModel.getText("AddSafetyCertificate");
    valueHelpData.columnModel = this.oSafetyObjColModel;
    valueHelpData.path = "/WrkPmtSftyCertValueHelp";
    valueHelpData.valueHelp = this._oSftyObjValueHelpDialog;
    break;
   case id.includes("Order"):
    valueHelpData.fragmentId = "i2d.eam.workpermit.manages1.ext.view.fragments.AddOrderPopUp";
    valueHelpData.vhTitle = this.i18nModel.getText("Title.Order");
    valueHelpData.columnModel = this.oOrderColModel;
    valueHelpData.path = "/OpenOrder";
    valueHelpData.sorter = "";
    valueHelpData.valueHelp = this._oOrderValueHelpDialog;
    break;
   case id.includes("Approvals"):
    valueHelpData.fragmentId = "i2d.eam.workpermit.manages1.ext.view.fragments.AddApprovalsPopUp";
    valueHelpData.vhTitle = this.i18nModel.getText("Title.AddAprovals");
    valueHelpData.columnModel = this.oApprovalsColModel;
    valueHelpData.path = "/approvalDetails";
    valueHelpData.valueHelp = this._oApprovalsValueHelpDialog;
    break;
   default:
    break;
   }
   return valueHelpData;
  },
  setValueHelpData: function (oFragment, _objnumber, _oPlanningPlant, _oPermitType, valueHelpData) {
   var WorkPermit = this.permitData.WorkPermit,
    draftId = this.permitData.DraftUUID;
   if (oFragment.getId().includes("PPE")) {
    this._oPPEValueHelpDialog = oFragment;
    valueHelpData.filterArr = new Filter({
     filters: [
      new Filter("MaintenancePlanningPlant", FilterOperator.EQ, _oPlanningPlant),
      new Filter("WorkPermitType", FilterOperator.EQ, _oPermitType),
      new Filter("WorkPermitGroupCategory", FilterOperator.EQ, "PPE")
     ],
     and: true
    });
    this.getPPETableItems(_objnumber, _oPlanningPlant, _oPermitType);
   } else if (oFragment.getId().includes("SPR")) {
    this._oSPRValueHelpDialog = oFragment;
    valueHelpData.filterArr = new Filter({
     filters: [
      new Filter("MaintenancePlanningPlant", FilterOperator.EQ, _oPlanningPlant),
      new Filter("WorkPermitType", FilterOperator.EQ, _oPermitType),
      new Filter("WorkPermitGroupCategory", FilterOperator.EQ, "SPR")
     ],
     and: true
    });
    this.getSPRTableItems(_objnumber, _oPlanningPlant, _oPermitType);
   } else if (oFragment.getId().includes("TechObj")) {
    this._oTechObjValueHelpDialog = oFragment;
    valueHelpData.filterArr = [new Filter("MaintenancePlanningPlant", FilterOperator.EQ, _oPlanningPlant)];
    this.getTechObjTableItems(_objnumber, _oPlanningPlant, _oPermitType);
   } else if (oFragment.getId().includes("SafetyCert")) {
    this._oSftyObjValueHelpDialog = oFragment;
    // valueHelpData.filterArr = [new Filter("MaintenancePlanningPlant", FilterOperator.EQ, _oPlanningPlant)];
    this.getSftyCertTableItems(_objnumber, _oPlanningPlant);
   } else if (oFragment.getId().includes("Order")) {
    this._oOrderValueHelpDialog = oFragment;
    this.getOrderTableItems(_objnumber, _oPlanningPlant);
    valueHelpData.filterArr = [new Filter("MaintenancePlanningPlant", FilterOperator.EQ, _oPlanningPlant)];
   } else if (oFragment.getId().includes("Approvals")) {
    this._oApprovalsValueHelpDialog = oFragment;
    this.getApprovalsTableItems(_objnumber, "", draftId, false);
    valueHelpData.filterArr = [new Filter("MaintenancePlanningPlant", FilterOperator.EQ, _oPlanningPlant), new Filter("WorkPermitType",
     FilterOperator.EQ, _oPermitType)];
   }
  },
  onOpenValueHelp: function (oEvent) {
   var WorkPermit = this.permitData.WorkPermit,
    draftId = this.permitData.DraftUUID,
    _objnumber = this.permitData.WorkPermitInternalID,
    _oPlanningPlant = this.permitData.MaintenancePlanningPlant,
    _oPermitType = this.permitData.WorkPermitType,
    valueHelpData = this.getValueHelpData(oEvent.getSource().getId(), WorkPermit, draftId);
   sap.ui.core.Fragment.load({
    name: valueHelpData.fragmentId,
    controller: this
   }).then(function name(oFragment) {
    this.setValueHelpData(oFragment, _objnumber, _oPlanningPlant, _oPermitType, valueHelpData);
    this.getView().addDependent(oFragment);
    //oFragment.getCustomHeader().getContentLeft()[0].setText(valueHelpData.vhTitle);

    this.oFilterBar = oFragment.getFilterBar();
    this._oBasicSearchField = new SearchField({
     showSearchButton: true
    });
    this.oFilterBar.setFilterBarExpanded(false);
    this.oFilterBar.setBasicSearch(this._oBasicSearchField);
    // Trigger filter bar search when the basic search is fired
    this._oBasicSearchField.attachSearch(function () {
     oFragment.getFilterBar().search();
    });
    oFragment.getTableAsync().then(function (oTable) {
     this.setVHTable(oTable, valueHelpData);
     oFragment.update();
    }.bind(this));
    oFragment.open();
   }.bind(this));
  },
  searchFilterItem: function () {
   this.oFilterBar.search();
  },
  setVHTable: function (oTable, valueHelpData) {
   var aCols;
   oTable.setModel(this.oModel);
   if (oTable.getId() !== "permitVHAddSafetyCert-table") {
    aCols = valueHelpData.columnModel.getProperty("/cols");
    oTable.setModel(valueHelpData.columnModel, "columns");
   }
   if (oTable.bindRows) {
    oTable.bindAggregation("rows", {
     path: valueHelpData.path,
     filters: valueHelpData.filterArr
    });
    if (oTable.getId() === "permitVHAddSafetyCert-table") {
     this.createSafetyCertificateColumn(oTable);
    }
   }
   if (oTable.bindItems) {
    oTable.bindAggregation("items", valueHelpData.path, function () {
     return new sap.m.ColumnListItem({
      cells: aCols.map(function (column) {
       return new sap.m.Label({
        text: "{" + column.template + "}"
       });
      })
     });
    });
   }
  },
  /* this.oSafetyObjColModel = new sap.ui.model.json.JSONModel({
     "cols": [{
      "label": this.i18nModel.getText("SftyCertificateNumber"),
      "template": "SafetyCertificate"
     }, {
      "label": this.i18nModel.getText("Description"),
      "template": "SftyCertDesc"
     }, {
      "label": this.i18nModel.getText("SftyCertificateType"),
      "template": "SafetyCertificateType"
     }, {
      "label": this.i18nModel.getText("SftyCertTypeDesc"),
      "template": "SftyCertificateTypeDescription"
     }, {
      "label": this.i18nModel.getText("Label.PlanningPlant"),
      "template": "MaintenancePlanningPlant"
     }, {
      "label": this.i18nModel.getText("TechnicalObject"),
      "template": "TechnicalObjectLabel"
     }, {
      "label": this.i18nModel.getText("TechnicalObjectDescription"),
      "template": "TechnicalObjectDescription"
     }]
    });*/
  createSafetyCertificateColumn: function (oTable) {
   var validityStartTemplate = new sap.m.Text({
    text: {
     path: "ValidFromDateTime",
     type: 'sap.ui.model.type.Date',
     formatOptions: {
      pattern: 'dd.MM.yyyy HH:mm:ss'
     }
    }
   });
   var validityEndTemplate = new sap.m.Text({
    text: {
     path: "ValidToDateTime",
     type: 'sap.ui.model.type.Date',
     formatOptions: {
      pattern: 'dd.MM.yyyy HH:mm:ss'
     }
    }
   });
   oTable.addColumn(new UIColumn({
    label: new Label({
     text: this.i18nModel.getText("SftyCertificateNumber")
    }),
    template: new Text({
     wrapping: false,
     text: "{SafetyCertificate}"
    }),
    width: "10em"
   }));
   oTable.addColumn(new UIColumn({
    label: new Label({
     text: this.i18nModel.getText("Description")
    }),
    template: new Text({
     wrapping: false,
     text: "{SftyCertDesc}"
    }),
    width: "16em"
   }));
   oTable.addColumn(new UIColumn({
    label: new Label({
     text: this.i18nModel.getText("SftyCertificateType")
    }),
    template: new Text({
     wrapping: false,
     text: "{SafetyCertificateType}"
    }),
    width: "12em"
   }));
   oTable.addColumn(new UIColumn({
    label: new Label({
     text: this.i18nModel.getText("SftyCertTypeDesc")
    }),
    template: new Text({
     wrapping: false,
     text: "{SftyCertificateTypeDescription}"
    }),
    width: "18em"
   }));
   oTable.addColumn(new UIColumn({
    label: new Label({
     text: this.i18nModel.getText("Label.PlanningPlant")
    }),
    template: new Text({
     wrapping: false,
     text: "{MaintenancePlanningPlant}"
    }),
    width: "8em"
   }));
   oTable.addColumn(new UIColumn({
    label: new Label({
     text: this.i18nModel.getText("PlanningPlantDescTitle")
    }),
    template: new Text({
     wrapping: false,
     text: "{PlantName}"
    }),
    width: "12em"
   }));
   oTable.addColumn(new UIColumn({
    label: new Label({
     text: this.i18nModel.getText("TechnicalObject")
    }),
    template: new Text({
     wrapping: false,
     text: "{TechnicalObjectLabel}"
    }),
    width: "8em"
   }));
   oTable.addColumn(new UIColumn({
    label: new Label({
     text: this.i18nModel.getText("TechnicalObjectDescription")
    }),
    template: new Text({
     wrapping: false,
     text: "{TechnicalObjectDescription}"
    }),
    width: "12em"
   }));
   oTable.addColumn(new UIColumn({
    label: new Label({
     text: this.i18nModel.getText("Title.ValidFromDateTime")
    }),
    template: validityStartTemplate,
    width: "10em"
   }));
   oTable.addColumn(new UIColumn({
    label: new Label({
     text: "Validity End"
    }),
    template: validityEndTemplate,
    width: "10em"
   }));
   oTable.addColumn(new UIColumn({
    label: new Label({
     text: this.i18nModel.getText("Title.ProcessingStatus")
    }),
    template: new Text({
     wrapping: false,
     text: "{SftyCertProcessingStatusText}"
    }),
    width: "12em"
   }));
  },
  handleClose: function (oEvent) {
   oEvent.getSource().close();
   oEvent.getSource().destroy();
  },
  onFilterBarSearch: function (oEvent) {
   var sSearchQuery = oEvent.getSource().getBasicSearchValue(),
    aSelectionSet = oEvent.getParameter("selectionSet"),
    searchHelpFilters = this.getSearchHelpFilters(oEvent.getSource().getId(), sSearchQuery),
    valueHelpData = this.getValueHelpData(oEvent.getSource().getId()),
    oVH = valueHelpData.valueHelp,
    aFilters;
   if (aSelectionSet[0].getId().includes("Order")) {
    aFilters = aSelectionSet.reduce(function (aResult, oControl) {
     if (oControl.getValue()) {
      var sfilterval = oControl.getValue();
      if (sfilterval.endsWith("*")) {
       aResult.push(new Filter({
        path: oControl.getName(),
        operator: FilterOperator.StartsWith,
        value1: sfilterval.slice(0, -1)
       }));
      } else {
       aResult.push(new Filter({
        path: oControl.getName(),
        operator: FilterOperator.Contains,
        value1: sfilterval
       }));
      }
     }
     return aResult;
    }, []);
    //Filtering for Add technical Object Value Help Table data
   } else if (aSelectionSet[0].getId().includes("TechObj")) {
    aFilters = aSelectionSet.reduce(function (aResult, oControl) {
     //Filtering for Technical Object type Multi Combobox
     if (oControl.getId() === "idTechObjTyp") {
      if (oControl.getSelectedKeys().length > 0) {
       var techObjFilter = [];
       for (var i = 0; i < oControl.getSelectedKeys().length; i++) {
        var sFilter = '';
        if (oControl.getSelectedKeys()[i].endsWith("*")) {
         sFilter = new Filter({
          path: "TechObjIsEquipOrFuncnlLoc",
          operator: FilterOperator.StartsWith,
          value1: oControl.getSelectedKeys()[i].slice(0, -1)
         });
        } else {
         sFilter = new Filter({
          path: "TechObjIsEquipOrFuncnlLoc",
          operator: FilterOperator.Contains,
          value1: oControl.getSelectedKeys()[i]
         });
        }
        techObjFilter.push(sFilter);
       }
       aResult.push(new Filter({
        filters: techObjFilter,
        and: false
       }));
      }
     } else {
      if (oControl.getValue()) {
       if (oControl.getValue().endsWith("*")) {
        aResult.push(new Filter({
         path: oControl.getName(),
         operator: FilterOperator.StartsWith,
         value1: oControl.getValue().slice(0, -1)
        }));
       } else {
        aResult.push(new Filter({
         path: oControl.getName(),
         operator: FilterOperator.Contains,
         value1: oControl.getValue()
        }));
       }
      }
     }
     return aResult;
    }, []);

   } else {
    aFilters = aSelectionSet.reduce(function (aResult, oControl) {
     if (oControl.getValue()) {
      if (oControl.getValue().endsWith("*")) {
       aResult.push(new Filter({
        path: oControl.getName(),
        operator: FilterOperator.StartsWith,
        value1: oControl.getValue().slice(0, -1)
       }));
      } else {
       aResult.push(new Filter({
        path: oControl.getName(),
        operator: FilterOperator.Contains,
        value1: oControl.getValue()
       }));
      }
     }
     return aResult;
    }, []);
   }
   aFilters.push(searchHelpFilters);
   this._filterTable(new Filter({
    filters: aFilters,
    and: true
   }), oVH);
  },
  _filterTable: function (oFilter, oVH) {
   oVH.getTableAsync().then(function (oTable) {
    if (oTable.bindRows) {
     oTable.getBinding("rows").filter(oFilter);
    }
    if (oTable.bindItems) {
     oTable.getBinding("items").filter(oFilter);
    }
    oVH.update();
   });
  },
  getSPRTableItems: function (objnumber, planningPlant) {
   this._oSPRValueHelpDialog.setBusy(true);
   this.oModel.read("/WorkPermitSafetyPracaution?", {
    filters: [
     new Filter("WorkPermitInternalID", FilterOperator.EQ, objnumber),
     new Filter("IsActiveEntity", FilterOperator.EQ, false)
    ],
    success: function (oData) {
     this.SPRItems = oData.results;
     this._oSPRValueHelpDialog.setBusy(false);
    }.bind(this),
    error: function (oData) {
     this._oSPRValueHelpDialog.setBusy(false);
    }.bind(this)
   });
  },
  handleSPRConfirm: function (oEvent) {
   sap.ui.core.BusyIndicator.show(0);
   var SafetyReqVH = oEvent.getSource(),
    valueHelpData = this.getValueHelpData(oEvent.getSource().getId()),
    oTable = valueHelpData.oTable;
   if (oEvent.getParameters().tokens.length > 0) {
    this._oSafetyLength = 0;
    this.oModel.setDeferredGroups(["NewSafetyPrecautionItem"]);
    var selectedTokens = oEvent.getSource()._oSelectedTokens.getTokens();
    for (var i = 0; i < selectedTokens.length; i++) {
     this.safetyItemAvailable = false;
     var oItems = oEvent.getSource()._oSelectedItems.items[oEvent.getSource()._oSelectedTokens.getTokens()[i].getKey()];
     for (var j = 0; j < this.SPRItems.length; j++) {
      if (oItems.WrkPmtSafetyRequirementGroup === this.SPRItems[j].WrkPmtSafetyRequirementGroup && oItems.WorkPermitSafetyRequirement ===
       this.SPRItems[j].WorkPermitSafetyRequirement) {
       this.safetyItemAvailable = true;
       this._oSafetyLength += 1;
       break;
      }
     }
     if (this.safetyItemAvailable === false) {
      var sCriticalityTxt = "";
      if (oItems.WrkPmtSftyRqmtIsImplemented) {
       sCriticalityTxt = this.i18nModel.getText("NotImplemented");
      } else {
       sCriticalityTxt = this.i18nModel.getText("NotApplicable");
      }
      this.oModel.createEntry(
       oEvent.getSource().getBindingContext().sPath + valueHelpData.sPath, {
        groupId: "NewSafetyPrecautionItem",
        properties: {
         "WorkPermitGroupCategory": oItems.WorkPermitGroupCategory,
         "WorkPermitInternalID": this.permitData.WorkPermitInternalID,
         "WrkPmtSftyRequirementGroupText": oItems.WrkPmtSftyRequirementGroupText,
         "WorkPermit": this.permitData.WorkPermit,
         "WrkPmtSafetyRequirementGroup": oItems.WrkPmtSafetyRequirementGroup,
         "WorkPermitSafetyRequirement": oItems.WorkPermitSafetyRequirement,
         "MaintenancePlanningPlant": oItems.MaintenancePlanningPlant,
         "WorkPermitType": oItems.WorkPermitType,
         "WrkPmtSafetyRequirementText": oItems.WrkPmtSafetyRequirementText,
         "CriticalityText": sCriticalityTxt,
         "IsActiveEntity": false
        }
       });
     }
    }
    this.submitBatchChanges(SafetyReqVH, oTable, "NewSafetyPrecautionItem");
   } else {
    sap.ui.core.BusyIndicator.hide();
    SafetyReqVH.setBusy(false);
    SafetyReqVH.close();
    SafetyReqVH.destroy();
   }
  },
  getPPETableItems: function (objnumber, planningPlant) {
   this._oPPEValueHelpDialog.setBusy(true);
   this.oModel.read("/WorkPermitProtEqip?", {
    filters: [
     new Filter("WorkPermitInternalID", FilterOperator.EQ, objnumber),
     new Filter("IsActiveEntity", FilterOperator.EQ, false)
    ],
    success: function (oData) {
     this.PPEItems = oData.results;
     this._oPPEValueHelpDialog.setBusy(false);
    }.bind(this),
    error: function (oData) {
     this._oPPEValueHelpDialog.setBusy(false);
    }.bind(this)
   });
  },
  handlePPEConfirm: function (oEvent) {
   sap.ui.core.BusyIndicator.show(0);
   var PrsnlProtEquipmenVH = oEvent.getSource(),
    valueHelpData = this.getValueHelpData(oEvent.getSource().getId()),
    oTable = valueHelpData.oTable;
   if (oEvent.getParameters().tokens.length > 0) {
    this._oPPELength = 0;
    this.oModel.setDeferredGroups(["NewPrsnlProctEqipmentItem"]);
    var selectedTokens = oEvent.getSource()._oSelectedTokens.getTokens();
    for (var i = 0; i < selectedTokens.length; i++) {
     this.ppeItemAvailable = false;
     var oItems = oEvent.getSource()._oSelectedItems.items[oEvent.getSource()._oSelectedTokens.getTokens()[i].getKey()];
     for (var j = 0; j < this.PPEItems.length; j++) {
      if (oItems.WrkPmtSafetyRequirementGroup === this.PPEItems[j].WrkPmtSafetyRequirementGroup && oItems.WorkPermitSafetyRequirement ===
       this.PPEItems[j].WorkPermitSafetyRequirement) {
       this.ppeItemAvailable = true;
       this._oPPELength += 1;
       break;
      }
     }
     if (this.ppeItemAvailable === false) {
      this.oModel.createEntry(
       oEvent.getSource().getBindingContext().sPath + valueHelpData.sPath, {
        groupId: "NewPrsnlProctEqipmentItem",
        properties: {
         "WorkPermitGroupCategory": oItems.WorkPermitGroupCategory,
         "WorkPermitInternalID": this.permitData.WorkPermitInternalID,
         "WrkPmtSftyRequirementGroupText": oItems.WrkPmtSftyRequirementGroupText,
         "WorkPermit": this.permitData.WorkPermit,
         "WrkPmtSafetyRequirementGroup": oItems.WrkPmtSafetyRequirementGroup,
         "WorkPermitSafetyRequirement": oItems.WorkPermitSafetyRequirement,
         "MaintenancePlanningPlant": oItems.MaintenancePlanningPlant,
         "WorkPermitType": oItems.WorkPermitType,
         "WrkPmtSafetyRequirementText": oItems.WrkPmtSafetyRequirementText,
         "IsActiveEntity": false
        }
       });
     }
    }
    this.submitBatchChanges(PrsnlProtEquipmenVH, oTable, "NewPrsnlProctEqipmentItem");
   } else {
    sap.ui.core.BusyIndicator.hide();
    PrsnlProtEquipmenVH.setBusy(false);
    PrsnlProtEquipmenVH.close();
    PrsnlProtEquipmenVH.destroy();
   }
  },
  // Assigned Order Add Functionality
  getOrderTableItems: function (permit) {
   this._oOrderValueHelpDialog.setBusy(true);
   this.oModel.read("/WorkPermitOrder?$orderby=OrderType asc", {
    filters: [new Filter("WorkPermitInternalID", FilterOperator.EQ, permit),
     new Filter("IsActiveEntity", FilterOperator.EQ, false)
    ],
    success: function (oData) {
     this.OrderData = oData.results;
     this._oOrderValueHelpDialog.setBusy(false);
    }.bind(this),
    error: function (oData) {
     this._oOrderValueHelpDialog.setBusy(false);
    }.bind(this)
   });
  },
  handleOrderConfirm: function (oEvent) {
   sap.ui.core.BusyIndicator.show(0);
   var OrderControl = oEvent.getSource(),
    controlName = sap.ui.getCore().byId(this.sAppId + "--ord::Table"),
    oSelLength = oEvent.getSource().getTable().getSelectedIndices().length;
   if (oEvent.getParameters().tokens.length > 0) {
    this._OrderLength = 0;
    for (var i = 0; i < oSelLength; i++) {
     this._OrderAvailable = false;
     var oItems = oEvent.getSource()._oSelectedItems.items[oEvent.getSource()._oSelectedTokens.getTokens()[i].getKey()];
     this.oModel.setDeferredGroups(["NewOrderItems"]);
     for (var j = 0; j < this.OrderData.length; j++) {
      if (oItems.MaintenanceOrder === this.OrderData[j].MaintenanceOrder) {
       this._OrderAvailable = true;
       this._OrderLength += 1;
       break;
      }
     }
     if (this._OrderAvailable === false) {
      this.oModel.createEntry(
       oEvent.getSource().getBindingContext().sPath + "/to_WorkPermitOrder", {
        groupId: "NewOrderItems",
        properties: {
         "MaintenanceOrder": oItems.MaintenanceOrder,
         "WorkPermitInternalID": this.permitData.WorkPermitInternalID,
         "MaintenanceOrderInternalID": oItems.MaintenanceOrderInternalID,
         "WorkPermitObjectType": "WA",
         "WorkPermitOrderObjectType": "OR",
         "IsActiveEntity": false
        }
       });
     }
    }
    this.submitBatchChanges(OrderControl, controlName, "NewOrderItems");
   } else {
    sap.ui.core.BusyIndicator.hide();
    OrderControl.setBusy(false);
    OrderControl.close();
    OrderControl.destroy();
   }
  },
  // on Delete Order
  onPressUnAssignOrderAction: function (oEvent) {
   var OrderControl, controlName, oChildItem, oParentItem, sMsg;
   controlName = sap.ui.getCore().byId(this.sAppId + "--ord::responsiveTable");
   OrderControl = controlName.getSelectedItem();
   sMsg = this.i18nModel.getText("Error.Item_Deleted");
   oChildItem = controlName.getSelectedItem().getBindingContext().getObject();
   oParentItem = this.getView().getBindingContext().getObject();
   MessageBox.warning(this.i18nModel.getText("Error.OrderDelete"), {
    title: this.i18nModel.getText("Title.Delete"),
    actions: ["Remove", MessageBox.Action.CANCEL],
    emphasizedAction: "Remove ",
    onClose: function (sAction) {
     if (sAction === "Remove") {
      OrderControl.setBusy(true);
      this.oModel.callFunction("/UnassignJobs", {
       method: "POST",
       urlParameters: {
        "WorkPermit": oParentItem.WorkPermit,
        "MaintenanceOrder": oChildItem.MaintenanceOrder,
        "WorkPermitInternalID": oChildItem.WorkPermitInternalID,
        "MaintenanceOrderInternalID": oChildItem.MaintenanceOrderInternalID,
        "DraftUUID": oParentItem.DraftUUID,
        "WorkPermitOrderDraftUUID": oChildItem.DraftUUID,
        "IsActiveEntity": oParentItem.IsActiveEntity
       },
       success: function (oData) {
        controlName.getParent().rebindTable();
        OrderControl.setBusy(false);
        MessageToast.show(this.i18nModel.getText(sMsg));
       }.bind(this),
       error: function (oError) {
        OrderControl.setBusy(false);
       }
      });
     }
    }.bind(this)
   });
  },
  // Safety Certificate     
  getSftyCertTableItems: function (objnumber, planningPlant) {
   this._oSftyObjValueHelpDialog.setBusy(true);
   this.oModel.read("/WrkPmtSafetyCertificate?", {
    filters: [
     new Filter("WorkPermitInternalID", FilterOperator.EQ, objnumber),
     new Filter("MaintenancePlanningPlant", FilterOperator.EQ, planningPlant),
     new Filter("IsActiveEntity", FilterOperator.EQ, false)
    ],
    success: function (oData) {
     this.SafetyObject = oData.results;
     this._oSftyObjValueHelpDialog.setBusy(false);
    }.bind(this),
    error: function (oData) {
     this._oSftyObjValueHelpDialog.setBusy(false);
    }.bind(this)
   });
  },
  handleSafetyConfirm: function (oEvent) {
   sap.ui.core.BusyIndicator.show(0);
   var SafetyObject = oEvent.getSource(),
    safetyObjectTab = sap.ui.getCore().byId(this.sAppId + "--SC::Table"),
    oSelLength = oEvent.getSource().getTable().getSelectedIndices().length;
   if (oEvent.getParameters().tokens.length > 0) {
    this._oSftyObjLen = 0;
    for (var i = 0; i < oSelLength; i++) {
     this.sftyObjectAvailable = false;
     var oItems = oEvent.getSource()._oSelectedItems.items[oEvent.getSource()._oSelectedTokens.getTokens()[i].getKey()];
     this.oModel.setDeferredGroups(["NewSftyObjItems"]);
     for (var j = 0; j < this.SafetyObject.length; j++) {

      if (oItems.SafetyCertificate === this.SafetyObject[j].SafetyCertificate) {
       this.sftyObjectAvailable = true;
       this._oSftyObjLen += 1;
       break;
      }
     }
     if (this.sftyObjectAvailable === false) {
      this.oModel.createEntry(oEvent.getSource().getBindingContext().sPath + "/to_WrkPmtSafetyCertificate", {
       groupId: "NewSftyObjItems",
       properties: {
        "WorkPermitInternalID": this.permitData.WorkPermitInternalID,
        "SafetyCertificate": oItems.SafetyCertificate,
        "SafetyCertificateInternalID": oItems.SafetyCertificateInternalID,
        "SafetyCertificateType": oItems.SafetyCertificateType,
        "MaintenancePlanningPlant": oItems.MaintenancePlanningPlant,
        "WorkPermitObjectType": "WA",
        "SftyCertWrkPmtObjectType": "WD",
        "IsActiveEntity": false
       }
      });
     }
    }
    this.submitBatchChanges(SafetyObject, safetyObjectTab, "NewSftyObjItems");
   } else {
    sap.ui.core.BusyIndicator.hide();
    SafetyObject.setBusy(false);
    SafetyObject.close();
    SafetyObject.destroy();
   }
  },
  /*Technical Object Section*/
  getTechObjTableItems: function (objnumber, planningPlant) {
   this._oTechObjValueHelpDialog.setBusy(true);
   this.oModel.read("/WorkPermitTechnicalObject?$orderby=TechnicalObject asc", {
    filters: [
     new Filter("WorkPermitInternalID", FilterOperator.EQ, objnumber),
     new Filter("MaintenancePlanningPlant", FilterOperator.EQ, planningPlant),
     new Filter("IsActiveEntity", FilterOperator.EQ, false)
    ],
    success: function (oData) {
     this.TechnicalObjects = oData.results;
     this._oTechObjValueHelpDialog.setBusy(false);
    }.bind(this),
    error: function (oData) {
     this._oTechObjValueHelpDialog.setBusy(false);
    }.bind(this)
   });
  },
  handleConfirmTechObj: function (oEvent) {
   sap.ui.core.BusyIndicator.show(0);
   var TechnicalObject = oEvent.getSource(),
    techObjectTab = sap.ui.getCore().byId(this.sAppId + "--TechObj::Table"),
    oSelLength = oEvent.getSource().getTable().getSelectedIndices().length;
   if (oEvent.getParameters().tokens.length > 0) {
    this._oTechObjLen = 0;
    for (var i = 0; i < oSelLength; i++) {
     this.techObjectAvailable = false;
     var oItems = oEvent.getSource()._oSelectedItems.items[oEvent.getSource()._oSelectedTokens.getTokens()[i].getKey()],
      techObjType;
     if (oItems.TechObjIsEquipOrFuncnlLocDesc === "Equipment") {
      techObjType = "E";
     } else {
      techObjType = "F";
     }
     this.oModel.setDeferredGroups(["NewTechObjItems"]);
     for (var j = 0; j < this.TechnicalObjects.length; j++) {
      if (oItems.TechnicalObjectLabel === this.TechnicalObjects[j].TechnicalObjectLabel) {
       this.techObjectAvailable = true;
       this._oTechObjLen += 1;
       break;
      }
     }
     if (this.techObjectAvailable === false) {
      this.oModel.createEntry(oEvent.getSource().getBindingContext().sPath + "/to_TechnicalObject", {
       groupId: "NewTechObjItems",
       properties: {
        "WorkPermitInternalID": this.permitData.WorkPermitInternalID,
        "TechnicalObjectLabel": oItems.TechnicalObjectLabel,
        "TechnicalObject": oItems.TechnicalObject,
        "SftyCertItemCatType": techObjType,
        "MaintenancePlant": oItems.MaintenancePlant,
        "MaintenancePlanningPlant": oItems.MaintenancePlanningPlant,
        "TechnicalObjectDescription": oItems.TechnicalObjectDescription,
        "TechObjIsEquipOrFuncnlLocDesc": oItems.TechObjIsEquipOrFuncnlLocDesc,
        "MaintObjectInternalID": oItems.MaintObjectInternalID,
        "IsActiveEntity": false
       }
      });
     }
    }
    this.submitBatchChanges(TechnicalObject, techObjectTab, "NewTechObjItems");
   } else {
    sap.ui.core.BusyIndicator.hide();
    TechnicalObject.setBusy(false);
    TechnicalObject.close();
    TechnicalObject.destroy();
   }
  },
  /*Partners Section*/
  onOpenAddPartnerDialog: function (oEvent) {
   if (!this.onPartnerDialog) {
    this.onPartnerDialog = sap.ui.xmlfragment("idPartnerDialog",
     "i2d.eam.workpermit.manages1.ext.view.fragments.AddPartnerPopUp", this);
    this.getView().addDependent(this.onPartnerDialog);
   }
   this.onPartnerDialog.open();
   this.onPartnerDialog.setModel(this.oModel);
   var filter = new Filter("MaintenancePlanningPlant", FilterOperator.EQ, this.permitData.MaintenancePlanningPlant);
   sap.ui.core.Fragment.byId("idPartnerDialog", "permitInputPartner").getBinding("items").filter([filter]);
   sap.ui.core.Fragment.byId("idPartnerDialog", "permitInputPartner").setValue("");
  },
  handlePartnerConfirm: function (oEvent) {
   sap.ui.core.BusyIndicator.show(0);
   var oPartnerControl = sap.ui.core.Fragment.byId("idPartnerDialog", "idPartnerDialog"),
    controlName = sap.ui.getCore().byId(this.sAppId + "--Partner::Table"),
    formData = sap.ui.core.Fragment.byId("idPartnerDialog", "permitInputPartner");
   this._oCounter = sap.ui.getCore().byId(this.sAppId + "--Partner::responsiveTable").getItems().length;
   if (formData.getSelectedKey() !== "") {
    this.oModel.setDeferredGroups(["AddPartner"]);
    this.oModel.createEntry(
     oEvent.getSource().getBindingContext().sPath + "/to_WorkPermitPartner", {
      groupId: "AddPartner",
      properties: {
       "PartnerFunction": formData.getSelectedKey(),
       "MaintenancePartnerObjectNumber": (this._oCounter + 1).toString(),
       "MaintObjectInternalID": this.permitData.WorkPermitInternalID,
       "MaintObjectCategory": "WAI",
       "PartnerFunctionName": formData.getSelectedItem().getText(),
       "MaintenancePlanningPlant": this.permitData.MaintenancePlanningPlant,
       "CreatedByUser": sap.ushell.Container.getService("UserInfo").getId(),
       "CreationDate": new Date(),
       // // "CreationTime": time,
       "IsActiveEntity": false
      }
     });
    this._oCounter++;
    this.submitBatchChanges(oPartnerControl, controlName, "AddPartner");
   } else {
    sap.ui.core.BusyIndicator.hide();
    oPartnerControl.setBusy(false);
    oPartnerControl.close();
   }

  },
  handlePartnerClose: function () {
   this.onPartnerDialog.close();
  },
  submitBatchChanges: function (vhControl, oTable, batchId) {
   vhControl.setBusy(true);
   this.oModel.submitChanges({
    batchGroupId: batchId,
    success: function (oData) {
     if (oTable.getId().includes("Partner")) {
      sap.ui.core.BusyIndicator.hide();
      vhControl.setBusy(false);
      this.onPartnerDialog.close();
      oTable.rebindTable();
      return;
     }
     if (batchId === "NewOperationItems") {
      this.UpdateOperationCount(this.operationCount);
     } else {
      oTable.rebindTable();
     }
     if (batchId === "NewSftyObjItems") {
      // var prcsAprTable = sap.ui.getCore().byId(this.sAppId + "--PA::responsiveTable");
      // prcsAprTable.getModel().refresh();
      var prcsAprResTable = sap.ui.getCore().byId(this.sAppId + "--PA::Table");
      prcsAprResTable.rebindTable();
     }
     sap.ui.core.BusyIndicator.hide();
     vhControl.setBusy(false);
     vhControl.close();
     vhControl.destroy();
     this.handleDuplicateMsg(oTable);
    }.bind(this),
    error: function (oError) {
     vhControl.setBusy(false);
    }
   });
  },
  handleDuplicateMsg: function (oTable) {
   if (this._oSafetyLength > 1) {
    MessageToast.show(this.i18nModel.getText("Message.SPRExists"));
   } else if (this._oSafetyLength === 1) {
    MessageToast.show(this.i18nModel.getText("Message.SPRExist"));
   }
   if (this._oPPELength > 1) {
    MessageToast.show(this.i18nModel.getText("Message.PPEExists1"));
   } else if (this._oPPELength === 1) {
    MessageToast.show(this.i18nModel.getText("Message.PPEExist"));
   }
   if (this._oSftyObjLen > 1) {
    MessageToast.show(this.i18nModel.getText("Message.SftyExists1"));
   } else if (this._oSftyObjLen === 1) {
    MessageToast.show(this.i18nModel.getText("Message.SftyExist"));
   }
   if (this._oTechObjLen > 1) {
    MessageToast.show(this.i18nModel.getText("Message.TechObjs"));
   } else if (this._oTechObjLen === 1) {
    MessageToast.show(this.i18nModel.getText("Message.TechObj"));
   }
   if (this._OrderLength > 1) {
    MessageToast.show(this.i18nModel.getText("Message.Orders"));
   } else if (this._OrderLength === 1) {
    MessageToast.show(this.i18nModel.getText("Message.Order"));
   }
   if (this._OperationLength > 1) {
    MessageToast.show(this.i18nModel.getText("Message.Operations"), {
     duration: 3600,
     width: "15rem"
    });
   } else if (this._OperationLength === 1) {
    MessageToast.show(this.i18nModel.getText("Message.Operation"), {
     duration: 3600,
     width: "15rem"
    });
   }
   if (this._oApprovalsLength > 1) {
    MessageToast.show(this.i18nModel.getText("Message.Approvals"));
   } else if (this._oApprovalsLength === 1) {
    MessageToast.show(this.i18nModel.getText("Message.Approval"));
   }
   this._oTechObjLen = 0;
   this._OrderLength = 0;
   this._OperationLength = 0;
   this._oSafetyLength = 0;
   this._oPPELength = 0;
   this._oApprovalsLength = 0;
  },
  /* Approvals Section */
  getApprovalsTableItems: function (WorkPermitInternalID, WrkPmtApprovalCounter, DraftUUID, IsActiveEntity) {
   this._oApprovalsValueHelpDialog.setBusy(true);
   this.oModel.read("/WorkPermitApproval", {
    filters: [
     new Filter("WorkPermitInternalID", FilterOperator.EQ, WorkPermitInternalID),
     new Filter("IsActiveEntity", FilterOperator.EQ, false)
    ],
    success: function (oData) {
     this._oApprovalsCounter = oData.results.length;
     this.approvalsData = oData.results;
     this._oApprovalsValueHelpDialog.setBusy(false);
    }.bind(this),
    error: function (oData) {
     this._oApprovalsValueHelpDialog.setBusy(false);
    }.bind(this)
   });
  },
  handleApprovalsConfirm: function (oEvent) {
   sap.ui.core.BusyIndicator.show(0);
   var oApprovalsControl = oEvent.getSource(),
    oSelLength = oEvent.getSource().getTable().getSelectedIndices().length,
    controlName = sap.ui.getCore().byId(this.sAppId + "--APPR1::Table");
   if (oEvent.getParameters().tokens.length > 0) {
    this._oApprovalsLength = 0;
    for (var i = 0; i < oSelLength; i++) {
     this._ApprovalsAvailable = false;
     this.oModel.setDeferredGroups(["AddApprovals"]);
     var oItems = oEvent.getSource()._oSelectedItems.items[oEvent.getSource()._oSelectedTokens.getTokens()[i].getKey()];
     for (var j = 0; j < this.approvalsData.length; j++) {
      if (oItems.WorkPermitApproval === this.approvalsData[j].WorkPermitApproval) {
       this._ApprovalsAvailable = true;
       this._oApprovalsLength += 1;
       break;
      }
     }
     if (this._ApprovalsAvailable === false) {
      this.oModel.createEntry(
       oEvent.getSource().getBindingContext().sPath + "/to_WorkPermitApproval", {
        groupId: "AddApprovals",
        properties: {
         "WorkPermitInternalID": this.permitData.WorkPermitInternalID,
         "IsActiveEntity": false,
         WorkPermitApprovalDescription: oItems.WorkPermitApprovalDescription,
         Mandatory: oItems.Mandatory,
         WrkPmtApprovalHierarchyLevel: oItems.WrkPmtApprovalHierarchyLevel,
         WorkPermitApproval: oItems.WorkPermitApproval,
         WrkPmtApprvlMandText: oItems.WrkPmtApprvlMandText,
         NumberOfWrkPermitApprovals: (this._oApprovalsCounter + 1).toString()
        }
       });
      this._oApprovalsCounter++;
     }
    }
    this.submitBatchChanges(oApprovalsControl, controlName, "AddApprovals");
   } else {
    sap.ui.core.BusyIndicator.hide();
    oApprovalsControl.setBusy(false);
    oApprovalsControl.close();
    oApprovalsControl.destroy();
   }
  },
  onClickCancelWorkPermit: function (oEvent) {
   MessageBox.warning(this.i18nModel.getText("CancelWorkPermitMsg"), {
    title: this.i18nModel.getText("idCancelWorkPermitButton"),
    icon: MessageBox.Icon.warning,
    actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
    emphasizedAction: MessageBox.Action.OK,
    onClose: function (sAction) {
     if (sAction === "YES") {
      sap.ui.core.BusyIndicator.show(0);
      this.callCancelWorkPermitAction();
     }
    }.bind(this)
   });
  },
  callCancelWorkPermitAction: function () {
   if (!this.oSubmitDialog) {
    this.oSubmitDialog = new sap.m.Dialog({
     type: sap.m.DialogType.Message,
     title: this.i18nModel.getText("Title.Cancel"),
     content: [
      new TextArea("cancelRsnWrkPmt", {
       width: "480px",
       placeholder: this.i18nModel.getText("Label.PermitCancelPopup"),
       liveChange: function (oEvent) {
        var sText = oEvent.getParameter("value");
        this.oSubmitDialog.getBeginButton().setEnabled(sText.length > 0);
       }.bind(this)
      })
     ],
     beginButton: new sap.m.Button({
      type: sap.m.ButtonType.Emphasized,
      text: this.i18nModel.getText("Button.CancelConfirm"),
      enabled: false,
      press: function (oEvent) {
       var LongText = sap.ui.getCore().byId("cancelRsnWrkPmt").getValue();
       this.getView().setBusy(true);
       this.oModel.callFunction("/Cancel", {
        method: "POST",
        urlParameters: {
         WorkPermitLongText: LongText,
         WorkPermit: this.permitData.WorkPermit,
         MaintenancePlanningPlant: this.permitData.MaintenancePlanningPlant,
         DraftUUID: this.permitData.DraftUUID,
         WorkPermitInternalID: this.permitData.WorkPermitInternalID,
         IsActiveEntity: this.permitData.IsActiveEntity
        },
        success: function (oData) {
         if (oData.Cancel.WorkPermitCancelIsAllowed === false) {
          sap.ui.getCore().byId("idCancelButton").setVisible(false);
         }
         if (oData.Cancel.SystemMessageType === "E") {
          MessageBox.error(oData.Cancel.SystemMessageText);
          sap.ui.getCore().byId("idCancelButton").setVisible(true);
          this.getView().setBusy(false);
          return;
         }
         this.getView().setBusy(false);
         sap.ui.core.BusyIndicator.hide();
         this.navigateToDisplayMode();

        }.bind(this),
        error: function (oError) {
         this.getView().setBusy(false);
         sap.ui.core.BusyIndicator.hide();
         this.handleAuthError(oError);
        }.bind(this)
       });

       this.oSubmitDialog.close();
      }.bind(this)
     }),
     endButton: new sap.m.Button({
      text: "Discard",
      press: function () {
       this.oSubmitDialog.close();
      }.bind(this)
     })
    });
   }
   sap.ui.getCore().byId("cancelRsnWrkPmt").setValue("");
   this.oSubmitDialog.open();

  },

  onClickSetInactiveFlag: function (oEvent) {
   MessageBox.confirm(this.i18nModel.getText("SetInactiveFlagMsg"), {
    title: this.i18nModel.getText("idSetInactiveFlagButton"),
    icon: MessageBox.Icon.INFORMATION,
    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
    emphasizedAction: MessageBox.Action.OK,
    onClose: function (sAction) {
     if (sAction === "OK") {
      sap.ui.core.BusyIndicator.show(0);
      this.callSetInactiveFlagAction(true);
     }
    }.bind(this)
   });
  },
  onClickResetInactiveFlag: function (oEvent) {
   MessageBox.confirm(this.i18nModel.getText("ResetInactiveFlagMsg"), {
    title: this.i18nModel.getText("idResetInactiveFlagButton"),
    icon: MessageBox.Icon.INFORMATION,
    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
    emphasizedAction: MessageBox.Action.OK,
    onClose: function (sAction) {
     if (sAction === "OK") {
      sap.ui.core.BusyIndicator.show(0);
      this.callSetInactiveFlagAction(false);
     }
    }.bind(this)
   });
  },
  callSubmitForApprovalAction: function (setFlag) {
   this.getView().setBusy(true);
   this.Ispproved = setFlag;
   this.oModel.callFunction("/SubmitForApproval", {
    method: "POST",
    urlParameters: {
     MaintenancePlanningPlant: this.permitData.MaintenancePlanningPlant,
     WorkPermit: this.permitData.WorkPermit,
     WorkPermitInternalID: this.permitData.WorkPermitInternalID,
     IsApproved: setFlag,
     DraftUUID: this.permitData.DraftUUID,
     IsActiveEntity: this.permitData.IsActiveEntity
    },
    success: function (oData) {
     this.IsApproved = setFlag;
     this.getView().setBusy(false);
     if (setFlag) {
      MessageToast.show(this.i18nModel.getText("SubmitForApprovalMsg"));
     } else {
      MessageToast.show(this.i18nModel.getText("RevokeMsgConfirm"));
     }
     sap.ui.core.BusyIndicator.hide();
     this.navigateToDisplayMode();
    }.bind(this),
    error: function (oResponse) {
     this.getView().setBusy(false);
     sap.ui.core.BusyIndicator.hide();
     var oMessage = JSON.parse(oResponse.responseText).error.message.value;
     sap.m.MessageBox.error(oMessage);
    }.bind(this)
   });
  },
  callSetInactiveFlagAction: function (setFlag) {
   this.getView().setBusy(true);
   this.Ispproved = setFlag;
   this.oModel.callFunction("/Deactivate", {
    method: "POST",
    urlParameters: {
     MaintenancePlanningPlant: this.permitData.MaintenancePlanningPlant,
     WorkPermit: this.permitData.WorkPermit,
     WorkPermitInternalID: this.permitData.WorkPermitInternalID,
     StatusIsInactive: setFlag ? "" : "X",
     WorkPermitProcessingStatus: this.permitData.WorkPermitProcessingStatus,
     DraftUUID: this.permitData.DraftUUID,
     IsActiveEntity: this.permitData.IsActiveEntity
    },
    success: function (oData) {
     this.IsApproved = setFlag;
     if (setFlag) {
      MessageToast.show(this.i18nModel.getText("InactiveStatusMsg"));
     } else {
      MessageToast.show(this.i18nModel.getText("ResetInacMsgConfirm"));
     }
     this.getView().setBusy(false);
     sap.ui.core.BusyIndicator.hide();
     this.navigateToDisplayMode();
    }.bind(this),
    error: function (oResponse) {
     this.getView().setBusy(false);
     sap.ui.core.BusyIndicator.hide();
     var oMessage = JSON.parse(oResponse.responseText).error.message.value;
     sap.m.MessageBox.error(oMessage);
    }.bind(this)
   });
  },

  //Approval History Section
  onPressLongText: function (oEvent) {
   var oPop = oEvent.getSource(),
    sPopover;
   if (oEvent.getSource().getParent().getBindingContext().getObject().PlainLongText.length > 0) {
    if (!sPopover) {
     sPopover = new sap.m.ResponsivePopover({
      title: this.i18nModel.getText("Title.ApprvComments"),
      placement: "Left",
      contentWidth: "300px",
      contentHeight: "250px",
      content: [
       new sap.m.Text({
        text: oEvent.getSource().getParent().getBindingContext().getObject().PlainLongText

       })
      ]
     });
    }
    sPopover.openBy(oPop);
   }
  },
  // Revoke Comment 
  onPressRevokeLongText: function (oEvent) {
   var oPop = oEvent.getSource(),
    sPopover;
   if (oEvent.getSource().getParent().getBindingContext().getObject().WorkPermitRevokeLongText.length > 0) {
    if (!sPopover) {
     sPopover = new sap.m.ResponsivePopover({
      title: this.i18nModel.getText("RevokeHistoryComment"),
      placement: "Left",
      contentWidth: "300px",
      contentHeight: "250px",
      content: [
       new sap.m.Text({
        text: oEvent.getSource().getParent().getBindingContext().getObject().WorkPermitRevokeLongText
       })
      ]
     });
    }
    sPopover.openBy(oPop);
   }
  },
  onClickPrint: function (evt) {
   var sPressBtn = evt.getSource().getText();
   MessageBox.warning(this.i18nModel.getText("PrintPermitMsg"), {
    title: this.i18nModel.getText("PrintWorkPermitMsg"),
    icon: MessageBox.Icon.warning,
    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
    emphasizedAction: MessageBox.Action.YES,
    onClose: function (sAction) {
     if (sAction === "YES") {
      sap.ui.core.BusyIndicator.show(0);
      this.onClickPrintPermit(sPressBtn);
     }
    }.bind(this)
   });
  },
  onClickPrintPermit: function (sPressBtn) {
   var printActionText = this.i18nModel.getText("Print");
   if (sPressBtn === printActionText) {
    var ScenarioID = "00001";
   } else {
    ScenarioID = "00002";
   }
   this.getView().setBusy(true);
   this.oModel.callFunction("/PrintWorkPermit", {
    method: "POST",
    urlParameters: {
     MaintenancePlanningPlant: this.permitData.MaintenancePlanningPlant,
     WorkPermit: this.permitData.WorkPermit,
     WorkPermitInternalID: this.permitData.WorkPermitInternalID,
     DraftUUID: this.permitData.DraftUUID,
     ValidationScenarioID: ScenarioID,
     IsActiveEntity: this.permitData.IsActiveEntity
    },
    success: function (oData) {
     this.getView().setBusy(false);
     sap.ui.core.BusyIndicator.hide();
     sap.ui.getCore().byId("idCombineChangeidReissueWrkPmtButton").setVisible(true);
     var base64EncodedPDF = oData.PrintWorkPermit.WorkPermitOutputDataBinary;
     var decodedPdfContent = atob(base64EncodedPDF);
     var byteArray = new Uint8Array(decodedPdfContent.length);
     for (var i = 0; i < decodedPdfContent.length; i++) {
      byteArray[i] = decodedPdfContent.charCodeAt(i);
     }
     var blob = new Blob([byteArray.buffer], {
      type: 'application/pdf'
     });
     var _pdfurl = URL.createObjectURL(blob);
     if (!this._PDFViewer) {
      this._PDFViewer = new sap.m.PDFViewer({
       width: "auto",
       source: _pdfurl, // my blob url
       showDownloadButton: false,
       isTrustedSource: true
      });
      jQuery.sap.addUrlWhitelist("blob"); // register blob url as whitelist
     }
     this._PDFViewer.open();
     this.navigateToDisplayMode();
    }.bind(this),
    error: function (oError) {
     this.getView().setBusy(false);
     sap.ui.core.BusyIndicator.hide();
     MessageBox.error(JSON.parse(oError.responseText).error.message.value);
    }.bind(this)
   });
  },
  onClickIssueWrkPmt: function (oEvent) {
   MessageBox.confirm(this.i18nModel.getText("SetIssueWrkPmtMsg"), {
    title: this.i18nModel.getText("idSetIssueFlagButton"),
    icon: MessageBox.Icon.INFORMATION,
    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
    emphasizedAction: MessageBox.Action.OK,
    onClose: function (sAction) {
     if (sAction === "OK" && !this.permitData.WrkPmtIssueHistoryIsAllowed) {
      sap.ui.core.BusyIndicator.show(0);
      this.callIssueWrkPmtAction(true);
     } else if (sAction === "OK" && this.permitData.WrkPmtIssueHistoryIsAllowed) {
      this.callAddPersonRespPopUp(true);
     }
    }.bind(this)
   });
  },
  onClickReissueWrkPmt: function (oEvent) {
   MessageBox.confirm(this.i18nModel.getText("HandoutApprovalMsg"), {
    title: this.i18nModel.getText("idReissueWrkPmtButton"),
    icon: MessageBox.Icon.INFORMATION,
    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
    emphasizedAction: MessageBox.Action.OK,
    onClose: function (sAction) {
     if (sAction === "OK" && !this.permitData.WrkPmtIssueHistoryIsAllowed) {
      sap.ui.core.BusyIndicator.show(0);
      this.callIssueWrkPmtAction(true);
     } else if (sAction === "OK" && this.permitData.WrkPmtIssueHistoryIsAllowed) {
      this.callAddPersonRespPopUp(true);
     }
    }.bind(this)
   });
  },
  callAddPersonRespPopUp: function (setFlag) {
   this.oIssueFlag = setFlag;
   if (!this.onIssuePermitDialog) {
    this.onIssuePermitDialog = sap.ui.xmlfragment("idIssuePermitDialog",
     "i2d.eam.workpermit.manages1.ext.view.fragments.WorkPermitIssueTechnicianPopUp", this);
    this.getView().addDependent(this.onIssuePermitDialog);
   }
   this.onIssuePermitDialog.open();
   this.idTechnician = sap.ui.core.Fragment.byId("idIssuePermitDialog", "permitInputTech");
   this.idComment = sap.ui.core.Fragment.byId("idIssuePermitDialog", "permitInputIssueComment");
   this.continueBtn = sap.ui.core.Fragment.byId("idIssuePermitDialog", "permitButtonHandOutPermit");
   this.continueBtn.setBlocked(true); //note 3460511
   this.clearIssuePopupFields();
   jQuery.sap.delayedCall(500, this, function () {
    this.idTechnician.focus();
   });
  },
  clearIssuePopupFields: function () {
   this.idTechnician.setValue("");
   this.idComment.setValue("");
   this.newPPValue = "";
   this.newPTValue = "";
   this.newRefValue = "";
  },
  handleClosePopupButton: function (oEvent) {
   this.onIssuePermitDialog.close();
  },
  handleIssuePermitButton: function (oEvent) {
   if (this.TechId !== "" && !this.continueBtn.getBlocked()) { // note 3460511
    this.onIssuePermitDialog.close();
    this.HistPath = oEvent.getSource().getBindingContext().sPath;
    this.CommentId = this.idComment.getValue();
    var that = this;
    if (this.TechId !== undefined || this.CommentId) {
     this.callIssueWrkPmtActn(this.oIssueFlag);
    } else {
     sap.ui.core.BusyIndicator.show(0);
     this.callIssueWrkPmtAction(this.oIssueFlag);
    }
   } // note 3460511
  },
  handleTechValueChange: function (oEvent) {
   this.TechId = oEvent.getParameters().newValue;
   if (this.TechId !== "") {
    this.validateTechn(this.TechId);
   } else {
    //    this.continueBtn.setBlocked(false); //note 3460511
    this.continueBtn.setBlocked(true); //note 3460511

   }
  },
  handleCommentChange: function (oEvent) {
   //   this.continueBtn.setBlocked(true);  // note 3460511
   this.oComment = oEvent.getParameters().newValue;
   //   this.continueBtn.setBlocked(false); // note 3460511
  },
  submitCreateBatch: function (batchId) {
   sap.ui.core.BusyIndicator.show(0);
   this.oModel.setDeferredGroups(this.oModel.getDeferredGroups().concat(["SavePermit"]));
   this.oModel.submitChanges({
    batchGroupId: batchId,
    success: function (oData) {
     sap.ui.core.BusyIndicator.hide();
     this.navigateToDisplayMode();
    }.bind(this),
    error: function (oError) {}
   });
  },
  callIssueWrkPmtAction: function (setFlag) {
   this.getView().setBusy(true);
   this.Ispproved = setFlag;
   this.oModel.resetChanges();
   this.oModel.callFunction("/IssueWorkPermit", {
    method: "POST",
    urlParameters: {
     MaintenancePlanningPlant: this.permitData.MaintenancePlanningPlant,
     WorkPermit: this.permitData.WorkPermit,
     WorkPermitInternalID: this.permitData.WorkPermitInternalID,
     WorkPermitIsIssued: setFlag,
     DraftUUID: this.permitData.DraftUUID,
     IsActiveEntity: this.permitData.IsActiveEntity
    },
    success: function (oData) {
     this.IsApproved = setFlag;
     if (setFlag) {
      MessageToast.show(this.i18nModel.getText("IssueStatusMsg"));
     } else {
      MessageToast.show(this.i18nModel.getText("ReissueMsgConfirm"));
     }
     this.getView().setBusy(false);
     sap.ui.core.BusyIndicator.hide();
     this.navigateToDisplayMode();
    }.bind(this),
    error: function (oResponse) {
     this.getView().setBusy(false);
     sap.ui.core.BusyIndicator.hide();
     var oMessage = JSON.parse(oResponse.responseText).error.message.value;
     sap.m.MessageBox.error(oMessage);
    }.bind(this)
   });
  },
  callIssueWrkPmtActn: function (setFlag) {
   this.getView().setBusy(true);
   this.Ispproved = setFlag;
   this.oModel.resetChanges();
   this.oModel.setDeferredGroups(this.oModel.getDeferredGroups().concat(["IssuePermit"]));
   this.oModel.callFunction("/IssueWorkPermit", {
    method: "POST",
    groupId: "IssuePermit",
    urlParameters: {
     MaintenancePlanningPlant: this.permitData.MaintenancePlanningPlant,
     WorkPermit: this.permitData.WorkPermit,
     WorkPermitInternalID: this.permitData.WorkPermitInternalID,
     WorkPermitIsIssued: setFlag,
     DraftUUID: this.permitData.DraftUUID,
     IsActiveEntity: this.permitData.IsActiveEntity
    }
   });
   this.oModel.submitChanges({
    batchGroupId: "IssuePermit",
    success: function (oData) {
     var oResp = oData.__batchResponses[0].__changeResponses;
     if (!oResp) {
      this.getView().setBusy(false);
      var oMessage = JSON.parse(oData.__batchResponses[0].response.body).error.message.value;
      sap.m.MessageBox.error(oMessage);
     } else {
      this.IsApproved = setFlag;
      // if (this.TechId !== "") {
      this.oModel.setDeferredGroups(this.oModel.getDeferredGroups().concat(["PermitHist"]));
      this.oModel.createEntry(
       this.HistPath + "/to_WorkPermitIssHist", {
        groupId: "PermitHist",
        properties: {
         "WorkPermitInternalID": this.permitData.WorkPermitInternalID,
         "NumberOfWorkPermitIssued": oData.__batchResponses[0].__changeResponses[0].data.IssueWorkPermit.NumberOfWorkPermitIssued,
         "WorkPermitIssuedBy": oData.__batchResponses[0].__changeResponses[0].data.IssueWorkPermit.CreatedByUser,
         "WorkPermitIssuedTo": this.TechId,
         "UserCommentsText": this.CommentId,
         "WorkPermitIssueDateTime": oData.__batchResponses[0].__changeResponses[0].data.IssueWorkPermit.CreationDateTime,
         "IsActiveEntity": false
        }
       });

      this.HistPath = "";
      this.TechId = "";
      this.submitCreateBatch("PermitHist");
      // }
      if (setFlag) {
       MessageToast.show(this.i18nModel.getText("IssueStatusMsg"));
      } else {
       MessageToast.show(this.i18nModel.getText("ReissueMsgConfirm"));
      }
     }
     this.getView().setBusy(false);
    }.bind(this),
    error: function (oResponse) {
     this.getView().setBusy(false);
     var oMessage = JSON.parse(oResponse.responseText).error.message.value;
     sap.m.MessageBox.error(oMessage);
    }.bind(this)
   });
  },
  onClickCloseWorkPermit: function (oEvent) {
   MessageBox.warning(this.i18nModel.getText("CloseWorkPermitMsg"), {
    title: this.i18nModel.getText("idCloseWorkPermitButton"),
    icon: MessageBox.Icon.warning,
    actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
    emphasizedAction: MessageBox.Action.OK,
    onClose: function (sAction) {
     if (sAction === "YES") {
      sap.ui.core.BusyIndicator.show(0);
      this.callCloseWorkPermitAction();
     }
    }.bind(this)
   });
  },
  callCloseWorkPermitAction: function () {
   this.getView().setBusy(true);
   this.oModel.callFunction("/SetProcessingStatusToClosed", {
    method: "POST",
    urlParameters: {
     MaintenancePlanningPlant: this.permitData.MaintenancePlanningPlant,
     WorkPermit: this.permitData.WorkPermit,
     WorkPermitInternalID: this.permitData.WorkPermitInternalID,
     DraftUUID: this.permitData.DraftUUID,
     IsActiveEntity: this.permitData.IsActiveEntity
    },
    success: function (oData) {
     sap.ui.getCore().byId("ObjectPageMenuButtonIdStatus").setVisible(false);
     this.getView().setBusy(false);
     sap.ui.core.BusyIndicator.hide();
     this.navigateToDisplayMode();
    }.bind(this),
    error: function (oError) {
     this.getView().setBusy(false);
     this.handleAuthError(oError);
    }.bind(this)
   });
  },

  onExit: function (oEvent) {
   if (this.oApproveWrkPmtSubmitDialog) {
    this.oApproveWrkPmtSubmitDialog.destroy();
    delete this.oApproveWrkPmtSubmitDialog;
   }
  },

  setCreatePermitParameterValues: function () {
   var oUrl = window.location;
   var oSearchParams = new URL(oUrl.hash.replace("#", oUrl.origin + "/")).searchParams;
   var sMaintenanceOrder = oSearchParams.get("ActiveMaintenanceOrder");
   var sMaintenancePlanningPlant = oSearchParams.get("MaintenancePlanningPlant");
   if (sMaintenancePlanningPlant) {
    this.newPPValue = sMaintenancePlanningPlant;
    this.validateAuthorization(this.newPPValue);
    this.idPlanningPlant.setValue(sMaintenancePlanningPlant);
   }
   if (sMaintenanceOrder) {
    this.idMaintorder.setValue(sMaintenanceOrder);
   }
  }
 });
});