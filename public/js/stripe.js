/* eslint-disable */
import axios from 'axios';
const Stripe = require('stripe');
const stripe = Stripe('pk_test_51Odt8eK5wCdUfAy680BX1WSbvuK0bDynlHrOkfJTKqUw3IWGLCEgGsE1hCUIkCT6FOt5lcyW9iO2C6Pm8amolZru00vskd3TAj');
import { showAlert } from './alerts';


export const bookTour = async tourId => {
    try {
        // 1) Get checkout session from API
        const session = await axios(`http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`);
        console.log(session);

        //2) Create checkout form + charge credit card
        // await stripe.redirectToCheckout({
        //     sessionId: session.data.session.id
        // })
        window.location.replace(session.data.session.url);
    } catch (err) {
        showAlert('error', err);
    }
};
