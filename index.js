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

app.get('/', (req, res) => {
    res.send('Welcome to my movie API!');
});

app.get('/movies', async (req, res) => {
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
});

app.get('/movies/:title', async (req, res) => {
    const {title} = req.params;
    try {
        const movie = await Movies.findOne({ Title: title}, 'Title');
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found'});
        }
        res.json(movie.Title);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});

app.get('/genres/:name', async (req, res) => {
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
app.get('/genres', async (req, res) => {
    try{
        const genres = await Genres.find({}, 'Name Description');
        res.json(genres);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});

app.get('/directors', async (req, res) => {
    try{
        const directors = await Directors.find({}, 'Name Bio');
        res.json(directors);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});

app.get('/directors/:Name', async (req, res) => {
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
app.get('/users/:Username', async (req, res) => {
    await Users.findOne({ Username: req.params.Username })
        .then((user) => {
            res.json(user);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});
app.get('/users', async (req, res) => {
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
    await Users.findOne({ Username: req.body.Username })
        .then((user) => {
            if (user) {
                return res.status(400).send(req.body.Username + 'already exists');
            } else {
                Users
                    .create({
                        Username: req.body.Username,
                        Password: req.body.Password,
                        Email: req.body.Email,
                        Birthday: req.body.Birthday
                    })
                    .then((user) => { res.status(201).json(user) })
                    .catch((error) => {
                        console.error(error);
                        res.status(500).send('Error: ' + error);
                    })
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

app.post('/users/:Username/favorites/:MovieID', async (req, res) => {
    const { Username, MovieID } = req.params;
    try {
        const user = await Users.findOne({ Username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const movie = await Movies.findById(MovieID);
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        if (user.FavoriteMovies.includes(MovieID)) {
            return res.status(400).json({ message: 'Movie already in favorites' });
        }
        user.FavoriteMovies.push(MovieID);
        await user.save();
        res.json({ message: 'Movie added to favorites successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});



//Update User Information
app.put('/users/:Username', async (req, res) => {
    const { Username } = req.params;
    const updatedUserInfo = req.body;
    try {
        const updatedUser = await Users.updateOne(
            { Username: Username },
            updatedUserInfo,
            { new: true }
        );
        res.json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
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