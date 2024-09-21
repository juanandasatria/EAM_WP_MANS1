/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"sap/ui/base/Object"
	],
	function (UI5Object) {
		"use strict";

		return function () {

			this.modifyMetadataXML = function (document, sNamespace) {
				var oTransformedMetadata = document;
				//header
				oTransformedMetadata = this.addReferentialConstraint(oTransformedMetadata, sNamespace,
					"WorkPermitType", ["WorkPermit"],
					"to_PermitNatureOfWork", ["WorkPermit"]
				);
				oTransformedMetadata = this.addReferentialConstraint(oTransformedMetadata, sNamespace,
					"WorkPermitType", ["WorkPermit"],
					"to_PermitProtEquip", ["WorkPermit"]
				);
				oTransformedMetadata = this.addReferentialConstraint(oTransformedMetadata, sNamespace,
					"WorkPermitType", ["WorkPermit"],
					"to_PermitSftyPrecaution", ["WorkPermit"]
				);
				oTransformedMetadata = this.addReferentialConstraint(oTransformedMetadata, sNamespace,
					"WorkPermitType", ["WorkPermit"],
					"to_TechnicalObject", ["WorkPermit"]
				);
				oTransformedMetadata = this.addReferentialConstraint(oTransformedMetadata, sNamespace,
					"WorkPermitType", ["WorkPermit"],
					"to_WorkPermitApproval", ["WorkPermit"]
				);
				oTransformedMetadata = this.addReferentialConstraint(oTransformedMetadata, sNamespace,
					"WorkPermitType", ["WorkPermit"],
					"to_WorkPermitLongTxt", ["WorkPermit"]
				);
				oTransformedMetadata = this.addReferentialConstraint(oTransformedMetadata, sNamespace,
					"WorkPermitType", ["WorkPermit"],
					"to_WorkPermitOrder", ["WorkPermit"]
				);
				oTransformedMetadata = this.addReferentialConstraint(oTransformedMetadata, sNamespace,
					"WorkPermitType", ["WorkPermit"],
					"to_WorkPermitOrderOperation", ["WorkPermit"]
				);
				oTransformedMetadata = this.addReferentialConstraint(oTransformedMetadata, sNamespace,
					"WorkPermitType", ["WorkPermit"],
					"to_WorkPermitPartner", ["WorkPermit"]
				);
				oTransformedMetadata = this.addReferentialConstraint(oTransformedMetadata, sNamespace,
					"WorkPermitType", ["WorkPermit"],
					"to_WorkPermitStatus", ["WorkPermit"]
				);
				return oTransformedMetadata;
			};

			this.addReferentialConstraint = function (document, sNamespace, sPrincipalEntityTypeName, aPrincipalEntityTypeFKPropertyNames,
				sNavigationPropertyName, aDependentEntityTypeKeyPropertyNames) {
				var oAssocDetail = this.getAssociationDetail(document, sNamespace,
					sPrincipalEntityTypeName, sNavigationPropertyName);
				if (oAssocDetail.oAssoc) {
					var oRefConstraint = this.getRefConstraint(document,
						oAssocDetail.sFromRoleName, aPrincipalEntityTypeFKPropertyNames,
						oAssocDetail.sToRoleName, aDependentEntityTypeKeyPropertyNames);
					/*eslint-disable sap-no-dom-insertion*/
					oAssocDetail.oAssoc.appendChild(oRefConstraint);
					/*eslint-enable sap-no-dom-insertion*/
				}
				return document;
			};

			this.getRefConstraint = function (document, sFromRoleName, aPrincipalEntityTypeFKPropertyNames, sToRoleName,
				aDependentEntityTypeKeyPropertyNames) {
				//dom operations necessary for constructing element
				//no guideline violation as the dom is just a mere xml and not a html
				/*eslint-disable sap-no-dom-insertion*/
				/*eslint-disable sap-browser-api-error*/
				/*eslint-disable sap-no-element-creation*/
				var oPrincipal = document.createElement("Principal");
				oPrincipal.setAttribute("Role", sFromRoleName);
				for (var i = 0; i < aPrincipalEntityTypeFKPropertyNames.length; i++) {
					var oPropertyRef = document.createElement("PropertyRef");
					oPropertyRef.setAttribute("Name", aPrincipalEntityTypeFKPropertyNames[i]);
					oPrincipal.appendChild(oPropertyRef);
				}
				var oDependent = document.createElement("Dependent");
				oDependent.setAttribute("Role", sToRoleName);
				for (i = 0; i < aDependentEntityTypeKeyPropertyNames.length; i++) {
					oPropertyRef = document.createElement("PropertyRef");
					oPropertyRef.setAttribute("Name", aDependentEntityTypeKeyPropertyNames[i]);
					oDependent.appendChild(oPropertyRef);
				}
				var oRefConstraint = document.createElement("ReferentialConstraint");
				/*eslint-enable sap-browser-api-error*/
				/*eslint-enable sap-no-element-creation*/
				oRefConstraint.appendChild(oPrincipal);
				oRefConstraint.appendChild(oDependent);
				/*eslint-enable sap-no-dom-insertion*/
				return oRefConstraint;
			};

			this.getAssociationDetail = function (document, sNamespace,
				sPrincipalEntityTypeName, sNavigationPropertyName) {
				var oResult = {
					oAssoc: null,
					sFromRoleName: "",
					sToRoleName: ""
				};
				var oEntityTypeElement = document.querySelector("EntityType[Name=\"" + sPrincipalEntityTypeName + "\"]");
				if (!oEntityTypeElement) {
					return oResult;
				}
				var oNavPropElement = oEntityTypeElement.querySelector("NavigationProperty[Name=\"" + sNavigationPropertyName + "\"]");
				if (!oNavPropElement) {
					return oResult;
				}
				var sAssocName = oNavPropElement.getAttribute("Relationship");
				if (sAssocName) {
					sAssocName = sAssocName.substring(sAssocName.indexOf(".") + 1);
				}
				oResult.oAssoc = document.querySelector("Association[Name=\"" + sAssocName + "\"]");
				oResult.sFromRoleName = oNavPropElement.getAttribute("FromRole");
				oResult.sToRoleName = oNavPropElement.getAttribute("ToRole");
				//Should be unnecessary as we are dealing with XML DOM here, but to prevent popping up as potential XSS vulnerability we encode the content put into the metadata xml
				oResult.sFromRoleName = jQuery.sap.encodeXML(oResult.sFromRoleName);
				oResult.sToRoleName = jQuery.sap.encodeXML(oResult.sToRoleName);
				return oResult;
			};
		};
	}

);