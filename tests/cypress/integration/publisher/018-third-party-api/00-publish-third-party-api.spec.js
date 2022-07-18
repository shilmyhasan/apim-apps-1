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

describe("Publish thirdparty api", () => {
    const { publisher, developer, password, } = Utils.getUserInfo();
    let testApiId;
    it.only("Publish thirdparty api", () => {
        cy.loginToPublisher(publisher, password);
        
        cy.visit(`${Utils.getAppOrigin()}/publisher/apis`);
        //check if other protocol option is added in AsyncApi
        Utils.addAPI({}).then((apiId) => {
            cy.visit(`${Utils.getAppOrigin()}/publisher/apis`);
            testApiId = apiId;
            cy.get('#itest-create-api-menu-button', { timeout: 30000 }).should('be.visible').click();
            cy.get('#itest-id-create-streaming-api-import').click();
            cy.get('#outlined-full-width').invoke('val', 'https://raw.githubusercontent.com/asyncapi/spec/v2.0.0/examples/2.0.0/streetlights.ym');
            cy.get('#outlined-full-width').type('l');
            cy.get('#outlined-full-width').click(0,0);
            cy.get('#outlined-full-width').should('have.value','https://raw.githubusercontent.com/asyncapi/spec/v2.0.0/examples/2.0.0/streetlights.yml');
            cy.get('button span').contains('Next').should('not.be.disabled');
            cy.get('button span').contains('Next').click();
            cy.get('#mui-component-select-protocol').click();
            cy.get('#other').should('exist');
            cy.visit(`${Utils.getAppOrigin()}/publisher/apis`);

            //select rest-api option from the menu item
            cy.get('#itest-create-api-menu-button', { timeout: 30000 }).should('be.visible').click();
            cy.get('#itest-id-landing-rest-create-default').click();
            cy.get('#itest-id-apiname-input').type('ThirdPartyApi');
            cy.get('#itest-id-apicontext-input').type('/thirdpartyapi');
            cy.get('#itest-id-apiversion-input').type('1.0.0');
            cy.get('#itest-id-apiendpoint-input').type(`${Utils.getAppOrigin()}/am/sample/thirdpartyapi/v1/api`);
            cy.get('#itest-create-default-api-button').click();
            //Mark as third party api
            cy.get('#itest-api-details-portal-config-acc').click();
            cy.url().then(url => {
                let apiId = /apis\/(.*?)\/overview/.exec(url)[1];
                cy.get('#left-menu-itemDesignConfigurations').click();
                cy.get('[name="advertised"]:first').click();
                cy.get('[name="apiExternalProductionEndpoint"]').type(`${Utils.getAppOrigin()}/am/sample/thirdpartyapi/v1/externalapi`);
                cy.get('[name="apiExternalSandboxEndpoint"]').type(`${Utils.getAppOrigin()}/am/sample/thirdpartyapi/v1/externalapi`);
                cy.get('[name="originalDevPortalUrl"]').type('http://www.mocky.io/v2/5ec501532f00009700dc2dc1');
                cy.get('#design-config-save-btn').click();
                cy.get('#itest-api-details-portal-config-acc').click();
        
                //publish
                cy.get('#left-menu-itemlifecycle').click();
                cy.get('[data-testid="Publish-btn"]').should('exist');
                cy.get('[data-testid="Deploy as a Prototype-btn"]').should('exist');
                cy.get('[data-testid="Publish-btn"]').click();
        
                //check if the api is third-party and published
                cy.get('[data-testid="itest-api-state"]').contains('PUBLISHED').should('exist');
                cy.get('[data-testid="itest-third-party-api-label"]').contains('Third Party').should('exist');
        
                //Check if the subscriptions,runtime config, resources, scopes, monetization, test console sections are present
                cy.get('#itest-api-details-portal-config-acc').click();
                cy.get('#left-menu-itemsubscriptions').should('exist');
                cy.get('#left-menu-itemsubscriptions').click();
                cy.get('[name="Unlimited"]').click();
                cy.get('#subscriptions-save-btn').click();
                cy.get('#itest-api-details-portal-config-acc').click();
                cy.get('#itest-api-details-api-config-acc').click();
                cy.get('#left-menu-itemRuntimeConfigurations').should('exist');
                cy.get('#left-menu-itemresources').should('exist');
                cy.get('#left-menu-itemLocalScopes').should('exist');
                cy.get('#left-menu-monetization-prod').should('exist');
                cy.get('#itest-api-details-api-config-acc').click();
                cy.get('#left-menu-itemTestConsole').should('exist');
        
                //Check if the api is not deployable
                cy.get('#left-menu-itemdeployments').click();
                cy.get('[data-testid="third-party-api-deployment-dialog"]').contains('This API is marked as a third party API. The requests are not proxied through the gateway. Hence, deployments are not required.').should('exist');
                cy.get('#deploy-btn').should('be.disabled');
        
                //Check if prompts when switching to a regular api
                cy.get('#itest-api-details-portal-config-acc').click();
                cy.get('#left-menu-itemDesignConfigurations').click();
                cy.get('[name="advertised"]:last').click();
                cy.get('[data-testid="itest-update-api-confirmation"]').should('exist');
        
                cy.visit(`${Utils.getAppOrigin()}/publisher/apis`);
                cy.get('[data-testid="itest-api-lifecycleState"] span').contains('PUBLISHED').should('exist');
                cy.get('[data-testid="third-party-api-card-label"]').should('exist');
        
                cy.logoutFromPublisher();
                cy.loginToDevportal(developer, password);
                cy.viewThirdPartyApi();
                cy.logoutFromDevportal();
                cy.log("delete api ", apiId);
                cy.loginToPublisher(publisher, password);
                Utils.deleteAPI(apiId);
                cy.logoutFromPublisher();
            });
        });
    });
    after(function () {
        cy.loginToPublisher(publisher, password);
        if (testApiId) {
            Utils.deleteAPI(testApiId);
        }
    })
});

