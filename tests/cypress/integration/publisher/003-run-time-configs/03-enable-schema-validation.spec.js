/*
 * Copyright (c) 2022, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import Utils from "@support/utils";

describe("publisher-003-03 : Runtime configuration-schema validation", () => {
    const { publisher, password, superTenant, testTenant} = Utils.getUserInfo();
    let apiName;
    const apiVersion = '1.0.0';

    const enableSchemaValidation = (tenant) => {
        cy.loginToPublisher(publisher, password, tenant);
        apiName = Utils.generateName();
        Utils.addAPI({ name: apiName, version: apiVersion }).then((apiId) => {
            cy.wait(1000)
            cy.visit(`/publisher/apis/${apiId}/overview`, { timeout: 25000 });
            cy.url({ timeout: Cypress.config().largeTimeout }).should('include', `/apis/${apiId}/overview`);
            cy.get('#itest-api-details-api-config-acc', {timeout: 25000}).click();
            cy.get('#left-menu-itemRuntimeConfigurations').click();
            cy.get('#schema-validation-switch').click();
            cy.get('#schema-validation-yes-btn').click();
            cy.get('#save-runtime-configurations').click();
            cy.get('#schema-validation-switch').should('be.checked');
            // Test is done. Now delete the api
            Utils.deleteAPI(apiId);
        });
    }

    it.only("Enable schema validation - super admin", () => {
        enableSchemaValidation(superTenant);
    });
    it.only("Enable schema validation - tenant user", () => {
        enableSchemaValidation(testTenant);
    });
});