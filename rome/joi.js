const Joi = require('joi');

// Define a schema for validating user data
const userSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(18).max(120).required(),
  // .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')) pattern that the password. 
  // This pattern ensures that the password contains only letters (both uppercase and lowercase) and numbers, and has a length between 3 and 30 characters.
  // valid(Joi.ref('password')) is used the confirmPassword field must match the password field. Joi.ref('password')
  password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  hobbies: Joi.array().items(Joi.string().max(50)).max(5),
});

// Sample user data to be validated
const userData = {
  name: 'John Doe',
  email: 'johndoe@example.com',
  age: 25,
  password: 'mypassword123',
  confirmPassword: 'mypassword123',
  hobbies: ['Reading', 'Coding', 'Watching movies'],
};

// Validate the user data against the defined schema
const { error, value } = userSchema.validate(userData);

if (error) {
  // Handle validation error
  console.log(error.details);
} else {
  // Handle valid data
  console.log(value);
}
