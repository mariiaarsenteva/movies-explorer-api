const { HTTP_STATUS_OK, HTTP_STATUS_CREATED } = require('http2').constants;
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user');
const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');
// const UnauthorizedError = require('../errors/NotFoundError');

const { SECRET_KEY } = process.env;

const getUser = (req, res, next) => {
  UserModel.findById(req.user._id)
    .orFail()
    .then((users) => res.status(HTTP_STATUS_OK).send(users))
    .catch(next);
};

const addUser = (req, res, next) => {
  const {
    name, email, password,
  } = req.body;
  bcrypt.hash(password, 10)
    .then((hash) => UserModel.create({
      name, email, password: hash,
    })
      .then((user) => res.status(HTTP_STATUS_CREATED).send({
        name: user.name, email: user.email, _id: user.id,
      }))
      .catch((err) => {
        if (err instanceof mongoose.Error.ValidationError) {
          next(new BadRequestError(err.message));
        } else if (err.code === 11000) {
          next(new ConflictError(`Пользователь с email: ${email} уже зарегистрирован`));
        } else {
          next(err);
        }
      }));
};

const editUserData = (req, res, next) => {
  const { name, email } = req.body;
  UserModel.findByIdAndUpdate(req.user._id, { name, email }, { new: 'true', runValidators: true })
    .orFail()
    .then((user) => {
      res.status(HTTP_STATUS_OK).send(user);
    })
    .catch((err) => {
      if (err instanceof mongoose.Error.ValidationError) {
        next(new BadRequestError(err.message));
      } else if (err instanceof mongoose.Error.DocumentNotFoundError) {
        next(new NotFoundError(`Пользователь по данному _id: ${req.params.userId} не найден.`));
      } else {
        next(err);
      }
    });
};

const login = (req, res, next) => {
  const { email, password } = req.body;
  return UserModel.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign({ _id: user._id }, process.env.NODE_ENV === 'production' ? SECRET_KEY : 'secret-key', { expiresIn: '7d' });
      res.send({ token });
    })
    .catch((err) => {
      next(err);
    });
};

module.exports = {
  addUser, editUserData, login, getUser,
};
