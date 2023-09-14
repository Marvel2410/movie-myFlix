const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const app = express();
const port = 8080;
const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.Movie;
const Users = Models.User;

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
        const movies = await Movies.find();
        res.json(movies);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
}
);

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

//Update User Information
app.put('/users/:Username', async (req, res) => {
    const { Username } = req.params;
    const updatedUserInfo = req.body;
    try {
        const updatedUser = await User.findOneAndUpdate(
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


app.post('/users/:userId/favorites', (req, res) => {
    res.json({ message: 'movie added to favorites successfully' });
});


app.delete('/users/:userId/favorites/:movieID', (req, res) => {
    const userId = req.params.userId;
    const movieId = req.params.movieId;
    res.json({ message: 'movie removed from favorites successfully' })
});

app.delete('/users/:Username', async (req, res) => {
    const { Username } = req.params;
    try {
        const deletedUser = await User.findOneAndRemove({ Username: Username });
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