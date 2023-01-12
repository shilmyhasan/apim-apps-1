/*
 *  Copyright (c) 2019-2023, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import 'swagger-ui-react/swagger-ui.css';
import SwaggerUILib from 'swagger-ui-react';
import CustomPadLock from './CustomPadLock';
import Configurations from 'Config';

const disableAuthorizeAndInfoPlugin = function (spec) {
    if (Configurations.swaggerValidationBehaviour === 'default'
        || Configurations.swaggerValidationBehaviour === null) {
        return {
            wrapComponents: {
                info: () => () => null,
                authorizeBtn: () => () => null,
                authorizeOperationBtn: () => () => null,
                OperationSummary: (original) => (props) => {
                    return <CustomPadLock BaseLayout={original} oldProps={props} spec={spec} />;
                },
            },
        };
    } else {
        return {
            wrapComponents: {
                info: () => () => null,
                authorizeBtn: () => () => null,
                authorizeOperationBtn: () => () => null,
                OperationSummary: (original) => (props) => {
                    return <CustomPadLock BaseLayout={original} oldProps={props} spec={spec} />;
                },
                errSelectors: () => () => null,
                errors: () => () => null,
            },
        };
    }
};

/**
 *
 * @class SwaggerUI
 * @extends {Component}
 */
const SwaggerUI = (props) => {
    const {
        spec, accessTokenProvider, authorizationHeader, api, securitySchemeType,
    } = props;

    const componentProps = {
        spec,
        validatorUrl: null,
        defaultModelsExpandDepth: -1,
        docExpansion: 'list',
        requestInterceptor: (req) => {
            const { url } = req;
            const { context } = api;
            const patternToCheck = `${context}/*`;
            if (authorizationHeader === 'apikey') {
                req.headers[authorizationHeader] = accessTokenProvider();
            } else if (securitySchemeType === 'BASIC') {
                req.headers[authorizationHeader] = 'Basic ' + accessTokenProvider();
            } else if (securitySchemeType === 'TEST') {
                req.headers[authorizationHeader] = accessTokenProvider();
            } else if (api.advertiseInfo && api.advertiseInfo.advertised && authorizationHeader !== '') {
                req.headers[authorizationHeader] = accessTokenProvider();
            } else {
                req.headers[authorizationHeader] = 'Bearer ' + accessTokenProvider();
            }
            if (url.endsWith(patternToCheck)) {
                req.url = url.substring(0, url.length - 2);
            } else if (url.includes(patternToCheck + '?')) { // Check for query parameters.
                const splitTokens = url.split('/*?');
                req.url = splitTokens.length > 1 ? splitTokens[0] + '?' + splitTokens[1] : splitTokens[0];
            }
            return req;
        },
        defaultModelExpandDepth: -1,
        plugins: [disableAuthorizeAndInfoPlugin(spec)],
    };
    const [render, setRender] = useState();
    const [layoutRender, setlayoutRender] = useState();

    useEffect(() => {
        if (!layoutRender) return;
        const len = document.querySelectorAll('.opblock .authorization__btn');
        let i = 0;
        for (; i < len.length; i++) {
            len[i].remove();
        }
        document.querySelector('.schemes select').setAttribute('id', 'schemes');
        document.getElementById('unlocked').parentNode.parentNode.remove();
        setlayoutRender(false);
    }, [layoutRender]);

    useEffect(() => {
        setlayoutRender(true);
    }, [render]);

    return (
        <>
            <SwaggerUILib {...componentProps} />
            {setRender}
        </>
    );
};

SwaggerUI.propTypes = {
    accessTokenProvider: PropTypes.func.isRequired,
    authorizationHeader: PropTypes.string.isRequired,
    api: PropTypes.shape({
        context: PropTypes.string.isRequired,
    }).isRequired,
    spec: PropTypes.string.isRequired,
};
export default SwaggerUI;
