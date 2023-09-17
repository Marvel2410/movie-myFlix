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

app.get('/movies', async (req, res) => {
    try{
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
      } catch(error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
      }
  });

app.get('/movies/:title', async (req, res) => {
    const { title } = req.params;
    try {
        const movie = await Movies.findOne({ Title: title });
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        res.json({
            Title: movie.Title,
            id: movie._id,
            Description: movie.Description
        });
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
    try {
        const genres = await Genres.find({}, 'Name Description');
        res.json(genres);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});

app.get('/directors', async (req, res) => {
    try {
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

app.get('/users/:Username', async (req, res) => {
    try {
        const user = await Users.findOne({ Username: req.params.Username });
        if (user) {
            //Birthday re-format
            const formattedUser = {
                ...user._doc,
                Birthday: user.Birthday.toISOString().split('T')[0]
            };
            res.json(formattedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

app.get('/users', async (req, res) => {
    try {
        const users = await Users.find();
        const formattedUsers = users.map(user => {
            return {
                ...user._doc,
                Birthday: user.Birthday.toISOString().split('T')[0]
            };
        });
        res.json(formattedUsers);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

app.post('/users', async (req, res) => {
    try {
      const userExists = await Users.findOne({ Username: req.body.Username });
      if (userExists) {
        return res.status(400).send(req.body.Username + ' already exists');
      }
  
      const user = await Users.create({
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: new Date(req.body.Birthday).toISOString().split('T')[0]
      });
  
      res.status(201).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error: ' + error);
    }
  });

  app.post('/users/:Username/favorites/:MovieTitle', async (req, res) => {
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
        res.json({ message: `Movie added to favorites successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error);
    }
});

app.put('/users/:Username', async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
        $set:
        {
            Username: req.body.Username,
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

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
    console.log('Listening on Port ' + port);
});