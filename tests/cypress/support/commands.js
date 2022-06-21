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
import 'cypress-file-upload';

Cypress.Commands.add('carbonLogin', (username, password) => {
    Cypress.log({
        name: 'carbonLogin',
        message: `${username} | ${password}`,
    })

    cy.visit(`${Utils.getAppOrigin()}/carbon/admin/login.jsp`);
    cy.get('#txtUserName').type(username);
    cy.get('#txtPassword').type(password);
    cy.get('form').submit();
})

Cypress.Commands.add('carbonLogout', () => {
    cy.get('[href="../admin/logout_action.jsp"]').click();
})

Cypress.Commands.add('portalLogin', (username, password, portal) => {
    Cypress.log({
        name: 'portalLogin',
        message: `${username} | ${password}`,
    })

    cy.visit(`${Utils.getAppOrigin()}/${portal}`);
    if (portal === 'devportal') {
        cy.visit(`${Utils.getAppOrigin()}/devportal/apis?tenant=carbon.super`);
        cy.get('#itest-devportal-sign-in').click();
    }
    cy.url().should('contains', `${Utils.getAppOrigin()}/authenticationendpoint/login.do`);
    cy.get('[data-testid=login-page-username-input]').click();
    cy.get('[data-testid=login-page-username-input]').type(username);
    cy.get('[data-testid=login-page-password-input]').type(password);
    cy.get('#loginForm').submit();
    cy.url().should('contains', `${Utils.getAppOrigin()}/${portal}`);
})

Cypress.Commands.add('loginToPublisher', (username, password) => {
    cy.portalLogin(username, password, 'publisher');
})

Cypress.Commands.add('loginToDevportal', (username, password) => {
    cy.portalLogin(username, password, 'devportal');
})

Cypress.Commands.add('loginToAdmin', (username, password) => {
    cy.portalLogin(username, password, 'admin');
})

Cypress.Commands.add('addNewTenant', (tenant = 'wso2.com', username = 'admin', password = 'admin') => {
    cy.visit(`${Utils.getAppOrigin()}/carbon/tenant-mgt/add_tenant.jsp?region=region1&item=govern_add_tenants_menu`);
    cy.get('#buttonRow .button');
    cy.get('#domain').click();
    cy.get('#domain').type(tenant);
    cy.get('#admin-firstname').click();
    cy.get('#admin-firstname').type(username);
    cy.get('#admin-lastname').click();
    cy.get('#admin-lastname').type(username);
    cy.get('#admin').click();
    cy.get('#admin').type(username);

    // There is a UI error in the carbon console. We need to skip this so that the test will not fail.
    Cypress.on('uncaught:exception', (err, runnable) => {
        // returning false here prevents Cypress from
        // failing the test
        return false
    });
    cy.get('#admin-password').click();
    cy.get('#admin-password').type(password);
    cy.get('#admin-password-repeat').click();
    cy.get('#admin-password-repeat').type(password);
    cy.get('#admin-email').click();
    cy.get('#admin-email').type(`admin@${tenant}`);
    cy.get('#buttonRow .button').click();
})

Cypress.Commands.add('addNewUser', (name = 'newuser', roles = [], password = 'test123') => {
    // Visit the add user page
    cy.visit(`${Utils.getAppOrigin()}/carbon/user/add-step1.jsp`);
    cy.get('input[name="username"]').type(name);
    cy.get('#password').type(password);
    cy.get('#password-repeat').type(password);
    cy.get('.buttonRow input:first-child').click();

    // Go to step 2 where add roles
    cy.url().should('contains', `${Utils.getAppOrigin()}/carbon/user/add-step2.jsp`);
    roles.forEach(role => {
        cy.get(`input[value="${role}"][type="checkbox"]`).check();
    });
    // Finish wizard
    cy.get('.buttonRow input:first-child').click();
    // cy.get('#messagebox-info p').contains(`User PRIMARY/${name} is added successfully.`).should('exist');
})

Cypress.Commands.add('addNewTenantUser', (
    tenantUser,
    password = 'test123',
    tenantRoles = ['Internal/publisher', 'Internal/creator', 'Internal/subscriber', 'Internal/everyone'],
    tenant = 'wso2.com',
    tenantAdminUsername = 'admin',
    tenantAdminPassword = 'admin'
) => {
    cy.addNewTenant(tenant, tenantAdminUsername, tenantAdminPassword);
    cy.reload();
    cy.carbonLogout();
    cy.carbonLogin(`${tenantAdminUsername}@${tenant}`, tenantAdminPassword);
    cy.addNewUser(tenantUser, tenantRoles, password);
})

