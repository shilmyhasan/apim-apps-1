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
import PublisherComonPage from "../../../support/pages/publisher/PublisherComonPage";
const publisherComonPage = new PublisherComonPage();

describe("prototype apis with security disabled", () => {
    const userName = 'admin';
    const password = 'admin';
    const apiName="Prototyped_sample1" + Math.floor(Date.now() / 1000);
    const apiVersion='1.0.0';
    let testApiId;
    before(function () {

    })
    it.only("try out resources disabling the security without credentials", () => {
        const endpoint = 'https://petstore.swagger.io/v2/store/inventory';
        cy.loginToPublisher(userName, password);
        Utils.addAPI({name: apiName, version: apiVersion}).then((apiId) => {
            testApiId = apiId;
            cy.visit(`/publisher/apis/${apiId}/overview`);
            publisherComonPage.waitUntillPublisherLoadingSpinnerExit();
            cy.get('#itest-api-details-api-config-acc', {timeout: Cypress.config().largeTimeout}).click();
            cy.get('#left-menu-itemendpoints').click();
            cy.get('[data-testid="http/restendpoint-add-btn"]').click({force:true});
    
            // Add the prod and sandbox endpoints
            cy.get('#production-endpoint-checkbox', {timeout: Cypress.config().largeTimeout}).click();
            cy.get('#production_endpoints', {timeout: Cypress.config().largeTimeout}).focus().type(endpoint);
            cy.get('#sandbox-endpoint-checkbox').click();
            cy.get('#sandbox_endpoints').focus().type(endpoint);
    
            // Save
            cy.get('body').click();
            cy.get('#endpoint-save-btn').scrollIntoView();
            cy.get('#endpoint-save-btn').click();
    
            // Check the values
            cy.get('#production_endpoints').should('have.value', endpoint);
            cy.get('#sandbox_endpoints').should('have.value', endpoint);
    
            //disable security
            cy.get("#left-menu-itemresources").click();
            cy.wait(5000)
            cy.get('button[aria-label="disable security for all"]').click();
            cy.get('button[aria-label="select merge strategy"]').click();
            cy.get("#split-button-menu").contains('li','Save and deploy').click();
            cy.wait(5000)
            cy.get('#Default', {timeout: Cypress.config().largeTimeout}).check({force:true});
            cy.get('[data-testid="btn-deploy"]').click();
    
            cy.get("#left-menu-itemlifecycle").click();
            cy.get('[data-testid="Deploy as a Prototype-btn"]',{timeout: Cypress.config().largeTimeout}).click();
    
            cy.logoutFromPublisher();
    
            //login to dev portal as Developer
            cy.loginToDevportal(userName, password);
            cy.get('table > tbody > tr',{timeout: Cypress.config().largeTimeout}).get(`[area-label="Go to ${apiName}"]`).contains('.api-thumb-chip-main','PRE-RELEASED').should('exist');
            cy.get('table > tbody > tr',{timeout: Cypress.config().largeTimeout}).get(`[area-label="Go to ${apiName}"]`).click();
            cy.contains('a',"Try out",{timeout: Cypress.config().largeTimeout}).click();
            cy.get('.opblock-summary-get > .opblock-summary-control', {timeout: Cypress.config().largeTimeout}).click();
            cy.get('.try-out__btn').click();
            cy.get('.execute').click();
           // cy.contains('.live-responses-table .response > td.response-col_status','200').should('exist');
            cy.get('.live-responses-table .response > td.response-col_status').should("contain.text",'200')
           
            cy.logoutFromDevportal();
        });
        
    });

    after(function () {
        // Test is done. Now delete the api
        cy.loginToPublisher(userName, password);
        publisherComonPage.waitUntillPublisherLoadingSpinnerExit();
        Utils.deleteAPI(testApiId);
    })
});