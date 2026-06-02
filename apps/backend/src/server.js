const app = require('./app');
const { env } = require('./config/env');

app.listen(env.PORT, () => {
  console.log(`Backend STI rodando em http://localhost:${env.PORT}`);
});
