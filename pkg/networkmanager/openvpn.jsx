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
    Button,
    Flex,
    FormFieldGroup, FormFieldGroupHeader,
    FormGroup,
    Grid,
    TextInput,
} from '@patternfly/react-core';

import { Name, NetworkModal, dialogSave } from './dialogs-common.jsx';
import { ModelContext } from './model-context.jsx';
import { useDialogs } from "dialogs.jsx";

import { v4 as uuidv4 } from 'uuid';
import {
    is_interface_connection,
    is_interesting_interface,
} from './interfaces.js';
import { MinusIcon, PlusIcon } from "@patternfly/react-icons";

const _ = cockpit.gettext;

export const OpenVpnDialog = ({ connection, dev, settings }) => {
    const Dialogs = useDialogs();
    const idPrefix = "network-openvpn-settings";
    const model = useContext(ModelContext);
    const parentChoices = [];
    model.list_interfaces().forEach(iface => {
        if (!is_interface_connection(iface, connection) &&
            is_interesting_interface(iface))
            parentChoices.push(iface.Name);
    });

    const [dialogError, setDialogError] = useState(undefined);
    const [iface, setIface] = useState(settings.connection.interface_name);
    const [privKey, setPrivKey] = useState(settings.wireguard.private_key);
    const [peers, setPeers] = useState(settings.wireguard.peers);

    const onSubmit = (ev) => {
        const createSettingsObj = () => ({
            ...settings,
            connection: {
                ...settings.connection,
                id: iface,
                interface_name: iface,
            },
            wireguard: {
                ...settings.wireguard,
                peers: peers,
                private_key: privKey,
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

    return (
        <NetworkModal dialogError={dialogError}
                      idPrefix={idPrefix}
                      onSubmit={onSubmit}
                      title={_("Wireguard settings")}
                      isFormHorizontal={false}
        >

            <Name idPrefix={idPrefix} iface={iface} setIface={setIface} />
            <FormGroup fieldId={idPrefix + "-private-key-input"} label={_("Private key")}>
                <TextInput id={idPrefix + "-private-key-input"} value={privKey} onChange={setPrivKey} />
            </FormGroup>

            <FormFieldGroup
                data-field='peers'
                header={
                    <FormFieldGroupHeader
                        titleText={{ text: _("Peers") }}
                        actions={
                            <Flex>
                                <Button variant="secondary"
                                        onClick={() => setPeers([...peers, {
                                            public_key: "",
                                            endpoint: "",
                                            allowed_ips: ""
                                        }])}
                                        id={idPrefix + "-peer-add"}
                                        aria-label={_("Add peer")}
                                        icon={<PlusIcon />} />
                            </Flex>
                        }
                    />
                }
            >
                {peers.map((peer, i) => {
                    return (
                        <Grid key={i} hasGutter>
                            <FormGroup fieldId={idPrefix + "-publicKey-" + i} label={_("Peer")} className="pf-m-4-col-on-sm">
                                <TextInput id={idPrefix + "-publicKey-" + i} value={peer.public_key} onChange={value => setPeers(
                                    peers.map((item, index) =>
                                        i === index
                                            ? {
                                                ...item, public_key: value,
                                            }
                                            : item
                                    ))} type="text" />
                            </FormGroup>
                            <FormGroup fieldId={idPrefix + "-endpoint-" + i} label={_("Endpoint")} className="pf-m-4-col-on-sm">
                                <TextInput id={idPrefix + "-endpoint-" + i} value={peer.endpoint} onChange={value => setPeers(
                                    peers.map((item, index) =>
                                        i === index
                                            ? {
                                                ...item, endpoint: value,
                                            }
                                            : item
                                    ))} />
                            </FormGroup>
                            <FormGroup fieldId={idPrefix + "-allowedIps-" + i} label={_("Allowed Ips")} className="pf-m-4-col-on-sm">
                                <TextInput id={idPrefix + "-allowedIps-" + i} value={peer.allowed_ips}
                                           onChange={value => setPeers(
                                               peers.map((item, index) =>
                                                   i === index
                                                       ? {
                                                           ...item, allowed_ips: value,
                                                       }
                                                       : item
                                               ))} />
                            </FormGroup>

                            <FormGroup className="pf-m-1-col-on-sm remove-button-group">
                                <Button variant='secondary'
                                        onClick={() => setPeers(peers.filter((_, index) => index !== i))}
                                        aria-label={_("Remove peer")}
                                        icon={<MinusIcon />} />
                            </FormGroup>
                        </Grid>
                    );
                })}
            </FormFieldGroup>

        </NetworkModal>
    );
};

export const getOpenVPNSettings = ({ newIfaceName }) => {
    return (
        {
            connection: {
                id: "",
                type: "wireguard",
                interface_name: newIfaceName,
                autoconnect: true,
                uuid: uuidv4()
            },
            wireguard: {
                peers: [],
                private_key: ""

            }
        }
    );
};
