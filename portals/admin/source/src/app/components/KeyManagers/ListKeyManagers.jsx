/*
 * Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
import API from 'AppData/api';
import { useIntl, FormattedMessage } from 'react-intl';
import Typography from '@material-ui/core/Typography';
import Delete from 'AppComponents/KeyManagers/DeleteKeyManager';
import { Link as RouterLink, useHistory } from 'react-router-dom';
import Alert from 'AppComponents/Shared/Alert';
import Switch from '@material-ui/core/Switch';
import Button from '@material-ui/core/Button';
import {
    Chip, ButtonGroup, ClickAwayListener, MenuItem, MenuList, Popper, Paper,
} from '@material-ui/core';
import { useAppContext } from 'AppComponents/Shared/AppContext';
import ContentBase from 'AppComponents/AdminPages/Addons/ContentBase';
import Toolbar from '@material-ui/core/Toolbar';
import Grid from '@material-ui/core/Grid';
import SearchIcon from '@material-ui/icons/Search';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import RefreshIcon from '@material-ui/icons/Refresh';
import AppBar from '@material-ui/core/AppBar';
import { makeStyles } from '@material-ui/core/styles';
import MUIDataTable from 'mui-datatables';
import EditIcon from '@material-ui/icons/Edit';
import InlineProgress from 'AppComponents/AdminPages/Addons/InlineProgress';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';

const useStyles = makeStyles((theme) => ({
    searchBar: {
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
    },
    searchInput: {
        fontSize: theme.typography.fontSize,
    },
    block: {
        display: 'block',
    },
    contentWrapper: {
        margin: '40px 16px',
    },
    button: {
        borderColor: 'rgba(255, 255, 255, 0.7)',
    },
    tableCellWrapper: {
        '& td': {
            'word-break': 'break-all',
            'white-space': 'normal',
        },
    },
}));

const addButtonLabels = ['local', 'global'];

function localAPICall() {
    return new API()
        .getKeyManagersList()
        .then((result) => {
            const resultList = result.body.list;
            resultList.forEach((item) => {
                if (item.tokenType === 'DIRECT') {
                    // eslint-disable-next-line no-param-reassign
                    item.tokenType = <Chip variant='outlined' color='primary' size='small' label='Direct' />;
                } else if (item.tokenType === 'BOTH') {
                    // eslint-disable-next-line no-param-reassign
                    item.tokenType = (
                        <div>
                            <Chip variant='outlined' color='primary' size='small' label='Direct' />
                            <Chip variant='outlined' color='primary' size='small' label='Exchange' />
                        </div>
                    );
                } else {
                    // eslint-disable-next-line no-param-reassign
                    item.tokenType = <Chip variant='outlined' color='primary' size='small' label='Exchange' />;
                }
            });
            return resultList;
        })
        .catch((error) => {
            throw error;
        });
}

function globalAPICall() {
    return new API()
        .getGlobalKeyManagersList()
        .then((result) => {
            return result.body.list;
        })
        .catch((error) => {
            throw error;
        });
}

/**
 * Render a list
 * @returns {JSX} Header AppBar components.
 */
