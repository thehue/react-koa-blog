require('dotenv').config();
import koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import mongoose from 'mongoose';

import api from './api';
import jwtMiddleware from './lib/jwtMiddleware';
//import createFakeData from './createFakeData';

const { PORT, MONGO_URI } = process.env;

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('Connected to MongoDB');
    //createFakeData();
  })
  .catch((e) => {
    console.error(e);
  });

const app = new koa();
const router = new Router();

router.use('/api', api.routes());

// post/put/patch 같은 메서드의 request body에 json 형식으로 데이터를 넣어주면 이를 파싱하여 서버에서 사용할 수 있게 한다.
app.use(bodyParser());
app.use(jwtMiddleware);

app.use(router.routes()).use(router.allowedMethods());

const port = PORT || 4000;
app.listen(port, () => {
  console.log('Listening to port %d', port);
});
