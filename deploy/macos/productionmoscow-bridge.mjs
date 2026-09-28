import net from "node:net";

const listenHost = "127.0.0.1";
const listenPort = 3011;
const targetHost = "host.docker.internal";
const targetPort = 3011;

const server = net.createServer((client) => {
  const upstream = net.createConnection({ host: targetHost, port: targetPort });
  client.pipe(upstream);
  upstream.pipe(client);

  const close = () => {
    client.destroy();
    upstream.destroy();
  };
  client.on("error", close);
  upstream.on("error", close);
});

server.listen(listenPort, listenHost, () => {
  console.log(`Production Moscow Caddy bridge listening on ${listenHost}:${listenPort}`);
});
