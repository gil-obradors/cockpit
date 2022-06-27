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
    Button, ClipboardCopy, Flex,
    FormFieldGroup, FormFieldGroupHeader,
    FormGroup,
    Grid, InputGroup,
    TextInput,
} from '@patternfly/react-core';

import { NetworkModal, dialogSave } from './dialogs-common.jsx';
import { ModelContext } from './model-context.jsx';
import { useDialogs } from "dialogs.jsx";

import { v4 as uuidv4 } from 'uuid';
import {
    is_interface_connection,
    is_interesting_interface,
} from './interfaces.js';
import { MinusIcon, PlusIcon } from "@patternfly/react-icons";

const _ = cockpit.gettext;

export const WireguardDialog = ({ connection, dev, settings }) => {
    const Dialogs = useDialogs();
    const idPrefix = "network-vpn-settings";
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
    const [pubKey, setPubKey] = useState("");
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
            <Grid hasGutter>
                {/* <Name className="pf-m-4-col-on-sm" idPrefix={idPrefix} iface={iface} setIface={setIface} /> */}
                <FormGroup fieldId={idPrefix + "-interface-name-input"} label={_("Name")}
                           className="pf-m-4-col-on-sm">
                    <TextInput id={idPrefix + "-interface-name-input"} value={iface} onChange={setIface} />
                </FormGroup>

                <FormGroup fieldId={idPrefix + "-private-key-input"} label={_("Private key")}
                           className="pf-m-8-col-on-sm">
                    <InputGroup>
                        <TextInput id={idPrefix + "-private-key-input"} value={privKey}
                                   onChange={setPrivKey} type="password" />
                        <Button id="textAreaButton2" variant="control"
                                onClick={() => {
                                    console.log("clicked");
                                    cockpit.script("KEY=$(/usr/bin/wg genkey) && echo $KEY | /usr/bin/wg pubkey && echo $KEY", { err: "ignore" })
                                            .then((output) => {
                                                const split = output.split('\n');
                                                setPrivKey(split[1]);
                                                setPubKey(split[0]);
                                            })
                                            .fail((fail) => console.log("fail", fail));
                                    console.log("public key", pubKey, "private key:", privKey);
                                }}>{_("Generate Private Key")}</Button>
                    </InputGroup>

                </FormGroup>
                <FormGroup label="Port" className="pf-m-4-col-on-sm">
                    <TextInput id={idPrefix + "-port-input"} type="text" />
                </FormGroup>

                <FormGroup fieldId={idPrefix + "-public-key-input"} label={_("Public key")}
                           className="pf-m-8-col-on-sm">
                    <ClipboardCopy isReadOnly hoverTip="Copy" clickTip={_("Copied")}>
                        {pubKey}
                    </ClipboardCopy>

                </FormGroup>
            </Grid>
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
                            <Grid>
                                <FormGroup fieldId={idPrefix + "-publicKey-" + i} label={_("Peer")}
                                           className="pf-m-8-col-on-sm">
                                    <TextInput id={idPrefix + "-publicKey-" + i} value={peer.public_key}
                                               onChange={value => setPeers(
                                                   peers.map((item, index) =>
                                                       i === index
                                                           ? {
                                                               ...item, public_key: value,
                                                           }
                                                           : item
                                                   ))} type="text" />
                                </FormGroup>
                            </Grid>
                            <FormGroup fieldId={idPrefix + "-endpoint-" + i} label={_("Endpoint")}
                                           className="pf-m-4-col-on-sm" helperText="IP-OR-HOST:PORT">
                                <TextInput id={idPrefix + "-endpoint-" + i} value={peer.endpoint}
                                               onChange={value => setPeers(
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

export const getWireguardSettings = ({ newIfaceName }) => {
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
