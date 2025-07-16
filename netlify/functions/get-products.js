// netlify/functions/get-products.js

// We are importing the product data directly from the moved file.
const { products } = require('./products.js');

exports.handler = async (event, context) => {
  // This function simply returns the entire list of products as JSON.
  // In the future, you could add logic here to fetch from a database.
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*' // Allows any website to request this data
    },
    body: JSON.stringify(products),
  };
};