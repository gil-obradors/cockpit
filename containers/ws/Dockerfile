FROM registry.fedoraproject.org/fedora:36
LABEL maintainer="cockpit-devel@lists.fedorahosted.org"
LABEL VERSION=main

ARG VERSION

ADD . /container

RUN echo -e '[group_cockpit-cockpit-preview]\nname=Copr repo for cockpit-preview owned by @cockpit\nbaseurl=https://copr-be.cloud.fedoraproject.org/results/@cockpit/cockpit-preview/fedora-$releasever-$basearch/\ntype=rpm-md\ngpgcheck=1\ngpgkey=https://copr-be.cloud.fedoraproject.org/results/@cockpit/cockpit-preview/pubkey.gpg\nrepo_gpgcheck=0\nenabled=1\nenabled_metadata=1' > /etc/yum.repos.d/cockpit.repo

RUN /container/install.sh

LABEL INSTALL="docker run --rm --privileged -v /:/host -e IMAGE=\${IMAGE} \${IMAGE} /container/label-install \${IMAGE}"
LABEL UNINSTALL="docker run --rm --privileged -v /:/host -e IMAGE=\${IMAGE} \${IMAGE} /container/label-uninstall"
LABEL RUN="docker run -d --name \${NAME} --privileged --pid=host -v /:/host -e NAME=\${NAME} -e IMAGE=\${IMAGE} \${IMAGE} /container/label-run"

# Look ma, no EXPOSE

CMD ["/container/label-run"]
