const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const app = express();
const port = 8080;
const mongoose = require('mongoose');
const Models = require('./models.js');

const Movies = Models.movie;
const Users = Models.User;

mongoose.connect('mongodb://localhost:27017/myFlix', { useNewUrlParser: true, useUnifiedTopology: true});

app.use(morgan('common'));//alternative middleware needs to be after this
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Welcome to my movie API!');
});

    const moviesData = [
        {
            title: 'Movie%201',
            year: 2000,
            director: 'Jane Doe',
        },
        {
            title: 'Movie%202',
            year: 2000,
            director: 'Jan Doe',
        },
        {
            title: 'Movie%203',
            year: 2000,
            director: 'J Doe',
        },
    ];
  
  //  1.  Return a list of all movies
    app.get('/movies', (req, res) => {
        res.json(moviesData);
    }
);

 // 2.  Return data about a single movie by title
 app.get('/movies/:title', (req, res) => {
    const movieTitle = req.params.title;
    //Find specific title within data
    const movie = moviesData.find((m) => m.title ===movieTitle);
    if (movie) {
        res.json(movie);
    } else {
        res.status(404).json({message: 'Movie not found'});
    }
 });

 //Add a user
/* We’ll expect JSON in this format
{
  ID: Integer,
  Username: String,
  Password: String,
  Email: String,
  Birthday: Date
}*/
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
            .then((user) =>{res.status(201).json(user) })
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

 //4.  Allow users to update their information (username)
 app.put('/users/:userId', (req, res) => {
    const userId = req.params.userId;
    res.json({ message: 'User information updated successfully'});
 });

 //5.  Allow users to add a movie to their list of favorites
 app.post('/users/:userId/favorites', (req, res) => {
    res.json({ message: 'movie added to favorites successfully' });
 });

 //6.  Allow useres to remove a movie
 app.delete('/users/:userId/favorites/:movieID', (req, res) => {
    const userId = req.params.userId;
    const movieId = req.params.movieId;
    res.json({message: 'movie removed from favorites successfully'})
 });
 //7.  Allow existing user to deregister
 app.delete('/users/:userId', (req, res) => {
    const userId = req.params.userId;
    res.json({message: 'User deregistered successfully'});
 });

app.listen(8080, () => {
    console.log("My first Node test server is running on 8080.");
});