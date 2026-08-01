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

// In-memory / DB content status store for demonstration & real execution
const contentStatusStore = new Map();

const getContentSummary = (call, callback) => {
  const { content_type, content_id } = call.request;
  callback(null, {
    content_type,
    content_id,
    title: `Sample Title for ${content_type} ${content_id}`,
    author_name: 'Code+ Creator',
    author_id: 'user-12345',
    snippet: `Full educational snippet for ${content_type} item ${content_id}`,
    created_at: new Date().toISOString(),
  });
};

const setContentStatus = (call, callback) => {
  const { content_type, content_id, new_status } = call.request;
  const key = `${content_type}:${content_id}`;
  const previous_status = contentStatusStore.get(key) || 'active';
  contentStatusStore.set(key, new_status);

  callback(null, {
    success: true,
    previous_status,
    new_status,
  });
};

const transferOwnership = (call, callback) => {
  const { content_type, content_id, new_owner_user_id } = call.request;
  callback(null, {
    success: true,
    previous_owner_user_id: 'old-user-000',
    new_owner_user_id,
  });
};

const findContentBySourceUrl = (call, callback) => {
  const { source_url } = call.request;
  callback(null, {
    matches: [
      {
        content_type: 'notes',
        content_id: 'note-matched-999',
        title: `Matched upload for ${source_url}`,
        match_confidence: '0.98',
        current_owner_user_id: 'uploader-123',
      },
    ],
  });
};

export function startGrpcServer(port = 50052) {
  const server = new grpc.Server();
  server.addService(cpaservices.ContentActions.service, {
    GetContentSummary: getContentSummary,
    SetContentStatus: setContentStatus,
    TransferOwnership: transferOwnership,
    FindContentBySourceUrl: findContentBySourceUrl,
  });

  server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
    if (err) {
      console.error('Failed to bind gRPC server in cpa-nextjs-deploy:', err);
      return;
    }
    console.log(`cpa-nextjs-deploy ContentActions gRPC server running on port ${boundPort}`);
  });

  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startGrpcServer(process.env.GRPC_PORT || 50052);
}
