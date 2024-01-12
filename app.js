const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const { errors } = require('celebrate');
const cors = require('cors');
const { limiter } = require('./utils/constants');
const { requestLogger, errorLogger } = require('./middlewares/logger');
// const axios = require('axios');
require('dotenv').config();
// const router = express.Router();

const { PORT = 3001, MONGODB_URL = 'mongodb://127.0.0.1:27017/beatfilmsdb' } = process.env; // переменные прописаны в .env

const app = express();

app.use(cors());

app.use(helmet());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(router);

mongoose.connect(MONGODB_URL, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

app.use(requestLogger); // подключаем логгер запросов

app.use(limiter);

app.use('/', require('./routes/index'));

app.use(errorLogger);

app.use(errors()); // обработчик ошибок celebrate

app.use((err, req, res, next) => {
  // если у ошибки нет статуса, выставляем 500
  const { statusCode = 500, message } = err;

  res.status(statusCode).send({
    // проверяем статус и выставляем сообщение в зависимости от него
    message: statusCode === 500
      ? 'На сервере произошла ошибка'
      : message,
  });
  next();
});

app.timeout = 0;
app.listen(PORT);