Cypress.Commands.add('deleteUser', (name) => {
    cy.get(`[onClick="deleteUser(\\'${name}\\')"]`).click();
    cy.get('.ui-dialog  .ui-dialog-buttonpane button:first-child').click();
    cy.get('#messagebox-info p').contains(`User ${name} is deleted successfully.`).should('exist');
    cy.get('.ui-dialog-buttonpane button').click();
});

Cypress.Commands.add('deleteApi', (name, version) => {
    cy.visit(`${Utils.getAppOrigin()}/publisher/apis`);
    cy.intercept('**/apis*').as('getApis');
    cy.wait('@getApis', { timeout: 3000 }).then(() => {
        cy.get('#itest-id-deleteapi-icon-button', { timeout: 30000 });
        cy.get('#itest-id-deleteapi-icon-button').click();
        cy.get('#itest-id-deleteconf').click();
    });
});

// Don't use this 
// Fails intermittently 
// Instead delete each api after the test is finish.
Cypress.Commands.add('deleteAllApis', () => {
    cy.visit(`${Utils.getAppOrigin()}/publisher/apis`);
    cy.intercept('**/apis*').as('getApis');
    cy.wait('@getApis').then((interception) => {
        if (interception.response && interception.response.body && interception.response.body.count > 0) {
            cy.get('[data-testid="itest-id-deleteapi-icon-button"]', { timeout: 30000 });
            cy.get('[data-testid="itest-id-deleteapi-icon-button"]').each(($btn) => {
                cy.wrap($btn).click();
                cy.get('[data-testid="itest-id-deleteconf"]').click();
            })
        }
    })
});

Cypress.Commands.add('createAnAPI', (name, type = 'REST') => {
    const random_number = Math.floor(Date.now() / 1000);
    const randomName = `0sample_api_${random_number}`;
    cy.visit(`${Utils.getAppOrigin()}/publisher/apis`)
    cy.get('#itest-rest-api-create-menu', { timeout: 30000 });
    cy.get('#itest-rest-api-create-menu').click();
    cy.get('#itest-id-landing-rest-create-default').click()
    cy.get('#itest-id-apiname-input').type(name || randomName);
    cy.get('#itest-id-apicontext-input').click();
    cy.get('#itest-id-apicontext-input').type(`/sample_context_${random_number}`);
    cy.get('#itest-id-apiversion-input').click();
    cy.get('#itest-id-apiversion-input').type(`v${random_number}`);
    cy.get('#itest-id-apiendpoint-input').click();
    cy.get('#itest-id-apiendpoint-input').type(`https://apis.wso2.com/sample${random_number}`);
    cy.get('#itest-create-default-api-button').click();
    cy.get("#itest-api-name-version").contains(`sample_api_${random_number}`);
    cy.intercept('**/apis/**').as('apiGet');
    cy.wait('@apiGet', { timeout: 3000 }).then((res) => {
        const apiUUID = res.response.body.id;
        return { uuid: apiUUID, name: randomName };
    });

})

Cypress.Commands.add('createAPIByRestAPIDesign', (name = null, version = null, context = null) => {
    const random_number = Math.floor(Date.now() / 1000);

    const apiName = name ? name : `0sample_api_${random_number}`;
    const apiVersion = version ? version : `v${random_number}`;
    const apiContext = context ? context : `/sample_context_${random_number}`;
    cy.visit(`${Utils.getAppOrigin()}/publisher/apis`);
    cy.get('#itest-rest-api-create-menu', { timeout: 30000 });
    cy.get('#itest-rest-api-create-menu').click();
    cy.get('#itest-id-landing-rest-create-default').click();
    cy.get('#itest-id-apiname-input').type(apiName);
    cy.get('#itest-id-apicontext-input').click();
    cy.get('#itest-id-apicontext-input').type(apiContext);
    cy.get('#itest-id-apiversion-input').click();
    cy.get('#itest-id-apiversion-input').type(apiVersion);
    cy.get('#itest-id-apiendpoint-input').click();
    cy.get('#itest-id-apiendpoint-input').type(`https://apis.wso2.com/sample${random_number}`);
    cy.get('#itest-create-default-api-button').click();
    // There is a UI error in the console. We need to skip this so that the test will not fail.
    Cypress.on('uncaught:exception', (err, runnable) => {
        // returning false here prevents Cypress from
        // failing the test
        return false
    });
    cy.wait(500);
    cy.visit(`${Utils.getAppOrigin()}/publisher/apis/`, { timeout: 30000 });
    cy.get(`#${apiName}`).click();

    cy.get('#itest-api-name-version', { timeout: 30000 }).should('be.visible');
    cy.get('#itest-api-name-version').contains(apiVersion);
})

