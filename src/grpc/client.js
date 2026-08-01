import path from 'path';
import { fileURLToPath } from 'url';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, '../../proto/cpaservices/v1/cpaservices.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const cpaservices = protoDescriptor.cpaservices.v1;

const manageAddr = process.env.MANAGE_BACKEND_GRPC_ADDR || 'localhost:50051';

const client = new cpaservices.SocialActions(
  manageAddr,
  grpc.credentials.createInsecure()
);

export const createTicket = (reqData) => {
  return new Promise((resolve, reject) => {
    client.CreateTicket(reqData, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
};

export const getUserStanding = (userId) => {
  return new Promise((resolve, reject) => {
    client.GetUserStanding({ user_id: userId }, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
};

export const reportContent = (reqData) => {
  return new Promise((resolve, reject) => {
    client.ReportContent(reqData, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
};

export default client;
