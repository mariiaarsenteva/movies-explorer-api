const mongoose = require('mongoose');
// const validator = require('validator');
const bcrypt = require('bcrypt');
const UnauthorizedError = require('../errors/UnauthorizedError');
const { emailRegex } = require('../utils/constants');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Поле должно быть заполнено'],
    minlength: [2, 'Длина поля не меньше 2 знаков'],
    maxlength: [30, 'Длина поля не больше 30 знаков'],
  },
  email: {
    type: String,
    required: [true, 'Поле должно быть заполнено'],
    validate: {
      validator(email) {
        return emailRegex.test(email);
      },
      message: 'Введите верный email',
    },
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Поле должно быть заполнено'],
    select: false,
  },

}, { versionKey: false });

userSchema.statics.findUserByCredentials = function findUserByCredentials(email, password) {
  return this.findOne({ email })
    .select('+password')
    .then((user) => {
      if (!user) {
        throw new UnauthorizedError('Неправильные почта или пароль');
      }

      return bcrypt.compare(password, user.password)
        .then((matched) => {
          if (!matched) {
            throw new UnauthorizedError('Неправильные почта или пароль');
          }

          return user; // теперь user доступен
        });
    });
};

module.exports = mongoose.model('user', userSchema);
