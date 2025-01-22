const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors()); 
app.use(express.json());

mongoose
  .connect('mongodb://127.0.0.1:27017/leetcodeMetrics', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err));

  const UserSchema = new mongoose.Schema({
    username: String,
    easy: { solved: Number, total: Number },
    medium: { solved: Number, total: Number },
    hard: { solved: Number, total: Number },
    lastUpdated: { type: Date, default: Date.now },
  });
const User = mongoose.model('User', UserSchema);

app.post('/api/leetcode-metrics', async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  try {
  
    let user = await User.findOne({ username });

    if (user) {
      const oneDay = 24 * 60 * 60 * 1000; 
      if (new Date() - new Date(user.lastUpdated) < oneDay) {
        return res.json(user);
      }
    }

    
    const graphqlQuery = {
      query: `
        query userProgress($username: String!) {
          matchedUser(username: $username) {
            username
            submitStats: submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
          allQuestionsCount {
            difficulty
            count
          }
        }
      `,
      variables: { username },
    };
    

    const graphqlEndpoint = 'https://leetcode.com/graphql/';
    const response = await axios.post(graphqlEndpoint, graphqlQuery, {
      headers: { 'Content-Type': 'application/json' },
    });

    
    if (!response.data || !response.data.data) {
      throw new Error('Invalid response from LeetCode API');
    }

    const userData = response.data.data.matchedUser;
    const totalQuestions = response.data.data.allQuestionsCount;

    if (!userData || !totalQuestions) {
      return res.status(404).json({ error: 'User or total questions data not found' });
    }

    
    const solvedStats = userData.submitStats.acSubmissionNum || [];
const metrics = {
  username: userData.username,
  easy: {
    solved: solvedStats.find((d) => d.difficulty === 'Easy')?.count || 0,
    total: totalQuestions.find((d) => d.difficulty === 'Easy')?.count || 0,
  },
  medium: {
    solved: solvedStats.find((d) => d.difficulty === 'Medium')?.count || 0,
    total: totalQuestions.find((d) => d.difficulty === 'Medium')?.count || 0,
  },
  hard: {
    solved: solvedStats.find((d) => d.difficulty === 'Hard')?.count || 0,
    total: totalQuestions.find((d) => d.difficulty === 'Hard')?.count || 0,
  },
};

    
    if (user) {
      await User.updateOne({ username }, { ...metrics, lastUpdated: new Date() });
    } else {
      await User.create(metrics);
    }

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching data:', error.message);

    
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }

    res.status(500).json({ error: 'Failed to fetch data from LeetCode' });
  }
});

const PORT = 8080;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
