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

describe("prototype apis with security enabled", () => {
    const userName = 'admin';
    const password = 'admin';
    const apiName="Prototyped_sample2";
    const apiVersion='1.0.0';
    let testApiId;
    before(function () {
        cy.loginToPublisher(userName, password);
    })
    it.only("try out resources enabling the security without credentials", () => {
        const endpoint = 'https://petstore.swagger.io/v2/store/inventory';
        Utils.addAPI({name: apiName, version: apiVersion}).then((apiId) => {
            testApiId = apiId;
            cy.visit(`/publisher/apis/${apiId}/overview`);
            cy.get('#itest-api-details-api-config-acc').click();
            cy.get('#left-menu-itemendpoints').click();
            cy.get('[data-testid="http/restendpoint-add-btn"]').click();

            // Add the prod and sandbox endpoints
            cy.get('#production-endpoint-checkbox').click();
            cy.get('#sandbox-endpoint-checkbox').click();
            cy.get('#production_endpoints').focus().type(endpoint);
            cy.get('#sandbox_endpoints').focus().type(endpoint);

            // Save
            cy.get('body').click();
            cy.get('#endpoint-save-btn').scrollIntoView();
            cy.get('#endpoint-save-btn').click();

            // Check the values
            cy.get('#production_endpoints').should('have.value', endpoint);
            cy.get('#sandbox_endpoints').should('have.value', endpoint);

            //by default security enabled for resources
            cy.get("#left-menu-itemresources").click();
            cy.get('button[aria-label="disable security for all"]').should('exist');
            
            //deploy API
            cy.get("#left-menu-itemdeployments").click();
            cy.get("#deploy-btn",{timeout:3000}).click();

            cy.get("#left-menu-itemlifecycle").click();
            cy.get('[data-testid="Deploy as a Prototype-btn"]',{timeout:3000}).click();

            cy.logoutFromPublisher();

            //login to dev portal as Developer
            cy.loginToDevportal(userName, password);
            cy.get('table > tbody > tr',{timeout:6000}).get(`[area-label="Go to ${apiName}"]`).contains('.api-thumb-chip-main','PRE-RELEASED').should('exist');
            cy.get('table > tbody > tr',{timeout:6000}).get(`[area-label="Go to ${apiName}"]`).click();
            cy.contains('a',"Try out",{timeout:3000}).click();
            cy.get('.opblock-summary-get > .opblock-summary-control').click();
            cy.get('.try-out__btn').click();
            cy.get('.execute').click();
            cy.contains('.live-responses-table .response > .response-col_status','401').should('exist');
        
            cy.logoutFromDevportal();
        });
    });

    after(function () {
        // Test is done. Now delete the api
        cy.loginToPublisher(userName, password);
        cy.log("API id ", testApiId);
        Utils.deleteAPI(testApiId);
    })
});