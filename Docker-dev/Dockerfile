FROM registry.altlinux.org/p11/python AS maestro_api_dev

RUN apt-get update && apt-get install -y git python3-module-pip

COPY Docker-dev/requrements.txt /tmp/requirements.txt

RUN \
  mkdir -p /home/maestro;

COPY maestro_api /home/maestro/maestro_api

RUN  cd  /home/maestro/maestro_api/; rm -rf .venv; python3 -m venv .venv; \
  source /home/maestro/maestro_api/.venv/bin/activate; \
  pip3 install -e /home/maestro/maestro_api
# RUN ls -lR /home/maestro/;

# RUN  pip3 install -r /tmp/requirements.txt

FROM registry.altlinux.org/p11/alt

RUN apt-get update && \
  apt-get install -y headlamp talosctl su sudo nmap iputils caddy jq yq net-tools curl tcpdump

COPY /Docker-dev/entrypoint.sh /

COPY /plugin/maestro/dist/ /usr/share/headlamp/plugins/maestro/

COPY /plugin/maestro/package.json /usr/share/headlamp/plugins/maestro/

RUN adduser maestro

RUN chmod 755 /home/maestro

# USER maestro

COPY --from=maestro_api_dev --chown=maestro:maestro /home/maestro/maestro_api  /home/maestro/maestro_api

EXPOSE 4466

CMD /entrypoint.sh

