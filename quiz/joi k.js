const express = require("express");
const pool = require("../config");
const bcrypt = require('bcrypt')
const Joi = require('joi')

router = express.Router();
const passwordValidator = (value, helpers) => {
    if (value.length < 8) {
        throw new Joi.ValidationError('Password must contain at least 8 characters')
    }
    if (!(value.match(/[a-z]/) && value.match(/[A-Z]/) && value.match(/[0-9]/))) {
        throw new Joi.ValidationError('Password must be harder')
    }
    return value
}

const usernameValidator = async (value, helpers) => {
    const [rows, _] = await pool.query(
        "SELECT username FROM users WHERE username = ?",
        [value]
    )
    if (rows.length > 0) {
        const message = 'This user is already taken'
        throw new Joi.ValidationError(message, { message })
    }
    return value
}
//                          helper custom validation and sent custom messages
const check_require = Joi.object({
    title: Joi.string().required().messages({'any.required' : 'ต้องกรอก title'}),
    description:Joi.number().required().messages({'any.required' : 'ต้องกรอก description','number.base' : 'เป็นเลขเท่านั้น'}),
    due_date: Joi.date()
})
// const createSchema = Joi.object({
//     title: Joi.string().required(),
//     description: Joi.string().required(),
//     due_date: Joi.date().required(),
//   }).custom((value, helpers) => {
//     if (!value.title) {
//       return helpers.error("any.required", { message: "ต้องกรอก title" });
//     }
  
//     if (!value.description) {
//       return helpers.error("any.required", { message: "ต้องกรอก description" });
//     }
  
//     return value;
//   });
  
//   try {
//     await createSchema.validateAsync(req.body, { abortEarly: false });
//   } catch (err) {
//     console.log(err.message); // The error message from helpers.error()
//     return res.status(400).json({ message: err.message });
//   }
  

// joi custom error
  const Joi = require('joi');

const schema = Joi.object({
  title: Joi.string().required().messages({
    'any.required': 'ต้องกรอก title',
  }),
  description: Joi.string().required().messages({
    'any.required': 'ต้องกรอก description',
  }),
  due_date: Joi.date().required().messages({
    'any.required': 'ต้องกรอก due_date',
  }),
});

const data = {
  title: '',
  description: 'Some description',
  due_date: null,
};

const validation = schema.validate(data);
console.log(validation.error.message);



const signupSchema = Joi.object({
    email: Joi.string().required().email(),
    mobile: Joi.string().required().pattern(/0[0-9]{9}/),
    first_name: Joi.string().required().max(150),
    last_name: Joi.string().required().max(150),
    password: Joi.string().required().custom(passwordValidator),
    confirm_password: Joi.string().required().valid(Joi.ref('password')),
    username: Joi.string().required().min(5).external(usernameValidator),
})

router.post('/user/signup', async (req, res, next) => {
    try {
        await signupSchema.validateAsync(req.body, { abortEarly: false })
    } catch (err) {
        return res.status(400).json(err.toString())
    }
    const conn = await pool.getConnection()
    await conn.beginTransaction()

    const username = req.body.username
    const password = await bcrypt.hash(req.body.password, 5)
    const first_name = req.body.first_name
    const last_name = req.body.last_name
    const email = req.body.email
    const mobile = req.body.mobile

    try {
        await conn.query(
            'INSERT INTO users(username, password, first_name, last_name, email, mobile) ' +
            'VALUES (?, ?, ?, ?, ?, ?)',[username, password, first_name, last_name, email, mobile]
        )
        conn.commit()
        res.status(201).send()
    } catch (err) {
        conn.rollback()
        res.status(400).json(err.toString());
    } finally {
        conn.release()
    }
})
exports.router = router