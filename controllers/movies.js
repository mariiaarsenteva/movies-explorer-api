/* eslint no-underscore-dangle: 0 */

const { HTTP_STATUS_OK, HTTP_STATUS_CREATED } = require('http2').constants;
const mongoose = require('mongoose');
const MovieModel = require('../models/movie');
const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');
const ForbiddenError = require('../errors/ForbiddenError');
// const UnautorizedError = require('../errors/UnauthorizedError');

const getMovies = (req, res, next) => MovieModel.find({ owner: req.user._id })
  // .populate(['owner', 'likes'])
  .then((cards) => res.status(HTTP_STATUS_OK).send(cards)) /* reverse() */
  .catch(next);

const deleteMovie = (req, res, next) => {
  MovieModel.findById(req.params.movieId)
    .orFail()
    .then((card) => {
      if (!card.owner.equals(req.user._id)) {
        throw new ForbiddenError('Карточка другого пользователя');
      }
      MovieModel.deleteOne(card)
        .orFail()
        .then(() => {
          res.status(HTTP_STATUS_OK).send({ message: 'Карточка удалена' });
        })
        .catch((err) => {
          if (err instanceof mongoose.Error.CastError) {
            next(new BadRequestError(`Некорректный _id карточки: ${req.params.movieId}`));
          } else if (err instanceof mongoose.Error.DocumentNotFoundError) {
            next(new NotFoundError(`Карточка по данному _id: ${req.params.movieId} не найдена.`));
          } else {
            next(err);
          }
        });
    })
    .catch((err) => {
      if (err instanceof mongoose.Error.DocumentNotFoundError) {
        next(new NotFoundError(`Карточка по данному _id: ${req.params.movieId} не найдена.`));
      } else {
        next(err);
      }
    });
};

const addMovie = (req, res, next) => {
  const {
    country,
    director,
    duration,
    year,
    description,
    image,
    trailerLink,
    thumbnail,
    movieId,
    nameRU,
    nameEN,
  } = req.body;
  MovieModel.create({
    country,
    director,
    duration,
    year,
    description,
    image,
    trailerLink,
    thumbnail,
    movieId,
    nameRU,
    nameEN,
    owner: req.user._id,
  })
    .then((card) => {
      res.status(HTTP_STATUS_CREATED).send(card);
    })
    .catch((err) => {
      if (err instanceof mongoose.Error.ValidationError) {
        next(new BadRequestError(err.message));
      } else {
        next(err);
      }
    });
};

module.exports = {
  addMovie, getMovies, deleteMovie,
};