Cypress.Commands.add('createAndPublishAPIByRestAPIDesign', (name = null, version = null, context = null) => {
    const random_number = Math.floor(Date.now() / 1000);

    const apiName = name ? name : `0sample_api_${random_number}`;
    const apiVersion = version ? version : `v${random_number}`;
    const apiContext = context ? context : `/sample_context_${random_number}`;
    cy.visit(`${Utils.getAppOrigin()}/publisher/apis/create/rest`,{ timeout: 30000 });
    cy.get('#itest-id-apiname-input').type(apiName);
    cy.get('#itest-id-apicontext-input').click();
    cy.get('#itest-id-apicontext-input').type(apiContext);
    cy.get('#itest-id-apiversion-input').click();
    cy.get('#itest-id-apiversion-input').type(apiVersion);
    cy.get('#itest-id-apiendpoint-input').click();
    cy.get('#itest-id-apiendpoint-input').type(`https://apis.wso2.com/sample${random_number}`);
    cy.get('#itest-id-apicreatedefault-createnpublish').click();

    // Wait for the api to load
    cy.get('#itest-api-name-version', { timeout: 30000 }).should('be.visible');
    cy.get('#itest-api-name-version').contains(apiVersion);
})
  

Cypress.Commands.add('createLocalScope', (name, displayname='sample display name',description='sample description',roles=[]) => {

    cy.get('#name',{timeout:3000}).type(name,{force:true});
    cy.get('#displayName',{timeout: 30000 }).type(displayname);
    cy.get('#description',{timeout: 30000 }).type(description);
    cy.get('#name',{timeout:3000}).type(name);
    roles.forEach(role => {
        cy.get('#roles-input',{timeout: 30000 }).type(role+'\n');
    });
    cy.get('#scope-save-btn').click();
    
    cy.get('table').get('tbody').find("tr")
    .then((rows) => {
        var ele=null;
        rows.toArray().forEach((element) => {
            if (element.innerHTML.includes(name)) {
              ele=element;
            }
          });
          expect(ele.innerHTML).to.include(name);
    });

})

Cypress.Commands.add('addDocument', (name,summary,type,source) => {
    
    cy.get('[data-testid="add-document-btn"]').click();
    cy.get('#doc-name',{timeout: 30000}).type(name);
    cy.get('#doc-summary').click();
    cy.get('#doc-summary',{timeout: 30000}).type(summary);
    cy.contains('label',type).click();
    cy.contains('label',source).click();
    cy.get('#add-document-btn').scrollIntoView();
    cy.get('#add-document-btn').click();
    cy.get('#add-content-back-to-listing-btn').click();

    cy.get('table a').contains(name).should('be.visible');
})

Cypress.Commands.add('addComment', (comment) => {
    
    cy.get('[data-testid="new-comment-field"]',{timeout: 30000 }).type(comment);
    cy.get('#add-comment-btn').click();
    
    cy.contains('p',comment).should('exist');
})

Cypress.Commands.add('addBusinessInfo', (businessOwnerName,businessOwnerEmail,techOwnerName,techOwnerEmail) => {
    
    cy.get('#name').click({timeout: 30000 }).type(businessOwnerName);
    cy.get('#Email').click({timeout: 30000 }).type(businessOwnerEmail);
    cy.get('#TOname').click({timeout: 30000 }).type(techOwnerName);
    cy.get('#TOemail').click({timeout: 30000 }).type(techOwnerEmail);

    cy.get('#business-info-save').click();

    cy.get('#business-info-save').then(function () {
        cy.get('#name').should('have.value', businessOwnerName);
        cy.get('#Email').should('have.value', businessOwnerEmail);
        cy.get('#TOname').should('have.value', techOwnerName);
        cy.get('#TOemail').should('have.value', techOwnerEmail);
    });

})

