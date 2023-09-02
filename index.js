const express = require('express');
const app = express();
const morgan = require('morgan');
const port = 8080;


app.get('/movies', (req, res) => {
    const topMovies = [
        {
            title: 'Movie 1',
            year: 2000,
            director: 'Jane Doe',
        },
        {
            title: 'Movie 2',
            year: 2000,
            director: 'Jan Doe',
        },
        {
            title: 'Movie 3',
            year: 2000,
            director: 'J Doe',
        },
    ];
    res.json(topMovies);
});

app.get('/', (req, res) => {
    res.send('Welcome to my movie API!');
});

app.use(express.static('public'));
app.use(morgan('common'));//alternative middleware needs to be after this

app.listen(8080, () => {
    console.log(`My first Node test server is running on Port ${port}.`);
});