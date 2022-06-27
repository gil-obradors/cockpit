/*

 * This file is part of Cockpit.
 *
 * Copyright (C) 2021 Red Hat, Inc.
 *
 * Cockpit is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * Cockpit is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Cockpit; If not, see <http://www.gnu.org/licenses/>.
 */

import React, { useState, useContext } from 'react';
import cockpit from 'cockpit';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionToggle, Checkbox,
    FormGroup, FormSelect, FormSelectOption,
    Grid,
    TextInput
} from '@patternfly/react-core';

import { NetworkModal, dialogSave } from './dialogs-common.jsx';
import { ModelContext } from './model-context.jsx';
import { useDialogs } from "dialogs.jsx";

import { v4 as uuidv4 } from 'uuid';
import {
    is_interface_connection,
    is_interesting_interface,
} from './interfaces.js';

const _ = cockpit.gettext;

export const PppoeDialog = ({ connection, dev, settings }) => {
    const Dialogs = useDialogs();
    const idPrefix = "network-pppoe-settings";
    const model = useContext(ModelContext);
    const parentChoices = [];
    model.list_interfaces().forEach(iface => {
        if (!is_interface_connection(iface, connection) &&
            is_interesting_interface(iface))
            parentChoices.push(iface.Name);
    });

    const [parent, setParent] = useState(settings.pppoe.parent || parentChoices[0]);
    const [dialogError, setDialogError] = useState(undefined);
    const [iface, setIface] = useState(settings.connection.interface_name);
    const [ppp, setPpp] = useState(settings.ppp);
    const [pppoe, setPppoe] = useState(settings.pppoe);

    const onSubmit = (ev) => {
        const createSettingsObj = () => ({
            ...settings,
            connection: {
                ...settings.connection,
                id: iface,
                interface_name: iface,
            },
            ppp: {
                ...settings.ppp,
                ...ppp,
            },
            pppoe:{
                ...settings.pppoe,
                ...pppoe,
                parent: parent,
            }
        });
        console.log(createSettingsObj());
        dialogSave({
            model,
            dev,
            connection,
            settings: createSettingsObj(),
            setDialogError,
            onClose: Dialogs.close,
        });

        // Prevent dialog from closing because of <form> onsubmit event
        if (event)
            event.preventDefault();

        return false;
    };
    const [expanded, setExpanded] = useState('ex-toggle2');

    const onToggle = (id) => {
        if (id === expanded) {
            setExpanded('');
        } else {
            setExpanded(id);
        }
    };
    return (
        <NetworkModal dialogError={dialogError}
                      idPrefix={idPrefix}
                      onSubmit={onSubmit}
                      title={_("PPPoE settings")}
                      isFormHorizontal={false}
        >
            <Grid hasGutter>
                {/* <Name idPrefix={idPrefix} iface={iface} setIface={setIface}/> */}
                <FormGroup className="pf-m-6-col-on-sm" fieldId={idPrefix + "-interface-name-input"} label={_("Name")}>
                    <TextInput id={idPrefix + "-interface-name-input"} value={iface} onChange={setIface} />
                </FormGroup>

                <FormGroup className="pf-m-6-col-on-sm" fieldId={idPrefix + "-parent-select"} label={_("Parent")}>
                    <FormSelect id={idPrefix + "-parent-select"} onChange={value => {
                        setParent(value);
                        // if (iface == (parent + "." + vlanId))
                        //     setIface(value + "." + vlanId);
                    }}
                                value={parent}>
                        {parentChoices.map(choice => <FormSelectOption value={choice} label={choice} key={choice} />)}
                    </FormSelect>
                </FormGroup>

                <FormGroup className="pf-m-6-col-on-sm" fieldId={idPrefix + "-username-input"} label={_("Username")}>
                    <TextInput id={idPrefix + "-username-input"} value={pppoe.username} onChange={
                        value => setPppoe({ ...pppoe, username: value })} />
                </FormGroup>

                <FormGroup className="pf-m-6-col-on-sm" fieldId={idPrefix + "-password-input"} label={_("Password")}>
                    <TextInput id={idPrefix + "-password-input"} value={pppoe.password} onChange={
                        value => setPppoe({ ...pppoe, password: value })} />
                </FormGroup>
            </Grid>
            <Accordion asDefinitionList>
                <AccordionItem>
                    <AccordionToggle
                        onClick={() => {
                            onToggle('ex-toggle1');
                        }}
                        isExpanded={expanded === 'ex-toggle1'}
                        id="ex-toggle1"
                    >
                        Advanced configuration
                    </AccordionToggle>
                    <AccordionContent id="ex-expand1" isHidden={expanded !== 'ex-toggle1'}>
                        <Grid hasGutter>
                            <FormGroup fieldId={idPrefix + "-service-input"} label={_("Service name")}>
                                <TextInput id={idPrefix + "-service-input"} value={pppoe.service} onChange={
                                    value => setPppoe({ ...pppoe, service: value })} />
                            </FormGroup>

                            <FormGroup className="pf-m-4-col-on-sm" fieldId={idPrefix + "-ppp-lcpef-input"}
                                       label={_("LCP echo failure")}>
                                <TextInput id={idPrefix + "-ppp-lcpef-input"} value={ppp.lcp_echo_failure} onChange={
                                    value => setPpp({ ...ppp, lcp_echo_failure: value })} />
                            </FormGroup>

                            <FormGroup className="pf-m-4-col-on-sm" label="Compresion" isStack hasNoPaddingTop>
                                <Checkbox label={_("BSD compresion")} id={idPrefix + "-compresion-bsd-checkbox"} name="alt-form-checkbox-1" />
                                <Checkbox label={_("Deflate compresion")} id={idPrefix + "-compresion-deflate-checkbox"} name="alt-form-checkbox-2" />
                                <Checkbox label={_("TCP Headers compresion")} id={idPrefix + "-compresion-tcp-checkbox"}
                                          name="alt-form-checkbox-3" />
                            </FormGroup>

                            <FormGroup className="pf-m-4-col-on-sm" label="Encriptation" isStack hasNoPaddingTop>
                                <Checkbox label={_("Require MPPE 64bits")} id="alt-form-checkbox-1"
                                          name="alt-form-checkbox-1" />
                                <Checkbox label={_("Require MPPE 128bits")} id="alt-form-checkbox-2"
                                          name="alt-form-checkbox-2" />

                            </FormGroup>

                        </Grid>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

        </NetworkModal>
    );
};

export const getPppoeSettings = ({ newIfaceName }) => {
    return (
        {
            connection: {
                id: "",
                type: "pppoe",
                interface_name: newIfaceName,
                autoconnect: true,
                uuid: uuidv4()
            },
            ppp: {
                lcp_echo_failure: 5,
                lcp_echo_interval: 30

            },
            pppoe: {
                password: "",
                username: "",
                parent: "",
                service: "",
            }
        }
    );
};