export default function ListKeyManagers() {
    const { isSuperTenant, user: { _scopes } } = useAppContext();
    const isSuperAdmin = isSuperTenant && _scopes.includes('apim:admin_settings');
    // eslint-disable-next-line no-unused-vars
    const [saving, setSaving] = useState(false);
    const intl = useIntl();
    const classes = useStyles();
    const [data, setData] = useState(null);
    const [globalKMs, setGlobalKMs] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [error, setError] = useState(null);
    const editComponentProps = {};
    const history = useHistory();
    // for split buttons
    const [open, setOpen] = useState(false);
    const anchorRef = React.useRef(null);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const setKeyManagerState = (localKmList, globalKmList) => {
        const localKMArray = localKmList || [];
        const globalKMArray = globalKmList || [];
        setData([...localKMArray, ...globalKMArray]);
        setGlobalKMs(globalKMArray);
    };

    const fetchData = () => {
        // Fetch data from backend when an apiCall is provided
        setData(null);
        let localKmList;
        let globalKmList;

        if (localAPICall) {
            localAPICall().then((result) => {
                if (result) {
                    localKmList = result;
                    if (globalKmList !== undefined) {
                        setKeyManagerState(result, globalKmList);
                    }
                    setError(null);
                } else {
                    setError(intl.formatMessage({
                        id: 'AdminPages.Addons.ListBase.noDataError',
                        defaultMessage: 'Error while retrieving data.',
                    }));
                }
            })
                .catch((e) => {
                    setError(e.message);
                });
        }

        if (globalAPICall) {
            globalAPICall().then((result) => {
                if (result) {
                    globalKmList = result;
                    if (localKmList) {
                        setKeyManagerState(localKmList, result);
                    }
                    setError(null);
                } else {
                    setError(intl.formatMessage({
                        id: 'AdminPages.Addons.ListBase.noDataError',
                        defaultMessage: 'Error while retrieving data.',
                    }));
                }
            })
                .catch((e) => {
                    setError(e.message);
                });
        }
        setSearchText('');
    };

    const addedActions = [
        (props) => {
            const { rowData, updateList } = props;
            const updateSomething = () => {
                const restApi = new API();
                const kmName = rowData[0];
                const kmId = rowData[5];
                const isGlobal = rowData[6];
                (isGlobal ? restApi.globalKeyManagerGet(kmId) : restApi.keyManagerGet(kmId)).then((result) => {
                    let editState;
                    if (result.body.name !== null) {
                        editState = {
                            ...result.body,
                        };
                    }
                    editState.enabled = !editState.enabled;
                    (isGlobal
                        ? restApi.updateGlobalKeyManager(kmId, editState) : restApi.updateKeyManager(kmId, editState))
                        .then(() => {
                            Alert.success(` ${kmName} ${intl.formatMessage({
                                id: 'KeyManagers.ListKeyManagers.edit.success',
                                defaultMessage: ' Key Manager updated successfully.',
                            })}`);
                            setSaving(false);
                            updateList();
                        }).catch((e) => {
                            const { response } = e;
                            if (response.body) {
                                Alert.error(response.body.description);
                            }
                            setSaving(false);
                            updateList();
                        });
                });
            };
            const kmEnabled = rowData[4];
            return (
                <Switch
                    disabled={rowData[5] ? !isSuperAdmin : false}
                    checked={kmEnabled}
                    onChange={updateSomething}
                    color='primary'
                    size='small'
                />
            );
        },
    ];

    const columns = [
        {
            name: 'name',
            label: intl.formatMessage({
                id: 'KeyManagers.ListKeyManagers.table.header.label.name',
                defaultMessage: 'Name',
            }),
            options: {
                customBodyRender: (value, tableMeta) => {
                    if (typeof tableMeta.rowData === 'object') {
                        const artifactId = tableMeta.rowData[5];
                        return (
                            <RouterLink
                                to={{
                                    pathname: `/settings/key-managers/${artifactId}`,
                                    state: { isGlobal: tableMeta.rowData[6] },
                                }}
                            >
                                {value}
                                {' '}
                                {tableMeta.rowData[6] && (
                                    <Chip
                                        size='small'
                                        label='Global'
                                        color='primary'
                                        style={{ marginTop: -4, marginLeft: 10 }}
                                    />
                                )}
                            </RouterLink>
                        );
                    } else {
                        return <div />;
                    }
                },
            },
        },
        {
            name: 'description',
            label: intl.formatMessage({
                id: 'KeyManagers.ListKeyManagers.table.header.label.description',
                defaultMessage: 'Description',
            }),
            options: {
                sort: false,
            },
        },
        {
            name: 'tokenType',
            label: intl.formatMessage({
                id: 'KeyManagers.ListKeyManagers.table.header.label.tokenType',
                defaultMessage: 'Type',
            }),
            options: {
                sort: false,
            },
        },
        {
            name: 'type',
            label: intl.formatMessage({
                id: 'KeyManagers.ListKeyManagers.table.header.label.provider',
                defaultMessage: 'Provider',
            }),
            options: {
                sort: false,
            },
        },
        { name: 'enabled', options: { display: false } },
        { name: 'id', options: { display: false } },
        { name: 'isGlobal', options: { display: false } },
        {
            name: '',
            label: 'Actions',
            options: {
                filter: false,
                sort: false,
                customBodyRender: (value, tableMeta) => {
                    const dataRow = data[tableMeta.rowIndex];
                    const itemName = (typeof tableMeta.rowData === 'object') ? tableMeta.rowData[0] : '';
                    if (editComponentProps && editComponentProps.routeTo) {
                        if (typeof tableMeta.rowData === 'object') {
                            const artifactId = tableMeta.rowData[tableMeta.rowData.length - 2];
                            return (
                                <div data-testid={`${itemName}-actions`}>
                                    <RouterLink to={editComponentProps.routeTo + artifactId}>
                                        <IconButton color='primary' component='span'>
                                            <EditIcon />
                                        </IconButton>
                                    </RouterLink>
                                    <Delete
                                        dataRow={dataRow}
                                        updateList={fetchData}
                                        isDisabled={dataRow.isGlobal && !isSuperAdmin}
                                    />
                                    {addedActions && addedActions.map((action) => {
                                        const AddedComponent = action;
                                        return (
                                            <AddedComponent rowData={tableMeta.rowData} updateList={fetchData} />
                                        );
                                    })}
                                </div>
                            );
                        } else {
                            return (<div />);
                        }
                    }
                    return (
                        <div data-testid={`${itemName}-actions`}>
                            <Delete
                                dataRow={dataRow}
                                updateList={fetchData}
                                isDisabled={dataRow.isGlobal && !isSuperAdmin}
                            />
                            {addedActions && addedActions.map((action) => {
                                const AddedComponent = action;
                                return (
                                    <AddedComponent rowData={tableMeta.rowData} updateList={fetchData} />
                                );
                            })}
                        </div>

                    );
                },
                setCellProps: () => {
                    return {
                        style: { width: 200 },
                    };
                },
            },
        },
    ];

    const pageProps = {
        pageStyle: 'paperLess',
        title: intl.formatMessage({
            id: 'KeyManagers.ListKeyManagers.List.title',
            defaultMessage: 'Key Managers',
        }),
    };

    const onAddButtonClick = (index) => {
        if (index === 1) {
            history.push({
                pathname: '/settings/key-managers/create',
                state: { isGlobal: true },
            });
        } else {
            history.push('/settings/key-managers/create');
        }
    };

    const getAddKeyManagerButtonLabel = (label) => {
        if (label === 'global') {
            return intl.formatMessage({
                id: 'KeyManagers.ListKeyManagers.addGlobalKeyManager',
                defaultMessage: 'Add Global Key Manager',
            });
        }
        return intl.formatMessage({
            id: 'KeyManagers.ListKeyManagers.addButtonProps.triggerButtonText',
            defaultMessage: 'Add Key Manager',
        });
    };

    const addButtonOverride = () => {
        if (globalKMs && globalKMs.length > 0) {
            return (
                <Button variant='contained' color='primary' size='small' onClick={() => onAddButtonClick(0)}>
                    {getAddKeyManagerButtonLabel('local')}
                </Button>
            );
        }
        return (
            <>
                <ButtonGroup variant='contained' color='primary' ref={anchorRef} aria-label='split button'>
                    <Button size='small' onClick={() => onAddButtonClick(selectedIndex)}>
                        {getAddKeyManagerButtonLabel(selectedIndex === 1 ? 'global' : 'local')}
                    </Button>
                    <Button
                        color='primary'
                        size='small'
                        aria-controls={open ? 'split-button-menu' : undefined}
                        aria-expanded={open ? 'true' : undefined}
                        aria-label='select key store type'
                        aria-haspopup='menu'
                        data-testid='add-km-dropdown'
                        onClick={() => {
                            setOpen((prevOpen) => !prevOpen);
                        }}
                    >
                        <ArrowDropDownIcon />
                    </Button>
                </ButtonGroup>
                <Popper open={open} anchorEl={anchorRef.current} style={{ zIndex: 99999999 }}>
                    <Paper>
                        <ClickAwayListener onClickAway={(event) => {
                            if (anchorRef.current && anchorRef.current.contains(event.target)) {
                                return;
                            }
                            setOpen(false);
                        }}
                        >
                            <MenuList id='split-button-menu'>
                                {addButtonLabels.map((label, index) => (
                                    <MenuItem
                                        key={label}
                                        style={{ fontSize: '0.7rem' }}
                                        disabled={index === 2}
                                        selected={index === selectedIndex}
                                        onClick={() => {
                                            setSelectedIndex(index);
                                            setOpen(false);
                                        }}
                                    >
                                        {getAddKeyManagerButtonLabel(label)}
                                    </MenuItem>
                                ))}
                            </MenuList>
                        </ClickAwayListener>
                    </Paper>
                </Popper>
            </>
        );
    };

    const emptyBoxProps = {
        content: (
            <Typography
                variant='body2'
                color='textSecondary'
                component='p'
                id='AdminPages.KeyManagers.List.empty.content.keymanagers.body'
            >
                <FormattedMessage
                    id='AdminPages.KeyManagers.List.empty.content.keymanagers'
                    defaultMessage='It is possible to register an OAuth Provider.'
                />
            </Typography>
        ),
        title: (
            <Typography
                gutterBottom
                variant='h5'
                component='h2'
                id='KeyManagers.ListKeyManagers.empty.header'
            >
                <FormattedMessage
                    id='KeyManagers.ListKeyManagers.empty.title'
                    defaultMessage='Key Managers'
                />
            </Typography>
        ),
    };

    useEffect(() => {
        fetchData();
    }, []);

    const sortBy = (field, reverse, primer) => {
        const key = primer
            ? (x) => {
                return primer(x[field]);
            }
            : (x) => {
                return x[field];
            };
        // eslint-disable-next-line no-param-reassign
        reverse = !reverse ? 1 : -1;

        return (a, b) => {
            const aValue = key(a);
            const bValue = key(b);
            return reverse * ((aValue > bValue) - (bValue > aValue));
        };
    };

    const onColumnSortChange = (changedColumn, direction) => {
        const sorted = [...data].sort(sortBy(changedColumn, direction === 'descending'));
        setData(sorted);
    };

    const options = {
        filterType: 'checkbox',
        selectableRows: 'none',
        filter: false,
        search: false,
        print: false,
        download: false,
        viewColumns: false,
        customToolbar: null,
        responsive: 'stacked',
        searchText,
        onColumnSortChange,
    };

    const filterData = (event) => {
        setSearchText(event.target.value);
    };

    // If no apiCall is provided OR,
    // retrieved data is empty, display an information card.
    if ((!localAPICall && !globalAPICall) || (data && data.length === 0)) {
        return (
            <ContentBase
                {...pageProps}
                pageStyle='small'
            >
                <Card className={classes.root}>
                    <CardContent>
                        {emptyBoxProps.title}
                        {emptyBoxProps.content}
                    </CardContent>
                    <CardActions>
                        {addButtonOverride()}
                    </CardActions>
                </Card>
            </ContentBase>
        );
    }
    // If apiCall is provided and data is not retrieved yet, display progress component
    if (!error && (localAPICall && globalAPICall) && !data) {
        return (
            <ContentBase pageStyle='paperLess'>
                <InlineProgress />
            </ContentBase>

        );
    }
    if (error) {
        return (
            <ContentBase {...pageProps}>
                <Alert severity='error'>{error}</Alert>
            </ContentBase>
        );
    }

    return (
        <>
            <ContentBase {... pageProps}>
                <div>
                    <AppBar className={classes.searchBar} position='static' color='default' elevation={0}>
                        <Toolbar>
                            <Grid container spacing={2} alignItems='center'>
                                <Grid item>
                                    <SearchIcon className={classes.block} color='inherit' />
                                </Grid>
                                <Grid item xs>
                                    <TextField
                                        fullWidth
                                        placeholder=''
                                        InputProps={{
                                            disableUnderline: true,
                                            className: classes.searchInput,
                                        }}
                                        onChange={filterData}
                                        value={searchText}
                                    />
                                </Grid>
                                <Grid item>
                                    {addButtonOverride()}
                                    <Tooltip title={(
                                        <FormattedMessage
                                            id='AdminPages.Addons.ListBase.reload'
                                            defaultMessage='Reload'
                                        />
                                    )}
                                    >
                                        <IconButton onClick={fetchData}>
                                            <RefreshIcon className={classes.block} color='inherit' />
                                        </IconButton>
                                    </Tooltip>
                                </Grid>
                            </Grid>
                        </Toolbar>
                    </AppBar>
                    <div className={classes.tableCellWrapper}>
                        {data && data.length > 0 && (
                            <MUIDataTable
                                title={null}
                                data={data}
                                columns={columns}
                                options={options}
                            />
                        )}
                    </div>
                    {data && data.length === 0 && (
                        <div className={classes.contentWrapper}>
                            <Typography color='textSecondary' align='center'>
                                <FormattedMessage
                                    id='AdminPages.Addons.ListBase.nodata.message'
                                    defaultMessage='No items yet'
                                />
                            </Typography>
                        </div>
                    )}
                </div>
            </ContentBase>
        </>
    );
}
