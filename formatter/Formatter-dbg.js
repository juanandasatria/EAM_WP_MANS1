/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/mvc/Controller"],
	function (Controller) {
		"use strict";
		var Formatter = {
			FormatObjKey: function (WrkPmtIntId) {

				var oBindingContext = this.getBindingContext();
				if (oBindingContext) {
					var sPath = oBindingContext.getPath();
					var oModel = oBindingContext.getModel();
					var oData = oModel.getData(sPath);
				}
				if (oData) {
					if (oData.WorkPermit !== undefined && oData.WorkPermit !== null && oData.WorkPermit !== "") {
						var oWorkPermit = oData.WorkPermit.padStart(12, '0');
						return oWorkPermit;
					} else {
						return oData.WorkPermitInternalID;
					}
				}

			},
			returnExtAttachmentSemObj: function (WorkPermit) {
				var sAttachmentKey = i2d.eam.workpermit.manages1.formatter.Formatter.getAttachmentKey(WorkPermit);
				return {
					"WorkPermit": sAttachmentKey
				};
			},
			getAttachmentKey: function (WorkPermit) {
				var objectKey = '';
				if (WorkPermit !== undefined && WorkPermit !== null && WorkPermit !== "" && WorkPermit.charAt(0) !== "#") { //FOR ACTIVE MaintenancePlanT
					objectKey = WorkPermit;
				}
				if (!isNaN(objectKey)) { //3058330
					while (objectKey.length < 10) { //3058330
						objectKey = '000' + objectKey; //3058330
					}
				}
				return objectKey;
			},
			// Set Operation counter for Operations Column
			formatOperationsText: function (OperationCounter) {
				var operationsText;
				if (OperationCounter > 1) {
					operationsText = OperationCounter + " " + this.getModel("i18n").getResourceBundle().getText("OperationsText");
				} else if (OperationCounter <= 1) {
					operationsText = OperationCounter + " " + this.getModel("i18n").getResourceBundle().getText("OperationFilterItemText");
				} else {
					operationsText = this.getModel("i18n").getResourceBundle().getText("OperationsText");
				}
				return operationsText;
			},
			formatOperationLinkDisplay: function (OperationCounter) {
				if (OperationCounter >= 1) {
					return true;
				} else {
					return false;
				}
			}
		};
		return Formatter;
	},
	true);