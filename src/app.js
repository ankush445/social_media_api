const express = require('express');

// Routes
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const likeRoutes = require('./routes/likeRoutes');
const commentRoutes = require('./routes/commentRoutes');

// Middleware
const loggerMiddleware = require('./middleware/loggerMiddleWare');
const errorMiddleware = require('./middleware/errorMiddleWare');


const app = express();

app.use(express.json());

// ✅ Logger FIRST
app.use(loggerMiddleware);

// ✅ Routes (clean structure)
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/comments', commentRoutes);


// ✅ LAST middleware
app.use(errorMiddleware);
module.exports = app;