/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
  "sap/ui/base/Object"
 ],
 function (UI5Object) {
  "use strict";
  var vNameSpace, vPermitCreateRequest;
  var _sAppModulePath = "i2d/eam/workpermit/manages1/";
  return function (sNameSpace, oMockServer, MockServer) {
   vNameSpace = sNameSpace;
   this.oMockserver = oMockServer;

   this.oMockserver._getOdataQueryExpand = function (aDataSet, sODataQueryValue, sEntitySetName) {
    for (var i = 0; i < aDataSet.length; i++) {
     if (JSON.stringify(aDataSet[i].DraftAdministrativeData) === "null" && sODataQueryValue.indexOf("DraftAdministrativeData") > -1) {
      if (aDataSet[i].IsActiveEntity === false) {
       aDataSet[i].DraftAdministrativeData = {
        "d": {
         "DraftAdministrativeData": {
          "__metadata": {
           "id": "/sap/opu/odata/sap/UI_WORKPERMIT/I_DraftAdministrativeData(DraftUUID=guid'42010aef-4c96-1edd-87f2-821cbd1d40c0',DraftEntityType='R_WORKPERMITDRAFTTP')",
           "uri": "/sap/opu/odata/sap/UI_WORKPERMIT/I_DraftAdministrativeData(DraftUUID=guid'42010aef-4c96-1edd-87f2-821cbd1d40c0',DraftEntityType='R_WORKPERMITDRAFTTP')",
           "type": "cds_ui_workpermit.I_DraftAdministrativeDataType"
          },
          "DraftUUID": "506b4bc3-45cc-1edc-b5d1-c0cbe6c9b297",
          "DraftEntityType": "R_WORKPERMITDRAFTTP",
          "CreationDateTime": "/Date(1652866602000+0000)/",
          "CreatedByUser": "DUMMY",
          "LastChangeDateTime": "/Date(1652866664000+0000)/",
          "LastChangedByUser": "DUMMY",
          "DraftAccessType": "0",
          "ProcessingStartDateTime": "/Date(1652866664000+0000)/",
          "InProcessByUser": "",
          "DraftIsKeptByUser": true,
          "EnqueueStartDateTime": "/Date(1652866664000+0000)/",
          "DraftIsCreatedByMe": true,
          "DraftIsLastChangedByMe": true,
          "DraftIsProcessedByMe": false,
          "CreatedByUserDescription": "DUMMY",
          "LastChangedByUserDescription": "DUMMY",
          "InProcessByUserDescription": ""
         },
         "SiblingEntity": {
          "__deferred": {
           "uri": "/sap/opu/odata/sap/UI_WORKPERMIT/WorkPermit(WorkPermit='',DraftUUID=guid'42010aef-4c96-1edd-87f2-821cbd1d20c0',IsActiveEntity=false)/SiblingEntity"
          }
         },
         "to_PermitNatureOfWork": {
          "__deferred": {
           "uri": "/sap/opu/odata/sap/UI_WORKPERMIT/WorkPermit(WorkPermit='',DraftUUID=guid'42010aef-4c96-1edd-87f2-821cbd1d20c0',IsActiveEntity=false)/to_PermitNatureOfWork"
          }
         },
         "to_PermitProtEquip": {
          "__deferred": {
           "uri": "/sap/opu/odata/sap/UI_WORKPERMIT/WorkPermit(WorkPermit='',DraftUUID=guid'42010aef-4c96-1edd-87f2-821cbd1d20c0',IsActiveEntity=false)/to_PermitProtEquip"
          }
         },
         "to_PermitSftyPrecaution": {
          "__deferred": {
           "uri": "/sap/opu/odata/sap/UI_WORKPERMIT/WorkPermit(WorkPermit='',DraftUUID=guid'42010aef-4c96-1edd-87f2-821cbd1d20c0',IsActiveEntity=false)/to_PermitSftyPrecaution"
          }
         },
         "to_TechnicalObject": {
          "__deferred": {
           "uri": "/sap/opu/odata/sap/UI_WORKPERMIT/WorkPermit(WorkPermit='',DraftUUID=guid'42010aef-4c96-1edd-87f2-821cbd1d20c0',IsActiveEntity=false)/to_TechnicalObject"
          }
         },
         "to_WorkPermitLongTxt": {
          "__deferred": {
           "uri": "/sap/opu/odata/sap/UI_WORKPERMIT/WorkPermit(WorkPermit='',DraftUUID=guid'42010aef-4c96-1edd-87f2-821cbd1d20c0',IsActiveEntity=false)/to_WorkPermitLongTxt"
          }
         },
         "to_WorkPermitOrder": {
          "__deferred": {
           "uri": "/sap/opu/odata/sap/UI_WORKPERMIT/WorkPermit(WorkPermit='',DraftUUID=guid'42010aef-4c96-1edd-87f2-821cbd1d20c0',IsActiveEntity=false)/to_WorkPermitOrder"
          }
         },
         "to_WorkPermitOrderOperation": {
          "__deferred": {
           "uri": "/sap/opu/odata/sap/UI_WORKPERMIT/WorkPermit(WorkPermit='',DraftUUID=guid'42010aef-4c96-1edd-87f2-821cbd1d20c0',IsActiveEntity=false)/to_WorkPermitOrderOperation"
          }
         },
         "to_WorkPermitPartner": {
          "__deferred": {
           "uri": "/sap/opu/odata/sap/UI_WORKPERMIT/WorkPermit(WorkPermit='',DraftUUID=guid'42010aef-4c96-1edd-87f2-821cbd1d20c0',IsActiveEntity=false)/to_WorkPermitPartner"
          }
         }
        }
       };
      } else {
       aDataSet[i].DraftAdministrativeData = {};
       aDataSet[i].DraftAdministrativeData.InProcessByUser = "null";
       aDataSet[i].DraftAdministrativeData.DraftIsProcessedByMe = "null";
       aDataSet[i].DraftAdministrativeData.DraftIsLastChangedByMe = "null";
       aDataSet[i].DraftAdministrativeData.InProcessByUserDescription = "null";
       aDataSet[i].DraftAdministrativeData.LastChangedByUserDescription = "null";
      }
     }
    }
    return MockServer.prototype._getOdataQueryExpand.apply(this, [aDataSet, sODataQueryValue, sEntitySetName]);
   };

   vPermitCreateRequest = '"__metadata":{"type":"' + sNameSpace + '.WorkPermitType"';

   this.enhanceDraftHandling = function (aRequests) {
    aRequests.push({
     method: "POST",
     path: new RegExp(/(WorkPermit)(\(([^/\?#]+)\)\/?(.*)?)?/),
     response: function (oXhr, sUrlParams) {
      if (oXhr.requestBody.indexOf(vPermitCreateRequest) > -1) {
       return this.PermitCreateRequest.call(this, oXhr, sUrlParams);
      }
      return false;
     }.bind(this)
    });

    aRequests.push({
     method: "POST",
     path: new RegExp(/WorkPermitDiscard([?#].*)?/),
     response: function (oXhr, sUrlParams) {
      this.DiscardPlan(oXhr);
      return;
     }.bind(this)

    });

    aRequests.push({
     method: "POST",
     path: new RegExp("(.*)Validate(.*)"),
     response: function (oXhr, sUrlParams) {
      var oResponse = {
       "d": {
        "Validate": {
         "WrkPmtOrdOpAssgmtIsAllowed": "X",
         "SystemMessageType": "SystemMessageType",
         "SystemMessageText": "SystemMessageText"
        }
       }
      };
      oXhr.respondJSON(202, {}, JSON.stringify(oResponse));
     }
    });

    aRequests.push({
     method: "POST",
     path: new RegExp("(.*)CreateFromPopup(.*)"),
     response: function (oXhr, sUrlParams) {
      var oResponse = {
       "d": {
        "DraftUUID": "506b4bc3-45cc-1edc-b5d1-c0cbe6c99297",
        "WorkPermit": ""
       }
      };
      oXhr.respondJSON(202, {}, JSON.stringify(oResponse));
     }
    });

    aRequests.push({
     method: "POST",
     path: new RegExp("(.*)UnassignJobs(.*)"),
     response: function (oXhr, sUrlParams) {
      var oResponse = {};
      oXhr.respondJSON(202, {}, JSON.stringify(oResponse));
     }
    });

    aRequests.push({
     method: "POST",
     path: new RegExp("(.*)CheckAuthorization(.*)"),
     response: function (oXhr, sUrlParams) {
      var oResponse = {
        "d": { "CheckAuthorization": {
        "WorkPermitCancelIsAllowed": true,
        "WrkPermitIsDeleted": true,
        WrkPmtResetDeletionIsAllowed: false,
        IsApproved: true,
        RevokeIsPossible: false
       }
       }
      };
      oXhr.respondJSON(202, {}, JSON.stringify(oResponse));
     }
    });

    aRequests.push({
     method: "POST",
     path: new RegExp("(.*)SetDeletionFlag(.*)"),
     response: function (oXhr, sUrlParams) {
      var oResponse = {
       "d": {
        "WorkPermitCancelIsAllowed": true,
        "WrkPermitIsDeleted": true,
        "WrkPmtResetDeletionIsAllowed": false
       }
      };
      oXhr.respondJSON(202, {}, JSON.stringify(oResponse));
     }
    });

    return aRequests;

   };

   this.PermitCreateRequest = function (oXhr, sUrlParams) {
    var aAssociations = ["DraftAdministrativeData", "SiblingEntity", "to_PermitNatureOfWork", "to_PermitProtEquip",
      "to_PermitSftyPrecaution", "to_TechnicalObject", "to_WorkPermitApproval", "to_WorkPermitLongTxt", "to_WorkPermitOrder",
      "to_WorkPermitOrderOperation", "to_WorkPermitPartner", "to_WorkPermitStatus"
     ],
     aData = this.oMockserver.getEntitySetData("WorkPermit"),
     aDraftData = this.oMockserver.getEntitySetData("I_DraftAdministrativeData"),
     sMockPlan = jQuery.sap.getModulePath(_sAppModulePath + "localService/mockutility/WorkPermitCreate", ".json"),
     oNewEntry = jQuery.sap.syncGetJSON(sMockPlan).data;

    var DraftAdminData = oNewEntry.DraftAdministrativeData;

    var sKey = "/WorkPermit(WorkPermit='',DraftUUID=guid'506b4bc3-45cc-1edc-b5d1-c0cbe6c99297',IsActiveEntity=false)";
    this.setAssociations(oNewEntry, aAssociations, sKey);
    // create the response
    var oResponse = {
     "d": oNewEntry
    };
    oNewEntry.__metadata = {
     "id": sKey,
     "uri": "/sap/opu/odata/sap/UI_WORKPERMIT/" + sKey,
     "type": vNameSpace + ".WorkPermitType"
    };

    aData.push(oNewEntry);
    aDraftData.push(DraftAdminData);

    this.oMockserver.setEntitySetData("WorkPermit", aData);
    this.oMockserver.setEntitySetData("I_DraftAdministrativeData", aDraftData);

    oXhr.respondJSON(200, {}, JSON.stringify(oResponse));
    return true;
   };

   this.DiscardPlan = function (oXhr) {
    if (oXhr.url.match(/WorkPermit='()'/)) {
     var WorkPermit = oXhr.url.match(/WorkPermit='()'/)[1];
     var aPermitData = this.oMockserver.getEntitySetData("WorkPermit");

     var aFilteredPermit = aPermitData.filter(function (permit) {
      return permit.WorkPermit !== WorkPermit;
     });

     this.oMockserver.setEntitySetData("WorkPermit", aFilteredPermit);
    }
    var oResponse =
     '{"d":{"WorkPermitDiscard":{"__metadata":{"type":"cds_ui_workpermit.DummyFunctionImportResult"},"IsInvalid":false}}}';
    oXhr.respondJSON(202, {}, oResponse);
    return;
   };

   this.setAssociations = function (oEntry, aAssociations, sKey) {
    for (var i = 0; i < aAssociations.length; i++) {
     oEntry[aAssociations[i]] = {
      "__deferred": {
       "uri": "/sap/opu/odata/sap/UI_WORKPERMIT/" + sKey + "/" + aAssociations[i]
      }
     };
    }
   };

  };
 }
);
