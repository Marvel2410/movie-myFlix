const mongoose = require('mongoose');
const Models = require('./models.js');
const Movies = Models.Movie;
const Users = Models.User;
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const app = express();
const Genres = Models.Genre;
const Directors = Models.Director;

const { check, validationResult } = require('express-validator');

//mongoose.connect('mongodb://localhost:27017/dudaDB', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });


app.use(morgan('common'));//alternative middleware needs to be after this
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const cors = require('cors');
app.use(cors());
let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');
app.use(express.static('public'));


let allowedOrigins = ['http://localhost:8080', 'https://marvel2410.github.io/flixList-Angular/',
    'https://marvel2410.github.io/myflix-angular-client/',
    'http://testsite.com',
    'http://localhost:1234',
    'https://dudasnewmyflixapp.netlify.app',
    'http://localhost:4200'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            let message = 'The CORS policy for this application does not allow access from origin' + origin;
            return callback(new Error(message), false);
        }
        return callback(null, true);
    }
}));

app.get('/', (req, res) => {
    res.send('Welcome to my movie API!');
});

app.get('/movies', passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        try {
            const movies = await Movies.find({}, 'Title Description Genere Director ImagePath Featured')
                .populate('Genre', 'Name')
                .populate('Director', 'Name');
            res.status(201).json(movies.map(movie => ({
                Title: movie.Title,
                id: movie._id,
                Description: movie.Description,
                Genre: movie.Genre.Name,
                Director: movie.Director.Name,
                ImagePath: movie.ImagePath,
                Featured: movie.Featured
            })));
        } catch (error) {
            console.error(error);
            res.status(500).send('Error: ' + error);
        }
    });

