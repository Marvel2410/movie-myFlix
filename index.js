const express = require('express');
const morgan = require('morgan');
const app = express();
const port = 8080;

app.use(morgan('common'));//alternative middleware needs to be after this
app.use(express.json());
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

 //3.  Allow new users to register
 app.post('/users', (req,res) => {
    res.json({ message: 'User Registered successfully'});
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