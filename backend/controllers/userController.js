const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')



// @desc Register new user
// @route POST /api/users/register
// access Public
const registerUser = asyncHandler(async (req, res) =>{
    const {display_name, email, password, confirm_password} = req.body;

    // check if fields are correct
    if (!display_name || !email || !password || !confirm_password) {
        res.status(400)
        throw new Error('Please add all fields')
    }

    // check if password is repeated correctly
    if (password != confirm_password) {
        res.status(400);
        throw new Error("Passwords do not match")
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // check if email is taken by existing user
    User.findByEmail(email, (err, data) => {
        if (!err) {
           res.status(400).send("User already exists")
        } else {

            // create new user
            const new_user = new User({
                display_name: display_name,
                email: email,
                password: hashedPassword,
                role: null,
                phone: null,
                is_admin: false
            })
            
            User.create(new_user, (error, data) => {
                if (error) 
                    res.status(400).send({ message: "Some error occured while creating the user" })
                else {
                    res.status(201)
                    res.send(data)
                }
            });
        }
    });
})

// @desc Update user
// @route POST /api/users/update
// access Public
const updateUser = asyncHandler( async(req, res) =>{

    console.log(req.body.email);

    User.findByEmail(req.body.email, (error, data) => {
        if (error)
            res.status(400).send({ message: "User not found"})
        else {
            const user = data;
            
            const altered_user = {
                display_name : user.display_name || req.body.display_name,
                phone : user.phone || req.body.phone,
                role : user.role || req.body.role
            }

            User.update(req.body.email, altered_user, (error, data) => {
                if (error) 
                    res.status(400).send({ message: "some error occured while updating the user" })
                else {
                    res.status(201)
                    res.send(data)
                }

            })

        }
    })
})

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) =>{

    const {email, password} = req.body;

    // Check for user email
    User.findByEmail(email, (error, data) => {
        if (error)
            res.status(400).send({ message: "User not found"})
        else {
            const user = data;
            if (user && (bcrypt.compare(password, user.password))) {
                res.json({ token: generateToken(user.email) })
            } else {
                res.status(400).send("Invalid credentials")
            }
        }
    })
})


// @desc    Get user data
// @route   POST /api/delete
// @access  Public
const deleteUser = asyncHandler(async (req, res) => {

    User.remove(req.body.email, (error, data) => {
        if (error) {

            if (error.kind === "not_found") {
                res.status(404).send({ message: `user not found: ${req.body.email}` });
            } else {
                res.status(500).send({ message: `user ${req.body.email} could not be deleted`});
            }

        } else {
            res.status(200).send({ message: `user ${req.body.email} was deleted succsessfully` })
        }
    });
})

// @desc    Get user data
// @route   GET /api/getloggedin
// @access  Private
const getLoggedIn = asyncHandler(async (req, res) => {
    console.log("authenticate user: ", req.user)
    res.status(200).json(req.user)
})


const generateToken = (email) => {
    return jwt.sign({email}, process.env.JWT_SECRET, {
        expiresIn: '30d',
    })
}


module.exports = {
    registerUser,
    loginUser,
    updateUser,
    deleteUser,
    getLoggedIn
};