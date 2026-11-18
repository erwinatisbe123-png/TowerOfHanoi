# Runs the Prolog server in the cloud (e.g. Render, "Docker" service type)
FROM swipl:stable
WORKDIR /app
COPY . .
EXPOSE 10000
CMD ["swipl", "server.pl"]
