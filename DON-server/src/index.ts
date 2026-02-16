import express from 'express';
import cors from 'cors';
import {config} from './config';
import paymentRoutes from './routes/payment';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({status: 'ok'});
});

app.use('/api', paymentRoutes);

app.listen(config.port, '0.0.0.0', () => {
  console.log(`DON-server listening on 0.0.0.0:${config.port}`);
});