/**
 * Creates a resource for a given http verb
 * Stuff with  more arguments.
 * @method createResource creates a resource for a given (one) httpverb
 * @param {string} ratelimitlevel  any of the following 2 : api | operation
 * @param {string} limitinglevel 10KPerMin | 20KOPerMin | 50KPerMin | Unlimited
 * @param {string} httpverb GET | POST | PUT | DELETE | PATCH | HEAD | OPTIONS
 * @param {string} uripattern
 * @param {string} description about the API
 * @param {string} summary about API
 * @param {boolean} security true | false
 * @param {string} scope name of the scope | null
 * @param {string} parametername
 * @param {string} parametertype   Query | Header | Cookie | Body | null
 * @param {string} datatype   Integer | Number | String | Boolean | null
 * @param {boolean} required  true | false
 */

Cypress.Commands.add('createResource', (ratelimitlevel, limitinglevel,httpverb,uripattern,description=null,summary=null,security=true,scope,parametername=null,parametertype=null,datatype=null,required=false) => {
    const uriId=httpverb.toLowerCase()+'\/'+uripattern;

    if(ratelimitlevel=="api"){
        cy.get('#api-rate-limiting-api-level').click();
        cy.get('#operation_throttling_policy').click();
        cy.contains('li',limitinglevel).click();
    }else{
        cy.get('#api-rate-limiting-operation-level').click();
    }
    cy.get('#add-operation-selection-dropdown').click();
    cy.contains('li',httpverb).click();
    
    //colapse dropdown
    cy.get('#menu-verbs').click();
    
    cy.get('#operation-target').type(uripattern);
    cy.get('#add-operation-button').click();
    
    cy.get(`[id="${uriId}"]`, { timeout: 30000 }).click();

    
    if(description!= null){
        cy.get(`[data-testid="description-${uriId}"]`, { timeout: 30000 }).click();
        cy.get(`[data-testid="description-${uriId}"]`).type(description);

    }
    if(summary!=null){
        cy.get(`[data-testid="summary-${uriId}"]`, { timeout: 30000 }).click();
        cy.get(`[data-testid="summary-${uriId}"]`).type(summary);
    }
    if(security==false){
        cy.get(`[data-testid="security-${uriId}"]`).click();
    }else{
        cy.get(`[id="${uriId}-operation-scope-select"]`, { timeout: 30000 }).click();
        cy.contains('li',scope).click();
        cy.get('#menu-').click();
    }

    if(ratelimitlevel=="operation"){
        cy.get(`[id="${uriId}-operation_throttling_policy-label"]`).click();
        cy.contains('li',limitinglevel).click();
    }


    //parameters
    if(parametertype!=null){
        cy.get(`[id="param-${uriId}"]`).click();
        cy.contains('li',parametertype).click();
        cy.get(`[id="name-${uriId}"]`).type(parametername);
        cy.get(`[id="data-${uriId}"]`).click();
        cy.get(`[id="data-${uriId}/${datatype.toLowerCase()}"]`).click();
        if(required){
            cy.get(`[data-testid="required-${uriId}"]`).click();
        }
        cy.get(`[id="param-${uriId}-add-btn"]`).click();
        cy.contains('td',parametername).should('exist');
    }
    cy.get('#resources-save-operations', { timeout: 30000 }).click();

})


Cypress.Commands.add('addProperty',(name,value,ifSendToDevPortal)=>{
    cy.get('#add-new-property',{ timeout: 30000 }).click();
    cy.get('#property-name').type(name);
    cy.get('#property-value').type(value);

    if(ifSendToDevPortal)
        cy.contains('label','Show in devportal').click();
    cy.get('#properties-add-btn').should('exist');
    cy.get('#properties-add-btn').click();

    //verifying that the property added
    cy.get('tr').contains('td',name);

    //save the property
    cy.get('[data-testid="custom-select-save-button"]').click();
    cy.timeout(3000);
})

Cypress.Commands.add('createAPIWithoutEndpoint', (name, type = 'REST') => {
    const random_number = Math.floor(Date.now() / 1000);
    const randomName = `0sample_api_${random_number}`;
    cy.visit(`${Utils.getAppOrigin()}/publisher/apis`)
    cy.get('#itest-rest-api-create-menu', { timeout: 30000 });
    cy.get('#itest-rest-api-create-menu').click();
    cy.get('#itest-id-landing-rest-create-default').click();
    cy.get('#itest-id-apiname-input').type(name || randomName);
    cy.get('#itest-id-apicontext-input').click();
    cy.get('#itest-id-apicontext-input').type(`/sample_context_${random_number}`);
    cy.get('#itest-id-apiversion-input').click();
    cy.get('#itest-id-apiversion-input').type(`v${random_number}`);
    cy.get('#itest-id-apiendpoint-input').click();
    cy.get('#itest-create-default-api-button').click();
    cy.wait(500);
    cy.visit(`${Utils.getAppOrigin()}/publisher/apis/`);
    cy.get(`#sample_api_${random_number}`).click();


    cy.get('#itest-api-name-version', { timeout: 30000 }).should('be.visible');
    cy.get('#itest-api-name-version').contains(`v${random_number}`);
})

