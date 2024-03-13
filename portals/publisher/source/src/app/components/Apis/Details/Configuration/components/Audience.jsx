/*
 * Copyright (c) 2024, WSO2 LLC. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
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

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import ChipInput from 'material-ui-chip-input';
import Grid from '@material-ui/core/Grid';
import { FormattedMessage } from 'react-intl';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import { ALL_AUDIENCES_ALLOWED } from './APISecurity/components/apiSecurityConstants';

const useStyles = makeStyles((theme) => ({
    actionSpace: {
        marginLeft: theme.spacing(20),
        marginTop: '-7px',
        marginBottom: '-7px',
    },
    subHeading: {
        fontSize: '1rem',
        fontWeight: 400,
        margin: 0,
        display: 'inline-flex',
        lineHeight: 1.5,
    },
    container: {
        marginBottom: 8,
    },
}));

/**
 *
 * Api Audience Validation
 * @export
 * @param {*} props
 * @returns
 */
export default function Audience(props) {
    const {
        configDispatcher,
        api: { audiences },
    } = props;
    const [isAudValidationEnabled, setAudValidationEnabled] = useState(audiences.length !== 0 &&
        !(audiences.includes(ALL_AUDIENCES_ALLOWED)));
    const [audienceValues, setAudienceValues] = useState(Array.isArray(audiences) ?
        audiences.filter(value => value !== ALL_AUDIENCES_ALLOWED) : []);
    const classes = useStyles();
    return (
        <>
            <Grid className={classes.container}>
                <Grid container className={classes.container} alignItems='center'>
                    <Grid item>
                        <Typography className={classes.subHeading} variant='h6' component='h4'>
                            <FormattedMessage
                                id='Apis.Details.Configuration.components.Audience.Validation.Title'
                                defaultMessage='Audience Validation'
                            />
                        </Typography>
                    </Grid>
                    <Grid item>
                        <FormControlLabel
                            className={classes.actionSpace}
                            control={(
                                <Switch
                                    checked={isAudValidationEnabled}
                                    onChange={({ target: { checked } }) => {
                                        setAudValidationEnabled(checked);
                                        configDispatcher({
                                            action: 'audienceValidationEnabled',
                                            value: checked,
                                        });
                                        if (checked){
                                            configDispatcher({
                                                action: 'audienceAllowed',
                                                value: [...audienceValues],
                                            });
                                        }
                                    }}
                                    color='primary'
                                    inputProps={{
                                        'aria-label': 'AudienceValidation',
                                    }}
                                />
                            )}
                        />
                    </Grid>
                </Grid>
                { isAudValidationEnabled && 
                    <Grid container>
                        <Grid item md={12}>
                            <Grid container>
                                <Grid item md={12}>
                                    <Typography variant='subtitle1'>
                                        <FormattedMessage
                                            id='Apis.Details.Configuration.components.Audience.Validation.values'
                                            defaultMessage='Allowed Audience'
                                        />
                                    </Typography>
                                </Grid>
                                <Grid item md={12}>
                                    <ChipInput
                                        style={{ marginBottom: 40, display: 'flex' }}
                                        value={audienceValues}
                                        helperText={(
                                            <FormattedMessage
                                                id={
                                                    'Apis.Details.Configuration.components'
                                                    + '.Audience.Validation.helper'
                                                }
                                                defaultMessage={
                                                    'Press `Enter` after typing the audience value,'
                                                    + ' to add a new audience'
                                                }
                                            />
                                        )}
                                        onAdd={(newValue) => {
                                            let audValue = [...audienceValues,
                                                newValue];
                                            if (
                                                audienceValues
                                                    .find((aud) => aud === newValue)
                                            ) {
                                                audValue = [...audienceValues];
                                            }
                                            setAudienceValues(audValue);
                                            configDispatcher({
                                                action: 'audienceAllowed',
                                                value: audValue,
                                            });
                                        }}
                                        onDelete={(deletedValue) => {
                                            const audValue = audienceValues
                                                .filter((value) => value !== deletedValue);
                                            setAudienceValues(audValue);
                                            configDispatcher({
                                                action: 'audienceAllowed',
                                                value: audValue,
                                            });
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                }
            </Grid>
        </>
    );
}

Audience.propTypes = {
    api: PropTypes.shape({}).isRequired,
    configDispatcher: PropTypes.func.isRequired,
};
