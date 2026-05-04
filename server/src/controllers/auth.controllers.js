import jwt from 'jsonwebtoken'
import User from "../models/auth.models.js";

export const register = async (req, res) => {
    //get name, email and password
    const { name, email, password } = req.body;

    //check if there is a user with the same email
    const user = await User.findOne({email});

    //if there is, return error
    if(user) {
        return res.status(400).json({
            success: false,
            message: 'User with this email already exit, please login'
        })
    }

    //if there isn't, create a new user and save it to the database
    const newUser = await User.create({ name, email, password });

    //use jwt to create a token and send it to the client
    const token = jwt.sign({userId: newUser._id}, 'test123', {expiresIn: '1hr'});

    //send a success message to the client
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token
    })
}