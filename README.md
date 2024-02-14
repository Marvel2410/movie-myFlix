# My Favorite Movies API

## Overview
This API provides access to information about favorite movies, directors, and plots. Users can sign up, update their personal information, and create a list of their favorite movies.

## Technologies Used
- Node.js
- Express.js
- MongoDB
- Mongoose
- Passport.js
- JSDoc
- CORS

## Installation
1. Clone the repository: `git clone https://github.com/yourusername/my-favorite-movies-api.git`
2. Install dependencies: `npm install`
3. Set up your MongoDB connection string in the `.env` file:
4. Start the server: `npm start`

## API Endpoints

### 1. Signup
- **Endpoint:** `POST /users`
- Registers a new user account.
- Example Request Body:
```json
{
   "Username": "newUser",
   "Password": "password123",
   "Email": "newuser@example.com",
   "Birthday": "1990-01-01"
}
{
    "_id": "generatedId",
    "Username": "newUser",
    "Email": "newuser@example.com",
    "Birthday": "1990-01-01",
    "FavoriteMovies": []
}

### 2. Login
- **Endpoint:** `POST /login`
- Logs in an existing user.
- Example Request Body:
{
    "Username": "existingUser",
    "Password": "password123"
}
{
    "user": {
        "_id": "generated id",
        "Username": "username",
        "Password": "hashed password",
        "Email": "newuser@example.com",
        "Birthday": "1990-01-01T00:00:00.000Z",
        "FavoriteMovies": [],
        "__v": 0
    },
    "token": "generatedToken"
}


### 3. View Movies
- **Endpoint:** `GET /movies`
- Shows all movies and information within the database
- Sample Response:
[
    {
        "Title": "Movie 1",
        "id": "generatedId1",
        "Description": "Description of Movie 1",
        "Genre": "Genre Name",
        "Director": "Director Name",
        "ImagePath": "path/to/image",
        "Featured": true
    },
    {
        "Title": "Movie 2",
        "id": "generatedId2",
        "Description": "Description of Movie 2",
        "Genre": "Genre Name",
        "Director": "Director Name",
        "ImagePath": "path/to/image",
        "Featured": false
    }
]

### 4. View a Specific Movie's Details
- **Endpoint:** `GET /movies/{MovieTitle}`
- Sample Response:
{
    "Title": "Movie 1",
    "id": "generatedId1",
    "Description": "Description of movie 1",
    "Genre": {
        "Name": "Genre of movie 1",
        "Description": "Description of Genre"
    },
    "Director": {
        "Name": "Director of movie 1",
        "Bio": "Director Bio"
    },
    "ImagePath": "path to image",
    "Featured": true
}

### 5. Add a Movie to Favorites
- **Endpoint:** `POST /users/{Username}/favorites/{MovieTitleToAdd}`
- This endpoint allows users to add a movie to their list of favorite movies.

### 6. View Favorite Movies
- **Endpoint:** `GET /users/{Username}/favorites`
- Returns a list of favroite movies for specific user.

### 7. Remove Movie from Favorites
- **Endpoint:** `DELETE /users/{Username}/favorites/{MovieTitle}`
- Removes a movie from the list of favorite movies for a user.

### 8. Update Profile Data
- **Endpoint:** `PUT /users/{Username}`
- Allows a uer to update their profile information.

### Author ###
- **Stephanie Duda**
- Email: tippingvelvet24@gmail.com 

