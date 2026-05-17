# CineMood

Ever struggle to pick a movie that truly fits how you're feeling right now? CineMood helps you solve that by taking a simple text description of your mood, analyzing it with AI, and then recommending films that perfectly match your emotional state. It's all about making movie discovery personal and effortless, without any complicated setup.

## Installation

Let's get CineMood up and running on your local machine.

1.  **Clone the Repository**

    First, you'll want to get a copy of the project files. Open your terminal and run:

    ```bash
    git clone https://github.com/Aisdev979/cineMood.git
    cd cineMood
    ```

2.  **Backend Setup**

    The backend handles all the heavy lifting, from AI analysis to movie data fetching and user authentication.

    *   Navigate to the `server` directory:

        ```bash
        cd server
        ```

    *   Install the necessary Node.js packages:

        ```bash
        npm install
        ```

    *   Create a `.env` file in the `server` directory. This file will hold your environment variables. Populate it with the following:

        ```dotenv
        PORT=5000
        MONGO_URI=<Your MongoDB Connection String>
        ACCESS_TOKEN_SECRET=<A_VERY_STRONG_AND_RANDOM_SECRET_KEY_FOR_JWT>
        REFRESH_TOKEN_SECRET=<ANOTHER_VERY_STRONG_AND_RANDOM_SECRET_KEY_FOR_JWT>
        GROQ_API_KEY=<Your Groq API Key>
        TMDB_API_TOKEN=<Your TMDB API Read Access Token (v4 auth)>
        BREVO_API_KEY=<Your Brevo API Key>
        NODE_ENV=development
        ```

        *   **MongoDB**: You'll need a MongoDB database. You can set one up locally or use a cloud service like MongoDB Atlas.
        *   **Groq AI**: Obtain an API key from the Groq website.
        *   **TMDB**: Get a "Read Access Token (v4 auth)" from The Movie Database developer portal.
        *   **Brevo**: Sign up for Brevo (formerly Sendinblue) to get an API key for sending OTP emails.

    *   Start the backend server:

        ```bash
        npm run dev
        ```

        This will typically start the server on `http://localhost:5000`.

3.  **Frontend Setup**

    The frontend is a simple web application that connects to your running backend.

    *   Navigate back to the root `cineMood` directory, then into `clients`:

        ```bash
        cd ../clients
        ```

    *   Open the `index.html` file in your preferred web browser:

        ```bash
        open index.html
        ```
        (On Windows, you might just double-click `index.html`.)

    That's it! The frontend should now be running and communicating with your local backend.

## Usage

Once you have both the backend and frontend running, here's how you can use CineMood:

1.  **Access the Application**: Open `index.html` in your web browser. You'll land on the authentication page.
2.  **Sign Up or Sign In**:
    *   If you're a new user, click "Create one" to switch to the sign-up panel. Fill in your details. You'll receive a 6-digit OTP code in your email (via Brevo) to verify your account.
    *   If you already have an account, just sign in with your email and password.
3.  **Describe Your Mood**: After logging in, you'll see a text area on the home page. Type a few sentences describing how you're feeling. You can also pick from some quick mood chips to get started.
4.  **Find Films**: Click the "Find Films" button. CineMood will analyze your input using AI and present a curated list of movies from TMDB that match your emotional state.
5.  **View Movie Details**: Click on any movie card in the results to open a modal with more detailed information, including the overview, ratings, genres, and an embedded trailer if available.
6.  **New Search**: If you want to try a different mood, click the "New Search" button to return to the home page.

## Features

CineMood comes packed with features to make your movie discovery journey insightful and enjoyable:

*   **AI-Powered Mood Analysis**: Uses advanced AI to understand your emotional state and cinematic preferences from natural language descriptions.
*   **Personalized Movie Recommendations**: Dynamically suggests films from The Movie Database (TMDB) that perfectly align with your current mood, detected genres, and keywords.
*   **Secure User Authentication**: Features robust user registration, login, and an essential OTP (One-Time Password) email verification process for enhanced account security.
*   **Persistent Sessions**: Maintains user login state across sessions using a robust refresh token mechanism, so you don't have to log in repeatedly.
*   **Detailed Movie Information**: Provides comprehensive details for each recommended film, including overviews, release dates, runtime, ratings, genres, and embedded YouTube trailers.
*   **Responsive Web Interface**: Enjoy a smooth and intuitive experience whether you're accessing CineMood from your desktop computer or a mobile device.

## Technologies Used

This project leverages a modern tech stack to deliver its functionality:

| Category     | Technology       | Link                                                                      |
| :----------- | :--------------- | :------------------------------------------------------------------------ |
| **Backend**  | Node.js          | [nodejs.org](https://nodejs.org)                                          |
|              | Express.js       | [expressjs.com](https://expressjs.com)                                    |
|              | MongoDB          | [mongodb.com](https://www.mongodb.com)                                    |
|              | Mongoose         | [mongoosejs.com](https://mongoosejs.com)                                  |
|              | Groq SDK         | [groq.com](https://groq.com)                                              |
|              | Brevo (Email)    | [brevo.com](https://www.brevo.com/)                                       |
|              | JSON Web Tokens  | [jwt.io](https://jwt.io)                                                  |
|              | bcrypt           | [npmjs.com/package/bcrypt](https://www.npmjs.com/package/bcrypt)          |
| **Frontend** | HTML5            | [developer.mozilla.org/en-US/docs/Web/HTML](https://developer.mozilla.org/en-US/docs/Web/HTML) |
|              | CSS3             | [developer.mozilla.org/en-US/docs/Web/CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) |
|              | JavaScript       | [developer.mozilla.org/en-US/docs/Web/JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript) |
| **Deployment** | Vercel           | [vercel.com](https://vercel.com)                                          |

## Contributing

Hey there! If you're interested in making CineMood even better, we'd love for you to contribute. Here’s a quick guide to get you started:

1.  **Fork the repository**.
2.  **Create a new branch** for your feature or bug fix: `git checkout -b feature/your-feature-name` or `git checkout -b bugfix/issue-description`.
3.  **Make your changes**.
4.  **Commit your changes** with a clear and descriptive message: `git commit -m 'feat: Add amazing new feature'`.
5.  **Push your branch** to your forked repository: `git push origin feature/your-feature-name`.
6.  **Open a pull request** to the `main` branch of this repository.

Please ensure your code follows the existing style, and write clear commit messages. Thanks for your help!

## License

This project is licensed under the ISC License. See the `package.json` file for more details.

## Author Info

Connect with me!

*   **LinkedIn**: [Your LinkedIn](https://www.linkedin.com/in/aisosa-ogbebor-550073271)
*   **X (Twitter)**: [@yourhandle](https://x.com/OgbeborAisosa3)
*   **GitHub**: [@Aisdev979](https://github.com/Aisdev979)

---

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Mongoose](https://img.shields.io/badge/Mongoose-800000?style=for-the-badge&logoColor=white)](https://mongoosejs.com)
[![Groq AI](https://img.shields.io/badge/Groq%20AI-17181F?style=for-the-badge&logoColor=white)](https://groq.com)
[![TMDB API](https://img.shields.io/badge/TMDB%20API-000000?style=for-the-badge&logo=themoviedatabase&logoColor=white)](https://www.themoviedb.org/documentation/api)
[![Brevo](https://img.shields.io/badge/Brevo-3377FF?style=for-the-badge&logo=brevo&logoColor=white)](https://www.brevo.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
