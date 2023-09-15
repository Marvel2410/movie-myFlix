const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const app = express();
const port = 8080;
const mongoose = require('mongoose');
const Models = require('./models.js');
const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director;

mongoose.connect('mongodb://localhost:27017/dudaDB', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(morgan('common'));//alternative middleware needs to be after this
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
const cors = require('cors');
/*app.use(cors());*/ //this allows requests from all origins
let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) { //If a specific origin isn't found on the list of allowed origins
            let message = 'The CORS policy for this application does not allow access from origin' + origin;
            return callback(new Error(message), false);
        }
        return callback(null, true);
    }
}));
let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

app.get('/', (req, res) => {
    res.send('Welcome to my movie API!');
});

/*app.get('/movies', passport.authenticate('jwt', {session: false }), //This is my original code
async (req, res) => {
    try {
        const movies = await Movies.find({}, 'Title Description')
            .populate('Director', 'Name')
            .populate('Genre', 'Name');
        const formattedMovies = movies.map(movie => {
            return {
                Title: movie.Title,
                Description: movie.Description,
                Director: movie.Director.Name,
                Genre: movie.Genre.Name
            };
        });
        res.json(formattedMovies);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
}); */

app.get('/movies', passport.authenticate('jwt', { session: false }), //This is the code from excercise 2.9
    async (req, res) => {
        await Movies.find()
            .then((movies) => {
                res.status(201).json(movies);
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
            });
    });

app.get('/movies/:title', passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        const { title } = req.params;
        try {
            const movie = await Movies.findOne({ Title: title }, 'Title');
            if (!movie) {
                return res.status(404).json({ message: 'Movie not found' });
            }
            res.json(movie.Title);
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
                const { Name, Bio, Birth, Death } = director;
                res.json({ Name, Bio, Birth, Death });
            } else {
                res.status(404).json({ message: 'Director not found' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).send('Error: ' + error);
        }
    })
app.get('/users/:Username', passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        //Add additional condition
        if (req.user.Username !== req.params.Username) {
            return res.status(400).send('Permission Denied');
        }
        await Users.findOne({ Username: req.params.Username })
            .then((user) => {
                res.json(user);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    });
app.get('/users', passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        //additional condition
        if (req.user.Username !== req.params.Username) {
            return res.status(400).send('Permission Denied');
        }
        await Users.find()
            .then((users) => {
                res.status(201).json(users);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    });


app.post('/users', async (req, res) => {
    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOne({ Username: req.body.Username }) //serach to see if a user with the username already esists
        .then((user) => {
            if (user) {
                return res.status(400).send(req.body.Username + 'already exists');
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
        const { Username, MovieTitle } = req.params;
        //condition
        if (req.user.Username !== Username) {
            return res.status(400).send('Permission denied');
        }
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
            res.json({ message: 'Movie added to favorites successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error: ' + error);
        }
    });



//Update User Information
app.put('/users/:Username', passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        //Condition to check added here
        if (req.user.Username !== req.params.Username) {
            return res.status(400).send('Permission denied');
        }
        //End of condition
        await Users.findOneAndUpdate({ Username: req.params.Username }, {
            $set:
            {
                Username: req.body.Username,
                Password: req.body.Password,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            }
        },
            { new: true }) // This line makes sure that the updated document is returned
            .then((updatedUser) => {
                res.json(updatedUser);
            })
            .catch((err) => {
                console.log(err);
                res.status(500).send('Error: ' + err);
            })
    });



app.delete('/users/:Username/favorites/:MovieID', async (req, res) => {
    const { Username, MovieID } = req.params;
    try {
        const user = await Users.findOne({ Username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!user.FavoriteMovies.includes(MovieID)) {
            return res.status(404).json({ message: "Movie not found in favorites" });
        }
        user.FavoriteMovies = user.FavoriteMovies.filter(id => id !== MovieID);
        await user.save();
        res.json({ message: 'Movie removed from favorites successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});

app.delete('/users/:Username', async (req, res) => {
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

app.listen(8080, () => {
    console.log("My first Node test server is running on 8080.");
});