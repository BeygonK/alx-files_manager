import express from 'express';
import routes from './routes/index';

// Load environmet variables

const app = express();
const port = process.env.PORT || 5000;

// JSON middleware
app.use(express.json());

// Load routes
app.use('', routes);

app.listen(port, console.log(`Server running at ${port}`));