Cypress.Commands.add('createApp', (appName, appDescription) => {
    cy.visit(`${Utils.getAppOrigin()}/devportal/applications/create?tenant=carbon.super`);
    cy.intercept('**/application-attributes').as('attrGet');
    cy.wait('@attrGet', { timeout: 300000 }).then(() => {
        // Filling the form
        cy.get('#application-name').click();
        cy.get('#application-name').type(appName);
        cy.get('#application-description').click();
        cy.get('#application-description').type('{backspace}');
        cy.get('#application-description').type(appDescription);
        cy.get('#itest-application-create-save').click();

        // Checking the app name exists in the overview page.
        cy.url().should('contain', '/overview');
        cy.get('#itest-info-bar-application-name').contains(appName).should('exist');
    })
});

Cypress.Commands.add('deleteApp', (appName) => {
    cy.visit(`${Utils.getAppOrigin()}/devportal/applications?tenant=carbon.super`);
    cy.intercept('**/applications**').as('appGet');
    cy.wait('@appGet', { timeout: 300000 }).then(() => {
        cy.get(`#delete-${appName}-btn`, { timeout: 30000 });
        cy.get(`#delete-${appName}-btn`).click();
        cy.get(`#itest-confirm-application-delete`).click();
    })
});

Cypress.Commands.add('createAndPublishApi', (apiName = null) => {
    cy.visit(`${Utils.getAppOrigin()}/publisher/apis`);
    // select the option from the menu item
    cy.get('#itest-rest-api-create-menu').click();
    cy.get('#itest-id-landing-upload-oas').click();
    cy.get('#open-api-file-select-radio').click();

    // upload the swagger
    cy.get('#browse-to-upload-btn').then(function () {
        const filepath = 'api_artifacts/swagger_2.0.json'
        cy.get('input[type="file"]').attachFile(filepath)
    });

    // go to the next step
    cy.get('#open-api-create-next-btn').click();

    // Fill the second step form
    if (apiName) {
        const random_number = Math.floor(Date.now() / 1000);

        cy.get('#itest-id-apiname-input').clear().type(apiName);
        cy.get('#itest-id-apicontext-input').click();
        cy.get('#itest-id-apicontext-input').clear().type(`/api_${random_number}`);
        cy.get('#itest-id-apiendpoint-input').click().type('https://petstore.swagger.io');
    }

    cy.get('#open-api-create-btn').click();

    //select subscription tiers
    cy.get('#itest-api-details-portal-config-acc', { timeout: 30000 }).click();
    cy.get('#left-menu-itemsubscriptions').click();
    cy.get('[data-testid="policy-checkbox-silver"]').click();
    cy.get('[data-testid="policy-checkbox-unlimited"]').click();
    cy.get('#subscriptions-save-btn').click();

    // deploy
    cy.get('#left-menu-itemdeployments').click();
    cy.get('#left-menu-itemdeployments').then(() => {
        cy.wait(1000);
        cy.get('#deploy-btn').click();
        cy.get('#undeploy-btn').should('exist');
    })

    // publish
    cy.get('#left-menu-itemlifecycle').click();
    cy.wait(2000);
    cy.get('[data-testid="Publish-btn"]').click();
    cy.get('button[data-testid="Demote to Created-btn"]').should('exist');

})

Cypress.Commands.add('logoutFromDevportal', (referer = '/devportal/apis') => {
    cy.visit(`${Utils.getAppOrigin()}/devportal/apis?tenant=carbon.super`);
    cy.wait(2000);
    cy.get('#userToggleButton').click();
    cy.get('#logout-link').click();
    cy.url().should('contain', '/devportal/logout');
    cy.url().should('contain', referer);
})

Cypress.Commands.add('logoutFromPublisher', () => {
    cy.visit(`${Utils.getAppOrigin()}/publisher/services/logout`);
})

