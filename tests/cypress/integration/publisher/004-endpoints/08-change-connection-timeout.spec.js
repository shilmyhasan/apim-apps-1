/*
 * Copyright (c) 2023, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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

describe("publisher-004-08 : Change connection timeout", () => {
    const { publisher, password, superTenant, testTenant} = Utils.getUserInfo();
    // duration value should filter out non-numeric characters
    const duration = 'abcde-123+@#$%';
    const correctDuration = '123';
    const endpoint = 'https://petstore.swagger.io/v2/store/inventory';

    const changeConnectionTimeout = (tenant) => {
        cy.loginToPublisher(publisher, password, tenant);
        Utils.addAPI({}).then((apiId) => {
            cy.visit(`/publisher/apis/${apiId}/overview`);
            cy.get('#itest-api-details-api-config-acc').click();
            cy.get('#left-menu-itemendpoints').click();
            cy.get('[data-testid="http/restendpoint-add-btn"]').click();

            // Open the production endpoint
            cy.get('#production-endpoint-checkbox').click();
            cy.get('#production_endpoints').focus().type(endpoint);
            // Open advanced configurations
            cy.get('#production_endpoints-endpoint-configuration-icon-btn').click();
            // Set connection timeout
            cy.get('#duration-input').click();
            cy.get('#duration-input').clear();
            cy.get('#duration-input').type(duration);
            cy.get('#endpoint-configuration-submit-btn').click();

            // Open the sandbox endpoint
            cy.get('#sandbox-endpoint-checkbox').click();
            cy.get('#sandbox_endpoints').focus().type(endpoint);
            // Open advanced configurations
            cy.get('#sandbox_endpoints-endpoint-configuration-icon-btn').click();
            // Set connection timeout
            cy.get('#duration-input').click();
            cy.get('#duration-input').clear();
            cy.get('#duration-input').type(duration);
            cy.get('#endpoint-configuration-submit-btn').click();

            // Check the production endpoint connection timeout value
            cy.get('#production_endpoints-endpoint-configuration-icon-btn').click();
            cy.get('#duration-input').should('have.value', correctDuration);
            cy.get('#endpoint-configuration-submit-btn').click();

            // Check the sandbox endpoint connection timeout value
            cy.get('#sandbox_endpoints-endpoint-configuration-icon-btn').click();
            cy.get('#duration-input').should('have.value', correctDuration);
            cy.get('#endpoint-configuration-submit-btn').click();

            // Test is done. Now delete the api
            Utils.deleteAPI(apiId);
        });
    }

    it.only("Change connection timeout - super admin", () => {
        changeConnectionTimeout(superTenant);
    });
    it.only("Change connection timeout - tenant user", () => {
        changeConnectionTimeout(testTenant);
    });
});
