const http = require("http");
const app = require("./app");

const server = http.createServer(app);
app.set("server", server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`App Express is running on http://localhost:${PORT}`);
});
//test
