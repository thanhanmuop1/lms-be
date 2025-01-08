const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const lmsRoutes = require('./src/routes/lmsRoutes');
const authRoutes = require('./src/routes/authRoutes');
const quizRoutes = require('./src/routes/quizRoutes');
const documentRoutes = require('./src/routes/documentRoutes');
const teacherRoutes = require('./src/routes/teacherRoutes');
const courseEnrollRoutes = require('./src/routes/courseEnrollRoutes');
const searchRoutes = require('./src/routes/searchRoutes');
const userRoutes = require('./src/routes/userRoutes');
const classRoutes = require('./src/routes/classRoutes');
const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(cors({
    origin: [
      'http://localhost:3000',
      'https://frontend-lms-vwe3.onrender.com'
    ],
    credentials: true
  }));

app.use('/teacher', teacherRoutes);
app.use('/', lmsRoutes);
app.use('/', quizRoutes);
app.use('/', authRoutes);
app.use('/', documentRoutes);
app.use('/courseEnroll', courseEnrollRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/search', searchRoutes);
app.use('/users', userRoutes);
app.use('/', classRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});