app.get('/movies/:title', passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        const { title } = req.params;
        try {
            const movie = await Movies.findOne({ Title: title })
                .populate('Genre', 'Name Description')
                .populate('Director', 'Name Bio');
            if (!movie) {
                return res.status(404).json({ message: 'Movie not found' });
            }
            res.json({
                Title: movie.Title,
                id: movie._id,
                Description: movie.Description,
                Genre: {
                    Name: movie.Genre.Name,
                    Description: movie.Genre.Description
                },
                Director: {
                    Name: movie.Director.Name,
                    Bio: movie.Director.Bio
                },
                ImagePath: movie.ImagePath,
                Featured: movie.Featured
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error: ' + error);
        }
    });

app.get('/genres/:name', passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        const genreName = req.params.name;
        try {
            const genre = await Genres.findOne({ Name: genreName });
            if (genre) {
                res.json(genre);
            } else {
                res.status(404).json({ message: 'Genre not found' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Error: ' + error);
        }
    });

app.get('/genres', passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        try {
            const genres = await Genres.find({}, 'Name Description');
            res.json(genres);
        } catch (error) {
            console.error(error);
            res.status(500).send('Error: ' + error);
        }
    });

app.get('/directors', passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        try {
            const directors = await Directors.find({}, 'Name Bio');
            res.json(directors);
        } catch (error) {
            console.error(error);
            res.status(500).send('Error: ' + error);
        }
    });

app.get('/directors/:Name', passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        try {
            const director = await Directors.findOne({ 'Name': req.params.Name });
            if (director) {
                const { _id, Name, Bio, Birth, Death } = director;
                res.json({ _id, Name, Bio, Birth, Death });
            } else {
                res.status(404).json({ message: 'Director not found' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Error: ' + error);
        }
    });

app.get('/users/:Username', passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        //Condition to check user matches username
        if (req.user.Username !== req.params.Username) {
            return res.status(400).send('Permission Denied');
        }
        //End of condition
        await Users.findOneAndUpdate(
            { Username: req.params.Username },
            {
                $set: {
                    Username: req.body.Username,
                    Password: req.body.Password,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday
                }
            },
            { new: true }
        )
            .then(async (updatedUser) => {
                // Get the titles of favorite movies
                const favoriteMovies = await Promise.all(updatedUser.FavoriteMovies.map(async movieID => {
                    const movie = await Movies.findById(movieID, 'Title');
                    return movie.Title;
                }));

                //Birthday re-format
                const formattedUser = {
                    ...updatedUser._doc,
                    Birthday: updatedUser.Birthday.toISOString().split('T')[0],
                    FavoriteMovies: favoriteMovies
                };
                res.json(formattedUser);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    });

app.get('/users/:Username/favorites', passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        if (req.user.Username !== req.params.Username) {
            return res.status(400).send('Permission denied');
        }
        try {
            const user = await Users.findOne({ Username: req.params.Username }).populate('FavoriteMovies');
            if (!user) {
                return res.status(400).json({ message: 'User not Found' });
            }
            const favoriteMovies = user.FavoriteMovies.map(movie => ({
                Title: movie.Title,
                id: movie._id,
                Description: movie.Description,
                Genre: {
                    Name: movie.Genre.Name,
                    Description: movie.Genre.Description
                },
                Director: {
                    Name: movie.Director.Name,
                    Bio: movie.Director.Bio
                },
                ImagePath: movie.ImagePath,
                Featured: movie.Featured
            }));
            res.json(favoriteMovies);
        } catch (error) {
            console.error(error);
            res.status(500).send('Error: ' + error);
        }
    });

app.get('/users', passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        if (req.user) {
            res.status(403).send('Permission Denied-Admin Only');
        } else {
            try {
                const users = await Users.find();
                const formattedUsers = await Promise.all(users.map(async user => {
                    const favoriteMovies = await Promise.all(user.FavoriteMovies.map(async movieID => {
                        const movie = await Movies.findById(movieID, 'Title');
                        return movie.Title;
                    }));
                    return {
                        ...user._doc,
                        Birthday: user.Birthday.toISOString().split('T')[0],
                        FavoriteMovies: favoriteMovies
                    };
                }));
                res.json(formattedUsers);
            } catch (err) {
                console.error(err);
                res.status(500).send('Error: ' + err);
            }
        }
    });

app.post('/users',
    [
        check('Username', 'Username is required').isLength({ min: 5 }),
        check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric('en-US', { ignore: ' ' }),
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'Email does not appear to be valid').isEmail()
    ], async (req, res) => {
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        let hashedPassword = Users.hashPassword(req.body.Password);
        await Users.findOne({ Username: req.body.Username }) // Search to see if a user with the requested username already exists
            .then((user) => {
                if (user) {
                    //If the user is found, send a response that it already exists
                    return res.status(400).send(req.body.Username + ' already exists');
                } else {
                    Users
                        .create({
                            Username: req.body.Username,
                            Password: hashedPassword,
                            Email: req.body.Email,
                            Birthday: req.body.Birthday
                        })
                        .then((user) => { res.status(201).json(user) })
                        .catch((error) => {
                            console.error(error);
                            res.status(500).send('Error: ' + error);
                        });
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
            });
    });

app.post('/users/:Username/favorites/:MovieTitle', passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        if (req.user.Username !== req.params.Username) {
            return res.status(400).send('Permission denied');
        }
        const { Username, MovieTitle } = req.params;
        try {
            const user = await Users.findOne({ Username });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const movie = await Movies.findOne({ Title: MovieTitle });
            if (!movie) {
                return res.status(404).json({ message: 'Movie not found' });
            }
            if (user.FavoriteMovies.includes(movie._id)) {
                return res.status(400).json({ message: 'Movie already in favorites' });
            }
            user.FavoriteMovies.push(movie._id);
            await user.save();
            const movieDetails = await Movies.findById(movie._id, 'Title');
            res.json({ message: `Movie '${movieDetails.Title}' added to favorites successfully` });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error: ' + error);
        }
    });

app.put('/users/:Username', passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        if (req.user.Username !== req.params.Username) {
            return res.status(400).send('Permission denied');
        }
        let hashedPassword = await Users.hashPassword(req.body.Password);

        await Users.findOneAndUpdate({ Username: req.params.Username }, {
            $set:
            {
                Username: req.body.Username,
                Password: hashedPassword,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            }
        },
            { new: true })
            .then((updatedUser) => {
                res.json(updatedUser);
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send('Error: ' + err);
            })
    });

app.delete('/users/:Username/favorites/:MovieTitle', passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        // CONDITION TO CHECK ADDED HERE
        if (req.user.Username !== req.params.Username) {
            return res.status(400).send('Permission denied');
        }
        // CONDITION ENDS
        const { Username, MovieTitle } = req.params;
        try {
            const user = await Users.findOne({ Username });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const movie = await Movies.findOne({ Title: MovieTitle });
            if (!movie) {
                return res.status(404).json({ message: 'Movie not found' });
            }
            if (!user.FavoriteMovies.includes(movie._id)) {
                return res.status(404).json({ message: "Movie not found in favorites" });
            }
            user.FavoriteMovies = user.FavoriteMovies.filter(id => id.toString() !== movie._id.toString());
            await user.save();
            res.json({ message: `Movie '${movie.Title}' removed from favorites successfully` });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error: ' + error);
        }
    });

app.delete('/users/:Username', passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        // CONDITION TO CHECK ADDED HERE
        if (req.user.Username !== req.params.Username) {
            return res.status(400).send('Permission denied');
        }
        // CONDITION ENDS
        const { Username } = req.params;
        try {
            const deletedUser = await Users.findOneAndRemove({ Username: Username });
            if (!deletedUser) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json({ message: 'User deregistered successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error: ' + error);
        }
    });

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on Port ' + port);
});